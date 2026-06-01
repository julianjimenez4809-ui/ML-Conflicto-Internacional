"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import "leaflet/dist/leaflet.css";

// ── Types ──────────────────────────────────────────────────────────────────────

type Hotspot = { latitude: number; longitude: number; frp: number; acq_date: string; satellite: string };
type MapData  = { hotspots: Hotspot[] };
type LatLon   = [number, number];

interface Vehicle {
  id: string;
  label: string;
  type: "tanker" | "cargo" | "naval" | "commercial" | "military" | "cargo_plane";
  route: LatLon[];
  progress: number;
  speed: number;     // fraction of route per second
  color: string;
}

// ── Routes ────────────────────────────────────────────────────────────────────

const SHIP_ROUTES: Omit<Vehicle, "progress">[] = [
  { id:"s1", label:"IRAN SABALAN (fragata)", type:"naval",   color:"#ff3b30", speed:0.006,
    route:[[27.2,56.3],[27.0,55.5],[26.5,54.8],[26.8,53.5],[27.2,56.3]] },
  { id:"s2", label:"VLCC KHUZESTAN", type:"tanker",  color:"#5ac8fa", speed:0.004,
    route:[[29.9,48.6],[29.2,49.1],[28.2,49.9],[27.0,50.8],[26.0,51.8],[25.3,52.5],[24.8,54.0],[25.5,56.5],[27.2,56.3]] },
  { id:"s3", label:"MAERSK GULF", type:"cargo",   color:"#34c759", speed:0.005,
    route:[[24.0,60.0],[24.5,58.5],[25.5,57.5],[27.2,56.3],[26.5,55.0],[25.2,54.4],[24.4,54.5]] },
  { id:"s4", label:"Q-FLEX MEBROUK", type:"tanker",  color:"#5ac8fa", speed:0.0035,
    route:[[25.9,51.5],[25.2,52.0],[24.8,53.5],[25.0,55.0],[26.0,56.5],[27.0,57.0],[24.5,59.0]] },
  { id:"s5", label:"USS EISENHOWER", type:"naval",   color:"#ff3b30", speed:0.005,
    route:[[22.0,59.0],[23.5,57.5],[25.5,56.8],[27.0,56.3],[26.5,55.0],[26.0,53.0],[25.5,51.5],[26.2,50.6]] },
  { id:"s6", label:"ABU DHABI STAR", type:"tanker",  color:"#5ac8fa", speed:0.004,
    route:[[24.5,54.4],[25.0,55.5],[26.0,56.5],[27.2,56.3],[26.0,57.5],[24.5,58.5]] },
  { id:"s7", label:"BAHRI JASMINE", type:"cargo",   color:"#34c759", speed:0.006,
    route:[[26.2,50.6],[27.0,50.0],[27.5,49.5],[28.5,49.2],[29.5,48.6]] },
  { id:"s8", label:"IRAN ALVAND (corveta)", type:"naval", color:"#ff3b30", speed:0.007,
    route:[[26.9,56.0],[27.2,56.5],[27.0,57.0],[26.5,56.8],[26.9,56.0]] },
  { id:"s9", label:"COSCO SHIPPING", type:"cargo",   color:"#34c759", speed:0.004,
    route:[[28.0,48.5],[27.5,49.5],[26.5,51.0],[25.5,52.5],[25.0,54.5],[25.2,55.4]] },
  { id:"s10",label:"RAS LAFFAN LNG", type:"tanker",  color:"#5ac8fa", speed:0.0045,
    route:[[25.9,51.5],[26.5,52.5],[27.0,54.0],[27.2,56.3],[26.5,57.5],[25.0,58.5],[22.5,60.0]] },
];

const PLANE_ROUTES: Omit<Vehicle, "progress">[] = [
  { id:"p1", label:"UAE123 Dubai→Tehran",   type:"commercial", color:"#af52de", speed:0.012,
    route:[[25.2,55.4],[26.5,56.0],[28.0,54.5],[30.0,53.0],[32.0,52.0],[35.7,51.4]] },
  { id:"p2", label:"EL AL456 TLV→Dubai",   type:"commercial", color:"#af52de", speed:0.011,
    route:[[32.0,34.9],[30.0,36.5],[28.0,39.5],[26.5,44.0],[25.5,49.5],[25.2,55.4]] },
  { id:"p3", label:"THY789 IST→AbuDhabi", type:"commercial", color:"#af52de", speed:0.009,
    route:[[41.0,28.8],[38.0,33.0],[35.5,36.5],[32.5,40.0],[30.0,45.0],[27.0,50.5],[24.5,54.4]] },
  { id:"p4", label:"SVA012 RUH→DXB",      type:"commercial", color:"#af52de", speed:0.013,
    route:[[24.7,46.7],[24.8,50.0],[24.9,53.0],[25.2,55.4]] },
  { id:"p5", label:"QTR345 DOH→LHR",      type:"commercial", color:"#af52de", speed:0.010,
    route:[[25.3,51.5],[28.0,47.0],[32.0,40.0],[37.0,34.0],[41.0,29.0],[45.0,25.0]] },
  { id:"p6", label:"IRM-F14 Scramble",    type:"military",   color:"#ff9f0a", speed:0.018,
    route:[[35.7,51.4],[33.0,51.0],[31.0,52.0],[29.0,53.0],[27.5,55.5],[27.2,56.3]] },
  { id:"p7", label:"USAF P-8 Poseidon",  type:"military",   color:"#ff9f0a", speed:0.015,
    route:[[22.0,59.0],[24.0,57.0],[26.0,56.0],[27.0,53.0],[26.0,51.0],[25.0,49.0],[26.2,50.6]] },
  { id:"p8", label:"BAH678 BAH→Cairo",    type:"commercial", color:"#af52de", speed:0.011,
    route:[[26.2,50.6],[26.0,46.0],[27.0,41.0],[28.0,36.0],[29.5,33.0],[30.1,31.4]] },
  { id:"p9", label:"KAC901 KWI→DXB",     type:"commercial", color:"#af52de", speed:0.013,
    route:[[29.4,47.9],[28.0,49.0],[26.5,51.5],[25.5,53.0],[25.2,55.4]] },
  { id:"p10",label:"IDF-F35 Patrol",     type:"military",   color:"#ff9f0a", speed:0.016,
    route:[[31.9,35.0],[30.5,36.0],[29.0,38.0],[29.5,35.0],[31.0,34.8],[31.9,35.0]] },
  { id:"p11",label:"OMA432 MCT→DOH",     type:"commercial", color:"#af52de", speed:0.012,
    route:[[23.6,58.6],[25.0,57.0],[26.5,56.0],[26.5,54.0],[25.5,52.5],[25.3,51.5]] },
];

// ── Color helpers ─────────────────────────────────────────────────────────────

function frpColor(frp: number): string {
  const t = Math.min(frp / 220, 1);
  if (t < 0.2)  return "#ffffb2";
  if (t < 0.4)  return "#fecc5c";
  if (t < 0.6)  return "#fd8d3c";
  if (t < 0.8)  return "#f03b20";
  return "#bd0026";
}
function frpRadius(frp: number): number {
  return Math.max(3, Math.min(15, frp / 16));
}
function lerp(a: LatLon, b: LatLon, t: number): LatLon {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}
function getPosAndHeading(route: LatLon[], progress: number): { pos: LatLon; heading: number } {
  const n = route.length - 1;
  const seg = Math.min(progress * n, n - 0.0001);
  const i   = Math.floor(seg);
  const t   = seg - i;
  const p1  = route[i], p2 = route[Math.min(i + 1, n)];
  const pos = lerp(p1, p2, t);
  const dy  = p2[0] - p1[0], dx = p2[1] - p1[1];
  const heading = (Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360;
  return { pos, heading };
}

// ── SVG icon builders ─────────────────────────────────────────────────────────

function shipIcon(color: string, heading: number, type: string): string {
  const glow  = color + "99";
  const shape = type === "naval"
    ? `<polygon points="10,1 16,14 10,11 4,14" fill="${color}"/>
       <rect x="9" y="11" width="2" height="5" rx="0.5" fill="${color}"/>
       <rect x="7" y="6" width="6" height="2" rx="0.5" fill="${color}" opacity="0.7"/>`
    : type === "tanker"
    ? `<polygon points="10,1 17,16 10,12 3,16" fill="${color}"/>
       <rect x="8" y="8" width="4" height="6" rx="0.5" fill="${color}" opacity="0.6"/>
       <circle cx="10" cy="6" r="1.5" fill="${color}" opacity="0.8"/>`
    : `<polygon points="10,2 16,15 10,12 4,15" fill="${color}"/>
       <rect x="9" y="9" width="2" height="5" rx="0.5" fill="${color}" opacity="0.7"/>`;
  return `<div style="transform:rotate(${heading}deg);filter:drop-shadow(0 0 4px ${glow});width:20px;height:20px">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20">${shape}</svg>
  </div>`;
}

function planeIcon(color: string, heading: number, type: string): string {
  const glow = color + "aa";
  const body = type === "military"
    ? `<path d="M10,1 L12,6 L18,8 L18,10 L12,9 L13,16 L10,18 L7,16 L8,9 L2,10 L2,8 L8,6 Z" fill="${color}" opacity="0.95"/>
       <rect x="9" y="18" width="2" height="3" rx="0.5" fill="${color}" opacity="0.7"/>`
    : `<path d="M10,1 C11,1 12,4 13,8 L19,9 L19,11 L13,11 L14,18 L10,20 L6,18 L7,11 L1,11 L1,9 L7,8 C8,4 9,1 10,1Z" fill="${color}" opacity="0.9"/>`;
  return `<div style="transform:rotate(${heading}deg);filter:drop-shadow(0 0 5px ${glow});width:22px;height:22px">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="22" height="22">${body}</svg>
  </div>`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GulfMap() {
  const [rl,   setRl]   = useState<typeof import("react-leaflet") | null>(null);
  const [L,    setL]    = useState<typeof import("leaflet") | null>(null);
  const [data, setData] = useState<MapData | null>(null);

  const [ships,  setShips]  = useState<Vehicle[]>(() =>
    SHIP_ROUTES.map(r => ({ ...r, progress: Math.random() })));
  const [planes, setPlanes] = useState<Vehicle[]>(() =>
    PLANE_ROUTES.map(r => ({ ...r, progress: Math.random() })));

  const [showHeat,   setShowHeat]   = useState(true);
  const [showShips,  setShowShips]  = useState(true);
  const [showPlanes, setShowPlanes] = useState(true);
  const [showRoutes, setShowRoutes] = useState(false);

  const [trails, setTrails] = useState<Map<string, LatLon[]>>(new Map());
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);

  // ── Load leaflet + data ──────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      import("react-leaflet"),
      import("leaflet"),
      fetch("/data/gulf_map.json").then(r => r.json()),
    ]).then(([rlMod, lMod, d]) => {
      delete (lMod.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      lMod.Icon.Default.mergeOptions({
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      setRl(rlMod);
      setL(lMod);
      setData(d as MapData);
    });
  }, []);

  // ── Animation loop ───────────────────────────────────────────────────────────

  const animate = useCallback((ts: number) => {
    const dt = lastRef.current ? Math.min((ts - lastRef.current) / 1000, 0.1) : 0.016;
    lastRef.current = ts;

    setShips(prev => prev.map(v => ({ ...v, progress: (v.progress + v.speed * dt) % 1 })));
    setPlanes(prev => prev.map(v => ({ ...v, progress: (v.progress + v.speed * dt) % 1 })));

    setTrails(prev => {
      return prev;
    });

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (!rl) return;
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [rl, animate]);

  // ── Trail update ─────────────────────────────────────────────────────────────

  useEffect(() => {
    setTrails(prev => {
      const next = new Map(prev);
      [...ships, ...planes].forEach(v => {
        const { pos } = getPosAndHeading(v.route, v.progress);
        const hist = prev.get(v.id) ?? [];
        const last = hist[hist.length - 1];
        if (!last || Math.abs(last[0] - pos[0]) > 0.01 || Math.abs(last[1] - pos[1]) > 0.01) {
          next.set(v.id, [...hist.slice(-12), pos]);
        }
      });
      return next;
    });
  }, [ships, planes]);

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (!rl || !L || !data) {
    return (
      <div className="flex items-center justify-center h-full bg-[#060d18]" style={{ minHeight: 520 }}>
        <div className="text-center">
          <div className="text-white/30 font-mono text-sm animate-pulse mb-2">Cargando mapa interactivo…</div>
          <div className="text-white/15 font-mono text-xs">Inicializando capas FIRMS · AIS · OpenSky</div>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, Polyline } = rl;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative w-full" style={{ minHeight: 540 }}>
      <MapContainer
        center={[27.5, 52]}
        zoom={5.3}
        style={{ height: "100%", width: "100%", minHeight: 540 }}
        zoomControl={false}
        attributionControl={false}
      >
        {/* CartoDB Dark — matches dark section */}
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" subdomains="abcd" />

        {/* FIRMS hotspots */}
        {showHeat && data.hotspots.map((h, i) => (
          <CircleMarker key={i} center={[h.latitude, h.longitude]}
            radius={frpRadius(h.frp)}
            pathOptions={{ color:"transparent", fillColor:frpColor(h.frp), fillOpacity:0.68 }}>
            <Tooltip sticky>
              <div style={{ fontFamily:"monospace", fontSize:11, lineHeight:1.6 }}>
                <b style={{ color:frpColor(h.frp) }}>Potencia: {h.frp} MW</b><br/>
                {h.satellite} · {h.acq_date}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}

        {/* Ships */}
        {showShips && ships.map(v => {
          const { pos, heading } = getPosAndHeading(v.route, v.progress);
          const trail = trails.get(v.id) ?? [];
          return (
            <rl.FeatureGroup key={v.id}>
              {/* Trail */}
              {trail.length > 1 && (
                <Polyline positions={trail} pathOptions={{ color:v.color, weight:1.5, opacity:0.35, dashArray:"4 6" }} />
              )}
              {/* Route (optional) */}
              {showRoutes && (
                <Polyline positions={v.route} pathOptions={{ color:v.color, weight:1, opacity:0.15, dashArray:"3 8" }} />
              )}
              {/* Marker */}
              <Marker position={pos}
                icon={new L.DivIcon({ html:shipIcon(v.color, heading, v.type), className:"", iconSize:[20,20], iconAnchor:[10,10] })}>
                <Tooltip>
                  <div style={{ fontFamily:"monospace", fontSize:11, lineHeight:1.6 }}>
                    <b style={{ color:v.color }}>{v.label}</b><br/>
                    Tipo: {v.type === "naval" ? "Buque naval" : v.type === "tanker" ? "Superpetrolero" : "Carguero"}<br/>
                    Lat: {pos[0].toFixed(3)}° · Lon: {pos[1].toFixed(3)}°
                  </div>
                </Tooltip>
              </Marker>
            </rl.FeatureGroup>
          );
        })}

        {/* Planes */}
        {showPlanes && planes.map(v => {
          const { pos, heading } = getPosAndHeading(v.route, v.progress);
          const trail = trails.get(v.id) ?? [];
          return (
            <rl.FeatureGroup key={v.id}>
              {/* Trail */}
              {trail.length > 1 && (
                <Polyline positions={trail} pathOptions={{ color:v.color, weight:1, opacity:0.3, dashArray:"2 8" }} />
              )}
              {/* Route */}
              {showRoutes && (
                <Polyline positions={v.route} pathOptions={{ color:v.color, weight:0.8, opacity:0.12, dashArray:"3 10" }} />
              )}
              {/* Marker */}
              <Marker position={pos}
                icon={new L.DivIcon({ html:planeIcon(v.color, heading, v.type), className:"", iconSize:[22,22], iconAnchor:[11,11] })}>
                <Tooltip>
                  <div style={{ fontFamily:"monospace", fontSize:11, lineHeight:1.6 }}>
                    <b style={{ color:v.color }}>{v.label}</b><br/>
                    Tipo: {v.type === "military" ? "Aeronave militar" : "Vuelo comercial"}<br/>
                    Lat: {pos[0].toFixed(3)}° · Lon: {pos[1].toFixed(3)}°
                  </div>
                </Tooltip>
              </Marker>
            </rl.FeatureGroup>
          );
        })}
      </MapContainer>

      {/* Controls */}
      <div className="absolute bottom-4 left-4 z-[1000] flex flex-col gap-2">
        {[
          { key:"heat",   label:"Hotspots FIRMS",  color:"#fd8d3c", state:showHeat,   set:setShowHeat   },
          { key:"ships",  label:`Buques (${ships.length})`,  color:"#5ac8fa", state:showShips,  set:setShowShips  },
          { key:"planes", label:`Aeronaves (${planes.length})`, color:"#af52de", state:showPlanes, set:setShowPlanes },
          { key:"routes", label:"Rutas",           color:"#ffffff", state:showRoutes, set:setShowRoutes },
        ].map(l => (
          <button key={l.key} onClick={() => l.set(!l.state)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all"
            style={{
              background: l.state ? l.color + "22" : "rgba(0,0,0,0.65)",
              border: `1px solid ${l.state ? l.color : "rgba(255,255,255,0.1)"}`,
              color: l.state ? l.color : "rgba(255,255,255,0.3)",
              backdropFilter: "blur(8px)",
            }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: l.state ? l.color : "rgba(255,255,255,0.15)" }}/>
            {l.label}
          </button>
        ))}
      </div>

      {/* FRP legend */}
      <div className="absolute bottom-4 right-4 z-[1000] rounded-xl p-3"
        style={{ background:"rgba(6,13,24,0.85)", border:"1px solid rgba(255,255,255,0.08)", backdropFilter:"blur(10px)" }}>
        <div className="text-[9px] font-mono text-white/35 tracking-widest mb-2">POTENCIA RADIATIVA (MW)</div>
        <div style={{ width:90, height:8, borderRadius:4, background:"linear-gradient(to right,#ffffb2,#fecc5c,#fd8d3c,#f03b20,#bd0026)" }}/>
        <div className="flex justify-between text-[9px] font-mono text-white/30 mt-1"><span>24</span><span>331</span></div>
        <div className="mt-3 pt-2.5 border-t border-white/8 space-y-1.5">
          {[["#5ac8fa","Buques"], ["#af52de","Comercial"], ["#ff9f0a","Militar"]].map(([c, l]) => (
            <div key={l} className="flex items-center gap-1.5 text-[9px] font-mono text-white/30">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor:c }}/>
              {l}
            </div>
          ))}
        </div>
      </div>

      {/* Live badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{ background:"rgba(6,13,24,0.8)", border:"1px solid rgba(255,59,48,0.3)", backdropFilter:"blur(8px)" }}>
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"/>
        <span className="text-[10px] font-mono text-red-400 tracking-widest">SIMULACIÓN EN TIEMPO REAL</span>
      </div>
    </div>
  );
}
