"""OpenSky Network client — flight state vectors over conflict region."""

import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "https://opensky-network.org/api/states/all"

# Bounding box: Middle East / Eastern Mediterranean
BBOX = {
    "lamin": 29.0,
    "lamax": 38.0,
    "lomin": 34.0,
    "lomax": 56.0,
}


def fetch_states(time_secs: int | None = None) -> pd.DataFrame:
    params = {**BBOX}
    if time_secs:
        params["time"] = time_secs

    auth = None
    user = os.environ.get("OPENSKY_USERNAME")
    passwd = os.environ.get("OPENSKY_PASSWORD")
    if user and passwd:
        auth = (user, passwd)

    resp = requests.get(BASE_URL, params=params, auth=auth, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    columns = [
        "icao24", "callsign", "origin_country", "time_position",
        "last_contact", "longitude", "latitude", "baro_altitude",
        "on_ground", "velocity", "true_track", "vertical_rate",
        "sensors", "geo_altitude", "squawk", "spi", "position_source",
    ]
    states = data.get("states") or []
    df = pd.DataFrame(states, columns=columns)
    if df.empty:
        return df
    df["timestamp"] = pd.to_datetime(data["time"], unit="s", utc=True)
    df["source"] = "opensky"
    return df


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "timestamp": df["timestamp"],
            "source": "opensky",
            "country": df["origin_country"],
            "lat": df["latitude"],
            "lon": df["longitude"],
            "text": df["callsign"].str.strip(),
            "event_type": "flight",
            "value": df["baro_altitude"],
        }
    )
