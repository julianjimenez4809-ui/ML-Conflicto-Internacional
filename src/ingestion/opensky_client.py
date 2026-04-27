"""OpenSky Network client — OAuth2 (client_credentials) flow.

Tokens duran 30 min. TokenManager los refresca automáticamente.
Credenciales van en .env: OPENSKY_CLIENT_ID y OPENSKY_CLIENT_SECRET.
"""

import os
import time
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

TOKEN_URL = "https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token"
BASE_URL  = "https://opensky-network.org/api"

# Bounding box: Mediterráneo Oriental + Golfo Pérsico
BBOX = {"lamin": 29.0, "lamax": 38.0, "lomin": 34.0, "lomax": 56.0}


class TokenManager:
    """Obtiene y refresca el Bearer token antes de que expire."""

    def __init__(self):
        self._token: str | None = None
        self._expires_at: float = 0

    def get_token(self) -> str:
        if self._token and time.time() < self._expires_at - 60:
            return self._token
        return self._refresh()

    def _refresh(self) -> str:
        client_id     = os.environ["OPENSKY_CLIENT_ID"]
        client_secret = os.environ["OPENSKY_CLIENT_SECRET"]
        resp = requests.post(
            TOKEN_URL,
            data={
                "grant_type":    "client_credentials",
                "client_id":     client_id,
                "client_secret": client_secret,
            },
            timeout=15,
        )
        resp.raise_for_status()
        payload = resp.json()
        self._token      = payload["access_token"]
        self._expires_at = time.time() + payload.get("expires_in", 1800)
        return self._token

    def auth_header(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.get_token()}"}


# Instancia global reutilizable dentro del proceso
_token_manager = TokenManager()


def _get(endpoint: str, params: dict) -> requests.Response:
    resp = requests.get(
        f"{BASE_URL}{endpoint}",
        params=params,
        headers=_token_manager.auth_header(),
        timeout=30,
    )
    resp.raise_for_status()
    return resp


def fetch_states() -> pd.DataFrame:
    """Vuelos en tiempo real sobre el bbox de Medio Oriente."""
    resp = _get("/states/all", BBOX)
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
    """Mapea al esquema común del proyecto."""
    return pd.DataFrame({
        "timestamp":  df["timestamp"],
        "source":     "opensky",
        "country":    df["origin_country"],
        "lat":        df["latitude"],
        "lon":        df["longitude"],
        "text":       df["callsign"].str.strip(),
        "event_type": "flight",
        "value":      df["baro_altitude"],
    })
