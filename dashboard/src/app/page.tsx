import { supabase } from "@/lib/supabase";
import type { TimelinePoint, DistPoint } from "./charts";
import {
  NavBar, HeroSection, VideoBreak, ConflictSection, DataSection,
  DataArchitectureSection, SourcesSection, HormuzMapSection,
  MLSection, LiveSection, FindingsSection, FooterSection,
} from "./story-sections";

const VIDEOS = {
  conflict:  "/videos/military.mp4",
  satellite: "/videos/tanker.mp4",
  newsroom:  "/videos/newsroom.mp4",
};

// ── Data fetching ─────────────────────────────────────────────────────────────

async function getPageData() {
  const [
    { data: latestRaw },
    { data: recentRaw },
    { data: timelineRaw },
    { data: distributionRaw },
  ] = await Promise.all([
    supabase
      .from("daily_features")
      .select("date, country, escalation_level, n_conflict_events, avg_goldstein, n_gdelt_mentions")
      .order("date", { ascending: false })
      .limit(30),
    supabase
      .from("raw_events")
      .select("timestamp, source, country, event_type, text")
      .order("timestamp", { ascending: false })
      .limit(10),
    supabase
      .from("v_escalation_timeline")
      .select("date, country, level_real, model_name")
      .eq("model_name", "knn")
      .order("date", { ascending: true }),
    supabase.from("v_target_distribution").select("*"),
  ]);

  const latest: Record<string, {
    escalation_level: number; date: string;
    n_conflict_events: number; avg_goldstein: number; n_gdelt_mentions: number;
  }> = {};
  for (const row of latestRaw ?? []) {
    if (!latest[row.country]) latest[row.country] = row as typeof latest[string];
  }

  const timelineMap: Record<string, TimelinePoint> = {};
  for (const row of timelineRaw ?? []) {
    if (!timelineMap[row.date]) timelineMap[row.date] = { date: row.date };
    (timelineMap[row.date] as Record<string, unknown>)[row.country] = row.level_real;
  }
  const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  const distMap: Record<number, DistPoint> = {};
  for (const row of distributionRaw ?? []) {
    const lvl = row.escalation_level as number;
    const label = lvl === 0 ? "Bajo (0)" : lvl === 1 ? "Medio (1)" : "Alto (2)";
    if (!distMap[lvl]) distMap[lvl] = { level: label, IRN: 0, ISR: 0, USA: 0 };
    (distMap[lvl] as Record<string, unknown>)[row.country as string] = row.dias;
  }
  const distribution = [0, 1, 2].map(l => distMap[l]).filter(Boolean) as DistPoint[];

  const recentEvents = (recentRaw ?? []).map(r => ({
    timestamp: r.timestamp ?? "", source: r.source ?? "",
    country: r.country ?? null, event_type: r.event_type ?? null, text: r.text ?? null,
  }));

  return { latest, recentEvents, timeline, distribution };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  const { latest, recentEvents, timeline, distribution } = await getPageData();

  return (
    <>
      <NavBar />
      <main>
        {/* 01 · Hero */}
        <HeroSection />

        {/* Video 1 — transición al conflicto (imágenes de guerra / noticieros) */}
        <VideoBreak
          src={VIDEOS.conflict}
          title="Una crisis global."
          subtitle="Irán, Israel y EE.UU. en el punto de mayor tensión desde la Guerra Fría"
          gradient="from-[#1d1d1f] via-[#2d1010] to-[#1d1d1f]"
          height="55vh"
        />

        {/* 02 · El conflicto — contexto histórico + timeline */}
        <ConflictSection />

        {/* 03 · Los datos — 6 gráficas */}
        <DataSection timeline={timeline} distribution={distribution} />

        {/* 04 · Arquitectura de datos — Supabase + ER + features */}
        <DataArchitectureSection />

        {/* 05 · Las fuentes */}
        <SourcesSection />

        {/* Video 2 — transición al mapa (satélite / buques / Golfo Pérsico) */}
        <VideoBreak
          src={VIDEOS.satellite}
          title="El Estrecho de Ormuz."
          subtitle="6,812 anomalías térmicas detectadas · NASA FIRMS · Mayo 2026"
          gradient="from-[#080f1a] via-[#0a1e35] to-[#080f1a]"
          height="55vh"
        />

        {/* 05 · Mapa del Estrecho + FIRMS */}
        <HormuzMapSection />

        {/* 06 · La IA */}
        <MLSection />

        {/* 07 · Estado actual en vivo */}
        <LiveSection latest={latest} recentEvents={recentEvents} />

        {/* Video 3 — transición a conclusiones (newsroom / breaking news) */}
        <VideoBreak
          src={VIDEOS.newsroom}
          title="Lo que encontramos."
          subtitle="Inteligencia artificial aplicada al conflicto más monitoreado de 2026"
          gradient="from-[#1d1d1f] via-[#1a1a2e] to-[#1d1d1f]"
          height="50vh"
        />

        {/* 08 · Conclusiones */}
        <FindingsSection />

        <FooterSection />
      </main>
    </>
  );
}
