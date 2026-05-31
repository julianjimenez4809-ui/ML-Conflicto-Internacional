---
name: project-context
description: Estado del proyecto OSINT ML1 — DB, datos, pipeline y pendientes
metadata:
  type: project
---

Proyecto final ML1-2026I: sistema de inteligencia multifuente sobre conflicto Irán-Israel-EE.UU.

**Pregunta analítica:** ¿Es posible clasificar el nivel de escalada (0/1/2) en ventanas país-día usando fuentes abiertas?
**Unidad de análisis:** país-día | **Target:** escalation_level derivado de GDELT | **Fuentes:** 5+ sin ACLED

## Supabase — Estado final migrado (2026-05-30)
- Proyecto: `osint-conflicto` (id: iswknjfskqiemxgpalui, us-east-1, ACTIVE_HEALTHY)
- **8 migraciones aplicadas** — esquema ER coherente y funcional

### Tablas con datos
| Tabla | Filas | Periodo |
|---|---|---|
| raw_events | 557K+ | Oct 2023 – May 2026 |
| events_gdelt | 120 | 2024-2026 (country-day IRN/ISR/USA) |
| events_rss | 141 | May 2026 (BBC·AJ·GNews) |
| events_firms | 348 | May 2026 (top hotspots) |
| events_opensky | 9 | May 2026 (snapshot) |
| events_aisstream | 138 | May 2026 |
| sources | 15 | — |
| daily_features | 0 | PENDIENTE (pipeline ML) |
| model_predictions | 0 | PENDIENTE (pipeline ML) |

### ER coherente — FKs correctas
- `raw_events.source_id` → `sources(id)` ✅ (todos los 557K rows resueltos)
- `events_*.source_id` → `sources(id)` ✅
- `events_gdelt.source_id` → `sources(id)` ✅
- `model_predictions(date, country)` → `daily_features(date, country)` ✅ (FK compuesto correcto)

### Columnas daily_features (para el modelo ML)
id, date, country, n_conflict_events, avg_goldstein, has_high_violence,
n_gdelt_mentions, n_flights, n_hotspots, avg_frp, n_news_articles, n_ships,
escalation_level (TARGET), n_social_posts, avg_social_engagement, sources_used

### Vistas disponibles
- v_sources_status (15 filas) — estado de cada fuente con conteos
- v_daily_timeline (229 filas) — eventos diarios por fuente
- v_source_coverage (229 filas) — cobertura temporal por fuente
- v_gdelt_tone_timeline (120 filas) — tono mediático GDELT
- v_firms_daily_summary (5 filas) — resumen FIRMS diario
- v_daily_dashboard (0, espera daily_features) — features + predicciones
- v_escalation_timeline (0, espera daily_features) — escalada real vs predicha
- v_target_distribution (0, espera daily_features) — distribución del target

### RLS
- `anon_select`: SELECT público para dashboard Next.js (anon key)
- `service_all`: acceso total para service_role (pipeline MCP)

## Stack técnico (notas importantes)
- Python 3.14, uv, .venv
- load_dotenv() en Py3.14 requiere path explícito: `load_dotenv(Path(__file__).parents[2] / ".env")`
- Supabase Python client incompatible con Py3.14 → usar MCP execute_sql para inserts
- pyarrow falla con columnas tipo mixto → castear a str antes de to_parquet()
- bluesky_client.py: strip "@" del handle antes de login

## Próximos pasos
1. **build_features.py**: leer raw_events (OpenSky, FIRMS, Bluesky) + events_gdelt + events_rss → poblar daily_features con escalation_level derivado de GDELT
2. **train.py**: KNN, Naive Bayes, LogReg, Ridge → guardar métricas en artifacts/metrics/
3. **Subir** daily_features y model_predictions a Supabase
4. **Dashboard**: conectar Next.js a Supabase con anon key, mostrar vistas v_daily_dashboard y v_escalation_timeline
