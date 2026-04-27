# Sistema de Inteligencia Multifuente — Conflicto Irán-Israel-EE.UU.

Proyecto Final ML1 · Universidad Externado de Colombia · 2026-I

## Pregunta analítica

> ¿Es posible clasificar el nivel de escalada del conflicto Irán-Israel-EE.UU. en ventanas
> país-día usando exclusivamente fuentes abiertas y gratuitas?

**Unidad de análisis:** país-día  
**Target:** nivel de escalada (0=bajo, 1=medio, 2=alto) derivado de fatalidades ACLED  
**Tarea ML principal:** clasificación supervisada multiclase

## Fuentes

| Fuente | Tipo | API / Acceso |
|--------|------|-------------|
| ACLED | Estructurada — eventos de conflicto | API con registro |
| GDELT | Textual — noticias y tono | API pública |
| BBC / Al Jazeera / Google News | Textual — titulares | RSS público |
| OpenSky | Movilidad aérea | API pública (o con cuenta) |
| Bluesky | Social — posts públicos | AT Protocol API |

## Modelos comparados

1. **KNN** (línea base)
2. **Naive Bayes** (sobre TF-IDF)
3. **Logistic Regression** (con balanceo de clases)
4. **Ridge Classifier** (regularización L2)

## Estructura del repositorio

```
.
├── data/
│   ├── raw/           # Datos crudos por fuente (no versionados)
│   ├── interim/       # Datos en proceso de limpieza
│   └── processed/     # Dataset integrado y features
├── notebooks/         # EDA y exploración
├── src/
│   ├── ingestion/     # Clientes por fuente
│   ├── processing/    # Normalización y merge
│   ├── features/      # Feature engineering
│   └── models/        # Entrenamiento y evaluación
├── artifacts/
│   ├── models/        # Modelos serializados
│   └── metrics/       # Resultados CV en JSON
├── dashboard/         # Next.js app (desplegada en Vercel)
├── material de apoyo/ # Enunciado del proyecto
├── pyproject.toml
└── .env.example
```

## Instalación

```bash
# 1. Clonar el repo
git clone <url>
cd taller_final

# 2. Crear entorno virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate          # Windows

# 3. Instalar dependencias Python
pip install -e ".[dev]"

# 4. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus API keys

# 5. Dashboard
cd dashboard && npm install
```

## Pipeline de datos

```bash
# Ingesta (ejecutar por fuente)
python -m src.ingestion.acled_client
python -m src.ingestion.gdelt_client
python -m src.ingestion.rss_client

# Normalizar y merge
python -m src.processing.normalize

# Feature engineering
python -m src.features.build_features

# Entrenar y comparar modelos
python -m src.models.train
```

## Dashboard local

```bash
cd dashboard
npm run dev
# → http://localhost:3000
```

## Despliegue en Vercel

El dashboard (`/dashboard`) está configurado para Vercel:

1. Conectar el repo en [vercel.com](https://vercel.com)
2. Set **Root Directory** → `dashboard`
3. Framework → Next.js (detectado automáticamente)
4. Deploy
