"""NASA FIRMS client — fire/thermal anomaly hotspots over conflict region."""

import os
import requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

from pathlib import Path as _Path
load_dotenv(_Path(__file__).parents[2] / ".env")

BASE_URL = "https://firms.modaps.eosdis.nasa.gov/api/area/csv"

# Middle East bounding box: W,S,E,N (max 5 days per request with real key)
BBOX = "29,28,60,38"

SOURCES = ["VIIRS_SNPP_NRT", "MODIS_NRT"]


def fetch_firms(
    source: str = "VIIRS_SNPP_NRT",
    day_range: int = 5,
    bbox: str = BBOX,
) -> pd.DataFrame:
    key = os.environ.get("NASA_FIRMS_KEY", "DEMO_KEY")
    url = f"{BASE_URL}/{key}/{source}/{bbox}/{day_range}"
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    from io import StringIO
    df = pd.read_csv(StringIO(resp.text))
    if df.empty:
        return df

    # Parse acquisition timestamp
    if "acq_date" in df.columns and "acq_time" in df.columns:
        df["acq_time_str"] = df["acq_time"].astype(str).str.zfill(4)
        df["acq_timestamp"] = pd.to_datetime(
            df["acq_date"].astype(str) + " " + df["acq_time_str"].str[:2] + ":" + df["acq_time_str"].str[2:],
            utc=True,
            errors="coerce",
        )

    df["source"] = source
    # Normalize 'confidence' column — VIIRS gives strings ('n','l','h'), MODIS gives int
    if "confidence" in df.columns:
        df["confidence"] = df["confidence"].astype(str)
    return df


if __name__ == "__main__":
    OUT_DIR = Path("data/raw/firms")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    all_frames = []
    # Real key allows max 5-day windows; fetch both sensors
    for src in SOURCES:
        print(f"Fetching NASA FIRMS [{src}] last 5 days over Middle East ...")
        try:
            df = fetch_firms(source=src, day_range=5)
            if not df.empty:
                all_frames.append(df)
                print(f"  → {len(df)} hotspots")
            else:
                print(f"  → 0 hotspots")
        except Exception as exc:
            print(f"  ✗ {exc}")

    if all_frames:
        combined = pd.concat(all_frames, ignore_index=True)
        out = OUT_DIR / "firms_raw.parquet"
        if out.exists():
            existing = pd.read_parquet(out)
            combined = pd.concat([existing, combined], ignore_index=True)
            if "acq_timestamp" in combined.columns and "latitude" in combined.columns:
                combined = combined.drop_duplicates(subset=["latitude", "longitude", "acq_timestamp"])
        combined.to_parquet(out, index=False)
        print(f"\nFIRMS: {len(combined)} hotspots → {out}")
    else:
        print("FIRMS: no data fetched")
