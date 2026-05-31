# Estado del Proyecto — ML Conflicto Internacional

**Última actualización:** 2026-05-30

---

## ✅ Completado

### Infraestructura
- [x] Repositorio GitHub configurado con SSH (`git@github.com:Juliand10x/ML-Conflicto-Internacional.git`)
- [x] Proyecto Next.js (dashboard) en `dashboard/`
- [x] Entorno Python con `pyproject.toml` y `.venv`
- [x] Supabase conectado (URL + Anon Key en `dashboard/.env.local`)

### Datos
- [x] Ingesta de datos FIRMS (NASA) → Supabase `raw_events` (>249k filas)
- [x] Descarga de datos desde Supabase → `data/raw/supabase_export.parquet` (1,000 filas Abr 2024)
- [x] Datos sintéticos ACLED para Abril 2024 → `data/raw/acled/acled_mock_202404.parquet` (120 filas)
- [x] Normalización e integración → `data/processed/integrated.parquet` (1,055 filas)

### Machine Learning
- [x] Feature engineering → `data/processed/features.parquet` (55 filas país-día)
  - Features numéricas: `n_events`, `total_fatalities`, `n_flights`, `n_posts`, `avg_likes`
  - Feature textual: `daily_news_text` (texto combinado por día)
  - Target: `escalation_level` (0=bajo, 1=medio, 2=alto)
- [x] Entrenamiento y evaluación (3-fold Stratified CV):
  | Modelo              | F1 (media) | F1 (std) |
  |---------------------|-----------|---------|
  | KNN ⭐              | 1.000     | 0.000   |
  | Logistic Regression | 1.000     | 0.000   |
  | Ridge Classifier    | 0.981     | 0.026   |
  | Naive Bayes         | 0.414     | 0.025   |
- [x] Mejor modelo guardado → `artifacts/models/knn.joblib`
- [x] Métricas guardadas → `artifacts/metrics/cv_results.json`

### Dashboard (Next.js)
- [x] Conexión en vivo a Supabase (`raw_events`)
- [x] KPIs dinámicos: total de eventos, mejor modelo, modelos evaluados
- [x] Tabla de últimos eventos desde Supabase
- [x] Visualización de resultados de los modelos con barras de progreso
- [x] Conteo de eventos por fuente de datos

---

## 🔄 Pendiente / Mejoras futuras

### Datos reales faltantes (requieren credenciales)
- [ ] **ACLED real**: Requiere `ACLED_EMAIL` + `ACLED_KEY` de acleddata.com
- [ ] **GDELT**: Sin datos (API pública, script listo en `src/ingestion/gdelt_client.py`)
- [ ] **RSS**: Sin datos recientes (script listo en `src/ingestion/rss_client.py`)
- [ ] **OpenSky**: Requiere `OPENSKY_CLIENT_ID` + `OPENSKY_CLIENT_SECRET`
- [ ] **Bluesky**: Requiere `BLUESKY_HANDLE` + `BLUESKY_PASSWORD`

### Pipeline
- [ ] Subir features a Supabase `daily_features` (ajustar esquema de la tabla)
- [ ] Subir resultados de modelos a Supabase `model_predictions` (ajustar esquema)
- [ ] Ampliar dataset a más meses (solo Abril 2024 actualmente)

### Dashboard
- [ ] Añadir gráficos de serie de tiempo (Chart.js / Recharts)
- [ ] Añadir mapa geográfico de eventos
- [ ] Filtros por fecha y fuente

---

## 🗂️ Estructura del Proyecto

```
ML-Conflicto-Internacional/
├── src/
│   ├── ingestion/          # Clientes de cada fuente de datos
│   ├── processing/         # Normalización, descarga Supabase, mock ACLED
│   ├── features/           # build_features.py
│   └── models/             # train.py
├── data/
│   ├── raw/                # Datos crudos por fuente
│   └── processed/          # integrated.parquet, features.parquet
├── artifacts/
│   ├── models/             # knn.joblib (mejor modelo)
│   └── metrics/            # cv_results.json
├── dashboard/              # Next.js — interfaz web
│   └── src/app/page.tsx    # Dashboard conectado a Supabase
└── docs/                   # Documentación técnica
```
