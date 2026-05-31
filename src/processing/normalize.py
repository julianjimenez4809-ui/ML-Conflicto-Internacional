"""Normalize source parquet files into a common schema for supplementary features.

GDELT is NOT processed here — it's already aggregated (country-day) and
goes directly into build_features.py.

Sources handled: rss, opensky, bluesky, firms
Schema: timestamp, source, country, lat, lon, text, event_type, value
"""

from pathlib import Path
import pandas as pd

RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

SCHEMA = ["timestamp", "source", "country", "lat", "lon", "text", "event_type", "value"]


def _load_parquets(source: str) -> pd.DataFrame:
    path = RAW_DIR / source
    files = sorted(path.glob("*.parquet"))
    if not files:
        return pd.DataFrame(columns=SCHEMA)
    return pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)


def _normalize_rss(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=SCHEMA)
    out = pd.DataFrame({
        "timestamp":  pd.to_datetime(df["timestamp"], utc=True, errors="coerce"),
        "source":     df["source"].fillna("rss"),
        "country":    df.get("country", None),
        "lat":        None,
        "lon":        None,
        "text":       df["text"].fillna(""),
        "event_type": "news",
        "value":      None,
    })
    return out.dropna(subset=["timestamp"]).reset_index(drop=True)


def _normalize_opensky(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=SCHEMA)
    # Puede venir con diferentes schemas (state-vector o simplificado)
    ts_col = "timestamp" if "timestamp" in df.columns else None
    if ts_col is None:
        return pd.DataFrame(columns=SCHEMA)
    out = pd.DataFrame({
        "timestamp":  pd.to_datetime(df[ts_col], utc=True, errors="coerce"),
        "source":     "opensky",
        "country":    df.get("origin_country", df.get("country", None)),
        "lat":        df.get("latitude", df.get("lat", None)),
        "lon":        df.get("longitude", df.get("lon", None)),
        "text":       df.get("callsign", df.get("text", "")).astype(str).str.strip(),
        "event_type": "flight",
        "value":      df.get("baro_altitude", df.get("value", None)),
    })
    return out.dropna(subset=["timestamp"]).reset_index(drop=True)


def _normalize_bluesky(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=SCHEMA)
    out = pd.DataFrame({
        "timestamp":  pd.to_datetime(df["timestamp"], utc=True, errors="coerce"),
        "source":     "bluesky",
        "country":    None,
        "lat":        None,
        "lon":        None,
        "text":       df["text"].fillna(""),
        "event_type": "social",
        "value":      pd.to_numeric(df.get("value", 0), errors="coerce").fillna(0),
    })
    return out.dropna(subset=["timestamp"]).reset_index(drop=True)


def _normalize_firms(df: pd.DataFrame) -> pd.DataFrame:
    """FIRMS tiene schema propio (lat/lon/frp/acq_date). Se convierte al schema comun."""
    if df.empty:
        return pd.DataFrame(columns=SCHEMA)

    # Generar timestamp desde acq_date + acq_time (si existe)
    if "acq_date" in df.columns:
        ts = pd.to_datetime(df["acq_date"].astype(str), utc=True, errors="coerce")
    elif "acq_timestamp" in df.columns:
        ts = pd.to_datetime(df["acq_timestamp"], utc=True, errors="coerce")
    else:
        return pd.DataFrame(columns=SCHEMA)

    # Etiquetar zona geografica como country proxy
    lat = pd.to_numeric(df.get("latitude", None), errors="coerce")
    lon = pd.to_numeric(df.get("longitude", None), errors="coerce")

    def _geo_country(r):
        la, lo = r["latitude"], r["longitude"]
        if 25 <= la <= 38 and 44 <= lo <= 63:
            return "IRN"
        if 29 <= la <= 34 and 34 <= lo <= 37:
            return "ISR"
        if 33 <= la <= 37 and 35 <= lo <= 42:
            return "SYR"
        return "OTHER"

    tmp = pd.DataFrame({"latitude": lat, "longitude": lon})
    country = tmp.apply(_geo_country, axis=1)

    frp = pd.to_numeric(df.get("frp", None), errors="coerce")
    out = pd.DataFrame({
        "timestamp":  ts,
        "source":     df.get("source", "firms"),
        "country":    country,
        "lat":        lat,
        "lon":        lon,
        "text":       "thermal_hotspot frp=" + frp.round(1).astype(str),
        "event_type": "hotspot",
        "value":      frp,
    })
    return out.dropna(subset=["timestamp"]).reset_index(drop=True)


_NORMALIZERS = {
    "rss":     _normalize_rss,
    "opensky": _normalize_opensky,
    "bluesky": _normalize_bluesky,
    "firms":   _normalize_firms,
}


def build_integrated_dataset() -> pd.DataFrame:
    frames = []
    for source, fn in _NORMALIZERS.items():
        raw = _load_parquets(source)
        df = fn(raw)
        if df.empty:
            print(f"[skip] {source}: sin datos")
        else:
            print(f"[load] {source}: {len(df):,} filas")
            frames.append(df[SCHEMA])

    if not frames:
        raise ValueError("No hay datos en data/raw/. Ejecuta los scripts de ingesta primero.")

    integrated = (
        pd.concat(frames, ignore_index=True)
        .drop_duplicates()
        .sort_values("timestamp")
        .reset_index(drop=True)
    )
    out = PROCESSED_DIR / "integrated.parquet"
    integrated.to_parquet(out, index=False)
    print(f"\nDataset integrado: {len(integrated):,} filas -> {out}")
    print(integrated["source"].value_counts().to_string())
    return integrated


if __name__ == "__main__":
    build_integrated_dataset()
