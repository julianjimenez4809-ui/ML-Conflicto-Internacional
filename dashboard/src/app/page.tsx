import { supabase } from "@/lib/supabase";
import type { TimelinePoint, DistPoint } from "./charts";
import {
  HeroSection,
  ContextSection,
  SignalsSection,
  DataSection,
  FirmsSection,
  MLSection,
  LiveSection,
  FindingsSection,
} from "./story-sections";

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

  // Latest escalation per country (first occurrence DESC = most recent date)
  const latest: Record<string, {
    escalation_level: number;
    date: string;
    n_conflict_events: number;
    avg_goldstein: number;
    n_gdelt_mentions: number;
  }> = {};
  for (const row of latestRaw ?? []) {
    if (!latest[row.country]) latest[row.country] = row as typeof latest[string];
  }

  // Pivot timeline: date → { IRN?, ISR?, USA? }
  const timelineMap: Record<string, TimelinePoint> = {};
  for (const row of timelineRaw ?? []) {
    if (!timelineMap[row.date]) timelineMap[row.date] = { date: row.date };
    (timelineMap[row.date] as Record<string, unknown>)[row.country] = row.level_real;
  }
  const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  // Pivot distribution: level → { IRN, ISR, USA }
  const distMap: Record<number, DistPoint> = {};
  for (const row of distributionRaw ?? []) {
    const lvl = row.escalation_level as number;
    const label = lvl === 0 ? "Bajo (0)" : lvl === 1 ? "Medio (1)" : "Alto (2)";
    if (!distMap[lvl]) distMap[lvl] = { level: label, IRN: 0, ISR: 0, USA: 0 };
    (distMap[lvl] as Record<string, unknown>)[row.country as string] = row.dias;
  }
  const distribution = [0, 1, 2].map((l) => distMap[l]).filter(Boolean) as DistPoint[];

  const recentEvents = (recentRaw ?? []).map((r) => ({
    timestamp: r.timestamp ?? "",
    source: r.source ?? "",
    country: r.country ?? null,
    event_type: r.event_type ?? null,
    text: r.text ?? null,
  }));

  return { latest, recentEvents, timeline, distribution };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function Home() {
  const { latest, recentEvents, timeline, distribution } = await getPageData();

  return (
    <main className="bg-[#040710]">
      <HeroSection />
      <ContextSection />
      <SignalsSection />
      <DataSection timeline={timeline} distribution={distribution} />
      <FirmsSection />
      <MLSection />
      <LiveSection latest={latest} recentEvents={recentEvents} />
      <FindingsSection />
    </main>
  );
}
