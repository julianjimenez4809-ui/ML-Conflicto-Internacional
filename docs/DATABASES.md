# Documentación de Fuentes de Datos — Proyecto ML Conflicto Internacional

Este documento detalla el procedimiento técnico y los requisitos para obtener los datos de cada una de las fuentes integradas en el Sistema de Inteligencia Multifuente.

## 1. ACLED (Armed Conflict Location & Event Data)
**Tipo:** Datos estructurados de eventos de conflicto.
**Uso en el proyecto:** Definición del *target* (nivel de escalada) y conteo de fatalidades.

### Procedimiento de obtención:
1.  **Registro:** Crear una cuenta en [acleddata.com](https://acleddata.com/).
2.  **API Key:** Una vez registrado, ir al panel de control para obtener el `ACLED_EMAIL` y `ACLED_KEY`.
3.  **Parámetros de consulta:**
    *   **Países:** Irán, Israel, Estados Unidos.
    *   **Filtros:** `event_date` (entre fechas específicas), `country`.
    *   **Campos requeridos:** `event_date`, `event_type`, `fatalities`, `notes`, `latitude`, `longitude`.
4.  **Endpoint:** `https://api.acleddata.com/acled/read`

---

## 2. GDELT (Global Database of Events, Language, and Tone)
**Tipo:** Datos textuales, metadatos de noticias y tono.
**Uso en el proyecto:** Análisis de sentimiento y frecuencia de menciones en medios globales.

### Procedimiento de obtención:
1.  **Acceso:** No requiere llave (es público).
2.  **API:** Se utiliza el **GDELT 2.0 DOC API**.
3.  **Consulta (Query):** Se recomienda filtrar por términos clave como:
    `("Iran" OR "Israel") AND ("conflict" OR "attack" OR "missile" OR "escalation")`
4.  **Endpoint:** `https://api.gdeltproject.org/api/v2/doc/doc`
5.  **Modo:** `artlist` (para obtener lista de artículos) o `timelinevol` (para volumen en el tiempo).

---

## 3. RSS Feeds (BBC, Al Jazeera, Google News)
**Tipo:** Titulares de noticias en tiempo real.
**Uso en el proyecto:** Ingesta de texto reciente para procesamiento de lenguaje natural (NLP).

### Procedimiento de obtención:
1.  **Acceso:** Público a través de URLs de RSS.
2.  **URLs sugeridas:**
    *   BBC World: `http://feeds.bbci.co.uk/news/world/rss.xml`
    *   Al Jazeera: `https://www.aljazeera.com/xml/rss/all.xml`
    *   Google News (Búsqueda): `https://news.google.com/rss/search?q=Iran+Israel+conflict`
3.  **Librería:** Se utiliza `feedparser` en Python para extraer títulos y descripciones.

---

## 4. OpenSky Network
**Tipo:** Datos de movilidad aérea (vuelos).
**Uso en el proyecto:** Detección de anomalías en el tráfico aéreo que puedan indicar movimientos militares o cierres de espacio aéreo.

### Procedimiento de obtención:
1.  **Registro:** Crear cuenta en [opensky-network.org](https://opensky-network.org/).
2.  **Credenciales:** Generar `CLIENT_ID` y `CLIENT_SECRET` en la sección de cuenta (OAuth2).
3.  **Endpoint Histórico:** `https://opensky-network.org/api/flights/all`
4.  **Parámetros:** `begin` y `end` (timestamps Unix).
5.  **Restricciones:** Los datos históricos tienen límites según el tipo de cuenta.

---

## 5. Bluesky (AT Protocol)
**Tipo:** Redes sociales (microblogging).
**Uso en el proyecto:** Captura de reacciones ciudadanas y reportes no oficiales en tiempo real.

### Procedimiento de obtención:
1.  **Cuenta:** Tener un handle en Bluesky (ej. `usuario.bsky.social`).
2.  **App Password:** Generar una contraseña específica para aplicaciones en la configuración de seguridad de Bluesky.
3.  **Librería:** Se utiliza `atproto` (Python SDK).
4.  **Búsqueda:** Consultar posts que contengan hashtags o términos relacionados al conflicto.

---

## 6. NASA FIRMS (Fire Information for Resource Management System)
**Tipo:** Datos satelitales de incendios y anomalías térmicas.
**Uso en el proyecto:** Identificación de posibles explosiones o ataques detectados por sensores infrarrojos.

### Procedimiento de obtención:
1.  **Registro:** Solicitar una API Key en [firms.modaps.eosdis.nasa.gov](https://firms.modaps.eosdis.nasa.gov/api/config/).
2.  **Endpoint:** `https://firms.modaps.eosdis.nasa.gov/api/area/csv/[KEY]/[SOURCE]/[EXTENT]/[DAYS]`
3.  **Filtros:** Coordenadas geográficas (Bounding Box) de la región de Medio Oriente.

---

## Resumen de Credenciales Necesarias (.env)
Para habilitar todas las descargas, el archivo `.env` debe contener:
```bash
ACLED_EMAIL=tu_email
ACLED_KEY=tu_llave
NASA_FIRMS_KEY=tu_llave
OPENSKY_CLIENT_ID=tu_id
OPENSKY_CLIENT_SECRET=tu_secreto
BLUESKY_HANDLE=tu_usuario
BLUESKY_PASSWORD=tu_app_password
```
