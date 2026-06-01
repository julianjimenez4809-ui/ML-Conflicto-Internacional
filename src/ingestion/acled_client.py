"""ACLED API client — structured conflict events."""

import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://api.acleddata.com/acled/read"

COUNTRIES_OF_INTEREST = ["Iran", "Israel", "United States"]


def fetch_events(
    start_date: str,
    end_date: str,
    countries: list[str] = COUNTRIES_OF_INTEREST,
    limit: int = 5000,
) -> pd.DataFrame:
    params = {
        "key": os.environ["ACLED_KEY"],
        "email": os.environ["ACLED_EMAIL"],
        "event_date": f"{start_date}|{end_date}",
        "event_date_where": "BETWEEN",
        "country": "|".join(countries),
        "country_where": "OR",
        "limit": limit,
        "fields": "event_id_cnty|event_date|event_type|sub_event_type|actor1|actor2|country|region|latitude|longitude|fatalities|notes",
    }
    resp = requests.get(BASE_URL, params=params, timeout=30)
    resp.raise_for_status()
    data = resp.json().get("data", [])
    df = pd.DataFrame(data)
    if df.empty:
        return df
    df["event_date"] = pd.to_datetime(df["event_date"])
    df["fatalities"] = pd.to_numeric(df["fatalities"], errors="coerce").fillna(0)
    df["source"] = "acled"
    return df


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Map to common schema: timestamp, source, country, lat, lon, text, event_type, value."""
    return pd.DataFrame(
        {
            "timestamp": df["event_date"],
            "source": "acled",
            "country": df["country"],
            "lat": pd.to_numeric(df["latitude"], errors="coerce"),
            "lon": pd.to_numeric(df["longitude"], errors="coerce"),
            "text": df["notes"],
            "event_type": df["event_type"],
            "value": df["fatalities"],
        }
    )


if __name__ == "__main__":
    from pathlib import Path

    OUT_DIR = Path("data/raw/acled")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Fetching ACLED events 2024-01-01 → 2026-05-30 ...")
    df = fetch_events(start_date="2024-01-01", end_date="2026-05-30", limit=10000)
    if not df.empty:
        out = OUT_DIR / "acled_raw.parquet"
        df.to_parquet(out, index=False)
        print(f"ACLED: {len(df)} events → {out}")
    else:
        print("ACLED: no data returned")
