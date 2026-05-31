"""GDELT v1 Events client — downloads daily export CSVs and aggregates per country-day.

Uses the public bulk downloads at data.gdeltproject.org/events/ (no rate limit, no key needed).
Filters for events involving Iran (IRN), Israel (ISR), or USA actor/location codes.
"""

import io
import time
import zipfile
import requests
import pandas as pd
from pathlib import Path
from datetime import date, timedelta

EXPORT_BASE = "http://data.gdeltproject.org/events"

# GDELT 1.0 column positions (0-indexed, tab-separated, no header)
COL_DATE          = 1   # SQLDATE YYYYMMDD
COL_ACTOR1_CC     = 7   # Actor1CountryCode
COL_ACTOR2_CC     = 17  # Actor2CountryCode
COL_EVENT_CODE    = 28  # EventCode (CAMEO)
COL_EVENT_ROOT    = 30  # EventRootCode
COL_QUAD          = 31  # QuadClass (1=Verbal Coop, 2=Mat Coop, 3=Verbal Conflict, 4=Mat Conflict)
COL_GOLDSTEIN     = 32  # GoldsteinScale (-10 to +10)
COL_MENTIONS      = 33  # NumMentions
COL_TONE          = 36  # AvgTone
COL_ACTION_CC     = 51  # ActionGeo_CountryCode

TARGET_COUNTRIES = {"IRN", "ISR", "USA"}


def _date_range(start: date, end: date):
    d = start
    while d <= end:
        yield d
        d += timedelta(days=1)


def fetch_day(day: date) -> pd.DataFrame:
    """Download one GDELT v1 export file and return rows for target countries."""
    url = f"{EXPORT_BASE}/{day.strftime('%Y%m%d')}.export.CSV.zip"
    try:
        resp = requests.get(url, timeout=60)
        resp.raise_for_status()
    except Exception as exc:
        print(f"    ✗ {day}: {exc}")
        return pd.DataFrame()

    try:
        with zipfile.ZipFile(io.BytesIO(resp.content)) as z:
            fname = z.namelist()[0]
            raw = z.read(fname)
        df = pd.read_csv(
            io.BytesIO(raw),
            sep="\t",
            header=None,
            low_memory=False,
            on_bad_lines="skip",
        )
    except Exception as exc:
        print(f"    ✗ parse error {day}: {exc}")
        return pd.DataFrame()

    if df.shape[1] < COL_ACTION_CC + 1:
        return pd.DataFrame()

    # Filter: at least one actor or action country in our set
    mask = (
        df.iloc[:, COL_ACTOR1_CC].isin(TARGET_COUNTRIES) |
        df.iloc[:, COL_ACTOR2_CC].isin(TARGET_COUNTRIES) |
        df.iloc[:, COL_ACTION_CC].isin(TARGET_COUNTRIES)
    )
    filtered = df[mask].copy()
    if filtered.empty:
        return pd.DataFrame()

    filtered.columns = [str(i) for i in filtered.columns]
    out = pd.DataFrame({
        "event_date": pd.to_datetime(filtered[str(COL_DATE)].astype(str), format="%Y%m%d", errors="coerce"),
        "actor1_cc":  filtered[str(COL_ACTOR1_CC)].fillna(""),
        "actor2_cc":  filtered[str(COL_ACTOR2_CC)].fillna(""),
        "action_cc":  filtered[str(COL_ACTION_CC)].fillna(""),
        "event_code": filtered[str(COL_EVENT_CODE)].fillna(""),
        "event_root": filtered[str(COL_EVENT_ROOT)].fillna(""),
        "quad_class":     pd.to_numeric(filtered[str(COL_QUAD)],      errors="coerce"),
        "goldstein":      pd.to_numeric(filtered[str(COL_GOLDSTEIN)],  errors="coerce"),
        "n_mentions":     pd.to_numeric(filtered[str(COL_MENTIONS)],   errors="coerce"),
        "avg_tone":       pd.to_numeric(filtered[str(COL_TONE)],       errors="coerce"),
    })
    return out


def aggregate_day(df: pd.DataFrame) -> pd.DataFrame:
    """Aggregate raw events into country-day features for each target country."""
    if df.empty:
        return pd.DataFrame()
    rows = []
    event_date = df["event_date"].iloc[0].date()
    for cc in TARGET_COUNTRIES:
        sub = df[
            df["actor1_cc"].eq(cc) | df["actor2_cc"].eq(cc) | df["action_cc"].eq(cc)
        ]
        if sub.empty:
            continue
        rows.append({
            "event_date":       event_date,
            "country":          cc,
            "n_conflict_events": int((sub["quad_class"] >= 3).sum()),
            "avg_goldstein":    float(sub["goldstein"].mean()),
            "has_high_violence": bool((sub["quad_class"] == 4).any()),
            "n_mentions":       int(sub["n_mentions"].sum()),
        })
    return pd.DataFrame(rows)


def fetch_period(start: date, end: date, delay_s: float = 1.0) -> pd.DataFrame:
    frames = []
    for day in _date_range(start, end):
        print(f"  Fetching GDELT {day} ...", end=" ", flush=True)
        raw = fetch_day(day)
        if not raw.empty:
            agg = aggregate_day(raw)
            if not agg.empty:
                frames.append(agg)
                print(f"{len(raw)} events → {len(agg)} country-day rows")
            else:
                print("0 rows after agg")
        else:
            print("no data")
        time.sleep(delay_s)
    return pd.concat(frames, ignore_index=True) if frames else pd.DataFrame()


if __name__ == "__main__":
    OUT_DIR = Path("data/raw/gdelt")
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Key conflict periods (sampling dense dates of interest)
    periods = [
        (date(2024, 4, 1),  date(2024, 4, 20)),   # Iran missile attack on Israel
        (date(2024, 10, 1), date(2024, 10, 15)),   # Oct 7 anniversary
        (date(2025, 1, 1),  date(2025, 1, 15)),    # Gaza ceasefire period
        (date(2026, 2, 28), date(2026, 3, 15)),    # US-Israel-Iran war start
        (date(2026, 5, 1),  date(2026, 5, 30)),    # Recent escalation
    ]

    all_frames = []
    for start, end in periods:
        print(f"\n=== {start} → {end} ===")
        df = fetch_period(start, end, delay_s=0.5)
        if not df.empty:
            all_frames.append(df)

    if all_frames:
        combined = pd.concat(all_frames, ignore_index=True)
        combined = combined.drop_duplicates(subset=["event_date", "country"])
        out = OUT_DIR / "gdelt_raw.parquet"
        combined.to_parquet(out, index=False)
        print(f"\nGDELT: {len(combined)} country-day rows → {out}")
        print(combined.groupby("country").size())
    else:
        print("GDELT: no data fetched")
