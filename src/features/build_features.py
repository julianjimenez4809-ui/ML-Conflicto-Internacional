"""Feature engineering — build the ML-ready dataset from the integrated table.

Unit of analysis: country-day window.
Target: escalation_level (0=low, 1=medium, 2=high) derived from ACLED fatalities + event count.
"""

import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer

PROCESSED_DIR = Path("data/processed")


def build(integrated: pd.DataFrame | None = None) -> pd.DataFrame:
    if integrated is None:
        integrated = pd.read_parquet(PROCESSED_DIR / "integrated.parquet")

    integrated["date"] = integrated["timestamp"].dt.date
    integrated["country"] = integrated["country"].fillna("Unknown")

    # --- Structural features (per country-day) ---
    acled = integrated[integrated["source"] == "acled"]
    acled_agg = (
        acled.groupby(["country", "date"])
        .agg(
            n_events=("event_type", "count"),
            total_fatalities=("value", "sum"),
        )
        .reset_index()
    )

    # --- Text features: TF-IDF on news titles (per day) ---
    news = integrated[integrated["event_type"] == "news"].copy()
    news["date"] = news["timestamp"].dt.date
    news_daily = news.groupby("date")["text"].apply(" ".join).reset_index()
    news_daily.columns = ["date", "daily_news_text"]

    # --- Mobility: flight count per day in bbox ---
    flights = integrated[integrated["source"] == "opensky"]
    flight_agg = (
        flights.groupby("date")
        .agg(n_flights=("event_type", "count"))
        .reset_index()
    )

    # --- Social: post volume + avg engagement per day ---
    social = integrated[integrated["source"] == "bluesky"]
    social_agg = (
        social.groupby("date")
        .agg(n_posts=("text", "count"), avg_likes=("value", "mean"))
        .reset_index()
    )

    # --- Build target variable ---
    # Escalation level based on ACLED: 0 / 1 / 2
    acled_agg["escalation_level"] = pd.cut(
        acled_agg["total_fatalities"],
        bins=[-1, 0, 10, np.inf],
        labels=[0, 1, 2],
    ).astype(int)

    # --- Merge all features ---
    base = acled_agg.copy()
    base = base.merge(news_daily, on="date", how="left")
    base = base.merge(flight_agg, on="date", how="left")
    base = base.merge(social_agg, on="date", how="left")

    base = base.fillna({"n_flights": 0, "n_posts": 0, "avg_likes": 0, "daily_news_text": ""})

    output_path = PROCESSED_DIR / "features.parquet"
    base.to_parquet(output_path, index=False)
    print(f"Features built: {len(base):,} rows → {output_path}")
    return base


if __name__ == "__main__":
    build()
