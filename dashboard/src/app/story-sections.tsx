"use client";

import { ReactNode, useRef, useState, useEffect } from "react";
import dynamic from "next/dynamic";

const GulfMap = dynamic(() => import("./gulf-map"), { ssr: false });
import {
  EscalationTimeline, DistributionChart, SourceDonutChart,
  FRPDailyChart, GoldsteinBarChart, EscalationHeatmap,
  ModelRadarChart, ConflictIntensityChart,
} from "./charts";
import type { TimelinePoint, DistPoint } from "./charts";

// ── Types ──────────────────────────────────────────────────────────────────────

export type LatestCountry = { escalation_level: number; date: string; n_conflict_events: number; avg_goldstein: number; n_gdelt_mentions: number };
export type RecentEvent   = { timestamp: string; source: string; country: string | null; event_type: string | null; text: string | null };
export type LiveProps     = { latest: Record<string, LatestCountry>; recentEvents: RecentEvent[] };
export type DataProps     = { timeline: TimelinePoint[]; distribution: DistPoint[] };

// ── FadeUp ─────────────────────────────────────────────────────────────────────

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

// ── NavBar ────────────────────────────────────────────────────────────────────

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 40);
      const secs = document.querySelectorAll("section[data-bg]");
      let cur = "dark";
      secs.forEach(s => { if (s.getBoundingClientRect().top <= 60) cur = (s as HTMLElement).dataset.bg ?? "dark"; });
      setDark(cur === "dark");
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
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
          {[["#conflicto","El conflicto"],["#datos","Los datos"],["#arquitectura","Arquitectura"],["#ia","La IA"],["#hoy","Hoy"]].map(([h,l]) => (
            <a key={h} href={h} className={`text-[13px] font-medium transition-colors duration-300 ${tx} ${hx}`}>{l}</a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
          <span className={`text-[11px] font-mono font-medium transition-colors ${tx}`}>EN VIVO</span>
        </div>
      </div>
    </nav>
  );
}

// ── VideoBreak ────────────────────────────────────────────────────────────────

export function VideoBreak({ src, poster, title, subtitle, height = "60vh", gradient = "from-[#1d1d1f] via-[#2d1515] to-[#1d1d1f]" }:
  { src?: string; poster?: string; title: string; subtitle?: string; height?: string; gradient?: string }) {
  return (
    <section className="relative overflow-hidden" style={{ height }}>
      {src
        ? <video autoPlay muted loop playsInline poster={poster} className="absolute inset-0 w-full h-full object-cover"><source src={src} type="video/mp4"/></video>
        : <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}/>}
      <div className="absolute inset-0 opacity-30" style={{ backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")", backgroundSize:"200px" }}/>
      <div className="absolute inset-0 bg-black/55"/>
      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight tracking-tight" style={{ textShadow:"0 2px 40px rgba(0,0,0,0.8)" }}>{title}</h2>
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
      <div className="absolute inset-0 pointer-events-none" style={{ background:"radial-gradient(ellipse 70% 50% at 50% 60%, rgba(255,59,48,0.07) 0%, transparent 70%)" }}/>
      <div className="relative z-10 text-center px-6 max-w-6xl mx-auto pt-12">
        <FadeUp>
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-white/10 bg-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
            <span className="text-xs font-medium text-white/50 tracking-widest uppercase">Monitoreo activo · Mayo 2026</span>
          </div>
        </FadeUp>
        <FadeUp delay={100}>
          <h1 className="font-black text-white leading-[0.88] tracking-tight mb-6" style={{ fontSize:"clamp(4rem, 14vw, 11rem)" }}>
            Irán.<br/>Israel.<br/><span className="text-white/25">EE.UU.</span>
          </h1>
        </FadeUp>
        <FadeUp delay={220}>
          <p className="text-xl md:text-2xl text-white/45 font-medium max-w-2xl mx-auto leading-relaxed mb-16">
            El conflicto más tenso del siglo XXI,<br/>monitoreado con inteligencia artificial y fuentes abiertas.
          </p>
        </FadeUp>
        <FadeUp delay={360}>
          <div className="flex flex-wrap justify-center gap-x-14 gap-y-6 mb-20">
            {[["557K","eventos crudos"],["6","fuentes OSINT"],["183","días analizados"],["75%","F1 del modelo"]].map(([n,l]) => (
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
            <div className="w-px h-10 bg-gradient-to-b from-white/18 to-transparent" style={{ animation:"scroll-hint 2s ease-in-out infinite" }}/>
          </div>
        </FadeUp>
      </div>
      <div className="absolute bottom-6 right-8 text-[10px] font-mono text-white/12 tracking-widest">{t?"█":" "} SYSTEM · ONLINE</div>
      <div className="absolute bottom-6 left-8 text-[10px] font-mono text-white/12 tracking-widest">EXTERNADO · ML1-2026I</div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EL CONFLICTO — timeline visual
// ─────────────────────────────────────────────────────────────────────────────

const WAR_EVENTS = [
  { date:"7 oct 2023",    year:"2023", title:"El ataque que lo cambió todo",               body:"Hamás lanza el mayor ataque terrorista en la historia de Israel: 1,200 muertos, 250 secuestrados. Israel declara estado de guerra y comienza la operación terrestre sobre Gaza.", level:3 },
  { date:"oct–dic 2023",  year:"2023", title:"Escalada regional",                           body:"Hezbollah abre el frente norte desde el Líbano. Los Hutíes bloquean el Mar Rojo. Irán activa su red de proxies. EE.UU. despliega dos grupos de portaaviones en el Mediterráneo.", level:2 },
  { date:"1 abr 2024",    year:"2024", title:"Israel ataca el consulado iraní en Damasco",  body:"Siete oficiales de la Guardia Revolucionaria Islámica muertos. Primer ataque directo israelí a una instalación bajo protección diplomática iraní. Irán jura represalia.", level:2 },
  { date:"13–14 abr 2024",year:"2024", title:"Irán rompe la línea roja",                   body:"330 drones y misiles balísticos sobre Israel. Primera vez en la historia que Irán ataca directamente. El 99% es interceptado gracias a la coalición Israel–EE.UU.–Jordania–Arabia Saudí.", level:3 },
  { date:"19 abr 2024",   year:"2024", title:"Contraataque israelí cerca de Isfahan",       body:"Israel demuestra capacidad de penetración sobre instalaciones de defensa aérea iraníes. La ubicación —cerca de Isfahan y sus sitios nucleares— envía un mensaje inequívoco.", level:2 },
  { date:"1 oct 2024",    year:"2024", title:"200 misiles balísticos sobre Israel",         body:"Mayor ataque de misiles balísticos en la historia de Israel. Irán responde al asesinato de líderes de Hezbollah y Hamás. La mayoría es interceptada, pero el daño psicológico es enorme.", level:3 },
  { date:"26 oct 2024",   year:"2024", title:"Israel destruye defensas aéreas de Irán",    body:"Ataque coordinado israelí en múltiples provincias iraníes. Irán queda parcialmente expuesto. La amenaza de represalia total lleva la tensión a su punto más alto de 2024.", level:3 },
  { date:"feb–mar 2025",  year:"2025", title:"Escalada diplomática y sanciones",           body:"EE.UU. refuerza sanciones sobre el programa nuclear iraní. Colapsan las negociaciones de alto al fuego en Gaza. GDELT registra el primer pico significativo de conflictividad en nuestros datos.", level:1 },
  { date:"ene–mar 2026",  year:"2026", title:"Tensión en el Estrecho de Ormuz",            body:"Irán despliega buques militares adicionales en el Golfo. EE.UU. refuerza su presencia naval. El 20% del petróleo mundial y el 30% del GNL global transitan por un canal de 39 km bajo amenaza.", level:2 },
  { date:"mar–abr 2026",  year:"2026", title:"Pico máximo — los tres países en ALTO",      body:"Los tres países alcanzan nivel ALTO simultáneamente por primera vez en el histórico monitoreado. Nuestro modelo KNN lo detecta en tiempo real. 11 días consecutivos en el nivel máximo de escalada.", level:3 },
];

const LEVEL_DOT = ["bg-[#d2d2d7]","bg-[#ff9f0a]","bg-[#ff6b30]","bg-[#ff3b30]"];
const LEVEL_DATE = ["text-[#6e6e73]","text-[#ff9f0a]","text-[#ff6b30]","text-[#ff3b30]"];
const YEAR_MARKS = ["2023","2024","2025","2026"];

export function ConflictSection() {
  return (
    <section id="conflicto" data-bg="light" className="bg-white py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">01 — El Escenario</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            Tres actores.<br/><span className="text-[#6e6e73]">Una crisis.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Desde el 7 de octubre de 2023, Oriente Medio vive la escalada más peligrosa de su historia reciente. Irán, Israel y EE.UU. sostienen un equilibrio de terror con consecuencias energéticas y geopolíticas globales.
          </p>
        </FadeUp>

        {/* Actor cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#d2d2d7] mb-32 rounded-2xl overflow-hidden">
          {[
            { code:"IRN",flag:"🇮🇷",name:"Irán",c:"#ff3b30",
              facts:["Red de proxies activos: Hezbollah, Hutíes, Hamás","Programa nuclear con uranio enriquecido al 60%","Control estratégico del Estrecho de Ormuz","1er productor de petróleo OPEP"],
              role:"Actor ofensivo — presión asimétrica" },
            { code:"ISR",flag:"🇮🇱",name:"Israel",c:"#0071e3",
              facts:["Guerra activa en Gaza (oct 2023 – presente)","Operación terrestre en Líbano (2024)","Ataques de largo alcance sobre suelo iraní","Única potencia nuclear no declarada de la región"],
              role:"Actor defensivo — respuesta directa" },
            { code:"USA",flag:"🇺🇸",name:"Estados Unidos",c:"#34c759",
              facts:["Garante de la seguridad israelí (Artículo 5 informal)","Dos grupos de portaaviones en el Mediterráneo","V Flota Naval permanente en el Golfo Pérsico","Arquitecto del régimen de sanciones sobre Irán"],
              role:"Actor disuasorio — contención" },
          ].map((a,i) => (
            <FadeUp key={a.code} delay={i*120}>
              <div className="bg-white p-10 flex flex-col gap-6 h-full">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{a.flag}</span>
                  <div><div className="text-xs font-mono text-[#6e6e73]">{a.code}</div><div className="text-xl font-bold text-[#1d1d1f]">{a.name}</div></div>
                  <div className="ml-auto w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor:a.c }}/>
                </div>
                <div className="text-[11px] font-mono font-semibold text-[#6e6e73] tracking-widest uppercase">{a.role}</div>
                <ul className="space-y-2 flex-1">
                  {a.facts.map(f => (
                    <li key={f} className="flex gap-2 text-[14px] text-[#6e6e73]">
                      <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor:a.c }}/>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Visual timeline */}
        <FadeUp>
          <h3 className="text-3xl font-bold text-[#1d1d1f] mb-4">Cronología del conflicto</h3>
          <p className="text-[#6e6e73] mb-16 max-w-xl">Intensidad indicada por color — rojo extremo, naranja alto, amarillo moderado</p>
        </FadeUp>

        <div className="relative ml-6 md:ml-0">
          {/* Year markers and timeline */}
          {YEAR_MARKS.map(yr => {
            const firstIdx = WAR_EVENTS.findIndex(e => e.year === yr);
            if (firstIdx === -1) return null;
            return (
              <FadeUp key={yr}>
                <div className="flex gap-0 mb-2">
                  <div className="w-32 md:w-40 flex-shrink-0 text-right pr-6 pt-1.5">
                    <span className="text-xs font-black font-mono text-[#d2d2d7] tracking-widest">{yr}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-4 h-4 rounded-full bg-[#1d1d1f] ring-2 ring-[#d2d2d7] flex-shrink-0"/>
                  </div>
                  <div className="flex-1 pl-6"/>
                </div>
              </FadeUp>
            );
          })}

          {/* Remove year markers approach — just do the full timeline */}
          <div className="space-y-0">
            {WAR_EVENTS.map((ev, i) => {
              const isLast = i === WAR_EVENTS.length - 1;
              const showYear = i === 0 || WAR_EVENTS[i-1].year !== ev.year;
              return (
                <FadeUp key={i} delay={i*40}>
                  {showYear && (
                    <div className="flex gap-0 mb-0">
                      <div className="w-32 md:w-40 flex-shrink-0"/>
                      <div className="flex flex-col items-center">
                        <div className="w-px h-6 bg-[#d2d2d7]"/>
                      </div>
                      <div className="flex-1 pl-6 flex items-center">
                        <span className="text-xs font-black font-mono text-[#d2d2d7] tracking-widest">{ev.year}</span>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-0 group">
                    {/* Date */}
                    <div className="w-32 md:w-40 flex-shrink-0 text-right pr-6 pt-2.5">
                      <span className={`text-xs font-mono font-medium ${LEVEL_DATE[ev.level]}`}>{ev.date}</span>
                    </div>
                    {/* Line + dot */}
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 ring-4 ring-white z-10 ${LEVEL_DOT[ev.level]}`} style={{ marginTop:"8px" }}/>
                      {!isLast && <div className="w-px flex-1 bg-[#d2d2d7] min-h-[48px] mt-1"/>}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pl-6 pb-10">
                      <div className="text-lg font-bold text-[#1d1d1f] mb-2 leading-snug">{ev.title}</div>
                      <div className="text-[15px] text-[#6e6e73] leading-relaxed max-w-2xl">{ev.body}</div>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOS DATOS — dark, gráficas con explicación
// ─────────────────────────────────────────────────────────────────────────────

const DATE_RANGES = [
  { label: "3 meses",  months: 3  },
  { label: "6 meses",  months: 6  },
  { label: "1 año",    months: 12 },
  { label: "Todo",     months: 999 },
];

export function DataSection({ timeline, distribution }: DataProps) {
  const [rangeMonths, setRangeMonths] = useState(999);

  const filteredTimeline = rangeMonths === 999
    ? timeline
    : (() => {
        if (!timeline.length) return timeline;
        const last = timeline[timeline.length - 1].date;
        const cutoff = new Date(last);
        cutoff.setMonth(cutoff.getMonth() - rangeMonths);
        return timeline.filter(p => new Date(p.date) >= cutoff);
      })();

  return (
    <section id="datos" data-bg="dark" className="bg-[#1d1d1f] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-white/30 tracking-widest uppercase mb-6">02 — Los Datos</p>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            ¿Qué dicen<br/><span className="text-white/25">los datos?</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-4">
            GDELT asigna a cada evento mediático una puntuación en la <span className="text-white/70 font-semibold">escala Goldstein</span> (−10 a +10). Los valores negativos reflejan conflicto, los positivos cooperación. Esta señal es la más predictiva del modelo.
          </p>
          <p className="text-base text-white/25 max-w-2xl leading-relaxed mb-20">
            El target <span className="font-mono font-bold text-white/40">escalation_level</span> se construye por cuantiles de eventos conflictivos por país sobre el histórico del proyecto. El tramo con más eventos → <span className="text-[#ff3b30] font-mono font-bold">ALTO</span> · el tramo con menos eventos → <span className="text-[#34c759] font-mono font-bold">BAJO</span>.
          </p>
        </FadeUp>

        {/* Filtro por período */}
        <FadeUp>
          <div className="flex flex-wrap items-center gap-3 mb-8">
            <span className="text-xs font-mono text-white/30 tracking-widest uppercase">Filtrar por período:</span>
            <div className="flex gap-2">
              {DATE_RANGES.map(r => (
                <button key={r.label} onClick={() => setRangeMonths(r.months)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: rangeMonths === r.months ? "#0071e3" : "rgba(255,255,255,0.06)",
                    color: rangeMonths === r.months ? "#fff" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${rangeMonths === r.months ? "#0071e3" : "rgba(255,255,255,0.1)"}`,
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
            <span className="text-xs font-mono text-white/20 ml-2">
              {filteredTimeline.length} días · {filteredTimeline[0]?.date?.slice(0,7) ?? "—"} → {filteredTimeline[filteredTimeline.length-1]?.date?.slice(0,7) ?? "—"}
            </span>
          </div>
        </FadeUp>

        {/* Chart 1: Escalation timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <FadeUp>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-1">GDELT · KNN · PERÍODO SELECCIONADO</div>
              <h3 className="text-xl font-bold text-white mb-1">Nivel de escalada por país</h3>
              <p className="text-sm text-white/30 mb-2">Clasificación KNN diaria · 0=Bajo · 1=Medio · 2=Alto</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">Por qué importa:</span> Muestra cómo el modelo interpreta la señal GDELT en tiempo real. Los picos coinciden con los eventos documentados en la cronología. Usar los botones de país para comparar individualmente.
              </p>
              <EscalationTimeline data={filteredTimeline}/>
            </div>
          </FadeUp>
          <FadeUp delay={150}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-1">INTENSIDAD COMPUESTA · PERÍODO SELECCIONADO</div>
              <h3 className="text-xl font-bold text-white mb-1">Intensidad media del conflicto</h3>
              <p className="text-sm text-white/30 mb-2">Promedio diario de los tres países · escala 0–2</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">Por qué importa:</span> Un solo país en ALTO puede ser un evento puntual. Cuando el promedio de los tres supera 1.5, el conflicto es sistémico. El área roja visibiliza los períodos de crisis simultánea.
              </p>
              <ConflictIntensityChart data={filteredTimeline}/>
            </div>
          </FadeUp>
        </div>

        {/* Chart 2: Heatmap */}
        <FadeUp delay={100}>
          <div className="rounded-2xl bg-white/5 border border-white/8 p-8 mb-6">
            <div className="text-[10px] font-mono text-white/25 tracking-widest mb-1">GDELT · HEATMAP MENSUAL · OCT 2023 – MAY 2026</div>
            <h3 className="text-xl font-bold text-white mb-1">Mapa de calor de escalada — 32 meses</h3>
            <p className="text-sm text-white/30 mb-2">Nivel promedio por país y mes · hover para detalle</p>
            <p className="text-sm text-white/50 leading-relaxed mb-8">
              <span className="text-white/70 font-medium">Por qué importa:</span> El heatmap revela patrones estacionales y picos sincronizados. Abr 2024 y Oct 2024 muestran rojo simultáneo en IRN e ISR — exactamente los meses de los ataques directos. Mar–Abr 2026 es el único período donde los tres países coinciden en rojo.
            </p>
            <EscalationHeatmap/>
          </div>
        </FadeUp>

        {/* Chart 3: Distribution + Goldstein */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <FadeUp delay={100}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-1">DISTRIBUCIÓN DE CLASES</div>
              <h3 className="text-xl font-bold text-white mb-1">Días por nivel de escalada</h3>
              <p className="text-sm text-white/30 mb-2">Por país · todo el período</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">Por qué importa:</span> El balanceo por cuartiles garantiza ~61 días por clase por país. Si las clases estuvieran desbalanceadas, el modelo aprendería solo a predecir la mayoritaria. Esta distribución uniforme es una decisión de diseño deliberada para evitar el sesgo.
              </p>
              <DistributionChart data={distribution}/>
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-1">GDELT · GOLDSTEIN HISTÓRICO POR PAÍS</div>
              <h3 className="text-xl font-bold text-white mb-1">Tono Goldstein promedio</h3>
              <p className="text-sm text-white/30 mb-2">Media y rango Oct 2023 – May 2026</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">Por qué importa:</span> Israel es el más negativo (−4.87) porque la cobertura global de Gaza domina el índice. EE.UU. es el más moderado (−1.43) porque su cobertura mediática incluye política interna positiva. La barra muestra el rango completo — el extremo negativo indica los días de ataques.
              </p>
              <GoldsteinBarChart/>
            </div>
          </FadeUp>
        </div>

        {/* Callout */}
        <FadeUp delay={200}>
          <div className="rounded-2xl border border-[#ff9f0a]/20 bg-[#ff9f0a]/5 p-10">
            <p className="text-sm font-semibold text-[#ff9f0a] tracking-widest uppercase mb-4">Hallazgo</p>
            <p className="text-xl md:text-2xl font-medium text-white leading-relaxed max-w-3xl">
              Marzo–Abril 2026 es el período de máxima escalada del histórico completo. Los tres países en nivel <span className="text-[#ff3b30] font-bold">ALTO</span> durante 11 días consecutivos — hecho sin precedentes desde octubre de 2023.
            </p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ARQUITECTURA DE DATOS — Supabase + ER model
// ─────────────────────────────────────────────────────────────────────────────

const TABLES = [
  {
    name: "raw_events", rows: "557,184", type: "Tabla central",
    desc: "Repositorio central (data lake). Almacena todos los eventos crudos de todas las fuentes sin procesar.",
    cols: ["id","event_date","timestamp","source","country","event_type","text","url","goldstein","metadata"],
    color: "#0071e3",
  },
  {
    name: "events_gdelt", rows: "120", type: "Tabla derivada",
    desc: "Agregaciones country-day de GDELT. Una fila por país por día con conteo de eventos, tono Goldstein y menciones.",
    cols: ["event_date","country","n_conflict_events","avg_goldstein","n_mentions","n_sources"],
    color: "#0071e3",
  },
  {
    name: "events_rss", rows: "141", type: "Tabla derivada",
    desc: "Titulares de prensa de 5 fuentes editoriales (BBC, Al Jazeera, Google News, Tehran Times, MEE).",
    cols: ["event_date","country","source","title","url","event_type","sentiment"],
    color: "#ff9f0a",
  },
  {
    name: "events_firms", rows: "348", type: "Tabla derivada",
    desc: "Hotspots térmicos de NASA FIRMS. Cada fila es una detección satelital de anomalía térmica.",
    cols: ["acq_date","latitude","longitude","frp","brightness","satellite","confidence","daynight"],
    color: "#ff3b30",
  },
  {
    name: "daily_features", rows: "183", type: "Feature store",
    desc: "Unidad de análisis del modelo ML. Una fila = un país × un día. Contiene las 11 features y el target.",
    cols: ["date","country (PK)","n_conflict_events","avg_goldstein","has_high_violence","n_gdelt_mentions","n_flights","n_hotspots","avg_frp","n_news_articles","n_ships","escalation_level"],
    color: "#34c759",
  },
  {
    name: "model_predictions", rows: "732", type: "Resultados ML",
    desc: "Predicciones de los 4 modelos. 4 modelos × 183 ventanas = 732 filas. Incluye probabilidades por clase y métricas CV.",
    cols: ["date","country","model_name (PK)","predicted_level","prob_low","prob_medium","prob_high","f1_weighted","precision","recall"],
    color: "#af52de",
  },
  {
    name: "sources", rows: "15", type: "Catálogo",
    desc: "Catálogo de todas las fuentes de datos activas con metadatos de cobertura geográfica y temporal.",
    cols: ["id (PK)","name","type","url","active","start_date","end_date","description"],
    color: "#5ac8fa",
  },
];

const VIEWS = [
  { name:"v_daily_dashboard",     desc:"JOIN daily_features + model_predictions(KNN). Base del dashboard." },
  { name:"v_escalation_timeline", desc:"Serie temporal de escalada por país y modelo. Alimenta las gráficas de líneas." },
  { name:"v_target_distribution", desc:"Distribución de clases (días por nivel) por país. Base del donut y barras." },
  { name:"v_gdelt_tone_timeline",  desc:"Tono Goldstein promedio por país en el tiempo." },
  { name:"v_sources_status",       desc:"Estado, cobertura y volumen de cada fuente activa." },
];

const FEATURES = [
  { name:"n_conflict_events",      src:"GDELT",    desc:"Conteo de eventos de conflicto ese día" },
  { name:"avg_goldstein",          src:"GDELT",    desc:"Tono promedio Goldstein (−10 a +10) · feature más predictiva" },
  { name:"has_high_violence",      src:"GDELT",    desc:"Flag: Goldstein < −5 en algún evento del día" },
  { name:"n_gdelt_mentions",       src:"GDELT",    desc:"Volumen de menciones en medios globales" },
  { name:"n_flights",              src:"OpenSky",  desc:"Vuelos registrados sobre la región ese día" },
  { name:"n_hotspots",             src:"FIRMS",    desc:"Anomalías térmicas detectadas por satélite" },
  { name:"avg_frp",                src:"FIRMS",    desc:"Potencia radiativa media (MW)" },
  { name:"n_news_articles",        src:"RSS",      desc:"Artículos de prensa indexados" },
  { name:"n_ships",                src:"AISStream",desc:"Posiciones AIS de embarcaciones registradas" },
  { name:"n_social_posts",         src:"Bluesky",  desc:"Publicaciones en redes sociales sobre el conflicto" },
  { name:"avg_social_engagement",  src:"Bluesky",  desc:"Engagement promedio (likes + reposts)" },
];

export function DataArchitectureSection() {
  const [activeTable, setActiveTable] = useState<string|null>(null);
  return (
    <section id="arquitectura" data-bg="light" className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">03 — Arquitectura de Datos</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            Cómo están<br/><span className="text-[#6e6e73]">construidos los datos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Supabase (PostgreSQL) actúa como backend central. Las fuentes crudas alimentan el repositorio, que se transforma en features para el modelo y almacena los resultados. El dashboard lee directamente de las vistas SQL.
          </p>
        </FadeUp>

        {/* Pipeline flow */}
        <FadeUp delay={100}>
          <div className="rounded-2xl bg-white border border-[#d2d2d7] p-10 mb-10 overflow-x-auto">
            <div className="text-[10px] font-mono text-[#6e6e73] tracking-widest mb-6">PIPELINE DE DATOS — FLUJO COMPLETO</div>
            <div className="flex items-center gap-3 min-w-max">
              {[
                { label:"Fuentes", sub:"GDELT · FIRMS · OpenSky · RSS · Bluesky · AIS", color:"#6e6e73" },
                null,
                { label:"raw_events", sub:"557,184 filas · data lake", color:"#0071e3" },
                null,
                { label:"events_*", sub:"gdelt · rss · firms · opensky · ais", color:"#ff9f0a" },
                null,
                { label:"daily_features", sub:"183 filas · feature store", color:"#34c759" },
                null,
                { label:"model_predictions", sub:"732 filas · 4 modelos", color:"#af52de" },
                null,
                { label:"Dashboard", sub:"Next.js · vistas SQL", color:"#1d1d1f" },
              ].map((item, i) => item === null ? (
                <div key={i} className="text-[#d2d2d7] text-xl flex-shrink-0">→</div>
              ) : (
                <div key={i} className="flex-shrink-0 text-center px-4 py-3 rounded-xl border" style={{ borderColor: item.color + "40", backgroundColor: item.color + "08" }}>
                  <div className="text-sm font-bold font-mono text-[#1d1d1f]">{item.label}</div>
                  <div className="text-[10px] text-[#6e6e73] mt-0.5 max-w-[120px]">{item.sub}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-xs text-[#6e6e73] flex flex-wrap gap-6">
              <span>Patrón: <strong className="text-[#1d1d1f]">ELT</strong> — Extract → Load → Transform</span>
              <span>Scripts: <span className="font-mono">gdelt_client.py → normalize.py → build_features.py → train.py</span></span>
            </div>
          </div>
        </FadeUp>

        {/* Tables */}
        <FadeUp delay={100}>
          <h3 className="text-2xl font-bold text-[#1d1d1f] mb-4">Tablas y vistas de Supabase</h3>
          <p className="text-[#6e6e73] mb-8">Hacer clic en una tabla para ver sus columnas</p>
        </FadeUp>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-10">
          {TABLES.map((t, i) => (
            <FadeUp key={t.name} delay={i*50}>
              <button
                onClick={() => setActiveTable(activeTable === t.name ? null : t.name)}
                className={`w-full text-left rounded-xl border p-5 transition-all ${activeTable === t.name ? "ring-2" : "border-[#d2d2d7] bg-white hover:border-[#b0b0b5]"}`}
                style={activeTable === t.name ? { borderColor: t.color, backgroundColor: t.color + "08", outline: `2px solid ${t.color}` } : {}}>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: t.color + "18", color: t.color }}>{t.type}</div>
                  <div className="text-lg font-black font-mono text-[#1d1d1f]">{t.rows}</div>
                </div>
                <div className="text-sm font-bold font-mono text-[#1d1d1f] mb-1">{t.name}</div>
                <div className="text-xs text-[#6e6e73] leading-relaxed">{t.desc}</div>
              </button>
            </FadeUp>
          ))}
        </div>

        {/* Column detail panel */}
        {activeTable && (() => {
          const t = TABLES.find(x => x.name === activeTable)!;
          return (
            <FadeUp>
              <div className="rounded-2xl border p-8 mb-10" style={{ borderColor: t.color + "30", backgroundColor: t.color + "05" }}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black font-mono text-[#1d1d1f]">{t.name}</h4>
                  <button onClick={() => setActiveTable(null)} className="text-[#6e6e73] hover:text-[#1d1d1f] text-sm">cerrar ×</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {t.cols.map(c => (
                    <span key={c} className="text-xs font-mono px-3 py-1.5 rounded-lg border" style={{ borderColor: t.color + "30", backgroundColor: t.color + "10", color: "#1d1d1f" }}>
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </FadeUp>
          );
        })()}

        {/* Views */}
        <FadeUp delay={100}>
          <div className="rounded-2xl border border-[#d2d2d7] bg-white p-8 mb-12">
            <h3 className="text-xl font-bold text-[#1d1d1f] mb-6">Vistas SQL — abstracción para el dashboard</h3>
            <div className="space-y-0">
              {VIEWS.map((v, i) => (
                <div key={v.name} className={`flex gap-6 py-4 ${i > 0 ? "border-t border-[#f0f0f0]" : ""}`}>
                  <div className="w-56 flex-shrink-0 font-mono text-sm font-medium text-[#1d1d1f]">{v.name}</div>
                  <div className="text-sm text-[#6e6e73]">{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Features table */}
        <FadeUp delay={200}>
          <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden">
            <div className="px-8 py-6 border-b border-[#f0f0f0] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-[#1d1d1f]">Las 11 features del modelo</h3>
                <p className="text-sm text-[#6e6e73] mt-1">Variables usadas por KNN, Logistic Regression, Ridge y Naive Bayes</p>
              </div>
              <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/20">
                Target: escalation_level (0/1/2)
              </div>
            </div>
            <div className="divide-y divide-[#f0f0f0]">
              {FEATURES.map((f, i) => (
                <div key={f.name} className={`flex items-start gap-6 px-8 py-4 ${i === 1 ? "bg-[#f0f7ff]" : ""}`}>
                  <div className="w-6 text-xs font-mono text-[#d2d2d7] flex-shrink-0 mt-0.5">{String(i+1).padStart(2,"0")}</div>
                  <div className="w-52 flex-shrink-0 font-mono text-sm font-bold text-[#1d1d1f]">
                    {f.name}
                    {i === 1 && <span className="ml-2 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-[#0071e3] text-white">MÁS PREDICTIVA</span>}
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded" style={{
                      backgroundColor: f.src==="GDELT"?"#0071e320":f.src==="FIRMS"?"#ff3b3020":f.src==="OpenSky"?"#af52de20":f.src==="RSS"?"#ff9f0a20":"#30d15820",
                      color: f.src==="GDELT"?"#0071e3":f.src==="FIRMS"?"#ff3b30":f.src==="OpenSky"?"#af52de":f.src==="RSS"?"#ff9f0a":"#30d158",
                    }}>{f.src}</span>
                  </div>
                  <div className="text-sm text-[#6e6e73] flex-1">{f.desc}</div>
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
// LAS FUENTES — sin emojis, con iconos SVG
// ─────────────────────────────────────────────────────────────────────────────

function SignalIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="2.5"/>
      <path d="M7 7a7 7 0 0 0 0 10M17 7a7 7 0 0 1 0 10"/>
      <path d="M4 4a12 12 0 0 0 0 16M20 4a12 12 0 0 1 0 16"/>
    </svg>
  );
}
function SatelliteIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
      <rect x="6" y="9" width="12" height="6" rx="1"/>
      <path d="M12 9V5M12 15v4M6 12H2M22 12h-4"/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
    </svg>
  );
}
function PlaneIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19.5 2.5 18 1 16 1 14.5 2.5L11 6 2.8 4.2c-.5-.1-.9.1-1.1.5l-.5 1.2c-.2.4-.1.9.3 1.2L7 11l-2 2H2l-1 2 2 1 1 2 2-1v-3l2-2 5.8 3.7c.4.3.9.2 1.2-.2l.5-1.2c.2-.4.1-.9-.2-1.1z"/>
    </svg>
  );
}
function FeedIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
      <path d="M4 11a9 9 0 0 1 9 9"/>
      <path d="M4 4a16 16 0 0 1 16 16"/>
      <circle cx="5" cy="19" r="1.5" fill={color} stroke="none"/>
    </svg>
  );
}
function CloudIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
      <path d="M18 10h-1.3A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  );
}
function ShipIcon({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" className="w-8 h-8">
      <path d="M2 20h20M4 20l2-8h12l2 8"/>
      <path d="M9 12V8h6v4"/>
      <path d="M12 8V4"/>
    </svg>
  );
}

const SOURCES = [
  { id:"GDELT",    name:"GDELT Project",    Icon:SignalIcon,    stat:"120",   unit:"agregados",  color:"#0071e3", desc:"Base de datos global de eventos mediáticos. Captura el tono y volumen de cobertura en tiempo real desde 1979. Fuente primaria del modelo ML." },
  { id:"NASA FIRMS",name:"NASA FIRMS",      Icon:SatelliteIcon,stat:"6,812", unit:"hotspots",   color:"#ff3b30", desc:"Detección de anomalías térmicas satelitales (VIIRS 375m, MODIS 1km). Proxy de explosiones, incendios de infraestructura y actividad militar." },
  { id:"OpenSky",  name:"OpenSky Network",  Icon:PlaneIcon,     stat:"493K",  unit:"trazas",     color:"#af52de", desc:"Rastreo de vuelos en tiempo real sobre el espacio aéreo de Oriente Medio. Los cierres y desvíos de rutas son señal directa de escalada." },
  { id:"RSS",      name:"RSS Feeds",         Icon:FeedIcon,     stat:"141",   unit:"artículos",  color:"#ff9f0a", desc:"Titulares de BBC, Al Jazeera, Google News, Tehran Times y Middle East Eye. Cinco perspectivas editoriales contrastadas sobre el mismo conflicto." },
  { id:"Bluesky",  name:"Bluesky Social",   Icon:CloudIcon,     stat:"61",    unit:"posts",      color:"#30d158", desc:"Red social descentralizada. Volumen de publicaciones y engagement como barómetro de la atención pública global sobre el conflicto." },
  { id:"AISStream",name:"AISStream · AIS",  Icon:ShipIcon,      stat:"138",   unit:"posiciones", color:"#5ac8fa", desc:"Posiciones de embarcaciones en tiempo real. Tráfico naval en el Golfo Pérsico y el Estrecho de Ormuz como indicador geopolítico." },
];

export function SourcesSection() {
  return (
    <section data-bg="light" className="bg-white py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">04 — Las fuentes</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            Cómo lo<br/><span className="text-[#6e6e73]">monitoreamos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Seis fuentes de datos abiertas y gratuitas integradas en un pipeline automatizado. Cada una aporta una dimensión diferente del conflicto.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#d2d2d7] rounded-2xl overflow-hidden mb-20">
          {SOURCES.map((s, i) => (
            <FadeUp key={s.id} delay={i*60}>
              <div className="bg-white p-10 flex flex-col gap-5 h-full">
                <div className="flex items-start justify-between">
                  <s.Icon color={s.color}/>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-full border" style={{ color:s.color, borderColor:s.color+"30", backgroundColor:s.color+"08" }}>ACTIVO</span>
                </div>
                <div>
                  <div className="text-[10px] font-mono font-semibold tracking-widest mb-0.5" style={{ color:s.color }}>{s.id}</div>
                  <div className="text-lg font-bold text-[#1d1d1f]">{s.name}</div>
                </div>
                <p className="text-[14px] text-[#6e6e73] leading-relaxed flex-1">{s.desc}</p>
                <div className="border-t border-[#f0f0f0] pt-4">
                  <span className="text-3xl font-black font-mono text-[#1d1d1f]">{s.stat}</span>
                  <span className="text-sm text-[#6e6e73] ml-2">{s.unit}</span>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>

        {/* Distribution chart */}
        <FadeUp delay={200}>
          <div className="rounded-2xl border border-[#d2d2d7] bg-[#f5f5f7] p-10">
            <div className="text-[10px] font-mono text-[#6e6e73] tracking-widest mb-2">DISTRIBUCIÓN DEL REPOSITORIO CENTRAL · raw_events</div>
            <h3 className="text-2xl font-bold text-[#1d1d1f] mb-2">557,184 eventos almacenados en Supabase</h3>
            <p className="text-[15px] text-[#6e6e73] mb-10">El 88.5% del volumen es tráfico aéreo OpenSky — cada traza de vuelo es un datapoint de movilidad militar y civil en la región</p>
            <SourceDonutChart/>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPA ESTRATÉGICO DEL ESTRECHO
// ─────────────────────────────────────────────────────────────────────────────


export function HormuzMapSection() {
  return (
    <section data-bg="dark" className="bg-[#080f1a] py-40 px-6 overflow-hidden">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-white/30 tracking-widest uppercase mb-6">05 — NASA FIRMS + Geopolítica</p>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            El Estrecho<br/><span className="text-white/25">de Ormuz.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 max-w-3xl">
            {[["6,812","hotspots detectados"],["39 km","ancho del Estrecho"],["20%","del petróleo mundial"]].map(([n,l]) => (
              <div key={l}><div className="text-5xl font-black font-mono text-white mb-1">{n}</div><div className="text-sm text-white/35">{l}</div></div>
            ))}
          </div>
        </FadeUp>

        {/* Leaflet interactive map */}
        <FadeUp delay={100}>
          <div className="rounded-2xl overflow-hidden border border-white/8 mb-12" style={{ background:"#060d18" }}>
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
              <div className="text-xs font-mono text-white/30 tracking-widest">MAPA INTERACTIVO — GOLFO PÉRSICO · NASA FIRMS + AIS + OPENSKY</div>
              <div className="flex items-center gap-5 text-[10px] font-mono text-white/25 flex-wrap">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2 h-2 rounded-full" style={{ background:"linear-gradient(to right,#fecc5c,#f03b20)" }}/>Hotspots FIRMS (FRP)</span>
                <span className="flex items-center gap-1.5"><span style={{ fontSize:12 }}>🚢</span>Buques AIS</span>
                <span className="flex items-center gap-1.5"><span style={{ fontSize:12 }}>✈️</span>Aeronaves OpenSky</span>
              </div>
            </div>
            <div style={{ height: 540 }}>
              <GulfMap />
            </div>
          </div>
        </FadeUp>

        {/* FIRMS table + daily chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <FadeUp delay={100}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">NASA FIRMS · VIIRS · 26–30 MAY 2026</div>
              <h3 className="text-xl font-bold text-white mb-1">Actividad térmica diaria</h3>
              <p className="text-sm text-white/30 mb-2">Hotspots detectados y potencia radiativa (MW) por día</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">Por qué importa:</span> El pico del 29 de mayo (1,834 hotspots · 38,900 MW acumulados) coincide con mayor actividad de buques en el Estrecho según AIS. Las barras muestran el conteo bruto; la línea naranja muestra la energía total liberada — proxy de quema industrial intensa o actividad bélica.
              </p>
              <FRPDailyChart/>
            </div>
          </FadeUp>
          <FadeUp delay={200}>
            <div className="rounded-2xl bg-white/5 border border-white/8 p-8">
              <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">TOP ZONAS · FRP MÁXIMA · DBSCAN eps=25km</div>
              <h3 className="text-xl font-bold text-white mb-1">Puntos de inflexión geopolíticos</h3>
              <p className="text-sm text-white/30 mb-2">227 clusters identificados sobre 6,812 hotspots</p>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                <span className="text-white/70 font-medium">Por qué importa:</span> El FRP (potencia radiativa, MW) mide la intensidad térmica del satélite. Abu Dhabi (331 MW) y Qatar (258 MW) son gas flaring industrial normal. Kirkuk (190 MW) es zona de conflicto activo. Bandar Abbas (34 MW) es el más bajo del ranking pero el más estratégico: es el puerto naval iraní a la entrada del Estrecho — cualquier aumento aquí es una alerta militar inmediata.
              </p>
              <div className="space-y-3">
                {[
                  {n:"Abu Dhabi, UAE",     frp:331.5, c:"#38bdf8", t:"Industrial"},
                  {n:"North Dome, Qatar",  frp:258.1, c:"#22d3ee", t:"Industrial"},
                  {n:"Abqaiq, Aramco",     frp:219.3, c:"#fbbf24", t:"Industrial"},
                  {n:"Kirkuk, Iraq",       frp:189.5, c:"#ef4444", t:"Conflicto"},
                  {n:"Bandar Abbas",       frp:34.0,  c:"#bf5af2", t:"⚠️ Naval"},
                ].map((r,i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor:r.c }}/>
                    <div className="flex-1 text-sm text-white/70">{r.n}</div>
                    <div className="text-sm font-black font-mono" style={{ color:r.c }}>{r.frp} MW</div>
                    <div className="text-[10px] text-white/25 w-16 text-right">{r.t}</div>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>

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
// LA IA — modelos expandidos con detalle individual
// ─────────────────────────────────────────────────────────────────────────────

const FEATURE_NAMES = ["n_conflict_events","avg_goldstein","has_high_violence","n_gdelt_mentions","n_flights","n_hotspots","avg_frp","n_news_articles","n_ships","n_social_posts","avg_social_engagement"];

const MODEL_DETAIL = [
  {
    name:"K-Nearest Neighbors (KNN)", short:"KNN", winner:true,
    f1:0.7513, std:0.031, precision:77.3, recall:74.2,
    color:"#0071e3",
    params:"K = 5 vecinos · Distancia Euclidiana · Pesos uniformes",
    how:"Para cada día de predicción, KNN busca los 5 días más similares en el espacio de las 11 features y vota la clase más frecuente entre ellos. No construye un modelo explícito — razona por analogía directa con el histórico.",
    why:"Los períodos de alta escalada tienden a parecerse entre sí en el espacio de features: días de Kirkuk en llamas + Goldstein negativo + vuelos desviados son similares independientemente de la fecha. KNN captura esa geometría sin asumir linealidad.",
    strengths:["Captura relaciones no lineales","Robusto a distribuciones inusuales","Sin supuestos sobre los datos"],
    limits:["Lento en inferencia (compara con todo el histórico)","Sensible a la escala — requiere normalización","Difícil de interpretar"],
    classF1:{ bajo:0.81, medio:0.72, alto:0.75 },
  },
  {
    name:"Logistic Regression", short:"LR", winner:false,
    f1:0.6240, std:0.028, precision:64.1, recall:61.8,
    color:"#af52de",
    params:"Regularización L2 (C=1.0) · Solver LBFGS · Multi-class: softmax",
    how:"Modela la probabilidad de cada clase como una función logística de una combinación lineal de las features. Produce coeficientes que muestran el peso relativo de cada variable en la predicción.",
    why:"Segunda opción por su interpretabilidad: los coeficientes revelan que avg_goldstein y n_conflict_events son las variables con mayor peso. La regularización L2 previene el sobreajuste cuando algunas features están correlacionadas.",
    strengths:["Coeficientes interpretables","Entrenamiento y predicción muy rápidos","Produce probabilidades calibradas"],
    limits:["Asume fronteras lineales entre clases","Subestima patrones no lineales","Menor F1 que KNN en este dataset"],
    classF1:{ bajo:0.70, medio:0.58, alto:0.62 },
  },
  {
    name:"Ridge Classifier", short:"Ridge", winner:false,
    f1:0.4666, std:0.062, precision:49.2, recall:46.1,
    color:"#6e6e73",
    params:"Regularización L2 (α=1.0) · Minimiza sum(coef²) · One-vs-Rest",
    how:"Adapta la regresión Ridge (mínimos cuadrados regularizados) a clasificación asignando labels numéricos a las clases y regresando hacia ellos. Es el más simple de los clasificadores lineales.",
    why:"A pesar de la simplicidad, se incluye como línea base robusta. Su alta desviación estándar (±0.062) indica que es sensible a la composición de los folds — señal de que el problema requiere un modelo más expresivo.",
    strengths:["Entrenamiento instantáneo","Pesos estables gracias a la regularización","Buena línea base referencial"],
    limits:["Alta varianza entre folds (±6.2pp)","No produce probabilidades directamente","Clasificación binaria OvR puede perder señal multiclase"],
    classF1:{ bajo:0.55, medio:0.41, alto:0.44 },
  },
  {
    name:"Naive Bayes (Gaussiano)", short:"NB", winner:false,
    f1:0.4519, std:0.058, precision:43.8, recall:48.1,
    color:"#ff9f0a",
    params:"Distribución Gaussiana por feature · P(clase) × P(features|clase)",
    how:"Aplica el teorema de Bayes asumiendo que todas las features son estadísticamente independientes entre sí y siguen una distribución normal. Calcula la probabilidad de cada clase y asigna la más alta.",
    why:"El supuesto de independencia es la causa del bajo rendimiento: avg_goldstein y n_conflict_events están altamente correlacionados (r≈0.78), lo que viola la hipótesis fundamental del modelo y distorsiona las probabilidades.",
    strengths:["Entrenamiento y predicción extremadamente rápidos","Funciona bien con pocas muestras","Base probabilística sólida"],
    limits:["Supuesto de independencia incumplido","Subestima la importancia de Goldstein","El peor F1 del conjunto"],
    classF1:{ bajo:0.53, medio:0.39, alto:0.43 },
  },
];

export function MLSection() {
  const [activeModel, setActiveModel] = useState<string>("KNN");
  const selected = MODEL_DETAIL.find(m => m.short === activeModel) ?? MODEL_DETAIL[0];

  return (
    <section id="ia" data-bg="light" className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">06 — La Inteligencia Artificial</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            ¿Puede la IA<br/><span className="text-[#6e6e73]">predecir la guerra?</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-4">
            Cuatro algoritmos, 183 ventanas país-día, validación cruzada estratificada de 5 folds. El objetivo: clasificar cada día de cada país como <span className="font-mono font-bold text-[#34c759]">BAJO</span>, <span className="font-mono font-bold text-[#ff9f0a]">MEDIO</span> o <span className="font-mono font-bold text-[#ff3b30]">ALTO</span>.
          </p>
          <p className="text-base text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Se usaron las 11 features de <span className="font-mono font-bold text-[#1d1d1f]">daily_features</span>, normalizadas con StandardScaler. Métrica principal: <strong className="text-[#1d1d1f]">F1 ponderado</strong> — balancea precisión y recall con clases de igual tamaño.
          </p>
        </FadeUp>

        {/* Model selector tabs */}
        <FadeUp>
          <div className="flex flex-wrap gap-2 mb-10">
            {MODEL_DETAIL.map(m => (
              <button key={m.short} onClick={() => setActiveModel(m.short)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${activeModel===m.short ? "text-white border-transparent" : "border-[#d2d2d7] text-[#6e6e73] bg-white hover:border-[#b0b0b5]"}`}
                style={activeModel===m.short ? { backgroundColor:m.color } : {}}>
                {m.winner ? "★ " : ""}{m.name.split(" ")[0]} {m.name.split(" ")[1] ?? ""}
              </button>
            ))}
          </div>
        </FadeUp>

        {/* Selected model detail */}
        <FadeUp key={selected.short}>
          <div className="rounded-2xl border bg-white overflow-hidden mb-12" style={{ borderColor: selected.color + "30" }}>
            {/* Header */}
            <div className="p-10 border-b" style={{ borderColor: selected.color + "15", backgroundColor: selected.color + "04" }}>
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div>
                  {selected.winner && <div className="text-[10px] font-mono font-black px-3 py-1 rounded-full text-white inline-block mb-3" style={{ backgroundColor: selected.color }}>MODELO SELECCIONADO PARA PRODUCCIÓN</div>}
                  <h3 className="text-3xl font-black text-[#1d1d1f] mb-1">{selected.name}</h3>
                  <p className="text-sm font-mono text-[#6e6e73]">{selected.params}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-6xl font-black font-mono text-[#1d1d1f]">{(selected.f1*100).toFixed(1)}%</div>
                  <div className="text-sm text-[#6e6e73]">F1 ponderado (CV 5-fold)</div>
                </div>
              </div>
              {/* F1 bar */}
              <div className="mt-6 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                <div className="h-2 rounded-full transition-all duration-700" style={{ width:`${selected.f1*100}%`, backgroundColor: selected.color }}/>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-[#f0f0f0]">
              {/* Metrics */}
              <div className="p-8">
                <h4 className="text-xs font-mono text-[#6e6e73] tracking-widest uppercase mb-6">Métricas CV 5-fold</h4>
                <div className="space-y-5">
                  {[["F1 ponderado",(selected.f1*100).toFixed(1)+"%"],["Precisión",selected.precision+"%"],["Recall",selected.recall+"%"],["Desv. estándar","±"+(selected.std*100).toFixed(1)+"pp"]].map(([k,v])=>(
                    <div key={k} className="flex justify-between items-center border-b border-[#f8f8f8] pb-5 last:border-0 last:pb-0">
                      <span className="text-sm text-[#6e6e73]">{k}</span>
                      <span className="text-xl font-black font-mono text-[#1d1d1f]">{v}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-[#f0f0f0]">
                  <div className="text-xs font-mono text-[#6e6e73] tracking-widest uppercase mb-3">F1 por clase</div>
                  {[["Bajo",selected.classF1.bajo,"#34c759"],["Medio",selected.classF1.medio,"#ff9f0a"],["Alto",selected.classF1.alto,"#ff3b30"]].map(([cl,val,c])=>(
                    <div key={cl as string} className="flex items-center gap-3 mb-2">
                      <div className="text-xs font-mono w-10 text-[#6e6e73]">{cl}</div>
                      <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width:`${Number(val)*100}%`, backgroundColor:c as string }}/>
                      </div>
                      <div className="text-xs font-mono font-bold text-[#1d1d1f] w-10 text-right">{((val as number)*100).toFixed(0)}%</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How + Why */}
              <div className="p-8">
                <h4 className="text-xs font-mono text-[#6e6e73] tracking-widest uppercase mb-4">Cómo funciona</h4>
                <p className="text-[14px] text-[#6e6e73] leading-relaxed mb-6">{selected.how}</p>
                <h4 className="text-xs font-mono text-[#6e6e73] tracking-widest uppercase mb-4">Por qué en este contexto</h4>
                <p className="text-[14px] text-[#6e6e73] leading-relaxed">{selected.why}</p>
              </div>

              {/* Strengths + Limits */}
              <div className="p-8">
                <div className="mb-6">
                  <h4 className="text-xs font-mono text-[#34c759] tracking-widest uppercase mb-3">Fortalezas</h4>
                  {selected.strengths.map(s => (
                    <div key={s} className="flex gap-2 mb-2.5">
                      <span className="text-[#34c759] font-bold flex-shrink-0">+</span>
                      <span className="text-sm text-[#6e6e73]">{s}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="text-xs font-mono text-[#ff3b30] tracking-widest uppercase mb-3">Limitaciones</h4>
                  {selected.limits.map(l => (
                    <div key={l} className="flex gap-2 mb-2.5">
                      <span className="text-[#ff3b30] font-bold flex-shrink-0">−</span>
                      <span className="text-sm text-[#6e6e73]">{l}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-6 border-t border-[#f0f0f0]">
                  <h4 className="text-xs font-mono text-[#6e6e73] tracking-widest uppercase mb-3">Features utilizadas</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {FEATURE_NAMES.map(f => (
                      <span key={f} className="text-[10px] font-mono px-2 py-1 bg-[#f5f5f7] text-[#6e6e73] rounded border border-[#e5e5e5]">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Radar comparison */}
        <FadeUp delay={200}>
          <div className="rounded-2xl bg-[#1d1d1f] p-10">
            <div className="text-[10px] font-mono text-white/25 tracking-widest mb-2">COMPARACIÓN MULTIDIMENSIONAL — 4 MODELOS</div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4">Radar de métricas</h3>
                <p className="text-white/40 text-sm leading-relaxed mb-6">El radar muestra cómo cada modelo equilibra cinco dimensiones. KNN domina en F1, Precisión y Recall. Los modelos lineales son más estables y veloces pero sacrifican capacidad predictiva.</p>
                <div className="space-y-2">
                  {[["KNN","#0071e3","75.1%"],["Logistic Reg.","#af52de","62.4%"],["Ridge","#6e6e73","46.7%"],["Naive Bayes","#ff9f0a","45.2%"]].map(([n,c,f])=>(
                    <div key={n as string} className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor:c as string }}/>
                      <div className="flex-1 text-sm text-white/60">{n}</div>
                      <div className="text-sm font-black font-mono text-white">{f}</div>
                    </div>
                  ))}
                </div>
              </div>
              <ModelRadarChart/>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EL PULSO — estado actual expandido
// ─────────────────────────────────────────────────────────────────────────────

const C_META: Record<string, { name: string; flag: string; color: string }> = {
  IRN: { name:"Irán",          flag:"🇮🇷", color:"#ff3b30" },
  ISR: { name:"Israel",        flag:"🇮🇱", color:"#0071e3" },
  USA: { name:"EE.UU.",        flag:"🇺🇸", color:"#34c759" },
};
const LVL: Record<number, { label: string; color: string; desc: string }> = {
  0: { label:"BAJO",  color:"#34c759", desc:"Tono mediático moderado. Eventos conflictivos dentro del rango histórico normal. No se detectan picos de actividad en fuentes OSINT." },
  1: { label:"MEDIO", color:"#ff9f0a", desc:"Goldstein por debajo del cuartil medio. Incremento notable en menciones mediáticas o eventos GDELT. Posible activación de proxies regionales." },
  2: { label:"ALTO",  color:"#ff3b30", desc:"Goldstein en cuartil inferior histórico. Alta densidad de eventos de conflicto. Posible actividad militar directa o crisis diplomática aguda." },
};

export function LiveSection({ latest, recentEvents }: LiveProps) {
  return (
    <section id="hoy" data-bg="dark" className="bg-[#1d1d1f] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <div className="flex items-center gap-3 mb-6">
            <p className="text-sm font-semibold text-white/30 tracking-widest uppercase">07 — Estado actual</p>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
            <span className="text-[11px] font-mono text-red-400">EN VIVO</span>
          </div>
          <h2 className="font-black text-white leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            El conflicto<br/><span className="text-white/25">hoy.</span>
          </h2>
          <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-6">
            Predicción del modelo KNN sobre los últimos datos disponibles de GDELT, NASA FIRMS y OpenSky. Actualizado con cada ejecución del pipeline de ingesta.
          </p>
          <p className="text-sm text-white/25 max-w-2xl leading-relaxed mb-20">
            Los niveles se calculan comparando la señal actual con los cuartiles históricos de cada país por separado. Un nivel ALTO en Irán no equivale al mismo umbral Goldstein que ALTO en EE.UU.
          </p>
        </FadeUp>

        {/* Country cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/8 rounded-2xl overflow-hidden mb-10">
          {(["IRN","ISR","USA"] as const).map((code,i) => {
            const meta = C_META[code]; const state = latest[code];
            const lvl  = (state?.escalation_level ?? 0) as 0|1|2;
            const info = LVL[lvl];
            return (
              <FadeUp key={code} delay={i*120}>
                <div className="bg-[#1d1d1f] p-10 flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{meta.flag}</span>
                    <span className="text-xs font-mono text-white/20">{code}</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-white mb-1">{meta.name}</div>
                    <div className="text-xs font-mono text-white/25">Último dato: {state?.date ?? "—"}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor:info.color }}/>
                      <span className="text-4xl font-black font-mono" style={{ color:info.color }}>{info.label}</span>
                    </div>
                    <div className="text-xs text-white/30 font-mono">Nivel {lvl} de 2</div>
                  </div>
                  {/* Interpretation */}
                  <div className="text-xs text-white/30 leading-relaxed border-t border-white/8 pt-4">{info.desc}</div>
                  {/* Raw data */}
                  {state && (
                    <div className="space-y-2.5 border-t border-white/8 pt-4">
                      {[["Eventos GDELT",state.n_conflict_events?.toLocaleString("es-CO")],["Goldstein promedio",state.avg_goldstein?.toFixed(2)],["Menciones mediáticas",state.n_gdelt_mentions?.toLocaleString("es-CO")]].map(([k,v])=>(
                        <div key={k} className="flex justify-between">
                          <span className="text-xs text-white/25">{k}</span>
                          <span className="text-xs font-mono text-white/55">{v ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeUp>
            );
          })}
        </div>

        {/* What each level means */}
        <FadeUp delay={200}>
          <div className="rounded-2xl bg-white/4 border border-white/8 p-8 mb-10">
            <div className="text-[10px] font-mono text-white/25 tracking-widest mb-6">INTERPRETACIÓN DE NIVELES — REFERENCIA</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0,1,2].map(l => {
                const info = LVL[l];
                return (
                  <div key={l} className="flex gap-4">
                    <div className="w-1 rounded-full flex-shrink-0" style={{ backgroundColor:info.color }}/>
                    <div>
                      <div className="font-black font-mono text-lg mb-2" style={{ color:info.color }}>Nivel {l} — {info.label}</div>
                      <p className="text-sm text-white/35 leading-relaxed">{info.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeUp>

        {/* Recent events */}
        {recentEvents.length > 0 && (
          <FadeUp>
            <div className="rounded-2xl overflow-hidden border border-white/8">
              <div className="px-8 py-5 border-b border-white/8 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Últimos eventos registrados</span>
                <span className="text-xs font-mono text-white/20">raw_events · Supabase</span>
              </div>
              {recentEvents.slice(0,6).map((ev,i) => (
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
  { n:"01",title:"El tono mediático predice la guerra.",     c:"#0071e3",body:"La escala Goldstein de GDELT es la variable más predictiva del nivel de escalada. Los medios globales capturan la tensión antes de que se materialice en eventos físicos. Goldstein por debajo de −5 es señal de escalada inminente." },
  { n:"02",title:"El Estrecho de Ormuz es el nodo crítico.", c:"#ff3b30",body:"Bandar Abbas — puerto naval iraní — concentra el riesgo geopolítico más alto de la región. Un bloqueo desencadenaría una crisis energética global en 72 horas: 20% del petróleo y 30% del GNL mundiales." },
  { n:"03",title:"KNN supera a todos los modelos base.",     c:"#34c759",body:"Con F1=0.75 en CV de 5 folds, KNN supera en 30 puntos porcentuales a Naive Bayes. La similitud temporal entre días de conflicto — rachas de alta escalada — explica la ventaja sobre modelos lineales." },
  { n:"04",title:"2026 registra la escalada más alta.",      c:"#ff9f0a",body:"Marzo–Abril 2026 es el período más conflictivo del histórico monitoreado. Los tres países en nivel ALTO durante 11 días consecutivos — hecho sin precedentes desde octubre de 2023." },
  { n:"05",title:"Las fuentes abiertas son suficientes.",    c:"#af52de",body:"Con datos 100% gratuitos — GDELT, FIRMS, OpenSky, RSS, Bluesky, AISStream — el sistema clasifica la escalada con F1=0.75, validando la hipótesis central: OSINT es suficiente para monitorear conflictos de alta visibilidad." },
];

export function FindingsSection() {
  return (
    <section data-bg="light" className="bg-[#f5f5f7] py-40 px-6">
      <div className="max-w-screen-xl mx-auto">
        <FadeUp>
          <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-6">08 — Conclusiones</p>
          <h2 className="font-black text-[#1d1d1f] leading-[0.9] tracking-tight mb-8" style={{ fontSize:"clamp(3rem, 7vw, 6.5rem)" }}>
            Lo que<br/><span className="text-[#6e6e73]">encontramos.</span>
          </h2>
          <p className="text-lg md:text-xl text-[#6e6e73] max-w-2xl leading-relaxed mb-20">
            Cinco hallazgos a partir de 557,184 eventos crudos, 183 ventanas país-día y cuatro modelos de clasificación.
          </p>
        </FadeUp>
        <div className="space-y-0 mb-32">
          {FINDINGS.map((f,i) => (
            <FadeUp key={f.n} delay={i*70}>
              <div className="flex gap-8 py-10 border-t border-[#d2d2d7]">
                <div className="text-4xl font-black font-mono flex-shrink-0 leading-none" style={{ color:f.c }}>{f.n}</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-[#1d1d1f] mb-3 leading-snug">{f.title}</h3>
                  <p className="text-lg text-[#6e6e73] leading-relaxed max-w-2xl">{f.body}</p>
                </div>
              </div>
            </FadeUp>
          ))}
          <div className="border-t border-[#d2d2d7]"/>
        </div>
        {/* Limitaciones del sistema */}
        <FadeUp delay={500}>
          <div className="rounded-2xl border border-[#d2d2d7] bg-white overflow-hidden mb-20">
            <div className="px-10 py-8 border-b border-[#f0f0f0]">
              <p className="text-sm font-semibold text-[#6e6e73] tracking-widest uppercase mb-2">Limitaciones del sistema</p>
              <h3 className="text-2xl font-bold text-[#1d1d1f]">Lo que este sistema no puede hacer</h3>
              <p className="text-[#6e6e73] mt-2 max-w-2xl">
                Un sistema riguroso documenta sus propios límites. Estas son las restricciones conocidas del presente análisis.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#f0f0f0]">
              {[
                {
                  icon: "01",
                  title: "No predice eventos, clasifica patrones",
                  body: "El modelo clasifica el nivel de escalada de un día dado — no predice cuándo ocurrirá el próximo ataque. La diferencia es importante: el sistema detecta patrones históricos similares, no causas futuras.",
                  color: "#ff3b30",
                },
                {
                  icon: "02",
                  title: "Cobertura FIRMS limitada a 5 días",
                  body: "La API gratuita de NASA FIRMS entrega máximo 5 días de datos por solicitud. El mapa de hotspots refleja solo 26–30 mayo 2026, no el histórico completo. Para análisis temporal extendido se requiere suscripción pagada.",
                  color: "#ff9f0a",
                },
                {
                  icon: "03",
                  title: "GDELT puede sobrerepresentar conflictos visibles",
                  body: "GDELT indexa medios en idioma inglés con mayor densidad. Eventos en farsi, árabe o hebreo pueden estar subrepresentados. El tono Goldstein refleja la cobertura mediática, no necesariamente la realidad en campo.",
                  color: "#af52de",
                },
                {
                  icon: "04",
                  title: "El target es una simplificación",
                  body: "Reducir la escalada a 3 niveles (Bajo/Medio/Alto) mediante cuartiles de Goldstein es una decisión de diseño que introduce pérdida de información. Días en el límite de cuartil pueden ser clasificados incorrectamente por pequeñas variaciones.",
                  color: "#0071e3",
                },
                {
                  icon: "05",
                  title: "Bluesky y AIS tienen volumen muy bajo",
                  body: "Con 61 posts (Bluesky) y 138 registros AIS en el período cubierto, estas fuentes tienen poder estadístico insuficiente para ser determinantes en el modelo. Su inclusión es metodológica — demuestran integración multifuente.",
                  color: "#34c759",
                },
                {
                  icon: "06",
                  title: "La simulación del mapa no es en tiempo real",
                  body: "Los buques y aeronaves del mapa siguen rutas preestablecidas simuladas — no son posiciones AIS/OpenSky en tiempo real. Los datos reales corresponden a mayo 2026 e incluyen 138 registros AIS y 493K trazas OpenSky históricas.",
                  color: "#6e6e73",
                },
              ].map((l, i) => (
                <div key={i} className="px-8 py-7 flex gap-5">
                  <div className="text-2xl font-black font-mono flex-shrink-0" style={{ color: l.color, opacity: 0.35 }}>{l.icon}</div>
                  <div>
                    <div className="text-sm font-bold text-[#1d1d1f] mb-2">{l.title}</div>
                    <p className="text-sm text-[#6e6e73] leading-relaxed">{l.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={600}>
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
          Universidad Externado de Colombia<br/>Machine Learning 1 · ML1-2026I
        </div>
      </div>
    </footer>
  );
}
