"""RSS feed client — BBC, Al Jazeera, Google News."""

import feedparser
import pandas as pd
from datetime import datetime, timezone

FEEDS = {
    "bbc": "http://feeds.bbci.co.uk/news/world/middle_east/rss.xml",
    "aljazeera": "https://www.aljazeera.com/xml/rss/all.xml",
    "googlenews": "https://news.google.com/rss/search?q=Iran+Israel+conflict&hl=en-US&gl=US&ceid=US:en",
}

KEYWORDS = {"iran", "israel", "hezbollah", "hamas", "idf", "irgc", "missile", "attack", "escalat"}


def _entry_matches(entry: dict) -> bool:
    text = (entry.get("title", "") + " " + entry.get("summary", "")).lower()
    return any(kw in text for kw in KEYWORDS)


def fetch_feed(name: str, url: str) -> list[dict]:
    parsed = feedparser.parse(url)
    rows = []
    for entry in parsed.entries:
        if not _entry_matches(entry):
            continue
        published = entry.get("published_parsed")
        ts = datetime(*published[:6], tzinfo=timezone.utc) if published else None
        rows.append(
            {
                "timestamp": ts,
                "source": f"rss_{name}",
                "country": None,
                "lat": None,
                "lon": None,
                "text": entry.get("title", ""),
                "event_type": "news",
                "value": None,
                "url": entry.get("link", ""),
            }
        )
    return rows


def fetch_all_feeds() -> pd.DataFrame:
    rows = []
    for name, url in FEEDS.items():
        rows.extend(fetch_feed(name, url))
    df = pd.DataFrame(rows)
    if not df.empty:
        df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True)
    return df
