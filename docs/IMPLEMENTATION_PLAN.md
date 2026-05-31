# Plan de implementacion profesional

Este plan traduce el enunciado oficial de ML1 en una ruta de trabajo concreta para construir un sistema de inteligencia multifuente solido, reproducible y defendible.

## 1. Alcance analitico

**Pregunta principal:** clasificar el nivel de escalada del conflicto Iran-Israel-EE.UU. en ventanas pais-dia usando fuentes abiertas.

**Unidad de analisis:** pais-dia.

**Target:** `escalation_level`, construido desde ACLED:

- `0`: baja escalada.
- `1`: escalada media.
- `2`: escalada alta.

La definicion exacta del target debe quedar documentada con umbrales y justificacion empirica despues del EDA.

## 2. Fuentes

Fuentes principales:

- ACLED: eventos, fatalidades, actores y tipo de evento.
- GDELT: noticias globales y corpus textual.
- RSS: titulares de BBC, Al Jazeera y Google News.
- OpenSky: movilidad aerea regional.
- Bluesky: conversacion social publica.

Fuente opcional:

- NASA FIRMS: anomalias termicas como contexto satelital.

## 3. Pipeline de datos

Cada fuente debe producir archivos en `data/raw/<source>/` con trazabilidad minima:

- rango de fechas consultado;
- fecha de ejecucion;
- cantidad de registros;
- errores o limitaciones de consulta.

Luego todas las fuentes pasan por una normalizacion comun:

```text
timestamp, source, country, lat, lon, text, event_type, value
```

Producto esperado:

```text
data/processed/integrated.parquet
```

## 4. Feature engineering

Features por pais-dia:

- `n_events`: numero de eventos ACLED.
- `total_fatalities`: fatalidades totales.
- `event_type_counts`: composicion de tipos de evento.
- `n_news`: volumen de noticias.
- `daily_news_text`: texto agregado para TF-IDF.
- `n_flights`: conteo de vuelos en la region.
- `flight_delta`: cambio respecto al dia anterior.
- `n_posts`: volumen social.
- `avg_likes`: interaccion promedio en Bluesky.

Producto esperado:

```text
data/processed/features.parquet
```

## 5. EDA

El analisis exploratorio debe responder:

- que cobertura temporal tiene cada fuente;
- que tan balanceado esta el target;
- que paises o fechas concentran eventos;
- como se relacionan noticias, vuelos y posts con eventos ACLED;
- que sesgos y faltantes existen.

Entregables:

- notebook o reporte reproducible;
- visualizaciones exportables;
- tabla de calidad de datos.

## 6. Modelado

Modelos obligatorios o base:

- KNN.
- Naive Bayes con TF-IDF.
- Logistic Regression con `class_weight="balanced"`.
- Ridge Classifier.

Evaluacion:

- validacion cruzada estratificada;
- `macro F1`;
- `weighted F1`;
- accuracy como metrica secundaria;
- matriz de confusion;
- analisis de errores por clase.

Productos esperados:

```text
artifacts/metrics/cv_results.json
artifacts/metrics/classification_report.json
artifacts/metrics/confusion_matrix.json
artifacts/models/<best_model>.joblib
```

## 7. Supabase

Supabase se usara como backend liviano para el dashboard.

Tablas recomendadas:

- `source_summary`
- `daily_features`
- `model_metrics`
- `predictions`
- `pipeline_runs`

El dashboard no debe depender de archivos locales en produccion.

## 8. Dashboard

Vistas minimas:

- resumen ejecutivo del problema;
- cobertura de fuentes;
- serie temporal de escalada;
- mapa de eventos;
- comparacion de fuentes;
- resultados de modelos;
- matriz de confusion;
- limitaciones y sesgos.

El dashboard debe comunicar decisiones metodologicas, no solo graficas.

## 9. Despliegue

Destino recomendado:

- Vercel para `dashboard/`;
- GitHub como repositorio central;
- Supabase para datos agregados y metricas.

Variables requeridas en Vercel:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 10. Secuencia de trabajo

1. Limpiar documentacion y textos visibles.
2. Consolidar pipeline de ingesta.
3. Descargar muestra pequena de datos reales.
4. Validar normalizacion e integracion.
5. Construir features y target.
6. Ejecutar EDA.
7. Entrenar y comparar modelos.
8. Guardar metricas y mejor modelo.
9. Subir resultados agregados a Supabase.
10. Construir dashboard final y desplegar.
