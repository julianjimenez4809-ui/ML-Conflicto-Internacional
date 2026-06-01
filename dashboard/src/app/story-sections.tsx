"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import {
  EscalationTimeline, DistributionChart, SourceDonutChart,
  FRPDailyChart, GoldsteinBarChart, EscalationHeatmap,
  ModelRadarChart, ConflictIntensityChart,
} from "./charts";
import type { TimelinePoint, DistPoint } from "./charts";

// ── Types ──────────────────────────────────────────────────────────────────────

export type LatestCountry = {
  escalation_level: number; date: string;
  n_conflict_events: number; avg_goldstein: number; n_gdelt_mentions: number;
};
export type RecentEvent = { timestamp: string; source: string; country: string | null; event_type: string | null; text: string | null };
export type LiveProps  = { latest: Record<string, LatestCountry>; recentEvents: RecentEvent[] };
export type DataProps  = { timeline: TimelinePoint[]; distribution: DistPoint[] };

// ── Scroll reveal ──────────────────────────────────────────────────────────────

export function FadeUp({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.06 });
    o.observe(el); return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} className={className}
      style={{ transition: `opacity 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.9s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(28px)" }}>
      {children}
    </div>
  );
}

// ── Nav ────────────────────────────────────────────────────────────────────────

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const sections = document.querySelectorAll("section[data-bg]");
      let current = "dark";
      sections.forEach(s => {
        const rect = s.getBoundingClientRect();
        if (rect.top <= 60) current = (s as HTMLElement).dataset.bg ?? "dark";
      });
      setDark(current === "dark");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tx = dark ? "text-white/70" : "text-[#1d1d1f]/70";
  const hx = dark ? "hover:text-white" : "hover:text-[#1d1d1f]";
  const lx = dark ? "text-white" : "text-[#1d1d1f]";
  const bg = scrolled ? (dark ? "bg-[#1d1d1f]/80 backdrop-blur-xl border-b border-white/10" : "bg-white/80 backdrop-blur-xl border-b border-black/8") : "bg-transparent";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${bg}`}>
      <div className="max-w-screen-xl mx-auto px-6 h-12 flex items-center justify-between">
        <span className={`text-sm font-bold tracking-tight transition-colors duration-300 ${lx}`}>OSINT · ML1</span>
        <div className="hidden md:flex items-center gap-8">
          {[["#conflicto","El conflicto"],["#datos","Los datos"],["#ia","La IA"],["#hoy","Hoy"]].map(([h,l]) => (
            <a key={h} href={h} className={`text-[13px] font-medium transition-colors duration-300 ${tx} ${hx}`}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className={`text-[11px] font-mono font-medium transition-colors ${tx}`}>EN VIVO</span>
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO BREAK — video de fondo con overlay (src vacío = placeholder gradiente)
// ─────────────────────────────────────────────────────────────────────────────

export function VideoBreak({
  src, poster, title, subtitle, height = "65vh",
  gradient = "from-[#1d1d1f] via-[#2d1515] to-[#1d1d1f]",
}: {
  src?: string; poster?: string; title: string; subtitle?: string;
  height?: string; gradient?: string;
}) {
  return (
    <section className="relative overflow-hidden" style={{ height }}>
      {src ? (
        <video autoPlay muted loop playsInline poster={poster}
          className="absolute inset-0 w-full h-full object-cover">
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      {/* Grain texture overlay */}
      <div className="absolute inset-0 opacity-30"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize: "200px" }} />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/55" />
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        {!src && (
          <div className="mb-6 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 text-[10px] font-mono text-white/40 tracking-widest">
            VIDEO · PENDIENTE DE ARCHIVO
          </div>
        )}
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight"
          style={{ textShadow: "0 2px 40px rgba(0,0,0,0.8)" }}>
          {title}
        </h2>
        {subtitle && <p className="text-lg text-white/50 max-w-xl">{subtitle}</p>}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────────────────────

export function HeroSection() {
  const [t, setT] = useState(true);
  useEffect(() => { const i = setInterval(() => setT(p => !p), 700); return () => clearInterval(i); }, []);
  return (
    <section data-bg="dark" className="relative min-h-screen bg-[#1d1d1f] flex flex-col justify-center items-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,59,48,0.07) 0%, transparent 70%)" }} />
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-12">
        <FadeUp>
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-medium text-white/50 tracking-widest uppercase">Monitoreo activo · Mayo 2026</span>
          </div>
        </FadeUp>
        <FadeUp delay={100}>
          <h1 className="font-black text-white leading-[0.88] tracking-tight mb-6"
            style={{ fontSize: "clamp(4rem, 14vw, 11rem)" }}>
            Irán.<br />Israel.<br /><span className="text-white/25">EE.UU.</span>
          </h1>
        </FadeUp>
        <FadeUp delay={220}>
          <p className="text-xl md:text-2xl text-white/45 font-medium max-w-2xl mx-auto leading-relaxed mb-16">
            El conflicto más tenso del siglo XXI,<br />monitoreado con inteligencia artificial y fuentes abiertas.
          </p>
        </FadeUp>
        <FadeUp delay={360}>
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-6 mb-20">
            {[["557K","eventos crudos"],["6","fuentes OSINT"],["183","días analizados"],["75%","F1 del modelo"]].map(([n, l]) => (
              <div key={l} className="text-center">
                <div className="text-4xl font-black text-white font-mono">{n}</div>
                <div className="text-xs text-white/25 font-medium mt-1 tracking-wide">{l}</div>
              </div>
            ))}
          </div>
        </FadeUp>
        <FadeUp delay={480}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] text-white/18 font-medium tracking-widest uppercase">Descubrir</span>
            <div className="w-px h-10 bg-gradient-to-b from-white/18 to-transparent"
              style={{ animation: "scroll-hint 2s ease-in-out infinite" }} />
          </div>
        </FadeUp>
      </div>
      <div className="absolute bottom-6 right-8 text-[10px] font-mono text-white/12 tracking-widest">{t ? "█" : " "} SYSTEM · ONLINE</div>
      <div className="absolute bottom-6 left-8 text-[10px] font-mono text-white/12 tracking-widest">EXTERNADO · ML1-2026I</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EL CONFLICTO
// ─────────────────────────────────────────────────────────────────────────────

const WAR_EVENTS = [
  { date: "7 oct 2023",    title: "El ataque que lo cambió todo",            body: "Hamás ataca Israel: 1,200 muertos, 250 secuestrados. Israel declara estado de guerra. Comienza la operación terrestre sobre Gaza.", hot: true },
  { date: "oct – dic 2023",title: "Escalada regional",                       body: "Hezbollah abre el frente norte. Hutíes bloquean el Mar Rojo. EE.UU. despliega dos portaaviones en el Mediterráneo.", hot: false },
  { date: "1 abr 2024",    title: "Israel ataca el consulado iraní en Damasco", body: "7 oficiales de la Guardia Revolucionaria Islámica muertos. Primer ataque directo israelí a una instalación iraní.", hot: true },
  { date: "13 abr 2024",   title: "Irán rompe la línea roja",                body: "330 drones y misiles sobre Israel. Primera vez en la historia que Irán ataca directamente. El 99% es interceptado.", hot: true },
  { date: "19 abr 2024",   title: "Contraataque israelí cerca de Isfahan",   body: "Israel demuestra capacidad de penetración sobre suelo iraní, incluyendo la zona de instalaciones nucleares.", hot: false },
  { date: "1 oct 2024",    title: "200 misiles balísticos",                  body: "Mayor ataque de misiles a Israel en la historia. Irán responde al asesinato de líderes de Hezbollah y Hamás.", hot: true },
  { date: "26 oct 2024",   title: "Israel destruye defensas aéreas de Irán", body: "Ataque coordinado en múltiples provincias. Irán queda parcialmente expuesto. Amenaza de represalia total.", hot: true },
  { date: "feb – mar 2025",title: "Escalada diplomática",                    body: "EE.UU. refuerza sanciones. Negociaciones de alto al fuego colapsan. GDELT registra primer pico de conflictividad.", hot: false },
  { date: "ene – mar 2026",title: "Tensión en el Estrecho de Ormuz",         body: "Irán despliega buques en el Golfo. EE.UU. refuerza presencia naval. El 20% del petróleo mundial en jaque.", hot: false },
  { date: "mar – abr 2026",title: "Pico máximo — tres países en ALTO",       body: "Los tres países alcanzan nivel ALTO simultáneamente. Nuestro modelo lo detecta en tiempo real.", hot: true },
];

export function ConflictSection() {
  return (
    <section id="conflicto" data-bg="light" className="bg-white py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">01 — El Escenario</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Tres actores.<br /><span className="text-[#6e6e73]">Una crisis.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Desde el 7 de octubre de 2023, Oriente Medio vive la escalada más peligrosa de su historia reciente.
          </p>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#d2d2d7] mb-32 rounded-2xl overflow-hidden">
          {[
            { code:"IRN",flag:"🇮🇷",name:"Irán",c:"#ff3b30",desc:"Potencia regional con red de proxies. Programa nuclear en punto crítico. Control del Estrecho de Ormuz.",stat:"1er productor de petróleo OPEP" },
            { code:"ISR",flag:"🇮🇱",name:"Israel",c:"#0071e3",desc:"Guerra activa en Gaza y Líbano. Capacidad de ataque de largo alcance sobre suelo iraní.",stat:"Única potencia nuclear no declarada" },
            { code:"USA",flag:"🇺🇸",name:"EE.UU.",c:"#34c759",desc:"Garante de la seguridad israelí. Dos portaaviones en el Mediterráneo. Arquitecto de las sanciones.",stat:"V Flota Naval en el Golfo Pérsico" },
          ].map((a, i) => (
            <FadeUp key={a.code} delay={i * 120}>
              <div className="bg-white p-10 flex flex-col gap-5">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{a.flag}</span>
                  <div><div className="text-xs font-mono text-[#6e6e73]">{a.code}</div><div className="text-xl font-bold text-[#1d1d1f]">{a.name}</div></div>
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: a.c }} />
                </div>
                <p className="text-[15px] text-[#6e6e73] leading-relaxed flex-1">{a.desc}</p>
                <div className="text-xs font-medium text-[#6e6e73] border-t border-[#d2d2d7] pt-4">{a.stat}</div>
              </div>
            </FadeUp>
          ))}
        </div>
        <FadeUp><h3 className="text-3xl font-bold text-[#1d1d1f] mb-16">Cronología del conflicto.</h3></FadeUp>
        <div className="space-y-0">
          {WAR_EVENTS.map((ev, i) => (
            <FadeUp key={i} delay={i * 35}>
              <div className="flex gap-10 py-7 border-t border-[#d2d2d7]">
                <div className="w-36 flex-shrink-0">
                  <span className={`text-sm font-mono font-medium ${ev.hot ? "text-[#ff3b30]" : "text-[#6e6e73]"}`}>{ev.date}</span>
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
// LOS DATOS — dark, múltiples gráficas
// ─────────────────────────────────────────────────────────────────────────────

export function DataSection({ timeline, distribution }: DataProps) {
  return (
    <section id="datos" data-bg="dark" className="bg-[#1d1d1f] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-white/30 tracking-widest uppercase mb-6">02 — Los Datos</p>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            ¿Qué dicen<br /><span className="text-white/25">los datos?</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-20">
            La <span className="text-white/70 font-medium">escala Goldstein</span> de GDELT mide el tono de la cobertura mediática.
            Valores negativos = conflicto. Positivos = cooperación. Es la variable más predictiva del modelo.
          </p>
        </FadeUp>

        {/* Row 1: Escalation timeline + Intensity composite */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FadeUp>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">GDELT · KNN · OCT 2023 – MAY 2026</div>
              <h3 className="text-xl font-bold text-white mb-1">Nivel de escalada por país</h3>
              <p className="text-sm text-white/30 mb-6">Clasificación KNN diaria · 0=Bajo · 1=Medio · 2=Alto</p>
              <EscalationTimeline data={timeline} />
            </div>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">INTENSIDAD MEDIA COMPUESTA · 90 DÍAS</div>
              <h3 className="text-xl font-bold text-white mb-1">Intensidad del conflicto</h3>
              <p className="text-sm text-white/30 mb-6">Promedio diario de los tres países · últimos 90 días</p>
              <ConflictIntensityChart data={timeline} />
            </div>
          </FadeUp>
        </div>

        {/* Row 2: Heatmap mensual */}
        <FadeUp delay={100}>
          <div className="rounded-2xl bg-white/5 border border-white/8 p-8 mb-6">
            <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">GDELT · HEATMAP MENSUAL · OCT 2023 – MAY 2026</div>
            <h3 className="text-xl font-bold text-white mb-1">Mapa de calor de escalada mensual</h3>
            <p className="text-sm text-white/30 mb-8">Nivel promedio por país y mes · hover para detalle</p>
            <EscalationHeatmap />
          </div>
        </FadeUp>

        {/* Row 3: Distribution + Goldstein */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FadeUp delay={100}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">DISTRIBUCIÓN DE CLASES</div>
              <h3 className="text-xl font-bold text-white mb-1">Días por nivel de escalada</h3>
              <p className="text-sm text-white/30 mb-6">Por país · Oct 2023 – May 2026</p>
              <DistributionChart data={distribution} />
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">GDELT · GOLDSTEIN PROMEDIO POR PAÍS</div>
              <h3 className="text-xl font-bold text-white mb-1">Tono Goldstein histórico</h3>
              <p className="text-sm text-white/30 mb-6">Media y rango Oct 2023 – May 2026 · Israel es el más negativo</p>
              <GoldsteinBarChart />
            </div>
          </FadeUp>
        </div>

        {/* Callout */}
        <FadeUp delay={200}>
          <div className="rounded-2xl border border-[#ff9f0a]/20 bg-[#ff9f0a]/5 p-10">
            <p className="text-sm font-semibold text-[#ff9f0a] tracking-widest uppercase mb-4">Hallazgo</p>
            <p className="text-xl md:text-2xl font-medium text-white leading-relaxed max-w-3xl">
              Marzo–Abril 2026 es el período de máxima escalada del histórico completo.
              Los tres países en nivel <span className="text-[#ff3b30] font-bold">ALTO</span> durante
              11 días consecutivos — hecho sin precedentes desde octubre de 2023.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAS FUENTES
// ─────────────────────────────────────────────────────────────────────────────

const SOURCES = [
  { id:"GDELT",     icon:"📡",name:"GDELT Project",    stat:"120",  unit:"agregados",  color:"#0071e3",desc:"Base de datos global de eventos mediáticos. Tono y volumen en tiempo real desde 1979." },
  { id:"NASA FIRMS",icon:"🛰️",name:"NASA FIRMS",       stat:"6,812",unit:"hotspots",   color:"#ff3b30",desc:"Detección de anomalías térmicas satelitales. Proxy de explosiones e infraestructura militar." },
  { id:"OpenSky",   icon:"✈️",name:"OpenSky Network",  stat:"493K", unit:"trazas",     color:"#af52de",desc:"Rastreo de vuelos sobre Oriente Medio. Cierres de espacio aéreo = señal de escalada." },
  { id:"RSS",       icon:"📰",name:"RSS Feeds",         stat:"141",  unit:"artículos",  color:"#ff9f0a",desc:"BBC · Al Jazeera · Google News · Tehran Times · MEE. Cinco perspectivas editoriales." },
  { id:"Bluesky",   icon:"🦋",name:"Bluesky Social",   stat:"61",   unit:"posts",      color:"#30d158",desc:"Red social descentralizada. Volumen de publicaciones como barómetro de atención pública." },
  { id:"AISStream", icon:"🚢",name:"AISStream · AIS",  stat:"138",  unit:"posiciones", color:"#5ac8fa",desc:"Posiciones de embarcaciones. Tráfico naval en el Golfo Pérsico y el Estrecho de Ormuz." },
];

export function SourcesSection() {
  return (
    <section data-bg="light" className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">03 — Las fuentes</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Cómo lo<br /><span className="text-[#6e6e73]">monitoreamos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-16">
            Seis fuentes abiertas y gratuitas integradas en un pipeline automatizado.
          </p>
        </FadeUp>

        {/* Source grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#d2d2d7] rounded-2xl overflow-hidden mb-20">
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

        {/* Source distribution chart */}
        <FadeUp delay={200}>
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-10">
            <div className="text-[10px] font-mono text-[#6e6e73] tracking-widest mb-2">DISTRIBUCIÓN DEL REPOSITORIO CENTRAL</div>
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">557,184 eventos en Supabase</h3>
            <p className="text-[15px] text-[#6e6e73] mb-8">El 88.5% del volumen es tráfico aéreo (OpenSky) — señal de movimiento militar en la región</p>
            <SourceDonutChart />
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPA ESTRATÉGICO DEL ESTRECHO — SVG custom
// ─────────────────────────────────────────────────────────────────────────────

const GULF_POINTS = [
  { id:"ormuz",  label:"Estrecho de Ormuz", sub:"39 km · 20% del petróleo mundial", x:570, y:175, type:"key",      dot:"#bf5af2", size:14 },
  { id:"babbas", label:"Bandar Abbas",       sub:"Puerto naval · Irán",              x:562, y:148, type:"military", dot:"#bf5af2", size:10 },
  { id:"spars",  label:"South Pars",         sub:"Mayor campo de gas mundial",       x:340, y:140, type:"oil",      dot:"#ff9f0a", size:9  },
  { id:"rlaffan",label:"Ras Laffan",         sub:"Qatar LNG · 258 MW FRP",          x:270, y:230, type:"oil",      dot:"#22d3ee", size:9  },
  { id:"abudhabi",label:"Abu Dhabi",         sub:"UAE · 331 MW FRP (máximo)",       x:488, y:345, type:"oil",      dot:"#38bdf8", size:9  },
  { id:"abqaiq", label:"Abqaiq (Aramco)",    sub:"Instalación crítica · 219 MW FRP", x:168, y:224, type:"oil",     dot:"#fbbf24", size:9  },
  { id:"bahrain",label:"Bahréin",            sub:"Base naval EE.UU.",               x:206, y:202, type:"military", dot:"#34c759", size:8  },
  { id:"doha",   label:"Doha, Qatar",        sub:"North Dome · 258 MW FRP",         x:250, y:264, type:"oil",      dot:"#22d3ee", size:8  },
];

const SHIP_PATHS = [
  { path:"M 50,200 Q 200,190 350,195 Q 480,198 570,175", color:"#ffffff", opacity:0.15, dur:"8s", delay:"0s"   },
  { path:"M 50,210 Q 200,200 350,205 Q 480,208 570,185", color:"#ffffff", opacity:0.10, dur:"10s", delay:"2s"  },
  { path:"M 50,220 Q 220,210 370,215 Q 490,218 565,190", color:"#ffffff", opacity:0.08, dur:"12s", delay:"5s"  },
];

export function HormuzMapSection() {
  return (
    <section data-bg="dark" className="bg-[#080f1a] py-40 px-6 overflow-hidden">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-white/30 tracking-widest uppercase mb-6">04 — NASA FIRMS + Geopolítica</p>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            El Estrecho<br /><span className="text-white/25">de Ormuz.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-16">
            Un canal de <strong className="text-white/70">39 km</strong> de ancho por el que transita
            el <strong className="text-white/70">20% del petróleo mundial</strong>. El control de este
            punto estratégico es el núcleo del conflicto entre Irán y Occidente.
          </p>
        </FadeUp>

        {/* SVG Strategic Map */}
        <FadeUp delay={100}>
          <div className="rounded-2xl overflow-hidden border border-white/8 mb-12" style={{ background: "#060d18" }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="text-xs font-mono text-white/30 tracking-widest">MAPA ESTRATÉGICO — GOLFO PÉRSICO</div>
              <div className="flex items-center gap-4 text-[10px] font-mono text-white/25">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-[#bf5af2]"/>Militar</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-[#ff9f0a]"/>Petróleo/Gas</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full bg-[#34c759]"/>Naval EE.UU.</span>
              </div>
            </div>
            <svg viewBox="0 0 860 480" className="w-full" style={{ maxHeight: 500 }}>
              <defs>
                <radialGradient id="seaGrad" cx="50%" cy="50%" r="60%">
                  <stop offset="0%" stopColor="#0a1e35" />
                  <stop offset="100%" stopColor="#060d18" />
                </radialGradient>
                <radialGradient id="straitGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#bf5af2" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#bf5af2" stopOpacity="0"/>
                </radialGradient>
                <linearGradient id="iranGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a2d3a"/>
                  <stop offset="100%" stopColor="#152535"/>
                </linearGradient>
                <linearGradient id="arabGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#152535"/>
                  <stop offset="100%" stopColor="#1a2d3a"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              {/* Sea background */}
              <rect width="860" height="480" fill="url(#seaGrad)" />

              {/* Grid lines */}
              {[100,200,300,400,500,600,700,800].map(x => (
                <line key={x} x1={x} y1="0" x2={x} y2="480" stroke="white" strokeOpacity="0.03" strokeWidth="1"/>
              ))}
              {[80,160,240,320,400].map(y => (
                <line key={y} x1="0" y1={y} x2="860" y2={y} stroke="white" strokeOpacity="0.03" strokeWidth="1"/>
              ))}

              {/* IRAN landmass (top) */}
              <path d="M 0,0 L 860,0 L 860,220 Q 780,260 730,270 Q 700,265 670,240 Q 640,215 620,200 Q 600,185 570,175 Q 545,168 510,172 Q 470,175 430,168 Q 380,160 340,145 Q 290,130 240,128 Q 180,126 120,130 Q 70,133 30,138 Q 10,140 0,142 Z"
                fill="url(#iranGrad)" stroke="#2d4a5f" strokeWidth="1"/>

              {/* ARABIAN PENINSULA (bottom) */}
              <path d="M 0,480 L 860,480 L 860,380 Q 800,360 750,340 Q 700,320 660,310 Q 630,305 610,290 Q 590,275 575,260 Q 560,248 555,235 Q 548,220 560,205 Q 568,195 575,190 Q 592,200 607,220 Q 620,238 635,248 Q 655,260 680,278 Q 710,298 740,320 Q 780,342 820,358 Q 845,368 860,375 L 860,480 Z"
                fill="url(#arabGrad)" stroke="#2d4a5f" strokeWidth="1" opacity="0"/>
              <path d="M 0,340 Q 40,335 80,330 Q 120,320 160,308 Q 190,300 215,295 Q 235,292 250,285 Q 265,278 270,265 Q 272,255 268,245 L 245,242 Q 230,248 218,258 Q 200,272 178,282 Q 148,294 110,306 Q 70,318 30,326 Q 15,330 0,333 Z"
                fill="url(#arabGrad)" stroke="#2d4a5f" strokeWidth="1"/>
              <path d="M 0,340 Q 40,335 80,330 Q 120,320 160,308 Q 190,300 215,295 Q 235,292 250,285 Q 265,278 270,265 Q 272,255 268,245 Q 265,232 260,222 Q 255,212 248,205 Q 240,198 232,196 Q 220,196 208,204 Q 196,213 188,226 Q 178,242 168,256 Q 148,278 120,298 Q 90,318 55,330 Q 28,338 0,342 L 0,480 L 860,480 L 860,320 Q 820,338 790,350 Q 760,362 730,370 Q 700,374 670,366 Q 648,358 632,344 Q 618,332 608,316 Q 598,300 592,286 Q 584,268 578,254 Q 572,240 564,228 Q 555,214 545,208 Q 535,203 522,204 Q 508,207 496,218 Q 480,233 468,252 Q 455,272 445,294 Q 432,318 418,336 Q 400,356 378,368 Q 350,380 316,386 Q 280,390 240,390 Q 200,390 158,384 Q 116,376 78,360 Q 40,344 0,334 Z"
                fill="url(#arabGrad)" stroke="#2d4a5f" strokeWidth="0.5"/>

              {/* Strait of Hormuz glow */}
              <ellipse cx="567" cy="192" rx="50" ry="35" fill="url(#straitGlow)" />
              <ellipse cx="567" cy="192" rx="50" ry="35" fill="url(#straitGlow)" opacity="0.5" />

              {/* Strait width annotation */}
              <line x1="560" y1="155" x2="560" y2="230" stroke="#bf5af2" strokeWidth="1" strokeOpacity="0.6" strokeDasharray="4 3"/>
              <text x="575" y="198" fill="#bf5af2" fontSize="9" fontFamily="monospace" opacity="0.9">39 km</text>

              {/* Ship paths (animated) */}
              {SHIP_PATHS.map((sp, i) => (
                <g key={i}>
                  <path d={sp.path} fill="none" stroke={sp.color} strokeWidth="0.5" strokeOpacity={sp.opacity}/>
                  <circle r="3" fill={sp.color} fillOpacity={Number(sp.opacity) * 2}>
                    <animateMotion dur={sp.dur} begin={sp.delay} repeatCount="indefinite" path={sp.path}/>
                  </circle>
                </g>
              ))}

              {/* Country labels */}
              <text x="300" y="80" fill="white" fillOpacity="0.2" fontSize="18" fontWeight="900" fontFamily="system-ui" letterSpacing="6">I R Á N</text>
              <text x="80"  y="390" fill="white" fillOpacity="0.15" fontSize="13" fontWeight="700" fontFamily="system-ui" letterSpacing="3">ARABIA SAUDÍ</text>
              <text x="430" y="420" fill="white" fillOpacity="0.15" fontSize="13" fontWeight="700" fontFamily="system-ui" letterSpacing="3">UAE</text>
              <text x="680" y="380" fill="white" fillOpacity="0.15" fontSize="13" fontWeight="700" fontFamily="system-ui" letterSpacing="3">OMÁN</text>
              <text x="220" y="180" fill="white" fillOpacity="0.12" fontSize="12" fontFamily="monospace">GOLFO PÉRSICO</text>
              <text x="650" y="295" fill="white" fillOpacity="0.12" fontSize="11" fontFamily="monospace">GOLFO DE OMÁN</text>

              {/* Key points */}
              {GULF_POINTS.map(p => (
                <g key={p.id} filter="url(#glow)">
                  {p.type === "key" && <circle cx={p.x} cy={p.y} r={p.size * 2} fill={p.dot} fillOpacity="0.15"><animate attributeName="r" values={`${p.size * 2};${p.size * 3};${p.size * 2}`} dur="3s" repeatCount="indefinite"/></circle>}
                  <circle cx={p.x} cy={p.y} r={p.size / 2} fill={p.dot} fillOpacity="0.9"/>
                  <text x={p.x + 10} y={p.y + 4} fill="white" fillOpacity="0.85" fontSize="9" fontWeight="700" fontFamily="system-ui">{p.label}</text>
                  <text x={p.x + 10} y={p.y + 14} fill="white" fillOpacity="0.35" fontSize="7.5" fontFamily="monospace">{p.sub}</text>
                </g>
              ))}

              {/* 20% label */}
              <rect x="590" y="156" width="160" height="28" rx="4" fill="#bf5af2" fillOpacity="0.12" stroke="#bf5af2" strokeOpacity="0.4" strokeWidth="0.5"/>
              <text x="598" y="167" fill="#bf5af2" fontSize="8" fontWeight="700" fontFamily="monospace">20% del petróleo mundial</text>
              <text x="598" y="179" fill="#bf5af2" fontSize="8" fontFamily="monospace" opacity="0.6">transita por aquí</text>
            </svg>
          </div>
        </FadeUp>

        {/* FIRMS daily chart + table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <FadeUp delay={100}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">NASA FIRMS · VIIRS · 26–30 MAY 2026</div>
              <h3 className="text-xl font-bold text-white mb-1">Actividad térmica diaria</h3>
              <p className="text-sm text-white/30 mb-6">Hotspots detectados y potencia radiativa (MW) por día</p>
              <FRPDailyChart />
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">TOP ZONAS · FRP MÁXIMA (MW)</div>
              <h3 className="text-xl font-bold text-white mb-1">Puntos de inflexión geopolíticos</h3>
              <p className="text-sm text-white/30 mb-6">227 clusters identificados por DBSCAN · radio ≈ 25 km</p>
              <div className="space-y-3">
                {[
                  { n:"Abu Dhabi, UAE",    frp:331.5,c:"#38bdf8",t:"Industrial" },
                  { n:"North Dome, Qatar", frp:258.1,c:"#22d3ee",t:"Industrial" },
                  { n:"Abqaiq, Aramco",    frp:219.3,c:"#fbbf24",t:"Industrial" },
                  { n:"Kirkuk, Iraq",      frp:189.5,c:"#ef4444",t:"Conflicto"  },
                  { n:"Bandar Abbas",      frp:34.0, c:"#bf5af2",t:"⚠️ Militar"  },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.c }}/>
                    <div className="flex-1 text-sm text-white/70">{r.n}</div>
                    <div className="text-sm font-black font-mono" style={{ color: r.c }}>{r.frp} MW</div>
                    <div className="text-[10px] text-white/25 w-16 text-right">{r.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Pull quote */}
        <FadeUp delay={300}>
          <div className="border-l-2 border-[#bf5af2] pl-8 max-w-2xl">
            <p className="text-2xl md:text-3xl font-bold text-white leading-snug mb-4">
              &ldquo;Un bloqueo del Estrecho de Ormuz provocaría una crisis energética global en 72 horas.&rdquo;
            </p>
            <p className="text-sm text-white/30">Análisis DBSCAN · 6,812 hotspots · Mayo 2026</p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LA IA
// ─────────────────────────────────────────────────────────────────────────────

const MODELS = [
  { name:"KNN",                 f1:0.7513, std:0.031, winner:true  },
  { name:"Logistic Regression", f1:0.6240, std:0.028, winner:false },
  { name:"Ridge Classifier",    f1:0.4666, std:0.062, winner:false },
  { name:"Naive Bayes",         f1:0.4519, std:0.058, winner:false },
];

export function MLSection() {
  return (
    <section id="ia" data-bg="light" className="bg-white py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">05 — La IA</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            ¿Puede la IA<br /><span className="text-[#6e6e73]">predecir la guerra?</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Cuatro algoritmos. 183 ventanas país-día. Validación cruzada 5-fold.
            El objetivo: clasificar la escalada como <span className="font-mono font-bold text-[#34c759]">BAJO</span>, <span className="font-mono font-bold text-[#ff9f0a]">MEDIO</span> o <span className="font-mono font-bold text-[#ff3b30]">ALTO</span>.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-16">
          {/* Model table */}
          <FadeUp>
            <div className="space-y-0">
              <div className="flex items-center justify-between pb-4 border-b border-[#d2d2d7]">
                <span className="text-[11px] font-mono text-[#6e6e73] tracking-widest uppercase">Modelo</span>
                <span className="text-[11px] font-mono text-[#6e6e73] tracking-widest uppercase">F1 ponderado</span>
              </div>
              {MODELS.map((m, i) => (
                <FadeUp key={m.name} delay={i * 80}>
                  <div className={`flex items-center justify-between py-7 border-b border-[#d2d2d7] ${m.winner ? "bg-[#f5f5f7] -mx-6 px-6" : ""}`}>
                    <div className="flex items-center gap-4">
                      {m.winner && <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#0071e3] text-white">GANADOR</span>}
                      <span className={`text-lg font-semibold ${m.winner ? "text-[#1d1d1f]" : "text-[#6e6e73]"}`}>{m.name}</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-black font-mono ${m.winner ? "text-[#1d1d1f]" : "text-[#d2d2d7]"}`}>{(m.f1 * 100).toFixed(1)}%</div>
                      <div className="text-xs font-mono text-[#6e6e73]">±{(m.std * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </FadeUp>
              ))}
              <div className="mt-6 text-sm text-[#6e6e73]">CV 5-fold estratificado · Métrica: F1 ponderado · 11 features</div>
            </div>
          </FadeUp>

          {/* Radar chart */}
          <FadeUp delay={200}>
            <div className="rounded-2xl bg-[#1d1d1f] p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">COMPARACIÓN MULTIDIMENSIONAL</div>
              <h3 className="text-xl font-bold text-white mb-1">Radar de métricas</h3>
              <p className="text-sm text-white/35 mb-6">F1 · Precisión · Recall · Estabilidad · Velocidad</p>
              <ModelRadarChart />
            </div>
          </FadeUp>
        </div>

        {/* Why KNN */}
        <FadeUp delay={300}>
          <div className="rounded-2xl bg-[#f5f5f7] p-10">
            <div className="text-xs font-mono text-[#0071e3] tracking-widest mb-4">POR QUÉ KNN GANA</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { t:"Similitud temporal",      b:"Los días de alta escalada se parecen entre sí. KNN los agrupa sin asumir estructura lineal." },
                { t:"+30pp sobre Naive Bayes",  b:"75.1% vs 45.2% de F1. En predicción de conflictos geopolíticos, la diferencia es operativamente decisiva." },
                { t:"Feature clave: Goldstein", b:"El tono promedio de GDELT es la variable más predictiva del nivel de escalada del día siguiente." },
              ].map((it, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-0.5 bg-[#0071e3] rounded-full flex-shrink-0 mt-1" />
                  <div>
                    <div className="text-sm font-bold text-[#1d1d1f] mb-1">{it.t}</div>
                    <div className="text-sm text-[#6e6e73] leading-relaxed">{it.b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EL PULSO — dark, live data
// ─────────────────────────────────────────────────────────────────────────────

const C_META: Record<string, { name: string; flag: string; color: string }> = {
  IRN: { name: "Irán",   flag: "🇮🇷", color: "#ff3b30" },
  ISR: { name: "Israel", flag: "🇮🇱", color: "#0071e3" },
  USA: { name: "EE.UU.",flag: "🇺🇸", color: "#34c759" },
};
const LVL: Record<number, { label: string; color: string }> = {
  0: { label: "BAJO",  color: "#34c759" },
  1: { label: "MEDIO", color: "#ff9f0a" },
  2: { label: "ALTO",  color: "#ff3b30" },
};

export function LiveSection({ latest, recentEvents }: LiveProps) {
  return (
    <section id="hoy" data-bg="dark" className="bg-[#1d1d1f] py-40 px-6">
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
            Estado del<br /><span className="text-white/25">conflicto hoy.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-20">
            Predicción del modelo KNN sobre los últimos datos de GDELT, NASA FIRMS y OpenSky.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden mb-16">
          {(["IRN","ISR","USA"] as const).map((code, i) => {
            const meta = C_META[code]; const state = latest[code];
            const lvl = (state?.escalation_level ?? 0) as 0|1|2;
            const info = LVL[lvl];
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
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: info.color }}/>
                    <span className="text-4xl font-black font-mono" style={{ color: info.color }}>{info.label}</span>
                  </div>
                  {state && (
                    <div className="space-y-2.5 border-t border-white/8 pt-5">
                      {[["Eventos GDELT", state.n_conflict_events?.toLocaleString("es-CO")],["Goldstein prom.", state.avg_goldstein?.toFixed(2)],["Menciones", state.n_gdelt_mentions?.toLocaleString("es-CO")]].map(([k,val]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-xs text-white/25">{k}</span>
                          <span className="text-xs font-mono text-white/50">{val ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeUp>
            );
          })}
        </div>

        {recentEvents.length > 0 && (
          <FadeUp>
            <div className="rounded-2xl overflow-hidden border border-white/8">
              <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Últimos eventos</span>
                <span className="text-xs font-mono text-white/20">raw_events · Supabase</span>
              </div>
              {recentEvents.slice(0, 6).map((ev, i) => (
                <div key={i} className="px-8 py-4 flex items-center gap-5 border-b border-white/5 last:border-0">
                  <span className="text-xs font-mono text-white/20 w-24 flex-shrink-0">{ev.timestamp?.slice(0,10)}</span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-white/40 flex-shrink-0">{ev.source}</span>
                  {ev.country && <span className="text-xs font-mono text-white/25 flex-shrink-0">{ev.country}</span>}
                  {ev.text && <span className="text-xs text-white/18 truncate hidden md:block">{ev.text.slice(0,90)}</span>}
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
// CONCLUSIONES
// ─────────────────────────────────────────────────────────────────────────────

const FINDINGS = [
  { n:"01", title:"El tono mediático predice la guerra.",     color:"#0071e3", body:"La escala Goldstein de GDELT es la variable más predictiva del nivel de escalada. Los medios globales capturan la tensión antes de que se materialice en eventos físicos." },
  { n:"02", title:"El Estrecho de Ormuz es el nodo crítico.", color:"#ff3b30", body:"Bandar Abbas concentra el riesgo geopolítico más alto de la región. Un bloqueo desencadenaría una crisis energética global en 72 horas: 20% del petróleo y 30% del GNL mundiales." },
  { n:"03", title:"KNN supera a todos los modelos base.",     color:"#34c759", body:"Con F1=0.75 en CV de 5 folds, KNN supera en 30 puntos porcentuales a Naive Bayes. La similitud temporal entre días de conflicto explica su ventaja sobre modelos lineales." },
  { n:"04", title:"2026 registra la escalada más alta.",      color:"#ff9f0a", body:"Marzo–Abril 2026 es el período más conflictivo del histórico monitoreado. Los tres países en nivel ALTO durante 11 días consecutivos — hecho sin precedentes desde octubre de 2023." },
  { n:"05", title:"Las fuentes abiertas son suficientes.",    color:"#af52de", body:"Con datos 100% gratuitos — GDELT, FIRMS, OpenSky, RSS, Bluesky, AISStream — el sistema clasifica la escalada con F1=0.75, validando la hipótesis central del proyecto." },
];

export function FindingsSection() {
  return (
    <section data-bg="light" className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">07 — Conclusiones</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8"
            style={{ fontSize: "clamp(3rem, 7vw, 6.5rem)" }}>
            Lo que<br /><span className="text-[#6e6e73]">encontramos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Cinco hallazgos a partir de 557,184 eventos, 183 ventanas país-día y cuatro modelos.
          </p>
        </FadeUp>
        <div className="space-y-0 mb-32">
          {FINDINGS.map((f, i) => (
            <FadeUp key={f.n} delay={i * 70}>
              <div className="flex gap-8 py-10 border-t border-[#d2d2d7]">
                <div className="text-4xl font-black font-mono flex-shrink-0 leading-none" style={{ color: f.color }}>{f.n}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3 leading-snug">{f.title}</h3>
                  <p className="text-lg text-[#6e6e73] leading-relaxed max-w-2xl">{f.body}</p>
                </div>
              </div>
            </FadeUp>
          ))}
          <div className="border-t border-[#d2d2d7]" />
        </div>
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

export function FooterSection() {
  return (
    <footer data-bg="dark" className="bg-[#1d1d1f] py-16 px-6">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="text-white font-semibold mb-1">Sistema de Inteligencia Multifuente</div>
          <div className="text-sm text-white/30">Conflicto Irán · Israel · EE.UU. — Mayo 2026</div>
        </div>
        <div className="text-sm text-white/20 text-center md:text-right">
          Universidad Externado de Colombia<br />Machine Learning 1 · ML1-2026I
        </div>
      </div>
    </footer>
  );
}
