"""GDELT 2.0 DOC API client — news tone and mentions."""

import requests
import pandas as pd

BASE_URL = "https://api.gdeltproject.org/api/v2/doc/doc"

QUERY_TERMS = '("Iran" OR "Israel") AND ("conflict" OR "attack" OR "missile" OR "escalation")'


def fetch_articles(
    query: str = QUERY_TERMS,
    start_date: str = "20240101000000",
    end_date: str = "20241231235959",
    max_records: int = 250,
    source_lang: str = "English",
) -> pd.DataFrame:
    params = {
        "query": query,
        "mode": "artlist",
        "maxrecords": max_records,
        "startdatetime": start_date,
        "enddatetime": end_date,
        "sourcelang": source_lang,
        "format": "json",
    }
    resp = requests.get(BASE_URL, params=params, timeout=30)
    resp.raise_for_status()
    articles = resp.json().get("articles", [])
    df = pd.DataFrame(articles)
    if df.empty:
        return df
    df["seendate"] = pd.to_datetime(df["seendate"], format="%Y%m%dT%H%M%SZ", errors="coerce")
    df["source"] = "gdelt"
    return df


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "timestamp": df["seendate"],
            "source": "gdelt",
            "country": df.get("sourcecountry", None),
            "lat": None,
            "lon": None,
            "text": df["title"],
            "event_type": "news",
            "value": pd.to_numeric(df.get("socialimage", None), errors="coerce"),
        }
    )
