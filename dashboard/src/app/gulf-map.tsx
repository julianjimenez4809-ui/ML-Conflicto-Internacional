"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

type Hotspot = { latitude: number; longitude: number; frp: number; acq_date: string; satellite: string; confidence: string };
type Ship    = { lat: number; lon: number; name: string; type: string };
type Plane   = { lat: number; lon: number; callsign: string; alt: number };

type MapData = { hotspots: Hotspot[]; ships: Ship[]; planes: Plane[] };

// FRP → color YlOrRd (matching EDA notebook)
function frpColor(frp: number): string {
  const t = Math.min(frp / 200, 1);
  if (t < 0.25) return "#ffffb2";
  if (t < 0.5)  return "#fecc5c";
  if (t < 0.75) return "#fd8d3c";
  if (t < 0.9)  return "#f03b20";
  return "#bd0026";
}

// FRP → radius
function frpRadius(frp: number): number {
  return Math.max(3, Math.min(14, frp / 18));
}

export default function GulfMap() {
  const [data, setData]     = useState<MapData | null>(null);
  const [Map,  setMap]      = useState<typeof import("react-leaflet") | null>(null);
  const [L,    setL]        = useState<typeof import("leaflet") | null>(null);
  const [showHeat, setShowHeat]   = useState(true);
  const [showShips, setShowShips] = useState(true);
  const [showPlanes, setShowPlanes] = useState(true);

  useEffect(() => {
    // Dynamic import to avoid SSR
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      fetch("/data/gulf_map.json").then(r => r.json()),
    ]).then(([rl, l, d]) => {
      // Fix leaflet default icon
      delete (l.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      l.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setMap(rl);
      setL(l);
      setData(d as MapData);
    });
  }, []);

  if (!Map || !L || !data) {
    return (
      <div className="flex items-center justify-center h-full bg-[#060d18]">
        <div className="text-white/30 font-mono text-sm animate-pulse">Cargando mapa interactivo…</div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip } = Map;

  // Custom icons for ships and planes
  const shipIcon = new L.DivIcon({
    html: `<div style="font-size:18px;line-height:1;filter:drop-shadow(0 0 4px rgba(90,200,250,0.8))">🚢</div>`,
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  const planeIcon = new L.DivIcon({
    html: `<div style="font-size:16px;line-height:1;filter:drop-shadow(0 0 4px rgba(175,82,222,0.8))">✈️</div>`,
    className: "",
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

  return (
    <div className="relative w-full h-full" style={{ minHeight: 520 }}>
      <MapContainer
        center={[28, 51]}
        zoom={5.5}
        style={{ height: "100%", width: "100%", minHeight: 520, borderRadius: "0 0 16px 16px" }}
        zoomControl={true}
        attributionControl={false}
      >
        {/* CartoDB Dark Matter — matches dark section */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />

        {/* FIRMS hotspots */}
        {showHeat && data.hotspots.map((h, i) => (
          <CircleMarker
            key={i}
            center={[h.latitude, h.longitude]}
            radius={frpRadius(h.frp)}
            pathOptions={{
              color: "transparent",
              fillColor: frpColor(h.frp),
              fillOpacity: 0.72,
            }}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}>
                <strong style={{ color: frpColor(h.frp) }}>Potencia: {h.frp} MW</strong><br/>
                Satélite: {h.satellite}<br/>
                Fecha: {h.acq_date}<br/>
                Confianza: {h.confidence}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Ships */}
        {showShips && data.ships.map((s, i) => (
          <Map.Marker key={i} position={[s.lat, s.lon]} icon={shipIcon}>
            <Tooltip permanent={false}>
              <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}>
                <strong style={{ color: "#5ac8fa" }}>Embarcación</strong><br/>
                {s.name}<br/>
                Tipo: {s.type}
              </div>
            </Tooltip>
          </Map.Marker>
        ))}

        {/* Planes */}
        {showPlanes && data.planes.map((p, i) => (
          <Map.Marker key={i} position={[p.lat, p.lon]} icon={planeIcon}>
            <Tooltip permanent={false}>
              <div style={{ fontFamily: "monospace", fontSize: 11, lineHeight: 1.5 }}>
                <strong style={{ color: "#af52de" }}>Aeronave</strong><br/>
                Vuelo: {p.callsign}<br/>
                Altitud: {p.alt.toLocaleString()} ft
              </div>
            </Tooltip>
          </Map.Marker>
        ))}
      </MapContainer>

      {/* Layer controls overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {[
          { key:"heat",  label:"Puntos FIRMS",  color:"#fd8d3c", state:showHeat,   set:setShowHeat },
          { key:"ships", label:"Buques AIS",    color:"#5ac8fa", state:showShips,  set:setShowShips },
          { key:"planes",label:"Aeronaves",     color:"#af52de", state:showPlanes, set:setShowPlanes },
        ].map(l => (
          <button key={l.key} onClick={() => l.set(!l.state)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all"
            style={{
              background: l.state ? l.color + "22" : "rgba(0,0,0,0.6)",
              border: `1px solid ${l.state ? l.color : "rgba(255,255,255,0.1)"}`,
              color: l.state ? l.color : "rgba(255,255,255,0.3)",
              backdropFilter: "blur(8px)",
            }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.state ? l.color : "rgba(255,255,255,0.2)" }}/>
            {l.label}
          </button>
        ))}
      </div>

      {/* FRP legend */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-lg overflow-hidden"
        style={{ background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.1)", backdropFilter:"blur(8px)" }}>
        <div className="px-3 py-2">
          <div className="text-[9px] font-mono text-white/40 tracking-widest mb-2">POTENCIA RADIATIVA (MW)</div>
          <div className="flex items-center gap-1.5">
            <div style={{ width:80, height:8, borderRadius:4, background:"linear-gradient(to right, #ffffb2, #fecc5c, #fd8d3c, #f03b20, #bd0026)" }}/>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1">
            <span>24</span><span>331</span>
          </div>
        </div>
      </div>
    </div>
  );
}
