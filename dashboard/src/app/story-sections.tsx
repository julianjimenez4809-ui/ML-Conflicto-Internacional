"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import { EscalationTimeline, DistributionChart } from "./charts";
import type { TimelinePoint, DistPoint } from "./charts";

// ── Types ──────────────────────────────────────────────────────────────────────

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

export type LiveProps    = { latest: Record<string, LatestCountry>; recentEvents: RecentEvent[] };
export type DataProps    = { timeline: TimelinePoint[]; distribution: DistPoint[] };

// ── Scroll reveal ──────────────────────────────────────────────────────────────

export function FadeUp({
  children, delay = 0, className = "",
}: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.08 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{
        transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(30px)",
      }}>{children}</div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────────

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);   // hero is dark

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      // Detect which section background we're over (rough heuristic by scroll pct)
      const sectionsDark = [true, false, false, true, false, true, false, true, false, true];
      const totalH = document.body.scrollHeight - window.innerHeight;
      const idx = Math.floor((y / totalH) * sectionsDark.length);
      setDark(sectionsDark[Math.min(idx, sectionsDark.length - 1)]);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const textColor = dark ? "text-white/80" : "text-[#1d1d1f]/80";
  const hoverColor = dark ? "hover:text-white" : "hover:text-[#1d1d1f]";
  const logoColor  = dark ? "text-white" : "text-[#1d1d1f]";
  const navBg = scrolled
    ? dark
      ? "bg-[#1d1d1f]/80 backdrop-blur-xl border-b border-white/10"
      : "bg-white/80 backdrop-blur-xl border-b border-black/10"
    : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="max-w-screen-xl mx-auto px-6 h-12 flex items-center justify-between">
        <span className={`text-sm font-semibold tracking-tight ${logoColor} transition-colors duration-300`}>
          OSINT · ML1
        </span>
        <div className="hidden md:flex items-center gap-8">
          {[["#conflicto","El conflicto"],["#datos","Los datos"],["#ia","La IA"],["#hoy","Hoy"]].map(([href,label]) => (
            <a key={href} href={href}
              className={`text-[13px] font-medium transition-colors duration-300 ${textColor} ${hoverColor}`}>
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className={`text-[11px] font-mono font-medium transition-colors duration-300 ${textColor}`}>EN VIVO</span>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO — dark, full viewport, massive type
// ─────────────────────────────────────────────────────────────────────────────

export function HeroSection() {
  const [t, setT] = useState(true);
  useEffect(() => { const i = setInterval(() => setT(p => !p), 700); return () => clearInterval(i); }, []);

  return (
    <section className="relative min-h-screen bg-[#1d1d1f] flex flex-col justify-center items-center overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,59,48,0.08) 0%, transparent 70%)" }} />

      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-12">
        {/* Eyebrow */}
        <FadeUp>
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-white/60 tracking-widest uppercase">
              Monitoreo activo · Mayo 2026
            </span>
          </div>
        </FadeUp>

        {/* Main title */}
        <FadeUp delay={100}>
          <h1
            className="font-black text-white leading-[0.9] tracking-tight mb-6"
            style={{ fontSize: "clamp(4rem, 13vw, 10rem)" }}
          >
            Irán.<br />Israel.<br />
            <span className="text-white/30">EE.UU.</span>
          </h1>
        </FadeUp>

        <FadeUp delay={220}>
          <p className="text-xl md:text-2xl text-white/50 font-medium max-w-2xl mx-auto leading-relaxed mb-16">
            El conflicto más tenso del siglo XXI,<br />
            monitoreado con inteligencia artificial y fuentes abiertas.
          </p>
        </FadeUp>

        {/* Stats row */}
        <FadeUp delay={360}>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-20">
            {[
              { n: "557K", l: "eventos crudos" },
              { n: "6",    l: "fuentes OSINT"  },
              { n: "183",  l: "días analizados" },
              { n: "75%",  l: "F1 del modelo"   },
            ].map(({ n, l }) => (
              <div key={l} className="text-center">
                <div className="text-4xl font-black text-white font-mono">{n}</div>
                <div className="text-xs text-white/30 font-medium mt-1 tracking-wide">{l}</div>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Scroll */}
        <FadeUp delay={500}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[11px] text-white/20 font-medium tracking-widest uppercase">Descubrir</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent"
              style={{ animation: "scroll-hint 2s ease-in-out infinite" }} />
          </div>
        </FadeUp>
      </div>

      {/* Corner tag */}
      <div className="absolute bottom-6 right-8 text-[10px] font-mono text-white/15 tracking-widest">
        {t ? "█" : " "} SYSTEM · ONLINE
      </div>
      <div className="absolute bottom-6 left-8 text-[10px] font-mono text-white/15 tracking-widest">
        EXTERNADO · ML1-2026I
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EL CONFLICTO — white, actors + timeline
// ─────────────────────────────────────────────────────────────────────────────

const WAR_EVENTS = [
  { date: "7 oct 2023",    title: "El ataque que lo cambió todo",            body: "Hamás ataca Israel: 1,200 muertos, 250 secuestrados. Israel declara guerra. Comienza la operación terrestre sobre Gaza.", hot: true },
  { date: "oct – dic 2023",title: "Escalada regional",                       body: "Hezbollah abre el frente norte. Hutíes bloquean el Mar Rojo. EE.UU. despliega dos portaaviones en el Mediterráneo.", hot: false },
  { date: "1 abr 2024",    title: "Israel ataca el consulado iraní en Damasco", body: "Siete oficiales de la Guardia Revolucionaria Islámica muertos. Primer ataque directo israelí a una instalación iraní.", hot: true },
  { date: "13 abr 2024",   title: "Irán rompe la línea roja",                body: "330 drones y misiles sobre Israel. Primera vez en la historia que Irán ataca directamente. El 99% es interceptado.", hot: true },
  { date: "19 abr 2024",   title: "Contraataque israelí cerca de Isfahan",   body: "Israel demuestra capacidad de penetración sobre suelo iraní, incluyendo la zona de instalaciones nucleares.", hot: false },
  { date: "1 oct 2024",    title: "200 misiles balísticos",                  body: "Mayor ataque de misiles a Israel en la historia. Irán responde al asesinato de líderes de Hezbollah y Hamás.", hot: true },
  { date: "26 oct 2024",   title: "Israel destruye defensas aéreas de Irán", body: "Ataque coordinado en múltiples provincias. Irán queda parcialmente expuesto. Amenaza de represalia total.", hot: true },
  { date: "feb – mar 2025",title: "Escalada diplomática",                    body: "EE.UU. refuerza sanciones. Negociaciones de alto al fuego colapsan. GDELT registra primer pico de conflictividad.", hot: false },
  { date: "ene – mar 2026",title: "Tensión en el Estrecho de Ormuz",         body: "Irán despliega buques militares en el Golfo. EE.UU. refuerza presencia naval. El 20% del petróleo mundial en jaque.", hot: false },
  { date: "mar – abr 2026",title: "Pico máximo — los tres países en ALTO",   body: "Los tres países alcanzan nivel ALTO simultáneamente por primera vez. Nuestro modelo lo detecta en tiempo real.", hot: true },
];

export function ConflictSection() {
  return (
    <section id="conflicto" className="bg-white py-40 px-6">
      <div className="max-w-screen-xl mx-auto">

        {/* Header */}
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">01 — El Escenario</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Tres actores.<br />Una región.<br />
            <span className="text-[#6e6e73]">Una crisis.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Desde el 7 de octubre de 2023, Oriente Medio vive la escalada más peligrosa de su historia reciente.
            El 20% del petróleo mundial y el 30% del GNL global transitan por una zona en alerta permanente.
          </p>
        </FadeUp>

        {/* Actor cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#d2d2d7] mb-32 rounded-2xl overflow-hidden">
          {[
            { code: "IRN", flag: "🇮🇷", name: "Irán", color: "#ff3b30",
              desc: "Potencia regional con red de proxies activos. Programa nuclear en punto crítico. Control estratégico del Estrecho de Ormuz.",
              stat: "1er productor de petróleo OPEP" },
            { code: "ISR", flag: "🇮🇱", name: "Israel", color: "#0071e3",
              desc: "Guerra activa en Gaza y Líbano. Capacidad de ataque de largo alcance sobre suelo iraní. Única potencia nuclear no declarada de la región.",
              stat: "Operación terrestre en curso" },
            { code: "USA", flag: "🇺🇸", name: "Estados Unidos", color: "#34c759",
              desc: "Garante de la seguridad israelí. Dos grupos de portaaviones en el Mediterráneo. Arquitecto de las sanciones sobre Irán.",
              stat: "V Flota Naval en el Golfo Pérsico" },
          ].map((a) => (
            <div key={a.code} className="bg-white p-10 flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{a.flag}</span>
                <div>
                  <div className="text-xs font-mono text-[#6e6e73]">{a.code}</div>
                  <div className="text-xl font-bold text-[#1d1d1f]">{a.name}</div>
                </div>
                <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: a.color }} />
              </div>
              <p className="text-[15px] text-[#6e6e73] leading-relaxed flex-1">{a.desc}</p>
              <div className="text-xs font-medium text-[#6e6e73] border-t border-[#d2d2d7] pt-4">{a.stat}</div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <FadeUp>
          <h3 className="text-3xl font-bold text-[#1d1d1f] mb-16">Cronología del conflicto.</h3>
        </FadeUp>

        <div className="space-y-0">
          {WAR_EVENTS.map((ev, i) => (
            <FadeUp key={i} delay={i * 40}>
              <div className="flex gap-10 py-7 border-t border-[#d2d2d7] group">
                <div className="w-36 flex-shrink-0">
                  <span className={`text-sm font-mono font-medium ${ev.hot ? "text-[#ff3b30]" : "text-[#6e6e73]"}`}>
                    {ev.date}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-lg font-semibold text-[#1d1d1f] mb-1">{ev.title}</div>
                  <div className="text-[15px] text-[#6e6e73] leading-relaxed max-w-2xl">{ev.body}</div>
                </div>
                {ev.hot && <div className="w-2 h-2 rounded-full bg-[#ff3b30] mt-2 flex-shrink-0" />}
              </div>
            </FadeUp>
          ))}
          <div className="border-t border-[#d2d2d7]" />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS DATOS — dark, charts
// ─────────────────────────────────────────────────────────────────────────────

export function DataSection({ timeline, distribution }: DataProps) {
  return (
    <section id="datos" className="bg-[#1d1d1f] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-white/30 tracking-widest uppercase mb-6">02 — Los Datos</p>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            ¿Qué dicen<br />
            <span className="text-white/25">los datos?</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-6">
            La <span className="text-white/70 font-medium">escala Goldstein</span> de GDELT mide el tono de la cobertura mediática
            global: valores negativos indican conflicto, positivos cooperación.
            Es la variable más predictiva del modelo de IA.
          </p>
          <p className="text-base text-white/30 max-w-2xl leading-relaxed mb-20">
            El nivel de escalada se construye por cuartiles de Goldstein por país.
            Los días en el cuartil inferior se clasifican como{" "}
            <span className="text-[#ff3b30] font-mono font-semibold">ALTO</span>,
            los del superior como{" "}
            <span className="text-[#34c759] font-mono font-semibold">BAJO</span>.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <FadeUp>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">GDELT · KNN · OCT 2023 – MAY 2026</div>
              <h3 className="text-xl font-bold text-white mb-1">Nivel de escalada en el tiempo</h3>
              <p className="text-sm text-white/35 mb-7">Clasificación KNN por país-día</p>
              <EscalationTimeline data={timeline} />
            </div>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">DISTRIBUCIÓN DE CLASES</div>
              <h3 className="text-xl font-bold text-white mb-1">Días por nivel de escalada</h3>
              <p className="text-sm text-white/35 mb-7">Por país · Oct 2023 – May 2026</p>
              <DistributionChart data={distribution} />
            </div>
          </FadeUp>
        </div>

        <FadeUp delay={200}>
          <div className="rounded-2xl border border-[#ff9f0a]/20 bg-[#ff9f0a]/5 p-10">
            <p className="text-sm font-semibold text-[#ff9f0a] tracking-widest uppercase mb-4">Hallazgo</p>
            <p className="text-xl md:text-2xl font-medium text-white leading-relaxed max-w-3xl">
              Marzo–Abril 2026 es el período de máxima escalada en el histórico completo.
              Los tres países alcanzaron nivel{" "}
              <span className="text-[#ff3b30] font-bold">ALTO</span> simultáneamente durante
              11 días consecutivos — hecho sin precedentes desde octubre de 2023.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CÓMO LO MONITOREAMOS — light, sources
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES = [
  { id: "GDELT",      icon: "📡", name: "GDELT Project",      stat: "120",    unit: "agregados",      color: "#0071e3", desc: "Base de datos global de eventos mediáticos. Tono y volumen de cobertura en tiempo real desde 1979." },
  { id: "NASA FIRMS", icon: "🛰️", name: "NASA FIRMS",         stat: "6,812",  unit: "hotspots",       color: "#ff3b30", desc: "Detección de anomalías térmicas satelitales. Proxy de explosiones, incendios e infraestructura militar." },
  { id: "OpenSky",    icon: "✈️", name: "OpenSky Network",    stat: "493K",   unit: "trazas",         color: "#af52de", desc: "Rastreo de vuelos sobre Oriente Medio. Los cierres de espacio aéreo son señal de escalada." },
  { id: "RSS",        icon: "📰", name: "RSS Feeds",          stat: "141",    unit: "artículos",      color: "#ff9f0a", desc: "BBC · Al Jazeera · Google News · Tehran Times · MEE. Cinco perspectivas editoriales contrastadas." },
  { id: "Bluesky",    icon: "🦋", name: "Bluesky Social",     stat: "61",     unit: "posts",          color: "#30d158", desc: "Red social descentralizada. Volumen de publicaciones como barómetro de atención pública global." },
  { id: "AISStream",  icon: "🚢", name: "AISStream · AIS",   stat: "138",    unit: "posiciones",     color: "#5ac8fa", desc: "Posiciones de embarcaciones en tiempo real. Tráfico naval en el Golfo Pérsico y el Estrecho de Ormuz." },
];

export function SourcesSection() {
  return (
    <section className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">03 — Las fuentes</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Cómo lo<br />
            <span className="text-[#6e6e73]">monitoreamos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Seis fuentes de datos abiertas y gratuitas integradas en un pipeline automatizado.
            Cada una aporta una dimensión diferente del conflicto.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#d2d2d7] rounded-2xl overflow-hidden">
          {SOURCES.map((s, i) => (
            <FadeUp key={s.id} delay={i * 60}>
              <div className="bg-[#f5f5f7] p-10 flex flex-col gap-4 h-full">
                <span className="text-4xl">{s.icon}</span>
                <div>
                  <div className="text-[10px] font-mono font-semibold tracking-widest mb-0.5" style={{ color: s.color }}>{s.id}</div>
                  <div className="text-lg font-bold text-[#1d1d1f]">{s.name}</div>
                </div>
                <p className="text-[14px] text-[#6e6e73] leading-relaxed flex-1">{s.desc}</p>
                <div className="border-t border-[#d2d2d7] pt-4">
                  <span className="text-3xl font-black font-mono text-[#1d1d1f]">{s.stat}</span>
                  <span className="text-sm text-[#6e6e73] ml-2">{s.unit}</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRMS / ESTRECHO — dark
// ─────────────────────────────────────────────────────────────────────────────

const FIRMS_ROWS = [
  { n: "331.5 MW", loc: "Abu Dhabi, UAE",                    type: "Industrial", note: "Mayor potencia radiativa del conjunto" },
  { n: "258.1 MW", loc: "North Dome / Ras Laffan, Qatar",   type: "Industrial", note: "Mayor exportador de GNL del mundo" },
  { n: "219.3 MW", loc: "Abqaiq, Saudi Aramco",             type: "Industrial", note: "Refinería crítica · atacada en 2019" },
  { n: "189.5 MW", loc: "Kirkuk, Iraq",                     type: "Conflicto",  note: "Gas flaring + actividad militar" },
  { n: "144.9 MW", loc: "Basra–Abadan (Iraq–Irán)",         type: "Industrial", note: "2,040 detecciones — mayor extensión" },
  { n: "138.7 MW", loc: "South Pars, Irán",                 type: "Industrial", note: "Mayor campo de gas del mundo" },
  { n: "138.9 MW", loc: "Baiji / Tikrit, Iraq",             type: "Conflicto",  note: "Ex-ISIS · refinería más grande de Iraq" },
  { n: "134.7 MW", loc: "Isfahán, Irán",                    type: "Conflicto",  note: "Zona de instalaciones nucleares" },
  { n:  "34.0 MW", loc: "Bandar Abbas — Estrecho de Ormuz", type: "⚠️ Militar", note: "Puerto naval iraní · entrada al Estrecho" },
];

export function FirmsSection() {
  return (
    <section className="bg-[#1d1d1f] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-white/30 tracking-widest uppercase mb-6">04 — NASA FIRMS</p>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            El Estrecho<br />
            <span className="text-white/25">de Ormuz.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 max-w-3xl">
            {[["6,812","hotspots detectados"],["39 km","ancho del Estrecho"],["20%","del petróleo mundial"]].map(([n,l]) => (
              <div key={l}>
                <div className="text-5xl font-black font-mono text-white mb-1">{n}</div>
                <div className="text-sm text-white/35">{l}</div>
              </div>
            ))}
          </div>
        </FadeUp>

        {/* Table */}
        <FadeUp delay={100}>
          <div className="space-y-0 mb-20">
            <div className="flex gap-6 pb-4 border-b border-white/10">
              <div className="w-28 text-[11px] font-mono text-white/20 uppercase tracking-widest">Potencia</div>
              <div className="flex-1 text-[11px] font-mono text-white/20 uppercase tracking-widest">Ubicación</div>
              <div className="w-24 text-[11px] font-mono text-white/20 uppercase tracking-widest hidden md:block">Tipo</div>
              <div className="flex-1 text-[11px] font-mono text-white/20 uppercase tracking-widest hidden lg:block">Nota</div>
            </div>
            {FIRMS_ROWS.map((r, i) => (
              <FadeUp key={i} delay={i * 35}>
                <div className={`flex gap-6 py-5 border-b border-white/8 ${r.type === "⚠️ Militar" ? "bg-white/3 -mx-6 px-6" : ""}`}>
                  <div className={`w-28 text-base font-bold font-mono flex-shrink-0 ${r.type === "⚠️ Militar" ? "text-[#bf5af2]" : "text-white"}`}>{r.n}</div>
                  <div className={`flex-1 text-base font-medium ${r.type === "⚠️ Militar" ? "text-[#bf5af2]" : "text-white/80"}`}>{r.loc}</div>
                  <div className={`w-24 text-sm flex-shrink-0 hidden md:block ${r.type === "Conflicto" ? "text-[#ff3b30]" : r.type === "⚠️ Militar" ? "text-[#bf5af2]" : "text-white/30"}`}>{r.type}</div>
                  <div className="flex-1 text-sm text-white/25 hidden lg:block">{r.note}</div>
                </div>
              </FadeUp>
            ))}
          </div>
        </FadeUp>

        {/* Pull quote */}
        <FadeUp delay={300}>
          <div className="border-l-2 border-[#bf5af2] pl-8 max-w-2xl">
            <p className="text-2xl md:text-3xl font-bold text-white leading-snug mb-4">
              &ldquo;Un bloqueo del Estrecho de Ormuz provocaría una crisis energética global en 72 horas.&rdquo;
            </p>
            <p className="text-sm text-white/35">
              Análisis DBSCAN sobre 6,812 hotspots · Bandar Abbas, Irán · Mayo 2026
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LA IA — white, model comparison
// ─────────────────────────────────────────────────────────────────────────────

const MODELS = [
  { name: "KNN",                  f1: 0.7513, std: 0.031, winner: true  },
  { name: "Logistic Regression",  f1: 0.6240, std: 0.028, winner: false },
  { name: "Ridge Classifier",     f1: 0.4666, std: 0.062, winner: false },
  { name: "Naive Bayes",          f1: 0.4519, std: 0.058, winner: false },
];

export function MLSection() {
  return (
    <section id="ia" className="bg-white py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
          <div>
            <FadeUp>
              <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">05 — La IA</p>
              <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 5.5rem)" }}>
                ¿Puede la IA<br />predecir<br />
                <span className="text-[#6e6e73]">la guerra?</span>
              </h2>
            </FadeUp>
            <FadeUp delay={100}>
              <p className="text-lg text-[#6e6e73] leading-relaxed mb-6">
                Entrenamos cuatro algoritmos sobre{" "}
                <span className="text-[#1d1d1f] font-semibold">183 ventanas país-día</span> usando
                validación cruzada estratificada de 5 folds.
              </p>
              <p className="text-lg text-[#6e6e73] leading-relaxed mb-12">
                El objetivo: clasificar cada día de cada país como{" "}
                <span className="font-mono font-bold text-[#34c759]">BAJO</span>,{" "}
                <span className="font-mono font-bold text-[#ff9f0a]">MEDIO</span> o{" "}
                <span className="font-mono font-bold text-[#ff3b30]">ALTO</span>.
              </p>
            </FadeUp>
            <FadeUp delay={200}>
              <div className="rounded-2xl bg-[#f5f5f7] p-8">
                <div className="text-xs font-mono text-[#6e6e73] tracking-widest mb-3">POR QUÉ KNN GANA</div>
                <div className="space-y-4">
                  {[
                    { t: "Similitud temporal",    b: "Los días de alta escalada se parecen entre sí. KNN los agrupa sin asumir estructura lineal." },
                    { t: "+30pp sobre Naive Bayes",b: "75.1% vs 45.2% de F1. En predicción de conflictos, la diferencia es operativamente decisiva." },
                    { t: "Feature clave: Goldstein",b: "El tono promedio de GDELT es la variable más predictiva del nivel de escalada del día siguiente." },
                  ].map((it, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-0.5 bg-[#0071e3] rounded-full flex-shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-bold text-[#1d1d1f] mb-0.5">{it.t}</div>
                        <div className="text-sm text-[#6e6e73] leading-relaxed">{it.b}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Model table */}
          <FadeUp delay={150}>
            <div className="pt-20">
              <div className="space-y-0">
                <div className="flex items-center justify-between pb-4 border-b border-[#d2d2d7]">
                  <span className="text-[11px] font-mono text-[#6e6e73] tracking-widest uppercase">Modelo</span>
                  <span className="text-[11px] font-mono text-[#6e6e73] tracking-widest uppercase">F1 ponderado</span>
                </div>
                {MODELS.map((m, i) => (
                  <FadeUp key={m.name} delay={200 + i * 80}>
                    <div className={`flex items-center justify-between py-7 border-b border-[#d2d2d7] ${m.winner ? "bg-[#f5f5f7] -mx-6 px-6" : ""}`}>
                      <div className="flex items-center gap-4">
                        {m.winner && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0071e3] text-white">
                            GANADOR
                          </span>
                        )}
                        <span className={`text-lg font-semibold ${m.winner ? "text-[#1d1d1f]" : "text-[#6e6e73]"}`}>
                          {m.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`text-3xl font-black font-mono ${m.winner ? "text-[#1d1d1f]" : "text-[#d2d2d7]"}`}>
                          {(m.f1 * 100).toFixed(1)}%
                        </div>
                        <div className="text-xs font-mono text-[#6e6e73]">±{(m.std * 100).toFixed(1)}%</div>
                      </div>
                    </div>
                  </FadeUp>
                ))}
              </div>
              <div className="mt-8 text-sm text-[#6e6e73]">
                CV 5-fold estratificado · Métrica: F1 ponderado
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EL PULSO — dark, live data
// ─────────────────────────────────────────────────────────────────────────────

const C_META: Record<string, { name: string; flag: string; color: string }> = {
  IRN: { name: "Irán",          flag: "🇮🇷", color: "#ff3b30" },
  ISR: { name: "Israel",        flag: "🇮🇱", color: "#0071e3" },
  USA: { name: "EE.UU.",        flag: "🇺🇸", color: "#34c759" },
};

const LVL: Record<number, { label: string; color: string }> = {
  0: { label: "BAJO",  color: "#34c759" },
  1: { label: "MEDIO", color: "#ff9f0a" },
  2: { label: "ALTO",  color: "#ff3b30" },
};

export function LiveSection({ latest, recentEvents }: LiveProps) {
  return (
    <section id="hoy" className="bg-[#1d1d1f] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <div className="flex items-center gap-3 mb-6">
            <p className="text-sm font-semibold text-white/30 tracking-widest uppercase">06 — El pulso actual</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[11px] font-mono text-red-400">EN VIVO</span>
            </div>
          </div>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Estado del<br />
            <span className="text-white/25">conflicto hoy.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-20">
            Predicción del modelo KNN sobre los últimos datos disponibles de GDELT,
            NASA FIRMS y OpenSky. Actualizado con cada ejecución del pipeline.
          </p>
        </FadeUp>

        {/* Country cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden mb-16">
          {(["IRN", "ISR", "USA"] as const).map((code, i) => {
            const meta  = C_META[code];
            const state = latest[code];
            const lvl   = (state?.escalation_level ?? 0) as 0 | 1 | 2;
            const info  = LVL[lvl];
            return (
              <FadeUp key={code} delay={i * 120}>
                <div className="bg-[#1d1d1f] p-10 flex flex-col gap-6">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{meta.flag}</span>
                    <span className="text-xs font-mono text-white/20">{code}</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white mb-1">{meta.name}</div>
                    <div className="text-xs font-mono text-white/25">{state?.date ?? "—"}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: info.color }} />
                      <span className="text-4xl font-black font-mono" style={{ color: info.color }}>{info.label}</span>
                    </div>
                    <div className="text-sm text-white/30 font-mono">Nivel {lvl} de 2</div>
                  </div>
                  {state && (
                    <div className="space-y-2.5 border-t border-white/8 pt-5">
                      {[
                        ["Eventos GDELT",    state.n_conflict_events?.toLocaleString("es-CO")],
                        ["Goldstein prom.",  state.avg_goldstein?.toFixed(2)],
                        ["Menciones",        state.n_gdelt_mentions?.toLocaleString("es-CO")],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-xs text-white/25">{k}</span>
                          <span className="text-xs font-mono text-white/50">{v ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* Recent events */}
        {recentEvents.length > 0 && (
          <FadeUp>
            <div className="rounded-2xl overflow-hidden border border-white/8">
              <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Últimos eventos registrados</span>
                <span className="text-xs font-mono text-white/20">raw_events · Supabase</span>
              </div>
              {recentEvents.slice(0, 6).map((ev, i) => (
                <div key={i} className="px-8 py-4 flex items-center gap-5 border-b border-white/5 last:border-0">
                  <span className="text-xs font-mono text-white/20 w-24 flex-shrink-0">{ev.timestamp?.slice(0,10)}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 flex-shrink-0">{ev.source}</span>
                  {ev.country && <span className="text-xs font-mono text-white/25 flex-shrink-0">{ev.country}</span>}
                  {ev.text && <span className="text-xs text-white/20 truncate hidden md:block">{ev.text.slice(0,90)}</span>}
                </div>
              ))}
            </div>
          </FadeUp>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCLUSIONES — light
// ─────────────────────────────────────────────────────────────────────────────

const FINDINGS = [
  { n: "01", title: "El tono mediático predice la guerra.",      color: "#0071e3", body: "La escala Goldstein de GDELT resulta ser la variable más predictiva del nivel de escalada. Los medios globales capturan la tensión antes de que se materialice en eventos físicos." },
  { n: "02", title: "El Estrecho de Ormuz es el nodo crítico.",  color: "#ff3b30", body: "Bandar Abbas — puerto naval iraní — concentra el riesgo geopolítico más alto de la región. Un bloqueo desencadenaría una crisis energética global en 72 horas." },
  { n: "03", title: "KNN supera a todos los modelos base.",      color: "#34c759", body: "Con F1=0.75 en CV de 5 folds, KNN supera en 30 puntos porcentuales a Naive Bayes. La similitud temporal entre días de conflicto explica su ventaja." },
  { n: "04", title: "2026 registra la escalada más alta.",       color: "#ff9f0a", body: "Marzo–Abril 2026 es el período más conflictivo del histórico monitoreado. Los tres países en nivel ALTO durante 11 días consecutivos — hecho sin precedentes." },
  { n: "05", title: "Las fuentes abiertas son suficientes.",     color: "#af52de", body: "Con datos 100% gratuitos — GDELT, FIRMS, OpenSky, RSS, Bluesky, AISStream — el sistema clasifica la escalada con F1=0.75, validando la hipótesis central del proyecto." },
];

export function FindingsSection() {
  return (
    <section className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">07 — Conclusiones</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Lo que<br />
            <span className="text-[#6e6e73]">encontramos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Cinco hallazgos a partir de 557,184 eventos crudos, 183 ventanas país-día
            y cuatro modelos de clasificación entrenados sobre fuentes abiertas.
          </p>
        </FadeUp>

        <div className="space-y-0 mb-32">
          {FINDINGS.map((f, i) => (
            <FadeUp key={f.n} delay={i * 70}>
              <div className="flex gap-8 py-10 border-t border-[#d2d2d7]">
                <div className="text-4xl font-black font-mono flex-shrink-0 leading-none" style={{ color: f.color }}>
                  {f.n}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3 leading-snug">{f.title}</h3>
                  <p className="text-lg text-[#6e6e73] leading-relaxed max-w-2xl">{f.body}</p>
                </div>
              </div>
            </FadeUp>
          ))}
          <div className="border-t border-[#d2d2d7]" />
        </div>

        {/* Closing quote */}
        <FadeUp delay={400}>
          <div className="text-center py-10">
            <blockquote className="text-3xl md:text-4xl font-black text-[#1d1d1f] leading-tight max-w-3xl mx-auto mb-4">
              &ldquo;Los datos abiertos no reemplazan a la inteligencia humana.
              <span className="text-[#6e6e73]"> Pero sí señalan cuándo debemos prestar atención.&rdquo;</span>
            </blockquote>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────

export function FooterSection() {
  return (
    <footer className="bg-[#1d1d1f] py-16 px-6">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-white font-semibold mb-1">Sistema de Inteligencia Multifuente</div>
          <div className="text-sm text-white/30">Conflicto Irán · Israel · EE.UU. — Mayo 2026</div>
        </div>
        <div className="text-sm text-white/20 text-center md:text-right">
          Universidad Externado de Colombia<br />
          Machine Learning 1 · ML1-2026I
        </div>
      </div>
    </footer>
  );
}
