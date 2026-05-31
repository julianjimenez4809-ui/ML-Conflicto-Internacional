# Sistema de Inteligencia Multifuente - Conflicto Iran-Israel-EE.UU.

Proyecto Final ML1 - Universidad Externado de Colombia - 2026-I

## Pregunta analitica

> Es posible clasificar el nivel de escalada del conflicto Iran-Israel-EE.UU. en ventanas pais-dia usando exclusivamente fuentes abiertas y gratuitas?

## Diseno metodologico

- **Unidad de analisis:** pais-dia.
- **Target:** nivel de escalada (`0=bajo`, `1=medio`, `2=alto`) derivado de eventos y fatalidades de ACLED.
- **Tarea principal:** clasificacion supervisada multiclase.
- **Producto final:** pipeline reproducible, modelos comparados y dashboard web desplegado.

## Fuentes previstas

| Fuente | Tipo | Uso en el proyecto |
| --- | --- | --- |
| ACLED | Eventos estructurados | Target, fatalidades, conteo de eventos, tipo de evento |
| GDELT | Noticias globales | Volumen informativo, corpus textual, narrativa mediatica |
| RSS BBC / Al Jazeera / Google News | Titulares | Senal textual reciente y contraste editorial |
| OpenSky | Movilidad aerea | Conteo y variacion de vuelos en la region |
| Bluesky | Conversacion social | Volumen de posts y senales discursivas |
| NASA FIRMS | Contexto satelital | Fuente opcional para anomalias termicas |

## Modelos base

El proyecto prioriza modelos vistos en ML1:

1. KNN como linea base.
2. Naive Bayes sobre TF-IDF.
3. Logistic Regression con balanceo de clases.
4. Ridge Classifier con regularizacion L2.

Las metricas principales seran `macro F1`, `weighted F1`, matriz de confusion y analisis de errores por clase.

## Estructura del repositorio

```text
.
|-- data/
|   |-- raw/            # Datos crudos por fuente, no versionados
|   |-- interim/        # Datos intermedios
|   `-- processed/      # Dataset integrado y features
|-- docs/               # Documentacion metodologica y tecnica
|-- material de apoyo/  # Enunciado oficial
|-- scripts/            # Scripts auxiliares
|-- src/
|   |-- ingestion/      # Clientes por fuente
|   |-- processing/     # Normalizacion e integracion
|   |-- features/       # Feature engineering
|   `-- models/         # Entrenamiento y evaluacion
|-- dashboard/          # App Next.js
|-- pyproject.toml
`-- .env.example
```

## Instalacion local

```bash
git clone git@github.com:julianjimenez4809-ui/ML-Conflicto-Internacional.git
cd ML-Conflicto-Internacional

python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"

copy .env.example .env
```

Dashboard:

```bash
cd dashboard
npm install
npm run dev
```

URL local:

```text
http://localhost:3000
```

## Variables de entorno

El archivo `.env.example` documenta las credenciales necesarias para ingesta y dashboard. Las claves reales deben ir en `.env` o `dashboard/.env.local`, nunca en Git.

## Pipeline previsto

```bash
python -m src.ingestion.acled_client
python -m src.ingestion.gdelt_client
python -m src.ingestion.rss_client
python -m src.processing.normalize
python -m src.features.build_features
python -m src.models.train
```

La version profesional del pipeline quedara documentada e implementada por fases en [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Dashboard y despliegue

El dashboard vive en `dashboard/` y esta preparado para Vercel:

1. Root Directory: `dashboard`
2. Framework: Next.js
3. Variables requeridas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Estado actual

- Repo conectado por SSH a GitHub.
- Dashboard Next.js funcionando localmente.
- Supabase configurado para frontend.
- Clientes iniciales de ingesta disponibles.
- Pendiente: ejecutar ingesta real, construir dataset final, entrenar modelos y alimentar dashboard con resultados.
