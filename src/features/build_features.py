"""Feature engineering — construye el dataset ML listo para entrenar.

Unidad de analisis : pais-dia (country-day)
Paises             : IRN, ISR, USA  (codigos GDELT)
Target             : escalation_level (0=bajo, 1=medio, 2=alto)
                     derivado de n_conflict_events de GDELT por
                     cuartiles dentro de cada pais (sin sesgo de escala).

Fuentes de features:
  - GDELT          → n_conflict_events, avg_goldstein, has_high_violence, n_mentions
  - RSS            → n_news_articles, daily_news_text (TF-IDF)
  - NASA FIRMS     → n_hotspots (zonas ISR e IRN), avg_frp
  - OpenSky        → n_flights
  - Bluesky        → n_social_posts, avg_social_engagement
"""

from pathlib import Path
import numpy as np
import pandas as pd

RAW_DIR       = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


# ─────────────────────────────────────────────
# 1. Carga de datos brutos
# ─────────────────────────────────────────────

def _load_gdelt() -> pd.DataFrame:
    import datetime
    path = RAW_DIR / "gdelt" / "gdelt_raw.parquet"
    df = pd.read_parquet(path)
    df["event_date"] = pd.to_datetime(df["event_date"]).dt.date
    df["country"] = df["country"].str.strip().str.upper()
    # Filtrar a periodo del conflicto (excluye fechas anomalas 2014-2016)
    cutoff = datetime.date(2024, 1, 1)
    before = len(df)
    df = df[df["event_date"] >= cutoff].reset_index(drop=True)
    if before > len(df):
        print(f"  GDELT: descartadas {before - len(df)} filas con fecha < 2024-01-01")
    return df


def _load_rss() -> pd.DataFrame:
    path = RAW_DIR / "rss" / "rss_raw.parquet"
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_parquet(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df["date"] = df["timestamp"].dt.date
    return df


def _load_firms() -> pd.DataFrame:
    path = RAW_DIR / "firms" / "firms_raw.parquet"
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_parquet(path)
    df["acq_date"] = pd.to_datetime(df["acq_date"], errors="coerce").dt.date
    df["frp"] = pd.to_numeric(df.get("frp", None), errors="coerce")
    df["latitude"]  = pd.to_numeric(df.get("latitude", None),  errors="coerce")
    df["longitude"] = pd.to_numeric(df.get("longitude", None), errors="coerce")
    return df


def _load_opensky() -> pd.DataFrame:
    path = RAW_DIR / "opensky" / "opensky_raw.parquet"
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_parquet(path)
    df["timestamp"] = pd.to_datetime(df.get("timestamp", None), utc=True, errors="coerce")
    df["date"] = df["timestamp"].dt.date
    return df


def _load_bluesky() -> pd.DataFrame:
    path = RAW_DIR / "bluesky" / "bluesky_raw.parquet"
    if not path.exists():
        return pd.DataFrame()
    df = pd.read_parquet(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, errors="coerce")
    df["date"] = df["timestamp"].dt.date
    df["value"] = pd.to_numeric(df.get("value", 0), errors="coerce").fillna(0)
    return df


# ─────────────────────────────────────────────
# 2. Derivar la variable objetivo desde GDELT
# ─────────────────────────────────────────────

def _derive_target(gdelt: pd.DataFrame) -> pd.DataFrame:
    """Clasifica cada country-day en nivel de escalada 0/1/2.

    Estrategia: cuartiles de n_conflict_events DENTRO de cada pais.
    Esto evita el sesgo de escala (USA tiene ~5x mas eventos que IRN/ISR).

    Nivel 0 (bajo)  : n_conflict_events < p33 del pais
    Nivel 1 (medio) : p33 <= n_conflict_events < p66
    Nivel 2 (alto)  : n_conflict_events >= p66
    """
    df = gdelt.copy()

    def _cut_country(group: pd.DataFrame) -> pd.Series:
        x = group["n_conflict_events"]
        p33 = x.quantile(0.33)
        p66 = x.quantile(0.66)
        labels = []
        for v, hv in zip(x, group["has_high_violence"]):
            if v < p33:
                labels.append(0)
            elif v < p66:
                labels.append(1)
            else:
                # Alto solo si hay conflicto material (QuadClass=4)
                labels.append(2 if hv else 1)
        return pd.Series(labels, index=group.index, dtype=int)

    df["escalation_level"] = (
        df.groupby("country", group_keys=False)
          .apply(_cut_country)
    )
    return df


# ─────────────────────────────────────────────
# 3. Features de cada fuente
# ─────────────────────────────────────────────

def _rss_features(rss: pd.DataFrame) -> pd.DataFrame:
    if rss.empty:
        return pd.DataFrame(columns=["date", "n_news_articles", "daily_news_text"])
    agg = (
        rss.groupby("date")
        .agg(
            n_news_articles=("text", "count"),
            daily_news_text=("text", lambda x: " ".join(x.fillna("").astype(str))),
        )
        .reset_index()
    )
    return agg


def _firms_features(firms: pd.DataFrame) -> pd.DataFrame:
    """Hotspots en zonas de conflicto ISR (Israel/Gaza/Libano) e IRN (Iran).
    Se agrega por fecha y se asigna un country-proxy geografico.
    """
    if firms.empty:
        return pd.DataFrame(columns=["date", "country", "n_hotspots", "avg_frp"])

    lat = firms["latitude"]
    lon = firms["longitude"]

    # Mascara geografica: Israel/Gaza/Libano
    isr_mask = (lat.between(29, 34)) & (lon.between(34, 37))
    # Mascara: Iran
    irn_mask = (lat.between(25, 38)) & (lon.between(44, 63))

    frames = []
    for mask, cc in [(isr_mask, "ISR"), (irn_mask, "IRN")]:
        sub = firms[mask].copy()
        if sub.empty:
            continue
        agg = (
            sub.groupby("acq_date")
            .agg(n_hotspots=("frp", "count"), avg_frp=("frp", "mean"))
            .reset_index()
            .rename(columns={"acq_date": "date"})
        )
        agg["country"] = cc
        frames.append(agg)

    if not frames:
        return pd.DataFrame(columns=["date", "country", "n_hotspots", "avg_frp"])
    return pd.concat(frames, ignore_index=True)


def _opensky_features(opensky: pd.DataFrame) -> pd.DataFrame:
    if opensky.empty:
        return pd.DataFrame(columns=["date", "n_flights"])
    return (
        opensky.groupby("date")
        .agg(n_flights=("date", "count"))
        .reset_index()
    )


def _bluesky_features(bluesky: pd.DataFrame) -> pd.DataFrame:
    if bluesky.empty:
        return pd.DataFrame(columns=["date", "n_social_posts", "avg_social_engagement"])
    return (
        bluesky.groupby("date")
        .agg(
            n_social_posts=("text", "count"),
            avg_social_engagement=("value", "mean"),
        )
        .reset_index()
    )


# ─────────────────────────────────────────────
# 4. Construir el dataset final
# ─────────────────────────────────────────────

def build(save: bool = True) -> pd.DataFrame:
    print("Cargando fuentes de datos...")
    gdelt   = _load_gdelt()
    rss     = _load_rss()
    firms   = _load_firms()
    opensky = _load_opensky()
    bluesky = _load_bluesky()

    print(f"  GDELT:   {len(gdelt):,} country-day rows")
    print(f"  RSS:     {len(rss):,} articulos")
    print(f"  FIRMS:   {len(firms):,} hotspots")
    print(f"  OpenSky: {len(opensky):,} state-vectors")
    print(f"  Bluesky: {len(bluesky):,} posts")

    # Tabla base: GDELT con target derivado
    base = _derive_target(gdelt)
    # has_high_violence es True en el 100% de filas (conflicto permanente) → no aporta como feature

    # Features adicionales
    rss_feat     = _rss_features(rss)
    firms_feat   = _firms_features(firms)
    opensky_feat = _opensky_features(opensky)
    bluesky_feat = _bluesky_features(bluesky)

    # Merge: RSS por fecha (sin diferenciar pais)
    df = base.merge(rss_feat, left_on="event_date", right_on="date", how="left")
    df = df.drop(columns=["date"], errors="ignore")

    # Merge: FIRMS por fecha + pais
    df = df.merge(
        firms_feat, left_on=["event_date", "country"], right_on=["date", "country"], how="left"
    ).drop(columns=["date"], errors="ignore")

    # Merge: OpenSky por fecha (global bbox Medio Oriente)
    df = df.merge(opensky_feat, left_on="event_date", right_on="date", how="left")
    df = df.drop(columns=["date"], errors="ignore")

    # Merge: Bluesky por fecha (global, sin geo)
    df = df.merge(bluesky_feat, left_on="event_date", right_on="date", how="left")
    df = df.drop(columns=["date"], errors="ignore")

    # Rellenar NaN en features suplementarias con 0
    supplement_cols = [
        "n_news_articles", "daily_news_text",
        "n_hotspots", "avg_frp",
        "n_flights",
        "n_social_posts", "avg_social_engagement",
    ]
    for col in supplement_cols:
        if col not in df.columns:
            df[col] = 0
    df["n_news_articles"]       = df["n_news_articles"].fillna(0).astype(int)
    df["n_hotspots"]            = df["n_hotspots"].fillna(0).astype(int)
    df["avg_frp"]               = df["avg_frp"].fillna(0.0)
    df["n_flights"]             = df["n_flights"].fillna(0).astype(int)
    df["n_social_posts"]        = df["n_social_posts"].fillna(0).astype(int)
    df["avg_social_engagement"] = df["avg_social_engagement"].fillna(0.0)

    # Texto diario para TF-IDF: combinar RSS + descriptor estructurado GDELT
    # El descriptor GDELT garantiza que TF-IDF vea los paises y la magnitud del conflicto
    # incluso cuando no hay titulares RSS que coincidan con la fecha.
    intensity = pd.cut(
        df["n_conflict_events"],
        bins=[-1, df["n_conflict_events"].quantile(0.33),
               df["n_conflict_events"].quantile(0.66), np.inf],
        labels=["low_conflict", "medium_conflict", "high_conflict"]
    ).astype(str)
    df["gdelt_text"] = (
        df["country"] + " "
        + intensity + " "
        + df["n_conflict_events"].astype(str) + "_events "
        + df["avg_goldstein"].round(1).astype(str) + "_goldstein "
        + df["n_mentions"].astype(str) + "_mentions"
    )
    df["daily_news_text"] = (
        df["daily_news_text"].fillna("").astype(str).str.strip()
        + " " + df["gdelt_text"]
    ).str.strip()

    # Columnas finales ordenadas (has_high_violence_int excluido: constante=1 en todos)
    final_cols = [
        "event_date", "country",
        # Features GDELT (core)
        "n_conflict_events", "avg_goldstein", "n_mentions",
        # Features RSS
        "n_news_articles",
        # Features FIRMS
        "n_hotspots", "avg_frp",
        # Features OpenSky
        "n_flights",
        # Features Bluesky
        "n_social_posts", "avg_social_engagement",
        # Texto para TF-IDF
        "daily_news_text",
        # Target
        "escalation_level",
    ]
    df = df[final_cols].reset_index(drop=True)

    if save:
        out = PROCESSED_DIR / "features.parquet"
        df.to_parquet(out, index=False)
        print(f"\nFeatures construidos: {len(df):,} filas -> {out}")

    # Resumen
    print("\n=== Resumen de features ===")
    print(df.describe(include="all").T[["count", "mean", "std", "min", "max"]].round(2).to_string())
    print("\n=== Distribucion del target por pais ===")
    print(df.groupby(["country", "escalation_level"]).size().unstack(fill_value=0).to_string())

    return df


if __name__ == "__main__":
    build()
