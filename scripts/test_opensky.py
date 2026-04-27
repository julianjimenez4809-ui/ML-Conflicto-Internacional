"""Prueba rápida de la API de OpenSky — vuelos actuales sobre Medio Oriente."""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.ingestion.opensky_client import fetch_states, normalize

print("Conectando a OpenSky...")
df = fetch_states()

if df.empty:
    print("Sin datos en este momento (puede ser fuera de horario o sin vuelos en el bbox).")
    sys.exit(0)

print(f"\nVuelos encontrados: {len(df)}")
print(df[["callsign", "origin_country", "latitude", "longitude", "baro_altitude"]].head(10).to_string())

norm = normalize(df)
print(f"\nDataset normalizado ({len(norm)} filas):")
print(norm.head(5).to_string())
