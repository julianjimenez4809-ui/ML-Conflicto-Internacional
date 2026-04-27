"""Normalize all sources to a common schema and merge into a single dataset."""

import pandas as pd
from pathlib import Path

RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

SCHEMA = ["timestamp", "source", "country", "lat", "lon", "text", "event_type", "value"]


def load_raw(source: str) -> pd.DataFrame:
    path = RAW_DIR / source
    files = list(path.glob("*.parquet"))
    if not files:
        return pd.DataFrame(columns=SCHEMA)
    return pd.concat([pd.read_parquet(f) for f in files], ignore_index=True)


def build_integrated_dataset() -> pd.DataFrame:
    sources = ["acled", "gdelt", "rss", "opensky", "bluesky"]
    frames = []
    for src in sources:
        df = load_raw(src)
        if df.empty:
            continue
        # Ensure common columns exist
        for col in SCHEMA:
            if col not in df.columns:
                df[col] = None
        frames.append(df[SCHEMA])

    if not frames:
        raise ValueError("No raw data found. Run ingestion scripts first.")

    integrated = pd.concat(frames, ignore_index=True)
    integrated["timestamp"] = pd.to_datetime(integrated["timestamp"], utc=True)
    integrated = integrated.sort_values("timestamp").reset_index(drop=True)
    integrated.to_parquet(PROCESSED_DIR / "integrated.parquet", index=False)
    print(f"Integrated dataset: {len(integrated):,} rows → {PROCESSED_DIR / 'integrated.parquet'}")
    return integrated


if __name__ == "__main__":
    build_integrated_dataset()
