# Guía de Datos y Base de Datos — Sistema OSINT ML1

**Proyecto:** Sistema de Inteligencia Multifuente · Conflicto Irán-Israel-EE.UU.  
**Curso:** Machine Learning 1 (ML1-2026I) · Universidad Externado de Colombia  
**Última actualización:** 2026-05-30

---

## Tabla de contenidos

1. [Arquitectura general](#1-arquitectura-general)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Fuentes de datos](#3-fuentes-de-datos)
   - [OpenSky Network](#31-opensky-network)
   - [NASA FIRMS](#32-nasa-firms)
   - [GDELT](#33-gdelt-global-database-of-events-language-and-tone)
   - [RSS Feeds](#34-rss-feeds)
   - [Bluesky](#35-bluesky)
   - [AISStream](#36-aisstream)
4. [Modelo ER](#4-modelo-er)
5. [Descripción de tablas](#5-descripción-de-tablas)
6. [Vistas SQL](#6-vistas-sql)
7. [Pipeline de ingesta](#7-pipeline-de-ingesta-paso-a-paso)
8. [Configuración de Supabase](#8-configuración-de-supabase)
9. [Replicar el dataset completo](#9-replicar-el-dataset-completo)
10. [Resolución de problemas](#10-resolución-de-problemas)

---

## 1. Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                     FUENTES ABIERTAS                        │
│  OpenSky  │  FIRMS  │  GDELT  │  RSS  │ Bluesky │ AISStream │
└─────┬─────┴────┬────┴────┬────┴───┬───┴────┬────┴─────┬────┘
      │          │         │        │        │           │
      ▼          ▼         ▼        ▼        ▼           ▼
┌─────────────────────────────────────────────────────────────┐
│              SCRIPTS DE INGESTA  (src/ingestion/)           │
│  opensky_client.py │ firms_client.py │ gdelt_client.py      │
│  rss_client.py     │ bluesky_client.py                      │
└─────────────────────────────────┬───────────────────────────┘
                                  │ parquets en data/raw/
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                   │
│                                                             │
│   raw_events (data lake, 557K+ filas)                      │
│   events_gdelt │ events_rss │ events_firms                  │
│   events_opensky │ events_aisstream                         │
│   ────────────────────────────────────────────             │
│   daily_features  (unidad de análisis: país-día)            │
│   model_predictions (resultados ML)                         │
└─────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     PIPELINE ML                             │
│  normalize.py → build_features.py → train.py               │
└─────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│               DASHBOARD  (Next.js + Vercel)                 │
│  Lee directamente de Supabase via anon key (REST API)       │
└─────────────────────────────────────────────────────────────┘
```

El diseño sigue el patrón **ELT** (Extract → Load → Transform):
- **Extract**: scripts Python descargan datos de las APIs
- **Load**: datos se guardan en `raw_events` y tablas especializadas de Supabase
- **Transform**: `build_features.py` agrega por país-día → `daily_features`

---

## 2. Prerrequisitos

### Software

```bash
# Python 3.11+ (probado en 3.14)
python3 --version

# uv (gestor de paquetes ultra-rápido, reemplaza pip)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Node.js 18+ (para el dashboard)
node --version
```

### Instalación del entorno Python

```bash
git clone <URL_DEL_REPO>
cd ML-Conflicto-Internacional

# Crear entorno virtual
uv venv

# Instalar dependencias
uv pip install requests feedparser pandas numpy python-dotenv pyarrow \
               scikit-learn plotly atproto "supabase==2.3.4"
```

> **Nota Python 3.14**: `load_dotenv()` sin argumentos falla en Python 3.14.
> Siempre usar la forma explícita:
> ```python
> from pathlib import Path
> load_dotenv(Path(__file__).parents[2] / ".env")
> ```

### Variables de entorno

Copiar `.env.example` → `.env` y rellenar:

```bash
cp .env.example .env
```

```ini
# Supabase
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_ANON_KEY=eyJ...

# OpenSky (opcional — sin credenciales funciona pero con límites)
OPENSKY_USERNAME=tu_usuario
OPENSKY_PASSWORD=tu_contraseña

# NASA FIRMS (obligatorio para datos de hotspots)
NASA_FIRMS_KEY=tu_key

# Bluesky
BLUESKY_HANDLE=tu_usuario.bsky.social
BLUESKY_PASSWORD=tu_contraseña

# GDELT — no requiere key
# RSS   — no requiere key
```

---

## 3. Fuentes de datos

### 3.1 OpenSky Network

**Tipo:** Movilidad aérea  
**URL:** https://opensky-network.org  
**Costo:** Gratuito (con límites sin cuenta)  
**Registro:** Opcional — se recomienda para más historial  

#### Qué datos provee

State vectors de aeronaves en tiempo real (o casi real) sobre un bounding box geográfico. Cada registro tiene:
- `icao24`: código transponder único
- `callsign`: indicativo de vuelo
- `origin_country`: país de registro
- `latitude`, `longitude`: posición actual
- `baro_altitude`: altitud barométrica en metros
- `velocity`: velocidad en m/s
- `timestamp`: momento de la medición

#### Bounding box usado

```
Medio Oriente y Mediterráneo Oriental:
  lat: 28° N – 38° N
  lon: 29° E – 60° E
```

Cubre: Israel, Gaza, Líbano, Siria, Irán, Irak, Arabia Saudita, Golfo Pérsico.

#### Límites de la API

| Tipo de usuario | Lookback | Llamadas/día |
|---|---|---|
| Anónimo | Solo tiempo real | ~400 |
| Registrado | 1 hora de historial | ~4000 |
| Investigador | Hasta 30 días | Ilimitado |

#### Cómo obtener datos históricos masivos

Los **493K registros históricos** (oct 2023 – jun 2025) en la base de datos fueron obtenidos mediante la API REST con credenciales de investigador, haciendo llamadas cada 5 minutos sobre el bounding box y almacenando cada snapshot.

Para replicar desde cero (datos actuales):

```python
# src/ingestion/opensky_client.py — ejecutar diariamente
python -m src.ingestion.opensky_client
```

Para acceso histórico, solicitar acceso de investigador en:
https://opensky-network.org/data/our-contribution-to-research

#### Datos disponibles en el proyecto

- `raw_events` donde `source = 'opensky'`: **493,382 filas** (2023-10-07 → 2025-06-13)
- `events_opensky`: snapshots recientes con schema completo de state vectors

---

### 3.2 NASA FIRMS

**Tipo:** Contexto geoespacial — hotspots térmicos  
**URL:** https://firms.modaps.eosdis.nasa.gov  
**Costo:** Gratuito con registro  
**Registro:** Obligatorio (key gratuita en <5 minutos)  

#### Qué datos provee

Detecciones satelitales de anomalías térmicas (fuego / explosiones / actividad industrial). Dos sensores:
- **VIIRS SNPP**: resolución 375 m, el más preciso para anomalías pequeñas
- **MODIS NRT**: resolución 1 km, más histórico

Cada registro contiene:
- `latitude`, `longitude`
- `frp`: Fire Radiative Power en MW (cuanto mayor, más intensa la anomalía)
- `bright_ti4`, `bright_ti5`: temperatura de brillo en los canales 4 y 5 (Kelvin)
- `acq_date`, `acq_time`: fecha y hora de adquisición
- `confidence`: nivel de confianza (n=nominal, l=low, h=high para VIIRS; 0-100 para MODIS)
- `satellite`, `daynight`

#### Cómo obtener la key

1. Ir a https://firms.modaps.eosdis.nasa.gov/api/
2. Hacer clic en "Get MAP_KEY"
3. Completar el formulario (email institucional o personal)
4. La key llega al email en minutos

#### Límites

- Máximo **5 días** por llamada con key estándar
- Sin límite de llamadas diarias si se usa responsablemente
- El bounding box puede ser grande (todo Medio Oriente: `W=29,S=28,E=60,N=38`)

#### Endpoint usado

```
GET https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{source}/{W,S,E,N}/{day_range}
```

Ejemplo:
```
https://firms.modaps.eosdis.nasa.gov/api/area/csv/MI_KEY/VIIRS_SNPP_NRT/29,28,60,38/5
```

#### Cómo ejecutar

```python
python -m src.ingestion.firms_client
# → Guarda en data/raw/firms/firms_raw.parquet
# → Obtiene últimos 5 días, VIIRS + MODIS
```

#### Datos en el proyecto

- `raw_events` donde `source = 'firms'`: **63,604 filas** (2023-10-07 → 2026-05-14)
- `events_firms`: **348 filas** con top hotspots de Mayo 2026 en zonas de conflicto

#### Interpretación de FRP

| FRP (MW) | Significado |
|---|---|
| 1 – 10 | Quema agrícola, incendio forestal pequeño |
| 10 – 50 | Incendio significativo o actividad industrial |
| 50 – 200 | Gran incendio, posible instalación en llamas |
| > 200 | Anomalía extrema — puede ser conflicto armado / bombardeo |

---

### 3.3 GDELT (Global Database of Events, Language and Tone)

**Tipo:** Eventos estructurados de conflicto + tono mediático  
**URL:** https://www.gdeltproject.org  
**Costo:** Completamente gratuito, sin registro  
**Uso en el proyecto:** Reemplaza a ACLED como fuente de eventos de conflicto  

#### Por qué GDELT en lugar de ACLED

ACLED es la fuente ideal (eventos geolocalizados con fatalidades), pero su API requiere registro institucional y aprobación. GDELT es público, sin key, y provee:
- Conteo diario de eventos de conflicto (QuadClass 3 y 4)
- Escala Goldstein: indicador de cooperación/conflicto (-10 a +10)
- Menciones mediáticas totales
- Tono promedio de la cobertura

#### Escala Goldstein

```
+10  = Máxima cooperación (tratado de paz)
  0  = Neutral
 -10 = Máximo conflicto (guerra declarada)
```

Para este proyecto, valores de Goldstein < 0 con `has_high_violence = TRUE` → escalación.

#### Enfoque de descarga usado

En lugar de la API DOC (rate-limited y poco fiable), se usan las **exportaciones CSV históricas**:

```
http://data.gdeltproject.org/events/YYYYMMDD.export.CSV.zip
```

Cada archivo es un ZIP con todos los eventos GDELT del día (~40-60K eventos/día). Se descomprime, se filtra por países de interés (IRN, ISR, USA en actor1 o actor2 o actionGeo) y se agrega por país-día.

#### Columnas GDELT utilizadas

| Columna (índice) | Descripción |
|---|---|
| 1 (SQLDATE) | Fecha del evento |
| 7 (Actor1CountryCode) | País del actor 1 (IRN, ISR, USA…) |
| 17 (Actor2CountryCode) | País del actor 2 |
| 31 (QuadClass) | Clase: 1=Verbal Coop, 2=Mat Coop, 3=Verbal Conflict, 4=Mat Conflict |
| 32 (GoldsteinScale) | Escala Goldstein |
| 33 (NumMentions) | Menciones totales en medios |
| 36 (AvgTone) | Tono promedio de la cobertura (-100 a +100) |
| 51 (ActionGeo_CountryCode) | País donde ocurrió la acción |

#### Periodos descargados

El script descarga automáticamente estos periodos clave:

| Periodo | Motivo |
|---|---|
| Abr 2024 (1–20) | Intercambio directo de misiles Irán ↔ Israel |
| Oct 2024 (1–15) | Aniversario 7 de octubre, escalada |
| Ene 2025 (1–15) | Cese el fuego en Gaza |
| Feb–Mar 2026 (28 feb – 15 mar) | Inicio guerra US-Israel-Irán |
| May 2026 (1–30) | Escalada reciente (período actual) |

#### Cómo ejecutar

```python
python -m src.ingestion.gdelt_client
# → Procesa ~3 millones de eventos GDELT brutos
# → Filtra y agrega → 285 filas country-day
# → Guarda en data/raw/gdelt/gdelt_raw.parquet
```

> **Nota:** Cada archivo diario es ~10-20 MB comprimido. El script descarga
> ~70 archivos (~1 GB total) y los procesa en memoria. Requiere ~2-4 GB de RAM.

---

### 3.4 RSS Feeds

**Tipo:** Titulares de noticias  
**Costo:** Completamente gratuito, sin registro  

#### Feeds configurados

| Feed | URL | Idioma | Cobertura |
|---|---|---|---|
| BBC Middle East | `feeds.bbci.co.uk/news/world/middle_east/rss.xml` | Inglés | Neutral/occidental |
| Al Jazeera | `aljazeera.com/xml/rss/all.xml` | Inglés | Perspectiva árabe |
| Google News | `news.google.com/rss/search?q=Iran+Israel+conflict` | Inglés | Agregador |
| Tehran Times | `tehrantimes.com/rss` | Inglés | Media estatal iraní |
| Middle East Eye | `middleeasteye.net/rss` | Inglés | Perspectiva regional |

#### Filtro por palabras clave

```python
KEYWORDS = {"iran", "israel", "hezbollah", "hamas", "idf", "irgc", 
            "missile", "attack", "escalat", "hormuz", "war"}
```

Solo se guardan artículos que contengan al menos una keyword en título o resumen.

#### Cómo ejecutar

```python
python -m src.ingestion.rss_client
# → Guarda en data/raw/rss/rss_raw.parquet
# → ~50-200 artículos por ejecución
```

Se recomienda ejecutar **diariamente** (los RSS solo tienen artículos recientes, no histórico).

---

### 3.5 Bluesky

**Tipo:** Señal social — posts públicos  
**URL:** https://bsky.app  
**Costo:** Gratuito con cuenta  
**Registro:** https://bsky.app (gratis)  

#### Términos de búsqueda usados

```python
SEARCH_TERMS = [
    "Iran Israel",
    "IDF attack", 
    "missile strike Middle East",
    "Iran strike",
    "Iran war",
    "Hezbollah Israel"
]
```

#### Datos capturados por post

- `timestamp`: fecha y hora del post
- `text`: contenido del post
- `value`: número de likes (engagement proxy)
- `url`: enlace directo al post en bsky.app

#### Límites de la API

- Máximo 100 resultados por término de búsqueda
- Sin límite explícito de llamadas (uso responsable)
- Solo posts públicos

#### Cómo configurar

```bash
# En .env:
BLUESKY_HANDLE=tu_usuario.bsky.social  # Con o sin el @
BLUESKY_PASSWORD=tu_contraseña
```

> **Importante:** El handle debe NO incluir el `@` al momento del login.
> El script lo elimina automáticamente con `.lstrip("@")`.

#### Cómo ejecutar

```python
python -m src.ingestion.bluesky_client
# → 388 posts por ejecución típica
# → Guarda en data/raw/bluesky/bluesky_raw.parquet
```

---

### 3.6 AISStream

**Tipo:** Movilidad marítima — buques  
**URL:** https://aisstream.io  
**Costo:** Gratuito con registro  
**Protocolo:** WebSocket  

#### Qué cubre

Posiciones de buques en el Golfo Pérsico, Mar Arábigo y Estrecho de Ormuz. Datos AIS (Automatic Identification System) retransmitidos en tiempo real.

#### Datos disponibles en el proyecto

- `raw_events` donde `source = 'aisstream'`: **138 filas** (2026-05-14)
- `events_aisstream`: mismos datos con schema estructurado

> **Nota:** La ingesta de AISStream requiere mantener una conexión WebSocket activa
> durante el tiempo que se quiera capturar datos. No tiene API REST para histórico gratuito.

#### Para replicar

```python
# Requiere cuenta en aisstream.io y key
# La implementación WebSocket está en el proyecto de otro miembro del equipo
# Los datos históricos están disponibles en raw_events (source='aisstream')
```

---

## 4. Modelo ER

### Diagrama entidad-relación

```
                        ┌──────────────────────────────────────┐
                        │              SOURCES                  │
                        │──────────────────────────────────────│
                        │ PK  id            INTEGER             │
                        │     name          TEXT (UNIQUE)       │
                        │     type          TEXT                │
                        │     description   TEXT                │
                        │     endpoint      TEXT                │
                        │     status        TEXT                │
                        │     last_ingested_at TIMESTAMPTZ      │
                        │     created_at    TIMESTAMPTZ         │
                        └──────────────────┬───────────────────┘
                                           │ 1
                          ┌────────────────┼────────────────────────────────┐
                          │                │                                 │
                          │N               │N                               │N
          ┌───────────────┴──┐   ┌─────────┴──────┐   ┌────────────────────┴─┐
          │   RAW_EVENTS     │   │  EVENTS_GDELT  │   │    EVENTS_RSS        │
          │──────────────────│   │────────────────│   │──────────────────────│
          │ PK id     BIGINT │   │ PK id  BIGINT  │   │ PK id       BIGINT   │
          │    timestamp TSTZ│   │    event_date  │   │    timestamp  TSTZ   │
          │    source    TEXT│   │    country TEXT│   │    feed_name  TEXT   │
          │    source_id INT ├──►│    n_conflict  │   │    headline   TEXT   │
          │    country   TEXT│   │    avg_goldst  │   │    url        TEXT   │
          │    lat      FLOAT│   │    has_high_v  │   │    source_id  INT  ──┤
          │    lon      FLOAT│   │    n_mentions  │   │    sentiment  FLOAT  │
          │    text      TEXT│   │    avg_tone    │   │    country_iso3 TEXT │
          │    event_type TEXT   │    source_id INT──►│    created_at TSTZ   │
          │    value    FLOAT│   │    created_at  │   └──────────────────────┘
          │    created_at TSTZ   └────────────────┘
          └──────────────────┘
                          │N                                    │N
          ┌───────────────┴──┐   ┌─────────────────┐   ┌───────┴──────────────┐
          │ EVENTS_OPENSKY   │   │  EVENTS_FIRMS   │   │   EVENTS_AISSTREAM   │
          │──────────────────│   │─────────────────│   │──────────────────────│
          │ PK id    BIGINT  │   │ PK id   BIGINT  │   │ PK id      BIGINT    │
          │    icao24   TEXT │   │    latitude     │   │    mmsi        BIGINT │
          │    callsign TEXT │   │    longitude    │   │    vessel_name  TEXT  │
          │    origin_country│   │    bright_ti4   │   │    timestamp    TSTZ  │
          │    timestamp TSTZ│   │    bright_ti5   │   │    snapshot_date DATE │
          │    flight_date   │   │    frp   FLOAT  │   │    lat         FLOAT  │
          │    lat      FLOAT│   │    acq_date DATE│   │    lon         FLOAT  │
          │    lon      FLOAT│   │    acq_timestamp│   │    speed_knots FLOAT  │
          │    baro_alt FLOAT│   │    satellite    │   │    course_deg  FLOAT  │
          │    velocity FLOAT│   │    confidence   │   │    nav_status  INT    │
          │    on_ground BOOL│   │    source_id INT├──►│    source_id   INT ───┤
          │    source_id INT ├──►│    created_at   │   │    created_at  TSTZ   │
          └──────────────────┘   └─────────────────┘   └──────────────────────┘


          ┌──────────────────────────────────────────────┐
          │              DAILY_FEATURES                   │  ← Tabla ML principal
          │──────────────────────────────────────────────│
          │ PK  id                 BIGINT                 │
          │ UK  date               DATE      ┐            │
          │ UK  country            TEXT      ┘ UNIQUE     │
          │     n_conflict_events  INTEGER                 │
          │     avg_goldstein      FLOAT                  │
          │     has_high_violence  BOOLEAN                │
          │     n_gdelt_mentions   INTEGER                │
          │     n_flights          INTEGER                │
          │     n_hotspots         INTEGER                │
          │     avg_frp            FLOAT                  │
          │     n_news_articles    INTEGER                │
          │     n_ships            INTEGER                │
          │     n_social_posts     INTEGER                │
          │     avg_social_engage  FLOAT                  │
          │     sources_used       TEXT                   │
          │     escalation_level   SMALLINT   ← TARGET   │
          │     created_at         TIMESTAMPTZ            │
          └──────────────────────┬───────────────────────┘
                                 │ 1 (UNIQUE date + country)
                                 │
                                 │N
          ┌──────────────────────┴───────────────────────┐
          │            MODEL_PREDICTIONS                  │
          │──────────────────────────────────────────────│
          │ PK  id               BIGINT                   │
          │ FK  date             DATE  ─┐                 │
          │ FK  country          TEXT  ─┘→ daily_features │
          │ UK  model_name       TEXT   (+ date + country)│
          │     predicted_level  SMALLINT                 │
          │     true_level       SMALLINT                 │
          │     confidence       FLOAT                    │
          │     f1_score         FLOAT                    │
          │     created_at       TIMESTAMPTZ              │
          └──────────────────────────────────────────────┘
```

### Relaciones

| Origen | → | Destino | Tipo | Descripción |
|---|---|---|---|---|
| `raw_events.source_id` | → | `sources.id` | N:1 | Todo evento pertenece a una fuente |
| `events_gdelt.source_id` | → | `sources.id` | N:1 | Eventos GDELT referenciados a fuente |
| `events_rss.source_id` | → | `sources.id` | N:1 | Cada feed RSS registrado en sources |
| `events_opensky.source_id` | → | `sources.id` | N:1 | Vuelos ligados a fuente OpenSky |
| `events_firms.source_id` | → | `sources.id` | N:1 | Hotspots ligados a fuente FIRMS |
| `events_aisstream.source_id` | → | `sources.id` | N:1 | Buques ligados a fuente AISStream |
| `model_predictions(date,country)` | → | `daily_features(date,country)` | N:1 composite | Predicciones solo existen si hay features |

---

## 5. Descripción de tablas

### `sources` — Catálogo de fuentes

Tabla maestra de todas las fuentes de datos. Cada fuente tiene un `id` entero que se usa como FK en todas las demás tablas.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | INTEGER PK | Identificador único |
| `name` | TEXT UNIQUE | Nombre corto (ej: `opensky`, `rss_bbc`) |
| `type` | TEXT | Categoría: `api`, `rss`, `mobility_air`, `mobility_sea`, `thermal`, `social`, `conflict` |
| `description` | TEXT | Descripción legible |
| `endpoint` | TEXT | URL base de la API/feed |
| `status` | TEXT | `active` \| `inactive` \| `deprecated` |
| `last_ingested_at` | TIMESTAMPTZ | Última ejecución del pipeline |
| `created_at` | TIMESTAMPTZ | Fecha de registro |

**Sources existentes:**

| id | name | type | Registros en raw_events |
|---|---|---|---|
| 1 | opensky | mobility_air | 493,382 |
| 2 | firms | thermal | 63,604 |
| 4 | aisstream | mobility_sea | 138 |
| 7 | rss_bbc | rss | 33 |
| 8 | rss_aljazeera | rss | 12 |
| 9 | rss_googlenews | rss | 98 |
| 13 | bluesky | api (social) | 61 |
| 16 | rss_tehrantimes | rss | 26 |
| 17 | rss_middleeasteye | rss | 20 |
| 18 | rss_googlenews_iran | rss | 100 |
| 19 | rss_googlenews_idf | rss | 81 |

---

### `raw_events` — Data lake unificado

Tabla central del sistema. Contiene **557K+ eventos** de todas las fuentes en un schema normalizado. Es la fuente de verdad para el pipeline de features.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `timestamp` | TIMESTAMPTZ | Momento del evento (UTC) |
| `source` | TEXT | Nombre de la fuente (`opensky`, `firms`, `bluesky`…) |
| `source_id` | INTEGER FK→sources | ID de la fuente (para JOINs eficientes) |
| `country` | TEXT | País o código de referencia (aeropuerto ICAO, código ISO…) |
| `lat` | FLOAT | Latitud (cuando disponible) |
| `lon` | FLOAT | Longitud (cuando disponible) |
| `text` | TEXT | Texto del evento (callsign, titular, post…) |
| `event_type` | TEXT | `flight` \| `hotspot` \| `social` \| `news` \| `vessel` |
| `value` | FLOAT | Valor numérico (altitud, FRP, likes, temperatura…) |
| `created_at` | TIMESTAMPTZ | Momento de ingesta |

**Rango temporal por fuente:**

| Source | Desde | Hasta | Filas |
|---|---|---|---|
| opensky | 2023-10-07 | 2025-06-13 | 493,382 |
| firms | 2023-10-07 | 2026-05-14 | 63,604 |
| aisstream | 2026-05-14 | 2026-05-14 | 138 |
| rss_* (varios) | 2023-04-07 | 2026-05-30 | ~570 |
| bluesky | 2026-05-30 | 2026-05-30 | 61 |

---

### `events_gdelt` — Eventos GDELT country-day

Datos GDELT **pre-agregados** por país y día. Uno de los inputs principales de `daily_features`.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `event_date` | DATE | Fecha del periodo |
| `country` | TEXT | Código GDELT: `IRN`, `ISR`, `USA` |
| `n_conflict_events` | INTEGER | Eventos QuadClass 3 o 4 ese día |
| `avg_goldstein` | FLOAT | Goldstein promedio (-10 a +10) |
| `has_high_violence` | BOOLEAN | TRUE si hubo QuadClass=4 ese día |
| `n_mentions` | INTEGER | Total de menciones en medios |
| `avg_tone` | FLOAT | Tono mediático promedio |
| `source_id` | INTEGER FK→sources | Fuente GDELT |
| `created_at` | TIMESTAMPTZ | Fecha de ingesta |

**Unique constraint:** `(event_date, country)` — un solo registro por país-día.

**Periodos cubiertos:** Abr 2024, Oct 2024, Ene 2025, Feb-Mar 2026, May 2026.

---

### `events_rss` — Titulares de noticias

Artículos de RSS filtrados por palabras clave del conflicto.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `timestamp` | TIMESTAMPTZ | Fecha de publicación |
| `feed_name` | TEXT | Nombre del feed (`rss_bbc`, `rss_aljazeera`…) |
| `headline` | TEXT | Titular del artículo |
| `url` | TEXT | Enlace al artículo original |
| `source_id` | INTEGER FK→sources | Fuente RSS |
| `sentiment_score` | FLOAT | Score NLP (-1 a +1), se llena con pipeline |
| `country_iso3` | TEXT | País mencionado (opcional, para geolocalización) |
| `created_at` | TIMESTAMPTZ | Fecha de ingesta |

---

### `events_opensky` — State vectors de vuelos

Registros individuales de aeronaves detectadas sobre el bounding box de Medio Oriente.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `icao24` | TEXT | Código transponder ICAO24 único |
| `callsign` | TEXT | Indicativo de vuelo |
| `origin_country` | TEXT | País de registro de la aeronave |
| `timestamp` | TIMESTAMPTZ | Momento del state vector |
| `flight_date` | DATE | Fecha (auto-calculada via trigger) |
| `lat` | FLOAT | Latitud |
| `lon` | FLOAT | Longitud |
| `baro_altitude_m` | FLOAT | Altitud barométrica en metros |
| `velocity_ms` | FLOAT | Velocidad en m/s |
| `vertical_rate` | FLOAT | Tasa de cambio de altitud m/s |
| `on_ground` | BOOLEAN | TRUE si está en tierra |
| `squawk` | TEXT | Código squawk del transponder |
| `source_id` | INTEGER FK→sources | Fuente OpenSky |
| `created_at` | TIMESTAMPTZ | Fecha de ingesta |

> **Nota:** Los 493K registros históricos de OpenSky viven en `raw_events`.
> `events_opensky` contiene snapshots recientes con el schema completo.

---

### `events_firms` — Hotspots térmicos NASA FIRMS

Detecciones satelitales de anomalías térmicas en zonas de conflicto.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `latitude` | FLOAT | Latitud del hotspot |
| `longitude` | FLOAT | Longitud del hotspot |
| `bright_ti4` | FLOAT | Temperatura de brillo canal 4 (Kelvin) — VIIRS |
| `bright_ti5` | FLOAT | Temperatura de brillo canal 5 (Kelvin) — VIIRS |
| `frp` | FLOAT | Fire Radiative Power en MW |
| `acq_date` | DATE | Fecha de adquisición |
| `acq_time` | INTEGER | Hora de adquisición (HHMM) |
| `acq_timestamp` | TIMESTAMPTZ | Timestamp completo de adquisición |
| `satellite` | TEXT | Satélite (`NOAA-20`, `Suomi NPP`, `Aqua`, `Terra`) |
| `instrument` | TEXT | Sensor (`VIIRS`, `MODIS`) |
| `confidence` | TEXT | Confianza de detección |
| `source_id` | INTEGER FK→sources | Fuente FIRMS |
| `created_at` | TIMESTAMPTZ | Fecha de ingesta |

---

### `events_aisstream` — Buques AIS

Posiciones de embarcaciones en el Golfo Pérsico y Estrecho de Ormuz.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `mmsi` | BIGINT | Maritime Mobile Service Identity |
| `vessel_name` | TEXT | Nombre del buque |
| `timestamp` | TIMESTAMPTZ | Momento de la posición |
| `snapshot_date` | DATE | Fecha del snapshot |
| `lat` | FLOAT | Latitud |
| `lon` | FLOAT | Longitud |
| `speed_knots` | FLOAT | Velocidad sobre el fondo en nudos |
| `course_deg` | FLOAT | Rumbo en grados |
| `nav_status` | INTEGER | Estado AIS (0=en curso, 1=anclado, 5=amarrado…) |
| `source_id` | INTEGER FK→sources | Fuente AISStream |
| `created_at` | TIMESTAMPTZ | Fecha de ingesta |

---

### `daily_features` — Features del modelo ML (tabla principal)

**Esta es la tabla central del pipeline de ML.** Cada fila es una unidad de análisis: un país en un día específico. El pipeline `build_features.py` agrega datos de todas las fuentes para construir esta tabla.

| Columna | Tipo | Fuente | Descripción |
|---|---|---|---|
| `id` | BIGINT PK | — | Auto-generado |
| `date` | DATE | — | Fecha de la ventana temporal |
| `country` | TEXT | — | País: `IRN`, `ISR`, `USA` |
| `n_conflict_events` | INTEGER | GDELT | Eventos de conflicto del día |
| `avg_goldstein` | FLOAT | GDELT | Goldstein promedio (negativo = más conflicto) |
| `has_high_violence` | BOOLEAN | GDELT | ¿Hubo conflicto material (QuadClass=4)? |
| `n_gdelt_mentions` | INTEGER | GDELT | Total menciones mediáticas |
| `n_flights` | INTEGER | OpenSky | Vuelos en bbox Medio Oriente |
| `n_hotspots` | INTEGER | FIRMS | Hotspots térmicos en zonas de conflicto |
| `avg_frp` | FLOAT | FIRMS | FRP promedio de hotspots |
| `n_news_articles` | INTEGER | RSS | Artículos de noticias del día |
| `n_ships` | INTEGER | AISStream | Buques en Golfo/Hormuz |
| `n_social_posts` | INTEGER | Bluesky | Posts sociales del día |
| `avg_social_engagement` | FLOAT | Bluesky | Likes promedio de posts |
| `sources_used` | TEXT | — | Lista de fuentes que aportaron datos |
| `escalation_level` | SMALLINT | Derivado | **TARGET**: 0=bajo, 1=medio, 2=alto |
| `created_at` | TIMESTAMPTZ | — | Fecha de construcción |

**Unique constraint:** `(date, country)` — exactamente un registro por país por día.

#### Derivación del target `escalation_level`

Se usa el percentil de `n_conflict_events` de GDELT:

```python
# Clasificación por percentiles:
# Nivel 0 (bajo):  n_conflict_events < percentil 33
# Nivel 1 (medio): percentil 33 ≤ n_conflict_events < percentil 66  
# Nivel 2 (alto):  n_conflict_events ≥ percentil 66
#                  AND has_high_violence = True
```

---

### `model_predictions` — Predicciones ML

Almacena los resultados de cada modelo por país-día.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | BIGINT PK | Auto-generado |
| `date` | DATE FK→daily_features | Fecha de la predicción |
| `country` | TEXT FK→daily_features | País de la predicción |
| `model_name` | TEXT | `knn`, `naive_bayes`, `logistic_regression`, `ridge` |
| `predicted_level` | SMALLINT | Nivel predicho: 0, 1, 2 |
| `true_level` | SMALLINT | Nivel real (de daily_features.escalation_level) |
| `confidence` | FLOAT | Probabilidad max de predict_proba |
| `f1_score` | FLOAT | F1 weighted del modelo en CV |
| `created_at` | TIMESTAMPTZ | Fecha de predicción |

**Unique constraint:** `(date, country, model_name)` — una predicción por modelo-país-día.

---

## 6. Vistas SQL

Las vistas están disponibles directamente desde el dashboard Next.js usando la anon key.

| Vista | Filas aprox. | Descripción |
|---|---|---|
| `v_sources_status` | 15 | Estado de cada fuente con conteos y fechas |
| `v_daily_timeline` | 229+ | Eventos diarios por fuente y tipo |
| `v_source_coverage` | 229+ | Cobertura temporal por fuente (para heatmap) |
| `v_gdelt_tone_timeline` | 120 | Tono mediático GDELT país-día |
| `v_firms_daily_summary` | variable | Resumen diario de hotspots FIRMS |
| `v_daily_dashboard` | 0* | Features + mejor predicción por país-día |
| `v_escalation_timeline` | 0* | Serie temporal escalada real vs predicha |
| `v_target_distribution` | 0* | Distribución de clases (EDA) |

*Se poblará al correr el pipeline ML.

---

## 7. Pipeline de ingesta paso a paso

### Paso 1: Preparar credenciales

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### Paso 2: Instalar dependencias

```bash
uv venv && uv pip install requests feedparser pandas numpy python-dotenv \
                          pyarrow scikit-learn atproto
```

### Paso 3: Ejecutar ingesta por fuente

```bash
# GDELT (no requiere credenciales — descarga ~70 archivos CSV históricos)
# ⚠️ Tarda 15-30 minutos y consume ~1 GB de ancho de banda
python -m src.ingestion.gdelt_client

# RSS (no requiere credenciales)
python -m src.ingestion.rss_client

# OpenSky (solo snapshot actual; histórico ya está en Supabase)
python -m src.ingestion.opensky_client

# NASA FIRMS (requiere NASA_FIRMS_KEY en .env)
python -m src.ingestion.firms_client

# Bluesky (requiere BLUESKY_HANDLE y BLUESKY_PASSWORD en .env)
python -m src.ingestion.bluesky_client
```

Todos los scripts guardan archivos `.parquet` en `data/raw/<fuente>/`.

### Paso 4: Normalizar y construir features

```bash
# Merge de todas las fuentes en data/processed/integrated.parquet
python -m src.processing.normalize

# Construir features país-día → data/processed/features.parquet
python -m src.features.build_features
```

### Paso 5: Entrenar modelos

```bash
python -m src.models.train
# → Guarda métricas en artifacts/metrics/cv_results.json
# → Guarda mejor modelo en artifacts/models/<nombre>.joblib
```

### Paso 6: Subir a Supabase

```bash
# Uploader (se construye junto con el pipeline)
python -m src.ingestion.supabase_uploader
```

### Diagrama de flujo completo

```
.env (credenciales)
     │
     ▼
python -m src.ingestion.gdelt_client     → data/raw/gdelt/gdelt_raw.parquet
python -m src.ingestion.rss_client       → data/raw/rss/rss_raw.parquet
python -m src.ingestion.opensky_client   → data/raw/opensky/opensky_raw.parquet
python -m src.ingestion.firms_client     → data/raw/firms/firms_raw.parquet
python -m src.ingestion.bluesky_client   → data/raw/bluesky/bluesky_raw.parquet
                │
                ▼
python -m src.processing.normalize       → data/processed/integrated.parquet
                │
                ▼
python -m src.features.build_features    → data/processed/features.parquet
                │                          (incluye escalation_level)
                ▼
python -m src.models.train               → artifacts/models/*.joblib
                │                          artifacts/metrics/cv_results.json
                ▼
Supabase:
  → daily_features (features + target)
  → model_predictions (resultados de los 4 modelos)
```

---

## 8. Configuración de Supabase

### Proyecto

- **Nombre:** osint-conflicto
- **Región:** us-east-1
- **PostgreSQL:** 17.6.1

### Conectar desde Python (Dashboard / API)

```javascript
// Next.js dashboard — usa la anon key (lectura pública)
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Ejemplo: leer vista del dashboard
const { data } = await supabase
  .from('v_daily_dashboard')
  .select('*')
  .order('date', { ascending: false })
  .limit(100)
```

### Conectar desde Python (ingesta / escritura)

```python
# ⚠️ Para inserts desde Python en Python 3.14,
# el cliente oficial de Supabase no es compatible.
# Usar MCP execute_sql o requests directamente.

import requests, json

SUPA_URL = "https://TU_PROYECTO.supabase.co"
# Necesita service_role key para escribir (bypass RLS)
HEADERS = {
    "apikey": "SERVICE_ROLE_KEY",
    "Authorization": "Bearer SERVICE_ROLE_KEY",
    "Content-Type": "application/json"
}

r = requests.post(
    f"{SUPA_URL}/rest/v1/daily_features",
    headers=HEADERS,
    data=json.dumps([{"date": "2026-05-30", "country": "ISR", ...}])
)
```

### Variables de entorno del dashboard (`.env.local` en `/dashboard`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://iswknjfskqiemxgpalui.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...  # Anon key (seguro en frontend)
```

### RLS (Row Level Security)

Todas las tablas tienen dos políticas:
- `anon_select`: SELECT público para el dashboard Next.js
- `service_all`: acceso total para el pipeline Python (service_role)

---

## 9. Replicar el dataset completo

Para replicar todos los datos del proyecto desde cero:

### Datos que NO se pueden replicar exactamente

- **OpenSky histórico** (493K filas, oct 2023 – jun 2025): requiere credenciales de investigador y haber ejecutado el script durante todo ese periodo
- **Bluesky histórico**: Bluesky no tiene API de búsqueda histórica profunda

### Datos que SÍ se pueden replicar

```bash
# 1. GDELT (100% replicable, exportaciones públicas)
python -m src.ingestion.gdelt_client
# Nota: añadir los periodos históricos en gdelt_client.py si se necesitan más fechas

# 2. RSS (replicable para noticias actuales)
python -m src.ingestion.rss_client

# 3. FIRMS (replicable, últimos 5 días; para histórico necesitas más llamadas)
python -m src.ingestion.firms_client

# 4. OpenSky (solo datos actuales sin credenciales)
python -m src.ingestion.opensky_client

# 5. Bluesky (replicable para posts actuales)
python -m src.ingestion.bluesky_client
```

### Ampliar el periodo de GDELT

Para descargar más períodos históricos, editar `src/ingestion/gdelt_client.py`:

```python
periods = [
    # Agregar más períodos aquí:
    (date(2023, 10, 7),  date(2023, 10, 31)),  # Inicio del conflicto
    (date(2024, 1, 1),   date(2024, 3, 31)),   # Q1 2024
    (date(2024, 4, 1),   date(2024, 4, 20)),   # Intercambio misiles Irán-Israel
    (date(2024, 10, 1),  date(2024, 10, 15)),  # Aniversario Oct 7
    (date(2025, 1, 1),   date(2025, 1, 15)),   # Cese el fuego Gaza
    (date(2026, 2, 28),  date(2026, 3, 15)),   # Inicio guerra
    (date(2026, 5, 1),   date(2026, 5, 30)),   # Periodo actual
]
```

### Ampliar el periodo de FIRMS

Para más historial de FIRMS (hasta 1 año con key estándar), hacer múltiples llamadas:

```python
# Pseudocódigo para descargar histórico FIRMS por semanas:
from datetime import date, timedelta

start = date(2023, 10, 7)
end   = date(2026, 5, 30)
current = start

while current < end:
    window_end = min(current + timedelta(days=4), end)
    fetch_firms(start_date=current, day_range=5)
    current = window_end + timedelta(days=1)
```

---

## 10. Resolución de problemas

### Error: `find_dotenv()` falla en Python 3.14

```python
# ❌ No usar
load_dotenv()

# ✅ Usar siempre
from pathlib import Path
load_dotenv(Path(__file__).parents[2] / ".env")
```

### Error: `pyarrow.lib.ArrowTypeError` al guardar parquet

La columna `confidence` de FIRMS mezcla strings y enteros. Solución:
```python
df["confidence"] = df["confidence"].astype(str)
df.to_parquet(...)
```

### Error: Bluesky 401 Unauthorized

El handle debe pasarse sin el `@`:
```python
handle = os.environ["BLUESKY_HANDLE"].lstrip("@")
client.login(handle, password)
```

### Error: FIRMS 400 Bad Request con DEMO_KEY

La DEMO_KEY no permite bbox grandes. Registrarse en firms.modaps.eosdis.nasa.gov para obtener una key real.

### Error: `supabase.client.Client.__init__()` en Python 3.14

El cliente oficial de Supabase no es compatible con Python 3.14 (error en gotrue). Alternativas:
1. Usar la REST API directamente con `requests`
2. Usar la herramienta MCP de Supabase (`execute_sql`)
3. Usar Python 3.11 o 3.12 con el cliente oficial

### GDELT devuelve datos vacíos

La API DOC de GDELT tiene rate limits. El script usa **exportaciones CSV** (`data.gdeltproject.org/events/`), no la API DOC. Verificar conectividad a `data.gdeltproject.org`.

### OpenSky devuelve 0 vuelos

El bbox podría no tener vuelos en ese momento (noche, restricciones de vuelo). También puede ser throttling de la API sin credenciales (solo 400 llamadas/día anónimo).

---

## Apéndice: Índices y rendimiento

Índices críticos para las queries del dashboard:

```sql
-- Para filtros por fecha en el dashboard
idx_raw_events_timestamp    ON raw_events(timestamp)
idx_raw_events_source       ON raw_events(source)
idx_raw_source_id           ON raw_events(source_id)

-- Para features ML
idx_features_country_date   ON daily_features(country, date DESC)
idx_features_level          ON daily_features(escalation_level, date)
idx_features_date           ON daily_features(date, country)

-- Para GDELT
idx_gdelt_country           ON events_gdelt(country)
idx_gdelt_goldstein         ON events_gdelt(avg_goldstein)
idx_gdelt_violence          ON events_gdelt(has_high_violence) WHERE has_high_violence = true

-- Para FIRMS (hotspots de alta intensidad)
idx_firms_high_frp          ON events_firms(frp) WHERE frp > 50
idx_firms_date_frp          ON events_firms(acq_date, frp DESC)
```

---

*Documento generado para el proyecto final ML1-2026I — Universidad Externado de Colombia*
