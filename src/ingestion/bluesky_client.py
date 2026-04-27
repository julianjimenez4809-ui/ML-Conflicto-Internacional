"""Bluesky (AT Protocol) client — public social posts."""

import os
import pandas as pd
from atproto import Client
from dotenv import load_dotenv

load_dotenv()

SEARCH_TERMS = ["Iran Israel", "IDF attack", "missile strike Middle East", "Iran strike"]


def _login() -> Client:
    client = Client()
    client.login(os.environ["BLUESKY_HANDLE"], os.environ["BLUESKY_PASSWORD"])
    return client


def fetch_posts(query: str, limit: int = 100) -> list[dict]:
    client = _login()
    resp = client.app.bsky.feed.search_posts({"q": query, "limit": limit})
    rows = []
    for post in resp.posts:
        rows.append(
            {
                "timestamp": post.indexed_at,
                "source": "bluesky",
                "country": None,
                "lat": None,
                "lon": None,
                "text": post.record.text,
                "event_type": "social",
                "value": post.like_count or 0,
                "url": f"https://bsky.app/profile/{post.author.handle}/post/{post.uri.split('/')[-1]}",
            }
        )
    return rows


def fetch_all(terms: list[str] = SEARCH_TERMS, limit_per_term: int = 100) -> pd.DataFrame:
    rows = []
    for term in terms:
        try:
            rows.extend(fetch_posts(term, limit_per_term))
        except Exception as exc:
            print(f"[bluesky] skipped term '{term}': {exc}")
    df = pd.DataFrame(rows)
    if not df.empty:
        df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
        df = df.drop_duplicates(subset=["text", "timestamp"])
    return df
