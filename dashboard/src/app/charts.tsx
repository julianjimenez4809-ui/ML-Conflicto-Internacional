"use client";

import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell,
  ComposedChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ReferenceLine,
} from "recharts";

// ── Color constants ────────────────────────────────────────────────────────────
const CC: Record<string, string> = { IRN: "#ff3b30", ISR: "#0071e3", USA: "#34c759" };
const LEVEL_LABEL: Record<number, string> = { 0: "Bajo", 1: "Medio", 2: "Alto" };

// ── Shared types ───────────────────────────────────────────────────────────────
export type TimelinePoint = { date: string; IRN?: number; ISR?: number; USA?: number };
export type DistPoint     = { level: string; IRN: number; ISR: number; USA: number };
export type GoldsteinPoint = { country: string; mean: number; std: number; min: number; max: number };

// ── Tooltip style ──────────────────────────────────────────────────────────────
const TT_STYLE = { backgroundColor: "#1d1d1f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 12 };
const LABEL_STYLE = { color: "#fff", fontSize: 12 };

// ═══════════════════════════════════════════════════════════════════════════════
// 1. EscalationTimeline — línea temporal KNN por país
// ═══════════════════════════════════════════════════════════════════════════════

export function EscalationTimeline({ data }: { data: TimelinePoint[] }) {
  const [active, setActive] = useState<Set<string>>(new Set(["IRN", "ISR", "USA"]));
  const toggle = (c: string) =>
    setActive(prev => { const n = new Set(prev); if (n.has(c)) { if (n.size > 1) n.delete(c); } else { n.add(c); } return n; });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["IRN", "ISR", "USA"] as const).map(c => (
          <button key={c} onClick={() => toggle(c)}
            className="px-3 py-1 rounded-full text-xs font-semibold transition-opacity"
            style={{ background: CC[c] + "22", color: CC[c], border: `1px solid ${CC[c]}`, opacity: active.has(c) ? 1 : 0.25 }}>
            {c}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="date" tick={{ fill: "#6e6e73", fontSize: 10 }}
            tickFormatter={d => d.slice(5)} interval={Math.floor(data.length / 6)} />
          <YAxis domain={[0, 2]} ticks={[0, 1, 2]}
            tickFormatter={v => LEVEL_LABEL[v as number] ?? v}
            tick={{ fill: "#6e6e73", fontSize: 9 }} />
          <Tooltip contentStyle={TT_STYLE} labelStyle={LABEL_STYLE}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, n: any) => [LEVEL_LABEL[v as number] ?? v, String(n)]} />
          <Legend wrapperStyle={{ fontSize: 11, color: "#6e6e73" }} />
          {(["IRN", "ISR", "USA"] as const).map(c =>
            active.has(c) ? (
              <Line key={c} type="stepAfter" dataKey={c} stroke={CC[c]}
                strokeWidth={2} dot={false} connectNulls />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. DistributionChart — barras agrupadas por nivel
// ═══════════════════════════════════════════════════════════════════════════════

export function DistributionChart({ data }: { data: DistPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="level" tick={{ fill: "#6e6e73", fontSize: 11 }} />
        <YAxis tick={{ fill: "#6e6e73", fontSize: 10 }} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={LABEL_STYLE}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, n: any) => [`${v} días`, String(n)]} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#6e6e73" }} />
        <Bar dataKey="IRN" fill={CC.IRN} radius={[3, 3, 0, 0]} />
        <Bar dataKey="ISR" fill={CC.ISR} radius={[3, 3, 0, 0]} />
        <Bar dataKey="USA" fill={CC.USA} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. SourceDonutChart — distribución de 557K eventos por fuente
// ═══════════════════════════════════════════════════════════════════════════════

const SOURCE_DATA = [
  { name: "OpenSky",   value: 493382, color: "#af52de", pct: "88.5%" },
  { name: "FIRMS",     value: 63604,  color: "#ff3b30", pct: "11.4%" },
  { name: "AISStream", value: 138,    color: "#5ac8fa", pct: "<0.1%" },
  { name: "RSS",       value: 341,    color: "#ff9f0a", pct: "<0.1%" },
  { name: "Bluesky",   value: 61,     color: "#30d158", pct: "<0.1%" },
  { name: "GDELT",     value: 120,    color: "#0071e3", pct: "<0.1%" },
];

const CustomDonutLabel = ({ cx, cy }: { cx: number; cy: number }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="#fff" fontSize={24} fontWeight={900} fontFamily="monospace">557K</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fill="#6e6e73" fontSize={11}>eventos totales</text>
  </>
);

export function SourceDonutChart() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="flex flex-col lg:flex-row items-center gap-6">
      <div className="w-full lg:w-64 flex-shrink-0">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={SOURCE_DATA} cx="50%" cy="50%"
              innerRadius={70} outerRadius={100}
              dataKey="value" paddingAngle={2}
              onMouseEnter={e => setActive(e.name ?? null)}
              onMouseLeave={() => setActive(null)}>
              {SOURCE_DATA.map((s, i) => (
                <Cell key={i} fill={s.color}
                  opacity={active === null || active === s.name ? 1 : 0.3}
                  stroke="transparent" />
              ))}
            </Pie>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            <Tooltip contentStyle={TT_STYLE} formatter={(v: any) => [Number(v).toLocaleString("es-CO"), "eventos"]} />
            <CustomDonutLabel cx={100} cy={110} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex-1 space-y-2.5 w-full">
        {SOURCE_DATA.map(s => (
          <div key={s.name}
            className="flex items-center gap-3"
            onMouseEnter={() => setActive(s.name)}
            onMouseLeave={() => setActive(null)}
            style={{ opacity: active === null || active === s.name ? 1 : 0.4 }}>
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
            <div className="flex-1 text-sm text-white/70">{s.name}</div>
            <div className="text-sm font-mono font-bold text-white">{s.value.toLocaleString("es-CO")}</div>
            <div className="text-xs font-mono text-white/30 w-12 text-right">{s.pct}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. FRPDailyChart — hotspots y potencia radiativa por día (FIRMS may 2026)
// ═══════════════════════════════════════════════════════════════════════════════

const FIRMS_DAILY = [
  { dia: "26 may", hotspots: 892,  frp_total: 18450, avg_frp: 20.7 },
  { dia: "27 may", hotspots: 1203, frp_total: 24800, avg_frp: 20.6 },
  { dia: "28 may", hotspots: 1467, frp_total: 31200, avg_frp: 21.3 },
  { dia: "29 may", hotspots: 1834, frp_total: 38900, avg_frp: 21.2 },
  { dia: "30 may", hotspots: 956,  frp_total: 19800, avg_frp: 20.7 },
];

export function FRPDailyChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <ComposedChart data={FIRMS_DAILY} margin={{ top: 4, right: 40, left: -8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="dia" tick={{ fill: "#6e6e73", fontSize: 10 }} />
        <YAxis yAxisId="left" tick={{ fill: "#6e6e73", fontSize: 9 }} label={{ value: "Hotspots", angle: -90, position: "insideLeft", fill: "#6e6e73", fontSize: 9 }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#ff9f0a", fontSize: 9 }} label={{ value: "FRP (MW)", angle: 90, position: "insideRight", fill: "#ff9f0a", fontSize: 9 }} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={LABEL_STYLE} />
        <Bar yAxisId="left" dataKey="hotspots" name="Puntos calientes" fill="#ff3b30" opacity={0.7} radius={[3, 3, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="frp_total" name="FRP total (MW)" stroke="#ff9f0a" strokeWidth={2.5} dot={{ fill: "#ff9f0a", r: 4 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. GoldsteinBarChart — goldstein promedio por país con rango
// ═══════════════════════════════════════════════════════════════════════════════

const GOLDSTEIN_DATA = [
  { country: "IRN", mean: -3.21, min: -8.4, max: 2.1, fill: "#ff3b30" },
  { country: "ISR", mean: -4.87, min: -9.2, max: 1.8, fill: "#0071e3" },
  { country: "USA", mean: -1.43, min: -6.1, max: 4.3, fill: "#34c759" },
];

export function GoldsteinBarChart() {
  return (
    <div>
      <div className="mb-4 text-xs font-mono text-white/25 tracking-widest">
        ESCALA: −10 (conflicto máximo) → +10 (cooperación máxima)
      </div>
      <div className="space-y-5">
        {GOLDSTEIN_DATA.map(d => {
          const scale = (v: number) => ((v + 10) / 20) * 100;
          return (
            <div key={d.country}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold font-mono" style={{ color: d.fill }}>{d.country}</span>
                <span className="text-lg font-black font-mono text-white">{d.mean.toFixed(2)}</span>
              </div>
              <div className="relative h-3 bg-white/5 rounded-full overflow-hidden">
                {/* Zero line */}
                <div className="absolute top-0 bottom-0 w-px bg-white/20" style={{ left: "50%" }} />
                {/* Range bar */}
                <div className="absolute top-1 bottom-1 rounded-full" style={{
                  left: `${scale(d.min)}%`, width: `${scale(d.max) - scale(d.min)}%`,
                  backgroundColor: d.fill, opacity: 0.25,
                }} />
                {/* Mean marker */}
                <div className="absolute top-0 bottom-0 w-0.5 rounded-full" style={{
                  left: `${scale(d.mean)}%`, backgroundColor: d.fill,
                }} />
              </div>
              <div className="flex justify-between text-[9px] font-mono text-white/20 mt-1">
                <span>mín {d.min}</span>
                <span>máx {d.max}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-white/8 text-xs text-white/30 leading-relaxed">
        Israel registra el tono más negativo (−4.87) · Oct 2023 – May 2026 · Fuente: GDELT
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 6. EscalationHeatmap — grid mes × país coloreado por nivel
// ═══════════════════════════════════════════════════════════════════════════════

// Nivel promedio mensual por país (0=bajo, 1=medio, 2=alto) — derivado de GDELT
const HEATMAP_DATA: Record<string, Record<string, number>> = {
  "Oct 23": { IRN: 1, ISR: 2, USA: 1 },
  "Nov 23": { IRN: 1, ISR: 2, USA: 1 },
  "Dic 23": { IRN: 2, ISR: 2, USA: 1 },
  "Ene 24": { IRN: 1, ISR: 2, USA: 1 },
  "Feb 24": { IRN: 1, ISR: 1, USA: 0 },
  "Mar 24": { IRN: 2, ISR: 2, USA: 1 },
  "Abr 24": { IRN: 2, ISR: 2, USA: 2 },
  "May 24": { IRN: 1, ISR: 2, USA: 1 },
  "Jun 24": { IRN: 1, ISR: 1, USA: 0 },
  "Jul 24": { IRN: 1, ISR: 1, USA: 0 },
  "Ago 24": { IRN: 1, ISR: 1, USA: 1 },
  "Sep 24": { IRN: 1, ISR: 2, USA: 1 },
  "Oct 24": { IRN: 2, ISR: 2, USA: 2 },
  "Nov 24": { IRN: 2, ISR: 2, USA: 1 },
  "Dic 24": { IRN: 1, ISR: 1, USA: 1 },
  "Ene 25": { IRN: 1, ISR: 1, USA: 0 },
  "Feb 25": { IRN: 2, ISR: 1, USA: 1 },
  "Mar 25": { IRN: 2, ISR: 2, USA: 2 },
  "Abr 25": { IRN: 1, ISR: 1, USA: 1 },
  "May 25": { IRN: 1, ISR: 1, USA: 0 },
  "Jun 25": { IRN: 0, ISR: 1, USA: 0 },
  "Jul 25": { IRN: 0, ISR: 1, USA: 0 },
  "Ago 25": { IRN: 1, ISR: 1, USA: 1 },
  "Sep 25": { IRN: 1, ISR: 1, USA: 1 },
  "Oct 25": { IRN: 1, ISR: 1, USA: 1 },
  "Nov 25": { IRN: 1, ISR: 2, USA: 1 },
  "Dic 25": { IRN: 1, ISR: 1, USA: 1 },
  "Ene 26": { IRN: 2, ISR: 1, USA: 1 },
  "Feb 26": { IRN: 2, ISR: 2, USA: 1 },
  "Mar 26": { IRN: 2, ISR: 2, USA: 2 },
  "Abr 26": { IRN: 2, ISR: 2, USA: 2 },
  "May 26": { IRN: 2, ISR: 2, USA: 1 },
};

const LEVEL_COLORS = ["#34c759", "#ff9f0a", "#ff3b30"];
const LEVEL_NAMES  = ["Bajo", "Medio", "Alto"];
const COUNTRIES    = ["IRN", "ISR", "USA"];
const MONTHS       = Object.keys(HEATMAP_DATA);

export function EscalationHeatmap() {
  const [hovered, setHovered] = useState<{m: string; c: string} | null>(null);
  return (
    <div>
      <div className="grid" style={{ gridTemplateColumns: `56px repeat(${MONTHS.length}, 1fr)`, gap: "2px" }}>
        {/* Header row */}
        <div />
        {MONTHS.map(m => (
          <div key={m} className="text-[7px] font-mono text-white/20 text-center pb-1 leading-tight">
            {m}
          </div>
        ))}
        {/* Data rows */}
        {COUNTRIES.map(c => (
          <>
            <div key={`lbl-${c}`} className="text-xs font-bold font-mono text-right pr-2 flex items-center justify-end"
              style={{ color: CC[c] }}>{c}</div>
            {MONTHS.map(m => {
              const lvl = HEATMAP_DATA[m][c];
              const isH = hovered?.m === m && hovered?.c === c;
              return (
                <div key={`${m}-${c}`}
                  className="rounded-[2px] h-6 cursor-default transition-all duration-150"
                  style={{ backgroundColor: LEVEL_COLORS[lvl], opacity: isH ? 1 : 0.65, transform: isH ? "scaleY(1.3)" : "scaleY(1)" }}
                  onMouseEnter={() => setHovered({ m, c })}
                  onMouseLeave={() => setHovered(null)}
                  title={`${c} ${m}: ${LEVEL_NAMES[lvl]}`}
                />
              );
            })}
          </>
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 justify-end">
        {LEVEL_NAMES.map((n, i) => (
          <div key={n} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: LEVEL_COLORS[i] }} />
            <span className="text-xs text-white/30">{n}</span>
          </div>
        ))}
      </div>
      {hovered && (
        <div className="mt-2 text-xs text-center font-mono text-white/50">
          {hovered.c} · {hovered.m} → Nivel {LEVEL_NAMES[HEATMAP_DATA[hovered.m][hovered.c]]}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 7. ModelRadarChart — comparación multidimensional de modelos
// ═══════════════════════════════════════════════════════════════════════════════

const RADAR_DATA = [
  { metric: "F1",        KNN: 75, LR: 62, Ridge: 47, NB: 45 },
  { metric: "Precisión", KNN: 77, LR: 64, Ridge: 49, NB: 43 },
  { metric: "Recall",    KNN: 74, LR: 61, Ridge: 46, NB: 48 },
  { metric: "Estabilidad",KNN: 94, LR: 97, Ridge: 76, NB: 81 },
  { metric: "Vel. entrn.",KNN: 90, LR: 95, Ridge: 98, NB: 99 },
];

export function ModelRadarChart() {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={90}>
        <PolarGrid stroke="rgba(255,255,255,0.08)" />
        <PolarAngleAxis dataKey="metric" tick={{ fill: "#6e6e73", fontSize: 10 }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6e6e73", fontSize: 8 }} />
        <Radar name="KNN"               dataKey="KNN"   stroke="#0071e3" fill="#0071e3" fillOpacity={0.25} strokeWidth={2} />
        <Radar name="Logistic Reg."     dataKey="LR"    stroke="#af52de" fill="#af52de" fillOpacity={0.1}  strokeWidth={1.5} />
        <Radar name="Ridge"             dataKey="Ridge" stroke="#6e6e73" fill="#6e6e73" fillOpacity={0.05} strokeWidth={1}   strokeDasharray="4 2" />
        <Radar name="Naive Bayes"       dataKey="NB"    stroke="#ff9f0a" fill="#ff9f0a" fillOpacity={0.05} strokeWidth={1}   strokeDasharray="4 2" />
        <Legend wrapperStyle={{ fontSize: 11, color: "#6e6e73" }} />
        <Tooltip contentStyle={TT_STYLE} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// 8. ConflictIntensityChart — intensidad compuesta (eventos × goldstein)
// ═══════════════════════════════════════════════════════════════════════════════

export function ConflictIntensityChart({ data }: { data: TimelinePoint[] }) {
  if (!data.length) return null;
  // Compute combined intensity: average of all available escalation values per date
  const chartData = data.slice(-90).map(d => {
    const vals = [d.IRN, d.ISR, d.USA].filter(v => v !== undefined) as number[];
    const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    return { date: d.date, intensidad: parseFloat(avg.toFixed(2)), IRN: d.IRN, ISR: d.ISR, USA: d.USA };
  });

  return (
    <ResponsiveContainer width="100%" height={160}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 8, left: -28, bottom: 4 }}>
        <defs>
          <linearGradient id="intensityGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ff3b30" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#ff3b30" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="date" tick={{ fill: "#6e6e73", fontSize: 9 }}
          tickFormatter={d => d.slice(5)} interval={Math.floor(chartData.length / 5)} />
        <YAxis domain={[0, 2]} ticks={[0, 1, 2]}
          tickFormatter={v => LEVEL_LABEL[v as number] ?? v}
          tick={{ fill: "#6e6e73", fontSize: 9 }} />
        <Tooltip contentStyle={TT_STYLE} labelStyle={LABEL_STYLE} />
        <ReferenceLine y={2} stroke="#ff3b30" strokeDasharray="4 2" strokeOpacity={0.4} label={{ value: "ALTO", fill: "#ff3b30", fontSize: 9, position: "right" }} />
        <Area type="monotone" dataKey="intensidad" name="Intensidad media"
          stroke="#ff3b30" fill="url(#intensityGrad)" strokeWidth={2} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
