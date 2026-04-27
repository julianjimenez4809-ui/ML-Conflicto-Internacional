"""Visualizaciones de vuelos en tiempo real — OpenSky sobre Medio Oriente.

Genera 4 gráficas y las guarda en visualizaciones/:
  1. Mapa interactivo con posición, callsign, altitud y velocidad
  2. Barras: vuelos por país de origen
  3. Distribución de altitud (baro) por vuelo
  4. Scatter altitud vs velocidad coloreado por país
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import timezone
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
from src.ingestion.opensky_client import fetch_states, normalize

OUT = "visualizaciones"
os.makedirs(OUT, exist_ok=True)

# ── Fetch ──────────────────────────────────────────────────────────────────
print("Descargando datos de OpenSky...")
raw = fetch_states()

if raw.empty:
    print("Sin vuelos en este momento. Intenta de nuevo.")
    sys.exit(0)

# Columnas útiles del raw (antes de normalizar)
df = raw.copy()
df["callsign"]      = df["callsign"].str.strip()
df["baro_altitude"] = pd.to_numeric(df["baro_altitude"], errors="coerce")
df["velocity"]      = pd.to_numeric(df["velocity"], errors="coerce")
df["latitude"]      = pd.to_numeric(df["latitude"], errors="coerce")
df["longitude"]     = pd.to_numeric(df["longitude"], errors="coerce")
df["true_track"]    = pd.to_numeric(df["true_track"], errors="coerce")
df["on_ground"]     = df["on_ground"].astype(bool)
df["timestamp"]     = pd.to_datetime(df["timestamp"], utc=True)
hora_captura        = df["timestamp"].iloc[0].strftime("%Y-%m-%d %H:%M UTC")

# Clasificación simple de tipo de vuelo por callsign
def clasificar(callsign: str, country: str) -> str:
    cs = str(callsign).upper()
    if cs.startswith(("ELY", "IAW", "THY", "RYR", "UAE", "QTR", "ETD", "MSR")):
        return "Aerolínea comercial"
    if cs.startswith(("ISR", "AFR", "BAW", "DLH")):
        return "Aerolínea / gobierno"
    if cs.startswith(("4X", "AIZ")):
        return "Aviación general / militar"
    if cs[:1].isdigit():
        return "Aviación general"
    return "Desconocido"

df["tipo"] = df.apply(lambda r: clasificar(r["callsign"], r["origin_country"]), axis=1)
df["estado"] = df["on_ground"].map({True: "En tierra", False: "En vuelo"})

# Paleta de colores por país — hex para compatibilidad matplotlib + plotly
paises = df["origin_country"].fillna("Desconocido").unique().tolist()
_hex_palette = [
    "#e63946", "#f4a261", "#2a9d8f", "#457b9d", "#a8dadc",
    "#e9c46a", "#8ecae6", "#c77dff", "#80b918", "#ff6b6b",
    "#ffd166", "#06d6a0", "#118ab2", "#ef476f", "#ffc8dd",
]
color_map = {p: _hex_palette[i % len(_hex_palette)] for i, p in enumerate(paises)}
df["color"] = df["origin_country"].fillna("Desconocido").map(color_map)

print(f"Vuelos encontrados: {len(df)}  |  Captura: {hora_captura}")
print(df[["callsign", "origin_country", "tipo", "baro_altitude", "velocity", "estado"]].to_string())

# ─────────────────────────────────────────────────────────────────────────────
# 1. MAPA INTERACTIVO
# ─────────────────────────────────────────────────────────────────────────────
hover = df.apply(lambda r: (
    f"<b>{r['callsign']}</b><br>"
    f"País: {r['origin_country']}<br>"
    f"Tipo: {r['tipo']}<br>"
    f"Estado: {r['estado']}<br>"
    f"Altitud: {r['baro_altitude']:.0f} m<br>" if pd.notna(r['baro_altitude']) else
    f"<b>{r['callsign']}</b><br>País: {r['origin_country']}<br>Tipo: {r['tipo']}<br>"
    f"Velocidad: {r['velocity']:.0f} m/s<br>" if pd.notna(r['velocity']) else ""
), axis=1)

fig_mapa = go.Figure()

for pais, grupo in df.groupby("origin_country"):
    fig_mapa.add_trace(go.Scattermapbox(
        lat=grupo["latitude"],
        lon=grupo["longitude"],
        mode="markers+text",
        marker=dict(size=12, color=color_map.get(pais, "#888"), opacity=0.85),
        text=grupo["callsign"],
        textposition="top right",
        textfont=dict(size=9, color="white"),
        customdata=grupo[["tipo", "estado", "baro_altitude", "velocity"]].fillna("N/D").values,
        hovertemplate=(
            "<b>%{text}</b><br>"
            "País: " + pais + "<br>"
            "Tipo: %{customdata[0]}<br>"
            "Estado: %{customdata[1]}<br>"
            "Altitud: %{customdata[2]} m<br>"
            "Velocidad: %{customdata[3]} m/s<extra></extra>"
        ),
        name=pais,
    ))

fig_mapa.update_layout(
    title=dict(text=f"Vuelos sobre Medio Oriente — {hora_captura}", font=dict(size=16, color="white")),
    mapbox=dict(
        style="carto-darkmatter",
        center=dict(lat=32.5, lon=44.0),
        zoom=4.5,
    ),
    paper_bgcolor="#111111",
    plot_bgcolor="#111111",
    font=dict(color="white"),
    legend=dict(bgcolor="#222", bordercolor="#444", borderwidth=1),
    margin=dict(l=0, r=0, t=50, b=0),
    height=650,
)

path_mapa = f"{OUT}/01_mapa_vuelos.html"
fig_mapa.write_html(path_mapa)
print(f"\n[1/4] Mapa interactivo → {path_mapa}")

# ─────────────────────────────────────────────────────────────────────────────
# 2. BARRAS: vuelos por país
# ─────────────────────────────────────────────────────────────────────────────
conteo = (
    df.groupby(["origin_country", "tipo"])
    .size()
    .reset_index(name="count")
    .sort_values("count", ascending=False)
)

fig_barras, ax = plt.subplots(figsize=(10, 5))
fig_barras.patch.set_facecolor("#111111")
ax.set_facecolor("#1a1a2e")

tipos_uniq = conteo["tipo"].unique()
tipo_colors = {t: sns.color_palette("husl", len(tipos_uniq))[i] for i, t in enumerate(tipos_uniq)}

bottom = {}
paises_orden = conteo.groupby("origin_country")["count"].sum().sort_values(ascending=False).index.tolist()

for tipo in tipos_uniq:
    sub_map = conteo[conteo["tipo"] == tipo].set_index("origin_country")["count"].to_dict()
    valores = [sub_map.get(p, 0) for p in paises_orden]
    ax.bar(
        paises_orden,
        valores,
        bottom=[bottom.get(p, 0) for p in paises_orden],
        label=tipo,
        color=tipo_colors[tipo],
        edgecolor="#333",
        linewidth=0.5,
    )
    for p, val in zip(paises_orden, valores):
        bottom[p] = bottom.get(p, 0) + val

ax.set_title(f"Vuelos por país de origen — {hora_captura}", color="white", fontsize=13, pad=12)
ax.set_xlabel("País de origen", color="#aaa", fontsize=10)
ax.set_ylabel("N° de vuelos", color="#aaa", fontsize=10)
ax.tick_params(colors="white", labelsize=9)
ax.xaxis.label.set_color("#aaa")
for spine in ax.spines.values():
    spine.set_edgecolor("#444")
ax.legend(title="Tipo de vuelo", facecolor="#222", edgecolor="#555", labelcolor="white",
          title_fontsize=9, fontsize=8)

plt.tight_layout()
path_barras = f"{OUT}/02_vuelos_por_pais.png"
fig_barras.savefig(path_barras, dpi=150, bbox_inches="tight", facecolor="#111111")
plt.close()
print(f"[2/4] Barras por país       → {path_barras}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. ALTITUD POR VUELO
# ─────────────────────────────────────────────────────────────────────────────
df_alt = df[pd.notna(df["baro_altitude"]) & (df["baro_altitude"] > 0)].sort_values("baro_altitude", ascending=False)

fig_alt, ax = plt.subplots(figsize=(12, 5))
fig_alt.patch.set_facecolor("#111111")
ax.set_facecolor("#1a1a2e")

bars = ax.barh(
    df_alt["callsign"],
    df_alt["baro_altitude"],
    color=[color_map.get(c, "#888") for c in df_alt["origin_country"]],
    edgecolor="#333",
    linewidth=0.5,
)

# Etiquetas de altitud
for bar, val, pais in zip(bars, df_alt["baro_altitude"], df_alt["origin_country"]):
    ax.text(val + 50, bar.get_y() + bar.get_height() / 2,
            f"{val:.0f} m", va="center", color="#ccc", fontsize=8)

patches = [mpatches.Patch(color=color_map.get(p, "#888"), label=p) for p in df_alt["origin_country"].unique()]
ax.legend(handles=patches, title="País", facecolor="#222", edgecolor="#555",
          labelcolor="white", title_fontsize=9, fontsize=8, loc="lower right")

ax.set_title(f"Altitud barométrica por vuelo — {hora_captura}", color="white", fontsize=13, pad=12)
ax.set_xlabel("Altitud (metros)", color="#aaa")
ax.tick_params(colors="white", labelsize=9)
for spine in ax.spines.values():
    spine.set_edgecolor("#444")

plt.tight_layout()
path_alt = f"{OUT}/03_altitud_por_vuelo.png"
fig_alt.savefig(path_alt, dpi=150, bbox_inches="tight", facecolor="#111111")
plt.close()
print(f"[3/4] Altitud por vuelo     → {path_alt}")

# ─────────────────────────────────────────────────────────────────────────────
# 4. SCATTER: altitud vs velocidad
# ─────────────────────────────────────────────────────────────────────────────
df_sc = df[pd.notna(df["baro_altitude"]) & pd.notna(df["velocity"]) &
           (df["baro_altitude"] > 0) & (df["velocity"] > 0)]

fig_sc, ax = plt.subplots(figsize=(9, 6))
fig_sc.patch.set_facecolor("#111111")
ax.set_facecolor("#1a1a2e")

for pais, grupo in df_sc.groupby("origin_country"):
    ax.scatter(
        grupo["velocity"],
        grupo["baro_altitude"],
        label=pais,
        color=color_map.get(pais, "#888"),
        s=90, edgecolors="#333", linewidths=0.5, alpha=0.9, zorder=3,
    )
    for _, row in grupo.iterrows():
        ax.annotate(
            row["callsign"],
            (row["velocity"], row["baro_altitude"]),
            textcoords="offset points", xytext=(6, 4),
            fontsize=7, color="#ccc",
        )

ax.set_title(f"Altitud vs Velocidad — {hora_captura}", color="white", fontsize=13, pad=12)
ax.set_xlabel("Velocidad (m/s)", color="#aaa", fontsize=10)
ax.set_ylabel("Altitud barométrica (m)", color="#aaa", fontsize=10)
ax.tick_params(colors="white")
ax.grid(True, color="#2a2a3e", linewidth=0.7, zorder=0)
for spine in ax.spines.values():
    spine.set_edgecolor("#444")
ax.legend(title="País", facecolor="#222", edgecolor="#555", labelcolor="white",
          title_fontsize=9, fontsize=8)

plt.tight_layout()
path_sc = f"{OUT}/04_altitud_vs_velocidad.png"
fig_sc.savefig(path_sc, dpi=150, bbox_inches="tight", facecolor="#111111")
plt.close()
print(f"[4/4] Altitud vs velocidad  → {path_sc}")

print(f"\nTodas las gráficas guardadas en /{OUT}/")
