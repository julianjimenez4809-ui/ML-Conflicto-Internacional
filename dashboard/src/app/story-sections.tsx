"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { EscalationTimeline, DistributionChart } from "./charts";
import type { TimelinePoint, DistPoint } from "./charts";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LatestCountry = {
  escalation_level: number;
  date: string;
  n_conflict_events: number;
  avg_goldstein: number;
  n_gdelt_mentions: number;
};

export type RecentEvent = {
  timestamp: string;
  source: string;
  country: string | null;
  event_type: string | null;
  text: string | null;
};

export type LiveProps = {
  latest: Record<string, LatestCountry>;
  recentEvents: RecentEvent[];
};

export type DataProps = {
  timeline: TimelinePoint[];
  distribution: DistPoint[];
};

// ── Scroll fade-in wrapper ────────────────────────────────────────────────────

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.85s ease ${delay}ms, transform 0.85s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
      }}
    >
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="text-xs font-mono text-slate-600">{num}</span>
      <span className="h-px w-8 bg-slate-700" />
      <span className="text-xs font-mono tracking-[0.25em] text-slate-500 uppercase">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 01. HERO
// ─────────────────────────────────────────────────────────────────────────────

export function HeroSection() {
  const [tick, setTick] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setTick((p) => !p), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-[#040710]">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[280, 480, 680].map((sz, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-red-700/25"
            style={{
              width: sz, height: sz,
              animation: `ring-pulse ${3.5 + i * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* Dot map — decorative coordinates */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
        {[
          { top: "35%", left: "62%", label: "Teherán" },
          { top: "42%", left: "55%", label: "Baghdad" },
          { top: "46%", left: "57%", label: "Kuwait" },
          { top: "44%", left: "52%", label: "Basra" },
          { top: "39%", left: "48%", label: "Tel Aviv" },
        ].map((p) => (
          <div key={p.label} className="absolute" style={{ top: p.top, left: p.left }}>
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="absolute top-2 left-2 text-[9px] font-mono text-slate-400 whitespace-nowrap">
              {p.label}
            </span>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2 mb-10 px-4 py-2 rounded-full border border-red-900/50 bg-red-950/20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono text-red-400 tracking-widest uppercase">
            Monitoreo activo · Mayo 2026
          </span>
        </div>

        {/* Title */}
        <h1
          className="font-black leading-none tracking-tight text-white mb-3"
          style={{ fontSize: "clamp(3.5rem, 11vw, 8.5rem)" }}
        >
          IRÁN · ISRAEL
        </h1>
        <h2
          className="font-black leading-none tracking-tight text-slate-600 mb-10"
          style={{ fontSize: "clamp(2rem, 6.5vw, 5.5rem)" }}
        >
          ESTADOS UNIDOS
        </h2>

        <div className="w-14 h-[2px] bg-red-600 mx-auto mb-10" />

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-14">
          Inteligencia de fuentes abiertas para clasificar la escalada del conflicto
          más tenso del siglo XXI
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
          {[
            { n: "6", label: "fuentes OSINT" },
            { n: "557K", label: "eventos crudos" },
            { n: "4", label: "modelos de IA" },
          ].map(({ n, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-black font-mono text-white">{n}</div>
              <div className="text-xs text-slate-600 font-mono mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[10px] font-mono text-slate-700 tracking-widest">DESPLAZAR</span>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-px h-4 bg-slate-700"
            style={{ animation: "scroll-fade 1.6s ease infinite", animationDelay: `${i * 0.22}s` }}
          />
        ))}
      </div>

      {/* Footer tag */}
      <div className="absolute top-6 left-6 text-[10px] font-mono text-slate-700 tracking-widest">
        EXTERNADO · ML1-2026I
      </div>
      <div className="absolute top-6 right-6 text-[10px] font-mono text-slate-700 tracking-widest">
        {tick ? "█" : " "} SYSTEM ONLINE
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 02. EL ESCENARIO — contexto + cronología
// ─────────────────────────────────────────────────────────────────────────────

const WAR_EVENTS = [
  {
    date: "7 oct 2023",
    title: "El ataque que lo cambió todo",
    body: "Hamás lanza el mayor ataque terrorista en la historia de Israel: 1,200 muertos, 250 secuestrados. Israel declara estado de guerra. Comienza la operación terrestre sobre Gaza.",
    level: "extreme",
  },
  {
    date: "oct – dic 2023",
    title: "Escalada regional",
    body: "Hezbollah abre el frente norte desde el Líbano. Los Hutíes bloquean el Mar Rojo. Irán activa su red de proxies. EE.UU. despliega dos grupos de batalla de portaaviones en el Mediterráneo.",
    level: "high",
  },
  {
    date: "1 abr 2024",
    title: "Israel ataca el consulado iraní en Damasco",
    body: "Siete oficiales de la Guardia Revolucionaria Islámica muertos. Es el primer ataque directo israelí a una instalación diplomática iraní. Irán jura represalia.",
    level: "high",
  },
  {
    date: "13–14 abr 2024",
    title: "Irán rompe la línea roja",
    body: "330 drones y misiles baliticos sobre Israel. Primera vez en la historia que Irán ataca directamente. El 99% es interceptado por Israel, EE.UU., Jordania y Arabia Saudí. El mundo contiene la respiración.",
    level: "extreme",
  },
  {
    date: "19 abr 2024",
    title: "Israel contraataca cerca de Isfahan",
    body: "Ataque de precisión israelí contra sistemas de defensa aérea iraníes. Señal de que Israel tiene capacidad de penetración profunda sobre suelo iraní, incluyendo instalaciones nucleares.",
    level: "high",
  },
  {
    date: "1 oct 2024",
    title: "200 misiles balísticos sobre Israel",
    body: "Irán responde al asesinato de líderes de Hezbollah y Hamás con el mayor ataque de misiles balísticos jamás sufrido por Israel. La mayoría es interceptada, pero el mensaje es claro.",
    level: "extreme",
  },
  {
    date: "26 oct 2024",
    title: "Israel destruye defensas aéreas iraníes",
    body: "Ataque coordinado israelí en múltiples provincias iraníes. Irán queda parcialmente expuesto. Se habla de posible ataque a instalaciones nucleares. La escalada llega a su punto más alto.",
    level: "extreme",
  },
  {
    date: "feb – mar 2025",
    title: "Escalada diplomática y sanciones",
    body: "EE.UU. refuerza sanciones sobre el programa nuclear iraní. Colapsan las negociaciones de alto al fuego en Gaza. GDELT registra el primer pico significativo de conflictividad en nuestros datos.",
    level: "medium",
  },
  {
    date: "ene – mar 2026",
    title: "Tensión en el Estrecho de Ormuz",
    body: "Irán despliega buques militares adicionales. EE.UU. refuerza su presencia naval en el Golfo Pérsico. El 20% del petróleo mundial y el 30% del GNL global transitan por un canal de 39 km de ancho bajo amenaza.",
    level: "high",
  },
  {
    date: "mar – abr 2026",
    title: "Pico máximo detectado por GDELT",
    body: "Los tres países alcanzan nivel ALTO simultáneamente por primera vez en el histórico monitoreado. Nuestro modelo KNN clasifica a IRN, ISR y USA en escalada máxima durante 11 días consecutivos.",
    level: "extreme",
  },
  {
    date: "26–30 may 2026",
    title: "Ventana de monitoreo activo FIRMS",
    body: "NASA detecta 6,812 anomalías térmicas sobre Oriente Medio. Bandar Abbas — puerto naval iraní a la entrada del Estrecho — registra actividad térmica activa. El sistema de IA está operativo.",
    level: "high",
  },
];

const EV_STYLE: Record<string, { dot: string; text: string }> = {
  extreme: { dot: "bg-red-500",    text: "text-red-400" },
  high:    { dot: "bg-orange-500", text: "text-orange-400" },
  medium:  { dot: "bg-amber-400",  text: "text-amber-400" },
};

export function ContextSection() {
  return (
    <section className="py-28 px-6 bg-[#040710]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="01" label="El Escenario" />
          <h2 className="text-5xl md:text-7xl font-black text-white mb-5 leading-none">
            Tres actores.<br />
            <span className="text-slate-600">Una región.</span><br />
            Una crisis.
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16 leading-relaxed">
            Desde el 7 de octubre de 2023, Oriente Medio vive la escalada más peligrosa de su historia
            reciente. Irán, Israel y Estados Unidos protagonizan un equilibrio de terror con
            consecuencias globales: el 20% del petróleo mundial transita por una zona en alerta permanente.
          </p>
        </FadeIn>

        {/* Actor cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
          {[
            {
              code: "IRN", flag: "🇮🇷", name: "Irán", color: "#ef4444",
              border: "border-red-900/40", bg: "bg-red-950/10",
              desc: "Potencia regional con red de proxies activos (Hezbollah, Hutíes, Hamás). Programa nuclear en punto crítico. Control estratégico del Estrecho de Ormuz.",
              stat: "1er productor de petróleo OPEP",
            },
            {
              code: "ISR", flag: "🇮🇱", name: "Israel", color: "#3b82f6",
              border: "border-blue-900/40", bg: "bg-blue-950/10",
              desc: "Guerra activa en Gaza y Líbano. Capacidad de ataque de largo alcance demostrada sobre suelo iraní. Presión diplomática internacional creciente.",
              stat: "Única potencia nuclear no declarada de la región",
            },
            {
              code: "USA", flag: "🇺🇸", name: "Estados Unidos", color: "#22c55e",
              border: "border-green-900/40", bg: "bg-green-950/10",
              desc: "Garante de la seguridad israelí. Presencia naval masiva en el Golfo Pérsico con dos grupos de portaaviones. Arquitecto de las sanciones sobre Irán.",
              stat: "V Flota Naval en el Golfo Pérsico",
            },
          ].map((a, i) => (
            <FadeIn key={a.code} delay={i * 140}>
              <div className={`rounded-2xl border ${a.border} ${a.bg} p-6 h-full`}>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{a.flag}</span>
                  <div>
                    <div className="text-[10px] font-mono text-slate-600">{a.code}</div>
                    <div className="text-lg font-bold text-white">{a.name}</div>
                  </div>
                  <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: a.color }} />
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">{a.desc}</p>
                <div className="text-xs font-mono text-slate-600 border-t border-slate-800/60 pt-3">
                  {a.stat}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* War timeline */}
        <FadeIn>
          <h3 className="text-2xl font-bold text-white mb-10">Cronología del conflicto</h3>
        </FadeIn>

        <div className="relative">
          <div className="absolute left-[7px] top-3 bottom-3 w-px bg-slate-800" />
          <div className="space-y-10">
            {WAR_EVENTS.map((ev, i) => {
              const s = EV_STYLE[ev.level];
              return (
                <FadeIn key={i} delay={i * 55}>
                  <div className="pl-9 relative">
                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full ${s.dot} ring-4 ring-[#040710]`} />
                    <div className={`text-xs font-mono mb-1 ${s.text}`}>{ev.date}</div>
                    <div className="text-white font-bold text-lg mb-1 leading-snug">{ev.title}</div>
                    <div className="text-sm text-slate-500 leading-relaxed max-w-2xl">{ev.body}</div>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 03. LAS SEÑALES — cómo lo monitoreamos
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES = [
  {
    id: "GDELT", name: "GDELT Project", icon: "📡",
    desc: "Base de datos global de eventos mediáticos. Captura tono y volumen de la cobertura de conflictos en tiempo real desde 1979.",
    stat: "120", unit: "agregados país-día",
    period: "Oct 2023 – May 2026",
    highlight: "Fuente primaria del modelo ML",
    color: "#3b82f6",
  },
  {
    id: "NASA FIRMS", name: "NASA FIRMS", icon: "🛰️",
    desc: "Detección de anomalías térmicas por satélite VIIRS (375m) y MODIS (1km). Proxy de explosiones, incendios de infraestructura y actividad militar.",
    stat: "6,812", unit: "hotspots térmicos",
    period: "26–30 mayo 2026",
    highlight: "Revela el Estrecho de Ormuz",
    color: "#ef4444",
  },
  {
    id: "OpenSky", name: "OpenSky Network", icon: "✈️",
    desc: "Rastreo de vuelos en tiempo real sobre el espacio aéreo de Oriente Medio. Los cierres y desvíos de rutas son señal directa de escalada.",
    stat: "493K", unit: "trazas de vuelo",
    period: "Oct 2023 – Jun 2025",
    highlight: "Mayor fuente por volumen de datos",
    color: "#8b5cf6",
  },
  {
    id: "RSS Feeds", name: "RSS Feeds", icon: "📰",
    desc: "Titulares de BBC, Al Jazeera, Google News, Tehran Times y Middle East Eye. Cinco perspectivas editoriales contrastadas sobre el mismo conflicto.",
    stat: "141", unit: "artículos indexados",
    period: "Feb – May 2026",
    highlight: "5 fuentes editoriales activas",
    color: "#f59e0b",
  },
  {
    id: "Bluesky", name: "Bluesky Social", icon: "🦋",
    desc: "Red social descentralizada. Volumen de publicaciones y engagement como barómetro de la atención pública global sobre el conflicto.",
    stat: "61", unit: "posts capturados",
    period: "Mayo 2026",
    highlight: "Señal de conversación pública",
    color: "#06b6d4",
  },
  {
    id: "AISStream", name: "AISStream (AIS)", icon: "🚢",
    desc: "Posiciones de embarcaciones en tiempo real mediante el sistema AIS. Tráfico naval en el Golfo Pérsico y el Estrecho de Ormuz como indicador geopolítico.",
    stat: "138", unit: "posiciones AIS",
    period: "Mayo 2026",
    highlight: "Control naval del Estrecho",
    color: "#22c55e",
  },
];

export function SignalsSection() {
  return (
    <section className="py-28 px-6 bg-[#070d1a]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="02" label="Las Señales" />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-5 leading-none">
            Así monitoreamos<br />
            <span className="text-slate-600">la guerra.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16 leading-relaxed">
            Seis fuentes de datos abiertas y gratuitas, integradas en un pipeline automatizado.
            Cada fuente aporta una dimensión distinta del conflicto: cobertura mediática,
            actividad satelital, tráfico aéreo, tráfico naval y conversación social.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SOURCES.map((s, i) => (
            <FadeIn key={s.id} delay={i * 90}>
              <div className="rounded-2xl border border-slate-800 bg-[#040710] p-6 hover:border-slate-700 transition-all duration-300 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{s.icon}</span>
                  <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-green-950/60 text-green-400 border border-green-900/40">
                    ACTIVO
                  </span>
                </div>
                <div className="text-[10px] font-mono mb-1" style={{ color: s.color }}>{s.id}</div>
                <div className="text-white font-bold mb-3">{s.name}</div>
                <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-5">{s.desc}</p>
                <div className="border-t border-slate-800 pt-4">
                  <span className="text-3xl font-black font-mono text-white">{s.stat}</span>
                  <span className="text-sm text-slate-600 ml-2">{s.unit}</span>
                  <div className="text-xs text-slate-600 mt-1">{s.period}</div>
                  <div className="mt-3 text-xs font-mono" style={{ color: s.color }}>▸ {s.highlight}</div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 04. LOS DATOS — visualizaciones con narrativa
// ─────────────────────────────────────────────────────────────────────────────

export function DataSection({ timeline, distribution }: DataProps) {
  return (
    <section className="py-28 px-6 bg-[#040710]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="03" label="Los Datos" />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-5 leading-none">
            ¿Qué dicen<br />
            <span className="text-slate-600">los datos?</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-6 leading-relaxed">
            La <strong className="text-white">escala Goldstein</strong> de GDELT mide el tono de la cobertura
            mediática: valores negativos indican conflicto, positivos cooperación.
            Es el indicador más predictivo del modelo de IA.
          </p>
          <p className="text-slate-500 text-base max-w-2xl mb-16 leading-relaxed">
            El nivel de escalada se construye por cuartiles de Goldstein por país:
            los días en el cuartil inferior se clasifican como <span className="text-red-400 font-mono font-bold">ALTO</span>,
            los del superior como <span className="text-green-400 font-mono font-bold">BAJO</span>.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <FadeIn>
            <div className="rounded-2xl border border-slate-800 bg-[#0a1628] p-7">
              <div className="text-[10px] font-mono text-slate-600 mb-1 tracking-widest">GDELT · ESCALA GOLDSTEIN · KNN</div>
              <h3 className="text-xl font-bold text-white mb-1">Nivel de escalada en el tiempo</h3>
              <p className="text-sm text-slate-500 mb-6">Clasificación KNN por país-día — Oct 2023 a May 2026</p>
              <EscalationTimeline data={timeline} />
            </div>
          </FadeIn>
          <FadeIn delay={180}>
            <div className="rounded-2xl border border-slate-800 bg-[#0a1628] p-7">
              <div className="text-[10px] font-mono text-slate-600 mb-1 tracking-widest">DISTRIBUCIÓN DE CLASES</div>
              <h3 className="text-xl font-bold text-white mb-1">¿Cuántos días en cada nivel?</h3>
              <p className="text-sm text-slate-500 mb-6">Días clasificados por nivel de escalada por país</p>
              <DistributionChart data={distribution} />
            </div>
          </FadeIn>
        </div>

        {/* Callout */}
        <FadeIn delay={300}>
          <div className="rounded-2xl border border-amber-800/40 bg-amber-950/15 p-8">
            <div className="text-[10px] font-mono text-amber-500 tracking-widest mb-3">▸ HALLAZGO — GDELT</div>
            <p className="text-lg text-amber-100 leading-relaxed max-w-3xl">
              <span className="font-bold">Marzo–Abril 2026 marca el pico máximo</span> de escalada
              en el histórico completo monitoreado. Los tres países alcanzaron nivel{" "}
              <span className="font-mono font-black text-red-400">ALTO</span> simultáneamente
              durante 11 días consecutivos — hecho sin precedentes desde el inicio del análisis en octubre de 2023.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 05. FIRMAS NASA — el mapa del conflicto
// ─────────────────────────────────────────────────────────────────────────────

const FIRMS_POINTS = [
  { name: "Abu Dhabi, UAE",           frp: 331.5, type: "industrial", desc: "Mayor potencia radiativa del conjunto. Infraestructura petrolera UAE.",        color: "#38bdf8" },
  { name: "North Dome, Qatar",        frp: 258.1, type: "industrial", desc: "Lado qatarí del mayor campo de gas del mundo. Ras Laffan LNG.",               color: "#22d3ee" },
  { name: "Abqaiq, Saudi Aramco",     frp: 219.3, type: "industrial", desc: "Refinería más crítica del mundo. Atacada por Hutíes con drones en 2019.",      color: "#fbbf24" },
  { name: "Jubail, Arabia Saudí",     frp: 205.3, type: "industrial", desc: "Mayor terminal de exportación de petróleo del planeta.",                        color: "#4ade80" },
  { name: "Kirkuk, Iraq",             frp: 189.5, type: "conflict",   desc: "Campos petrolíferos en zona de conflicto activo. Gas flaring + actividad militar.",  color: "#ef4444" },
  { name: "South Pars, Irán",         frp: 138.7, type: "industrial", desc: "Mayor campo de gas del mundo (lado iraní). Plataformas en el Golfo Pérsico.", color: "#ec4899" },
  { name: "Basra–Abadan, Iraq–Irán",  frp: 144.9, type: "industrial", desc: "Mayor concentración de detecciones (2,040 hotspots). Frontera Iraq-Irán.",    color: "#eab308" },
  { name: "Baiji/Tikrit, Iraq",       frp: 138.9, type: "conflict",   desc: "Ex-ISIS. Refinería más grande de Iraq. Actividad militar frecuente.",          color: "#f97316" },
  { name: "★ Bandar Abbas — Estrecho de Ormuz", frp: 34.0, type: "military", desc: "Puerto naval iraní a la entrada del Estrecho. 20% del petróleo mundial transita aquí.", color: "#a855f7" },
  { name: "Isfahán, Irán",            frp: 134.7, type: "conflict",   desc: "Sede de instalaciones nucleares y la mayor refinería de Irán.",               color: "#c084fc" },
];

const TYPE_BADGE: Record<string, string> = {
  industrial: "text-blue-400 border-blue-800/50 bg-blue-950/30",
  conflict:   "text-orange-400 border-orange-800/50 bg-orange-950/30",
  military:   "text-purple-400 border-purple-800/50 bg-purple-950/30",
};
const TYPE_LABEL: Record<string, string> = {
  industrial: "Industrial",
  conflict:   "Conflicto",
  military:   "⚠️ Militar",
};

export function FirmsSection() {
  const maxFrp = Math.max(...FIRMS_POINTS.map((p) => p.frp));
  return (
    <section className="py-28 px-6 bg-[#070d1a]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="04" label="NASA FIRMS — El mapa del conflicto" />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-5 leading-none">
            El Estrecho<br />
            <span className="text-slate-600">de Ormuz.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-6 leading-relaxed">
            El satélite VIIRS de la NASA detectó{" "}
            <strong className="text-white">6,812 anomalías térmicas</strong> sobre Oriente Medio
            durante el 26–30 de mayo de 2026. Mediante clustering espacial DBSCAN identificamos
            227 zonas calientes, clasificadas por intensidad y tipo de actividad.
          </p>
          <p className="text-slate-500 text-base max-w-2xl mb-16 leading-relaxed">
            El hallazgo más relevante: <strong className="text-purple-400">Bandar Abbas</strong>,
            el principal puerto naval iraní a la entrada del Estrecho de Ormuz, registra
            actividad térmica activa. Por ese canal de 39 km de ancho transita el 20% del
            petróleo mundial.
          </p>
        </FadeIn>

        <div className="space-y-3 mb-12">
          {FIRMS_POINTS.map((p, i) => (
            <FadeIn key={p.name} delay={i * 60}>
              <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-[#040710] px-5 py-4 hover:border-slate-700 transition-colors">
                {/* FRP bar */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold text-sm ${p.type === "military" ? "text-purple-300" : "text-white"}`}>
                      {p.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${TYPE_BADGE[p.type]}`}>
                        {TYPE_LABEL[p.type]}
                      </span>
                      <span className="text-lg font-black font-mono" style={{ color: p.color }}>
                        {p.frp.toFixed(0)} MW
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full"
                      style={{ width: `${(p.frp / maxFrp) * 100}%`, backgroundColor: p.color, opacity: 0.7 }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-2">{p.desc}</p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={700}>
          <div className="rounded-2xl border border-purple-800/40 bg-purple-950/15 p-8">
            <div className="text-[10px] font-mono text-purple-400 tracking-widest mb-3">▸ HALLAZGO CLAVE — FIRMS</div>
            <p className="text-lg text-purple-100 leading-relaxed max-w-3xl">
              <span className="font-bold">Bandar Abbas concentra el riesgo geopolítico más alto</span> de
              la región. Un bloqueo iraní del Estrecho de Ormuz provocaría una crisis energética
              global inmediata: el precio del petróleo se dispararía y economías de Asia, Europa
              y América quedarían afectadas en cuestión de días.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 06. LA IA — qué aprendió la máquina
// ─────────────────────────────────────────────────────────────────────────────

const MODELS = [
  {
    name: "KNN",
    f1: 0.7513, std: 0.031,
    winner: true,
    color: "#3b82f6",
    reason: "Captura similitud temporal entre días de conflicto sin asumir linealidad",
  },
  {
    name: "Logistic Regression",
    f1: 0.6240, std: 0.028,
    winner: false,
    color: "#8b5cf6",
    reason: "Segunda opción. Interpretable y estable, pero asume relaciones lineales",
  },
  {
    name: "Ridge Classifier",
    f1: 0.4666, std: 0.062,
    winner: false,
    color: "#64748b",
    reason: "Alta varianza entre folds. Inestable en clases minoritarias",
  },
  {
    name: "Naive Bayes",
    f1: 0.4519, std: 0.058,
    winner: false,
    color: "#64748b",
    reason: "El supuesto de independencia entre features penaliza con señales correlacionadas",
  },
];

export function MLSection() {
  return (
    <section className="py-28 px-6 bg-[#040710]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="05" label="La Inteligencia Artificial" />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-5 leading-none">
            ¿Puede la IA<br />
            <span className="text-slate-600">predecir la guerra?</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-5 leading-relaxed">
            Entrenamos 4 algoritmos sobre{" "}
            <strong className="text-white">183 ventanas país-día</strong>, usando validación cruzada
            estratificada de 5 folds. El objetivo: clasificar cada día de cada país como{" "}
            <span className="text-green-400 font-mono font-bold">BAJO</span>,{" "}
            <span className="text-amber-400 font-mono font-bold">MEDIO</span> o{" "}
            <span className="text-red-400 font-mono font-bold">ALTO</span> nivel de escalada.
          </p>
          <p className="text-slate-500 text-base max-w-2xl mb-16 leading-relaxed">
            Métrica principal: <strong className="text-slate-300">F1 ponderado</strong> — equilibra
            precisión y recall en un problema con clases desbalanceadas.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
          {/* Model bars */}
          <div className="lg:col-span-3 space-y-4">
            {MODELS.map((m, i) => (
              <FadeIn key={m.name} delay={i * 110}>
                <div
                  className={`rounded-2xl border p-6 ${
                    m.winner
                      ? "border-blue-700/50 bg-blue-950/20"
                      : "border-slate-800 bg-[#070d1a]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {m.winner && (
                        <span className="text-[10px] font-mono px-2 py-1 rounded-full bg-blue-600 text-white font-bold">
                          GANADOR
                        </span>
                      )}
                      <span className={`font-bold ${m.winner ? "text-blue-200 text-lg" : "text-slate-300"}`}>
                        {m.name}
                      </span>
                    </div>
                    <span
                      className="text-3xl font-black font-mono"
                      style={{ color: m.winner ? "#60a5fa" : "#475569" }}
                    >
                      {(m.f1 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${m.f1 * 100}%`, backgroundColor: m.color, opacity: m.winner ? 0.9 : 0.4 }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">{m.reason}</span>
                    <span className="text-xs font-mono text-slate-700 ml-4 whitespace-nowrap">
                      ±{(m.std * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          {/* KNN explanation card */}
          <FadeIn delay={400} className="lg:col-span-2">
            <div className="rounded-2xl border border-blue-800/40 bg-blue-950/15 p-7 sticky top-24">
              <div className="text-[10px] font-mono text-blue-400 tracking-widest mb-4">▸ POR QUÉ KNN GANA</div>
              <h3 className="text-2xl font-black text-blue-200 mb-6">K-Nearest Neighbors</h3>
              <div className="space-y-5">
                {[
                  {
                    title: "Similitud temporal",
                    body: "Los días de alta escalada se parecen entre sí en el espacio de features. KNN los agrupa de forma natural sin asumir estructura.",
                  },
                  {
                    title: "No linealidad",
                    body: "Las relaciones entre Goldstein, vuelos y hotspots no son lineales. KNN las captura sin restricciones.",
                  },
                  {
                    title: "+30 puntos sobre Naive Bayes",
                    body: "En clasificación de conflictos geopolíticos, 30pp de F1 es una diferencia operativamente decisiva.",
                  },
                ].map((it, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-0.5 rounded-full bg-blue-600 flex-shrink-0 mt-1" />
                    <div>
                      <div className="text-sm font-bold text-white mb-1">{it.title}</div>
                      <div className="text-sm text-slate-400 leading-relaxed">{it.body}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-7 pt-5 border-t border-blue-900/40">
                <div className="text-xs font-mono text-slate-600 mb-1">Feature más predictiva</div>
                <div className="text-xl font-black font-mono text-blue-300">avg_goldstein</div>
                <div className="text-sm text-slate-500">Tono Goldstein promedio · GDELT</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 07. EL PULSO — estado actual en vivo
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRY_META: Record<string, { name: string; flag: string; color: string; border: string; bg: string }> = {
  IRN: { name: "Irán",          flag: "🇮🇷", color: "#ef4444", border: "border-red-800/50",   bg: "bg-red-950/15"   },
  ISR: { name: "Israel",        flag: "🇮🇱", color: "#3b82f6", border: "border-blue-800/50",  bg: "bg-blue-950/15"  },
  USA: { name: "Estados Unidos",flag: "🇺🇸", color: "#22c55e", border: "border-green-800/50", bg: "bg-green-950/15" },
};

const LEVEL_INFO: Record<number, { label: string; color: string; dotColor: string; bg: string; border: string }> = {
  0: { label: "BAJO",  color: "text-green-400", dotColor: "#4ade80", bg: "bg-green-950/40", border: "border-green-700/40" },
  1: { label: "MEDIO", color: "text-amber-400", dotColor: "#fbbf24", bg: "bg-amber-950/40", border: "border-amber-700/40" },
  2: { label: "ALTO",  color: "text-red-400",   dotColor: "#f87171", bg: "bg-red-950/40",   border: "border-red-700/40"   },
};

export function LiveSection({ latest, recentEvents }: LiveProps) {
  return (
    <section className="py-28 px-6 bg-[#070d1a]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="06" label="El Pulso Actual" />
          <div className="flex flex-wrap items-start gap-4 mb-5">
            <h2 className="text-5xl md:text-6xl font-black text-white leading-none">
              Estado del<br />
              <span className="text-slate-600">conflicto hoy.</span>
            </h2>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-950/40 border border-red-900/50 mt-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-mono text-red-400">EN VIVO</span>
            </div>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mb-16 leading-relaxed">
            Predicción del modelo KNN sobre los últimos datos disponibles de GDELT, NASA FIRMS
            y OpenSky. Actualizado con cada ejecución del pipeline.
          </p>
        </FadeIn>

        {/* Country cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {(["IRN", "ISR", "USA"] as const).map((code, i) => {
            const meta = COUNTRY_META[code];
            const state = latest[code];
            const lvl = (state?.escalation_level ?? 0) as 0 | 1 | 2;
            const info = LEVEL_INFO[lvl];
            return (
              <FadeIn key={code} delay={i * 140}>
                <div className={`rounded-2xl border ${meta.border} ${meta.bg} p-8 h-full`}>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl">{meta.flag}</span>
                    <span className="text-xs font-mono text-slate-600">{code}</span>
                  </div>
                  <div className="text-xl font-bold text-white mb-1">{meta.name}</div>
                  <div className="text-xs font-mono text-slate-600 mb-8">
                    Último dato: {state?.date ?? "—"}
                  </div>
                  <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-bold font-mono ${info.bg} ${info.border} ${info.color}`}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: info.dotColor }} />
                    Nivel {lvl} — {info.label}
                  </div>
                  {state && (
                    <div className="mt-6 space-y-2 text-xs font-mono text-slate-600">
                      <div className="flex justify-between">
                        <span>Eventos GDELT</span>
                        <span className="text-slate-400">{state.n_conflict_events?.toLocaleString("es-CO") ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Goldstein promedio</span>
                        <span className="text-slate-400">{state.avg_goldstein?.toFixed(2) ?? "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Menciones en medios</span>
                        <span className="text-slate-400">{state.n_gdelt_mentions?.toLocaleString("es-CO") ?? "—"}</span>
                      </div>
                    </div>
                  )}
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Recent events */}
        {recentEvents.length > 0 && (
          <FadeIn>
            <div className="rounded-2xl border border-slate-800 bg-[#040710] overflow-hidden">
              <div className="px-7 py-5 border-b border-slate-800 flex items-center justify-between">
                <div className="font-bold text-white">Últimos eventos registrados</div>
                <div className="text-xs font-mono text-slate-600">raw_events · Supabase</div>
              </div>
              <div className="divide-y divide-slate-800/40">
                {recentEvents.slice(0, 7).map((ev, i) => (
                  <div key={i} className="px-7 py-3 flex items-center gap-4">
                    <div className="text-xs font-mono text-slate-600 w-24 flex-shrink-0">
                      {ev.timestamp?.slice(0, 10)}
                    </div>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 flex-shrink-0">
                      {ev.source}
                    </span>
                    {ev.country && (
                      <span className="text-xs font-mono text-slate-500">{ev.country}</span>
                    )}
                    {ev.text && (
                      <span className="text-xs text-slate-600 truncate">{ev.text.slice(0, 80)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 08. CONCLUSIONES
// ─────────────────────────────────────────────────────────────────────────────

const FINDINGS = [
  {
    num: "01",
    title: "El tono mediático predice la guerra",
    body: "La escala Goldstein de GDELT resultó ser la variable más predictiva del nivel de escalada. Los medios globales capturan la tensión antes de que se materialice en eventos físicos. Goldstein por debajo de −5 es señal de escalada inminente.",
    color: "#3b82f6",
  },
  {
    num: "02",
    title: "El Estrecho de Ormuz es el nodo crítico",
    body: "El análisis FIRMS identificó a Bandar Abbas como el punto de inflexión geopolítico más relevante. Un bloqueo del Estrecho de Ormuz por parte de Irán desencadenaría una crisis energética global en 72 horas: el 20% del petróleo y el 30% del GNL mundiales quedarían interrumpidos.",
    color: "#ef4444",
  },
  {
    num: "03",
    title: "KNN supera todos los modelos de referencia",
    body: "Con F1=0.75 en validación cruzada de 5 folds, KNN supera en 30 puntos porcentuales a Naive Bayes (0.45). La similitud temporal entre días de conflicto —días parecidos se producen en rachas— explica la ventaja de KNN sobre modelos que asumen independencia.",
    color: "#22c55e",
  },
  {
    num: "04",
    title: "2026 registra la escalada más alta del histórico",
    body: "Marzo–Abril 2026 es el período más conflictivo en el horizonte monitoreado (Oct 2023 – May 2026). Los tres países alcanzaron nivel ALTO simultáneamente durante 11 días consecutivos. El sistema detectó y clasificó este pico de forma autónoma.",
    color: "#f59e0b",
  },
  {
    num: "05",
    title: "Las fuentes abiertas son suficientes",
    body: "Con datos 100% gratuitos —GDELT, NASA FIRMS, OpenSky, RSS, Bluesky y AISStream— el sistema clasifica la escalada con F1=0.75. Esto valida la hipótesis central: el OSINT de fuentes abiertas es suficiente para monitorear conflictos de alta visibilidad mediática.",
    color: "#8b5cf6",
  },
];

export function FindingsSection() {
  return (
    <section className="py-28 px-6 bg-[#040710]">
      <div className="max-w-6xl mx-auto">
        <FadeIn>
          <SectionLabel num="07" label="Conclusiones" />
          <h2 className="text-5xl md:text-6xl font-black text-white mb-5 leading-none">
            Lo que<br />
            <span className="text-slate-600">encontramos.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mb-16 leading-relaxed">
            Cinco hallazgos a partir de 557,184 eventos crudos, 183 ventanas país-día
            y 4 modelos de clasificación entrenados sobre fuentes abiertas.
          </p>
        </FadeIn>

        <div className="space-y-4 mb-20">
          {FINDINGS.map((f, i) => (
            <FadeIn key={f.num} delay={i * 90}>
              <div className="group rounded-2xl border border-slate-800 bg-[#070d1a] p-8 hover:border-slate-700 transition-colors">
                <div className="flex items-start gap-6">
                  <div
                    className="text-5xl font-black font-mono flex-shrink-0 leading-none"
                    style={{ color: f.color, opacity: 0.3 }}
                  >
                    {f.num}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{f.body}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Cierre */}
        <FadeIn delay={600}>
          <div className="text-center py-16 border-t border-slate-800">
            <div className="w-12 h-[2px] bg-red-600 mx-auto mb-10" />
            <blockquote className="text-2xl md:text-3xl font-black text-white max-w-3xl mx-auto leading-tight mb-4">
              &ldquo;Los datos abiertos no reemplazan a la inteligencia humana.{" "}
              <span className="text-slate-600">
                Pero sí pueden señalar cuándo debemos prestar atención.&rdquo;
              </span>
            </blockquote>
            <div className="text-xs font-mono text-slate-700 tracking-widest mt-8">
              UNIVERSIDAD EXTERNADO DE COLOMBIA · ML1-2026I · MAYO 2026
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
