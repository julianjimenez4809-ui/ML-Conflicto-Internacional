"""Normalize source parquet files and merge them into a single dataset."""

from pathlib import Path

import pandas as pd

RAW_DIR = Path("data/raw")
PROCESSED_DIR = Path("data/processed")
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

SCHEMA = ["timestamp", "source", "country", "lat", "lon", "text", "event_type", "value"]
SOURCES = ["acled", "gdelt", "rss", "opensky", "bluesky"]


def load_raw(source: str) -> pd.DataFrame:
    path = RAW_DIR / source
    files = sorted(path.glob("*.parquet"))
    if not files:
        return pd.DataFrame(columns=SCHEMA)
    return pd.concat([pd.read_parquet(file) for file in files], ignore_index=True)


def normalize_frame(df: pd.DataFrame, source: str) -> pd.DataFrame:
    if df.empty:
        return pd.DataFrame(columns=SCHEMA)

    normalized = df.copy()
    for col in SCHEMA:
        if col not in normalized.columns:
            normalized[col] = None

    normalized = normalized[SCHEMA]
    normalized["timestamp"] = pd.to_datetime(normalized["timestamp"], utc=True, errors="coerce")
    normalized["source"] = normalized["source"].fillna(source)
    normalized = normalized.dropna(subset=["timestamp"]).reset_index(drop=True)
    return normalized


def build_integrated_dataset() -> pd.DataFrame:
    frames = []
    for source in SOURCES:
        df = normalize_frame(load_raw(source), source)
        if df.empty:
            print(f"[skip] {source}: no raw parquet files found")
            continue
        print(f"[load] {source}: {len(df):,} rows")
        frames.append(df)

    if not frames:
        print("Warning: No standard raw data found.")

    supabase_path = RAW_DIR / "supabase_export.parquet"
    if supabase_path.exists():
        supabase_df = pd.read_parquet(supabase_path)
        supabase_df = normalize_frame(supabase_df, "supabase_export")
        print(f"[load] supabase_export: {len(supabase_df):,} rows")
        frames.append(supabase_df)

    if not frames:
        raise ValueError("No raw data found. Run ingestion scripts first.")

    integrated = pd.concat(frames, ignore_index=True)
    integrated = integrated.drop_duplicates().sort_values("timestamp").reset_index(drop=True)
    integrated.to_parquet(PROCESSED_DIR / "integrated.parquet", index=False)

    print(f"Integrated dataset: {len(integrated):,} rows -> {PROCESSED_DIR / 'integrated.parquet'}")
    print("Rows by source:")
    print(integrated["source"].value_counts().to_string())
    return integrated


if __name__ == "__main__":
    build_integrated_dataset()
