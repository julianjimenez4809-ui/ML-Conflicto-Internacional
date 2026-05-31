"""Upload pipeline artifacts (features + model results) to Supabase."""

import os
import json
import requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("dashboard/.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

PROCESSED_DIR = Path("data/processed")
METRICS_DIR = Path("artifacts/metrics")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates",
}


def upsert(table: str, records: list[dict]) -> None:
    """Upsert a batch of records into a Supabase table."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    # Batch in chunks of 500
    chunk_size = 500
    total = 0
    for i in range(0, len(records), chunk_size):
        chunk = records[i : i + chunk_size]
        resp = requests.post(url, headers=HEADERS, json=chunk)
        if resp.status_code not in (200, 201):
            print(f"  [ERROR] {table} chunk {i}: {resp.status_code} - {resp.text[:200]}")
        else:
            total += len(chunk)
    print(f"  Upserted {total} rows into '{table}'")


def upload_features() -> None:
    path = PROCESSED_DIR / "features.parquet"
    if not path.exists():
        print("features.parquet not found, skipping.")
        return

    df = pd.read_parquet(path)
    df["date"] = df["date"].astype(str)

    # Drop text column (too large / not needed in DB)
    if "daily_news_text" in df.columns:
        df = df.drop(columns=["daily_news_text"])

    # Replace NaN with None for JSON serialization
    records = df.where(pd.notnull(df), None).to_dict(orient="records")
    print(f"Uploading {len(records)} feature rows...")
    upsert("daily_features", records)


def upload_model_results() -> None:
    path = METRICS_DIR / "cv_results.json"
    if not path.exists():
        print("cv_results.json not found, skipping.")
        return

    results = json.loads(path.read_text())
    records = [
        {
            "model_name": model,
            "f1_weighted_mean": metrics["f1_weighted_mean"],
            "f1_weighted_std": metrics["f1_weighted_std"],
            "evaluated_at": pd.Timestamp.now(tz="UTC").isoformat(),
        }
        for model, metrics in results.items()
    ]
    print(f"Uploading {len(records)} model result rows...")
    upsert("model_results", records)


if __name__ == "__main__":
    upload_features()
    upload_model_results()
    print("Done.")
