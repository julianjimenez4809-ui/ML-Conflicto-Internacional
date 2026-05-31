"""OpenSky — descarga de datos históricos de vuelos sobre Medio Oriente.

Endpoint: /flights/all  (requiere cuenta registrada con OAuth2)
Granularidad: intervalos de máx. 2 horas por request.
Región cubierta: bbox del Mediterráneo Oriental + Golfo Pérsico.
"""

import time
import pandas as pd
from datetime import datetime, timezone, timedelta
from pathlib import Path

from src.ingestion.opensky_client import _get

RAW_DIR = Path("data/raw/opensky")
RAW_DIR.mkdir(parents=True, exist_ok=True)

BBOX          = {"lamin": 29.0, "lamax": 38.0, "lomin": 34.0, "lomax": 56.0}
WINDOW_HOURS  = 2


def fetch_window(begin: datetime, end: datetime) -> pd.DataFrame:
    params = {
        **BBOX,
        "begin": int(begin.timestamp()),
        "end":   int(end.timestamp()),
    }
    try:
        resp = _get("/flights/all", params)
    except Exception as exc:
        if "404" in str(exc):
            return pd.DataFrame()
        raise
    data = resp.json() or []
    if not data:
        return pd.DataFrame()
    df = pd.DataFrame(data)
    df["window_start"] = begin.isoformat()
    df["source"] = "opensky"
    return df


def fetch_range(
    start: datetime,
    end: datetime,
    pause_secs: int = 10,
) -> pd.DataFrame:
    frames = []
    cursor = start
    total = int((end - start).total_seconds() / 3600 / WINDOW_HOURS)
    done  = 0

    while cursor < end:
        window_end = min(cursor + timedelta(hours=WINDOW_HOURS), end)
        print(f"[{done:>3}/{total}] {cursor.date()} {cursor.hour:02d}h–{window_end.hour:02d}h", end=" … ")
        df = fetch_window(cursor, window_end)
        print(f"{len(df)} vuelos")
        if not df.empty:
            frames.append(df)
        cursor  = window_end
        done   += 1
        time.sleep(pause_secs)

    if not frames:
        print("Sin datos en el rango especificado.")
        return pd.DataFrame()

    result   = pd.concat(frames, ignore_index=True)
    out_path = RAW_DIR / f"flights_{start.date()}_{end.date()}.parquet"
    result.to_parquet(out_path, index=False)
    print(f"\nGuardado: {out_path}  ({len(result):,} registros)")
    return result


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--start", default="2024-04-01")
    parser.add_argument("--end",   default="2024-04-07")
    args = parser.parse_args()

    start_dt = datetime.fromisoformat(args.start).replace(tzinfo=timezone.utc)
    end_dt   = datetime.fromisoformat(args.end).replace(tzinfo=timezone.utc)
    fetch_range(start_dt, end_dt)
