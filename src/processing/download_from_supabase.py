"""Download raw events from Supabase for a specific date range."""

import os
import requests
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("dashboard/.env.local")

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

RAW_DIR = Path("data/raw")

def download_month(start_date="2024-04-01T00:00:00Z", end_date="2024-04-30T23:59:59Z"):
    print(f"Downloading data from Supabase between {start_date} and {end_date}...")
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    
    url = f"{SUPABASE_URL}/rest/v1/raw_events"
    all_data = []
    limit = 1000 # Postgrest caps limit at 1000
    offset = 0
    
    while True:
        params = {
            "timestamp": f"gte.{start_date}",
            "timestamp": f"lte.{end_date}", 
        }
        query = f"timestamp=gte.{start_date}&timestamp=lte.{end_date}&limit={limit}&offset={offset}"
        req_url = f"{url}?{query}"
        
        resp = requests.get(req_url, headers=headers)
        resp.raise_for_status()
        
        chunk = resp.json()
        if not chunk:
            break
            
        all_data.extend(chunk)
        print(f"Fetched {len(all_data)} rows...")
        
        if len(chunk) < limit:
            break
            
        offset += limit
        
    df = pd.DataFrame(all_data)
    if not df.empty:
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        # Drop Supabase-specific cols like id, created_at, source_id to match SCHEMA
        cols_to_keep = ["timestamp", "source", "country", "lat", "lon", "text", "event_type", "value"]
        df = df[[c for c in cols_to_keep if c in df.columns]]
        output_path = RAW_DIR / "supabase_export.parquet"
        df.to_parquet(output_path, index=False)
        print(f"Successfully saved {len(df)} rows to {output_path}")
    else:
        print("No data found for the specified range.")

if __name__ == "__main__":
    download_month()
