# Sistema OSINT ML1 — Clasificación del Conflicto Irán-Israel-EE.UU.

**Proyecto Final · Machine Learning 1 (ML1-2026I)**  
**Universidad Externado de Colombia**

---

## Pregunta analítica

> ¿Es posible clasificar el nivel de escalada del conflicto Irán-Israel-EE.UU. en ventanas país-día usando exclusivamente fuentes abiertas y gratuitas?

**Unidad de análisis:** país-día (IRN / ISR / USA)  
**Target:** `escalation_level` — 0 = Bajo · 1 = Medio · 2 = Alto  
**Definición del target:** cuartiles de la escala Goldstein por país; calculados sobre el histórico GDELT 2023-2026. Los días con tono promedio en el cuartil inferior se marcan como "Alto conflicto", los del cuartil superior como "Bajo conflicto".

---

## Arquitectura del sistema

```
┌──────────────────────────────────────────────────────────────────┐
│                       FUENTES ABIERTAS                           │
│  GDELT │ NASA FIRMS │ OpenSky │ RSS Feeds │ Bluesky │ AISStream  │
└───┬────┴─────┬──────┴────┬────┴─────┬─────┴────┬────┴─────┬─────┘
    │          │           │          │           │          │
    ▼          ▼           ▼          ▼           ▼          ▼
┌──────────────────────────────────────────────────────────────────┐
│              INGESTA  (src/ingestion/)                           │
│  gdelt_client · firms_client · opensky_client · rss_client       │
│  bluesky_client · opensky_historical                             │
└─────────────────────────────┬────────────────────────────────────┘
                              │  data/raw/**/*.parquet
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│              SUPABASE — PostgreSQL  (iswknjfskqiemxgpalui)       │
│                                                                  │
│  raw_events          557,184 filas   ← data lake central         │
│  events_gdelt            120 filas   ← GDELT agregado            │
│  events_rss              141 filas   ← Titulares RSS             │
│  events_firms            348 filas   ← Hotspots NASA             │
│  daily_features          183 filas   ← Features país-día         │
│  model_predictions       732 filas   ← 4 modelos × 183 ventanas  │
│  sources                  15 filas   ← Catálogo de fuentes        │
│                                                                  │
│  Vistas: v_daily_dashboard · v_escalation_timeline               │
│          v_target_distribution · v_gdelt_tone_timeline           │
│          v_sources_status                                        │
└─────────────────────────────┬────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│  PIPELINE ML            │     │  DASHBOARD (Next.js)        │
│  normalize.py           │     │  Lee de Supabase vía REST   │
│  build_features.py      │     │  Recharts · Tailwind CSS    │
│  train.py               │     │  Desplegable en Vercel      │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## Fuentes de datos

| Fuente | Tipo | Período | Registros | Clave |
|---|---|---|---|---|
| **GDELT** | Eventos geopolíticos globales | Oct 2023 – May 2026 | 120 agregados país-día | Sin clave |
| **NASA FIRMS** | Anomalías térmicas satelitales | 26–30 may 2026 | 6,812 hotspots | `NASA_FIRMS_KEY` |
| **OpenSky Network** | Vuelos en el espacio aéreo regional | Oct 2023 – Jun 2025 | 493,382 trazas | `OPENSKY_CLIENT_ID/SECRET` |
| **RSS Feeds** | Titulares BBC, Al Jazeera, Google News, Tehran Times, MEE | Feb – May 2026 | 141 artículos | Sin clave |
| **Bluesky** | Posts de redes sociales | May 2026 | 61 posts | `BLUESKY_HANDLE/PASSWORD` |
| **AISStream** | Posiciones de barcos (AIS) | May 2026 | 138 registros | Integrado |

### GDELT — fuente primaria

GDELT (Global Database of Events, Language, and Tone) es la columna vertebral del sistema. Proporciona:

- `n_conflict_events`: número de eventos conflictivos por país-día
- `avg_goldstein`: tono de la cobertura mediática (−10 conflicto / +10 cooperación)
- `n_mentions`: volumen de menciones en medios globales

La escala Goldstein se usa como señal directa para construir el target de clasificación.

### NASA FIRMS — inteligencia geoespacial

FIRMS detecta anomalías térmicas mediante satélites VIIRS (375 m) y MODIS (1 km). En este proyecto se usa como proxy de explosiones, incendios de infraestructura energética y actividad militar de alto impacto calorífico.

Cobertura del mapa: lat 22°–38°N, lon 29°–60°E — incluye el **Estrecho de Ormuz** y el Golfo Pérsico completo.

---

## Base de datos Supabase

### Tablas principales

```sql
-- Unidad de análisis del modelo ML
daily_features (date, country, n_conflict_events, avg_goldstein,
                has_high_violence, n_gdelt_mentions, n_flights,
                n_hotspots, avg_frp, n_news_articles, n_ships,
                escalation_level, n_social_posts,
                avg_social_engagement, sources_used)

-- Predicciones de los 4 modelos
model_predictions (date, country, model_name, predicted_level,
                   probability_low, probability_medium, probability_high,
                   f1_weighted, f1_std, precision_weighted, recall_weighted)
```

### Vistas clave

| Vista | Uso en dashboard |
|---|---|
| `v_daily_dashboard` | Tarjetas de estado y métricas por país |
| `v_escalation_timeline` | Línea temporal de nivel de escalada (gráfica de líneas) |
| `v_target_distribution` | Distribución de clases por país (gráfica de barras) |
| `v_gdelt_tone_timeline` | Tono Goldstein promedio en el tiempo |
| `v_sources_status` | Estado y cobertura de cada fuente |

---

## Pipeline ML

### Feature engineering (`src/features/build_features.py`)

Para cada ventana país-día se construyen las siguientes features:

| Feature | Fuente | Descripción |
|---|---|---|
| `n_conflict_events` | GDELT | Conteo de eventos conflictivos |
| `avg_goldstein` | GDELT | Tono promedio Goldstein |
| `has_high_violence` | GDELT | Flag de evento con Goldstein < −5 |
| `n_gdelt_mentions` | GDELT | Menciones en medios globales |
| `n_flights` | OpenSky | Vuelos sobre la región |
| `n_hotspots` | FIRMS | Anomalías térmicas detectadas |
| `avg_frp` | FIRMS | Potencia radiativa media (MW) |
| `n_news_articles` | RSS | Artículos de prensa indexados |
| `n_ships` | AISStream | Posiciones de embarcaciones |
| `n_social_posts` | Bluesky | Volumen de publicaciones sociales |
| `avg_social_engagement` | Bluesky | Engagement promedio |

**Target:** `escalation_level` construido por cuartiles de `avg_goldstein` por país, calculados sobre el histórico completo GDELT.

### Modelos y evaluación (`src/models/train.py`)

Validación cruzada estratificada de 5 folds. Métricas reportadas: F1 ponderado.

| Modelo | F1 ponderado (media CV) | F1 std | Observación |
|---|---|---|---|
| **KNN** ⭐ | **0.7513** | ±0.031 | Mejor modelo — captura similitud temporal local |
| Logistic Regression | 0.6240 | ±0.028 | Segunda opción, interpretable |
| Ridge Classifier | 0.4666 | ±0.062 | Alta varianza entre folds |
| Naive Bayes | 0.4519 | ±0.058 | Supuesto de independencia penaliza |

El modelo **KNN** es el seleccionado para el dashboard. Las predicciones de los 4 modelos se almacenan en Supabase (`model_predictions`) para comparación.

---

## EDA Notebook

`notebooks/eda.ipynb` — 23 celdas ejecutadas · 3.9 MB · 0 errores

Secciones:
1. Configuración y entorno
2. Inventario de la base de datos (Supabase)
3. GDELT — serie temporal de eventos y tono Goldstein
4. GDELT — distribución de tono por país
5. GDELT — correlaciones entre variables
6. OpenSky — actividad aérea regional
7. RSS — análisis de titulares por fuente editorial
8. Bluesky — volumen y engagement social
9. AISStream — tráfico marítimo
10. Daily features — distribución y correlaciones
11. Resultados ML — comparación de modelos y matriz de confusión
12. **FIRMS NASA — Mapa interactivo de hotspots** (sección extendida)
    - DBSCAN (eps ≈ 25 km, haversine) → 227 clusters identificados
    - Mapa interactivo Plotly sobre CartoDB (etiquetas en español)
    - **15 puntos de inflexión geopolíticos** etiquetados:
      - ⚠️ Bandar Abbas — entrada al Estrecho de Ormuz (Irán)
      - ⚠️ Kirkuk — campos petrolíferos Iraq (conflicto activo)
      - ⚠️ Isfahán — zona industrial/nuclear Irán
      - 🛢️ South Pars — mayor campo de gas del mundo (Irán-Qatar)
      - 🛢️ Abqaiq — instalación crítica Saudi Aramco
      - 🛢️ Abu Dhabi — FRP máximo del conjunto (331 MW)
      - 🛢️ North Dome / Ras Laffan — Qatar LNG

---

## Dashboard

`dashboard/` — Next.js 14 · Tailwind CSS · Recharts · Supabase

Componentes:
- **Tarjetas de estado**: nivel de escalada actual por país (verde/amarillo/rojo)
- **Métricas del modelo**: F1 de los 4 modelos con mejor modelo destacado
- **Línea temporal** (`EscalationTimeline`): evolución del nivel de escalada por país con toggle por país
- **Distribución de clases** (`DistributionChart`): barras agrupadas IRN/ISR/USA por nivel
- **Eventos recientes**: últimos eventos crudos de `raw_events`

Para correr localmente:

```bash
cd dashboard
cp ../.env.example .env.local   # editar con tus credenciales
npm install
npm run dev
# → http://localhost:3000
```

Para desplegar en Vercel:

```bash
cd dashboard
vercel deploy
# Variables requeridas: NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Estructura del repositorio

```
ML-Conflicto-Internacional/
│
├── .env.example                    # Variables de entorno requeridas (sin valores reales)
├── pyproject.toml                  # Dependencias Python y configuración de herramientas
│
├── src/
│   ├── ingestion/
│   │   ├── gdelt_client.py         # Descarga eventos GDELT por país-día
│   │   ├── firms_client.py         # NASA FIRMS hotspots (bbox extendido: 22°–38°N)
│   │   ├── opensky_client.py       # Vuelos en tiempo real (OpenSky OAuth2)
│   │   ├── opensky_historical.py   # Descarga histórica OpenSky
│   │   ├── rss_client.py           # Titulares RSS (BBC, Al Jazeera, etc.)
│   │   ├── bluesky_client.py       # Posts de Bluesky
│   │   └── acled_client.py         # Cliente ACLED (disponible, no activo en pipeline)
│   ├── processing/
│   │   ├── normalize.py            # Normaliza y une todas las fuentes
│   │   ├── upload_to_supabase.py   # Sube datos procesados a Supabase
│   │   └── download_from_supabase.py # Descarga snapshots de Supabase
│   ├── features/
│   │   └── build_features.py       # Construye daily_features por país-día
│   └── models/
│       └── train.py                # CV 5-fold, entrena 4 modelos, guarda artefactos
│
├── notebooks/
│   └── eda.ipynb                   # EDA completo: 23 celdas, todas las fuentes
│
├── dashboard/                      # App Next.js
│   ├── src/app/
│   │   ├── page.tsx                # Página principal (server component, queries Supabase)
│   │   ├── charts.tsx              # Componentes de gráficas (client component, Recharts)
│   │   ├── layout.tsx              # Layout global con tema oscuro
│   │   └── globals.css
│   ├── src/lib/
│   │   └── supabase.ts             # Cliente Supabase configurado
│   └── vercel.json                 # Configuración de despliegue Vercel
│
├── artifacts/
│   ├── models/
│   │   └── knn.joblib              # Modelo KNN entrenado serializado
│   ├── metrics/
│   │   ├── cv_results.json         # F1 de los 4 modelos (CV 5-fold)
│   │   ├── classification_report.txt
│   │   └── confusion_matrix.png
│   └── sql/
│       ├── daily_features_insert.sql    # 183 filas — INSERT con ON CONFLICT upsert
│       └── model_predictions_insert.sql # 732 filas — 4 modelos × 183 ventanas
│
├── data/                           # No versionado (.gitignore)
│   ├── raw/                        # Parquets crudos por fuente
│   └── processed/                  # features.parquet · integrated.parquet
│
└── docs/
    └── GUIA_DATOS_Y_BASE_DE_DATOS.md  # Guía técnica completa: APIs, SQL, ER, troubleshooting
```

---

## Instalación y ejecución

### Requisitos

- Python ≥ 3.11 (probado con 3.14 + uv)
- Node.js ≥ 18
- Cuenta en [Supabase](https://supabase.com) (gratuita)

### Entorno Python

```bash
git clone git@github.com:julianjimenez4809-ui/ML-Conflicto-Internacional.git
cd ML-Conflicto-Internacional

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -e ".[dev]"

cp .env.example .env               # Completar con tus API keys
```

### Ejecutar el pipeline completo

```bash
# 1. Ingesta de datos
python -m src.ingestion.gdelt_client
python -m src.ingestion.firms_client
python -m src.ingestion.opensky_client
python -m src.ingestion.rss_client
python -m src.ingestion.bluesky_client

# 2. Normalización e integración
python -m src.processing.normalize

# 3. Feature engineering
python -m src.features.build_features

# 4. Entrenamiento y evaluación
python -m src.models.train

# 5. Subir resultados a Supabase
python -m src.processing.upload_to_supabase
```

### Variables de entorno

Copiar `.env.example` a `.env` y completar:

| Variable | Servicio | Cómo obtenerla |
|---|---|---|
| `NASA_FIRMS_KEY` | NASA FIRMS | [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/) |
| `OPENSKY_CLIENT_ID` | OpenSky Network | [opensky-network.org](https://opensky-network.org) — credenciales OAuth2 |
| `OPENSKY_CLIENT_SECRET` | OpenSky Network | Ídem |
| `BLUESKY_HANDLE` | Bluesky | Handle de tu cuenta (e.g. `usuario.bsky.social`) |
| `BLUESKY_PASSWORD` | Bluesky | App password desde Configuración → App Passwords |
| `ACLED_EMAIL` | ACLED | [acleddata.com/access-data](https://acleddata.com/access-data/) (opcional) |
| `ACLED_KEY` | ACLED | Ídem (opcional) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Settings → API → anon public |

### Ejecutar el notebook EDA

```bash
source .venv/bin/activate
jupyter notebook notebooks/eda.ipynb
```

O re-ejecutar completo desde cero:

```bash
jupyter nbconvert --to notebook --execute --inplace \
  --ExecutePreprocessor.timeout=300 \
  notebooks/eda.ipynb
```

---

## Resultados

### Modelo seleccionado: KNN

- **F1 ponderado (CV 5-fold):** 0.7513 ± 0.031
- **Clases:** Bajo (0) · Medio (1) · Alto (2)
- **Features más relevantes:** `avg_goldstein`, `n_conflict_events`, `n_flights`

### Hallazgos FIRMS — Estrecho de Ormuz

El análisis geoespacial de FIRMS (6,812 hotspots, 26–30 mayo 2026) identificó que la mayor concentración de anomalías térmicas de alta intensidad se concentra en el Golfo Pérsico:

| Zona | FRP máximo | Relevancia |
|---|---|---|
| Abu Dhabi, UAE | 331.5 MW | Infraestructura petrolera |
| North Dome, Qatar | 258.1 MW | Mayor campo de gas del mundo (lado Qatar) |
| Abqaiq, Saudi Aramco | 219.3 MW | Instalación crítica (atacada por Houthis en 2019) |
| **Bandar Abbas — Estrecho de Ormuz** | **34 MW** | ⚠️ Puerto naval iraní · 20% del petróleo mundial transita por aquí |
| Kirkuk, Iraq | 189.5 MW | Campos petrolíferos en zona de conflicto activo |

### Conclusión analítica

El KNN con F1=0.75 supera ampliamente a los modelos de referencia (Naive Bayes: 0.45). La escala Goldstein de GDELT resulta ser la feature más predictiva del nivel de escalada. Los datos de FIRMS revelan que la actividad energética en el Estrecho de Ormuz y el Golfo Pérsico concentra los mayores focos de tensión geopolítica indirecta, con el puerto naval de Bandar Abbas como nodo estratégico central.

---

## Créditos

- **Curso:** Machine Learning 1 (ML1-2026I) · Universidad Externado de Colombia
- **Fuentes:** GDELT Project · NASA FIRMS / EOSDIS · OpenSky Network · Bluesky · BBC / Al Jazeera · Supabase
