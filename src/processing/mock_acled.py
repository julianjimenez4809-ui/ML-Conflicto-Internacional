"""Generate synthetic ACLED data for April 2024 to provide a target for ML models."""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

RAW_DIR = Path("data/raw/acled")

def generate_mock_acled(start_date="2024-04-01", end_date="2024-04-30"):
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")
    
    rows = []
    countries = ["Iran", "Israel", "Syria"]
    
    current = start
    while current <= end:
        for country in countries:
            # Baseline: 0-2 events per day
            n_events = np.random.randint(0, 3)
            fatalities = np.random.randint(0, 2)
            
            # Escalation events
            # April 1: Embassy attack
            if current.strftime("%Y-%m-%d") == "2024-04-01" and country == "Syria":
                n_events += 5
                fatalities += 15
                
            # April 13-14: Iran strikes Israel
            if current.strftime("%Y-%m-%d") in ["2024-04-13", "2024-04-14"] and country == "Israel":
                n_events += 15
                fatalities += 0 # Most intercepted
                
            # April 19: Israel strikes Iran
            if current.strftime("%Y-%m-%d") == "2024-04-19" and country == "Iran":
                n_events += 5
                fatalities += 2
                
            for _ in range(n_events):
                rows.append({
                    "timestamp": current.strftime("%Y-%m-%dT12:00:00Z"),
                    "source": "acled",
                    "country": country,
                    "lat": None,
                    "lon": None,
                    "text": "Synthetic conflict event",
                    "event_type": "Explosions/Remote violence",
                    "value": fatalities / max(1, n_events) # distribute fatalities
                })
        current += timedelta(days=1)
        
    df = pd.DataFrame(rows)
    if not df.empty:
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        output_path = RAW_DIR / "acled_mock_202404.parquet"
        df.to_parquet(output_path, index=False)
        print(f"Successfully generated {len(df)} mock ACLED events to {output_path}")

if __name__ == "__main__":
    generate_mock_acled()
