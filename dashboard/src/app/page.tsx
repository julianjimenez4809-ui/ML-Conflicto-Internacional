import { supabase } from "@/lib/supabase";
import { EscalationTimeline, DistributionChart } from "./charts";
import type { TimelinePoint, DistPoint } from "./charts";

const MODEL_RESULTS = [
  { model: "KNN",                 f1: 0.751, std: 0.031 },
  { model: "Logistic Regression", f1: 0.624, std: 0.028 },
  { model: "Ridge Classifier",    f1: 0.467, std: 0.062 },
  { model: "Naive Bayes",         f1: 0.452, std: 0.058 },
];

type LatestEntry = {
  date: string;
  country: string;
  escalation_level: number;
  n_conflict_events: number;
  avg_goldstein: number;
  n_gdelt_mentions: number;
};

async function getStats() {
  const [
    { count: totalEvents },
    { data: sources },
    { data: recentEvents },
    { data: latestRaw },
    { data: timelineRaw },
    { data: distributionRaw },
  ] = await Promise.all([
    supabase.from("raw_events").select("*", { count: "exact", head: true }),
    supabase.from("raw_events").select("source").limit(5000),
    supabase
      .from("raw_events")
      .select("timestamp, source, country, event_type, text")
      .order("timestamp", { ascending: false })
      .limit(8),
    supabase
      .from("daily_features")
      .select("date, country, escalation_level, n_conflict_events, avg_goldstein, n_gdelt_mentions")
      .order("date", { ascending: false })
      .limit(30),
    supabase
      .from("v_escalation_timeline")
      .select("date, country, level_real, model_name")
      .eq("model_name", "knn")
      .order("date", { ascending: true }),
    supabase.from("v_target_distribution").select("*"),
  ]);

  // Source counts
  const sourceCounts: Record<string, number> = {};
  for (const row of sources ?? []) {
    sourceCounts[row.source] = (sourceCounts[row.source] ?? 0) + 1;
  }

  // Latest escalation per country (first occurrence DESC = most recent date)
  const latest: Record<string, LatestEntry> = {};
  for (const row of latestRaw ?? []) {
    if (!latest[row.country]) latest[row.country] = row as LatestEntry;
  }

  // Pivot timeline: date → { IRN, ISR, USA }
  const timelineMap: Record<string, TimelinePoint> = {};
  for (const row of timelineRaw ?? []) {
    if (!timelineMap[row.date]) timelineMap[row.date] = { date: row.date };
    (timelineMap[row.date] as Record<string, unknown>)[row.country] = row.level_real;
  }
  const timeline = Object.values(timelineMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Pivot distribution: level → { IRN, ISR, USA }
  const distMap: Record<number, DistPoint> = {};
  for (const row of distributionRaw ?? []) {
    const lvl = row.escalation_level as number;
    const label = lvl === 0 ? "Bajo (0)" : lvl === 1 ? "Medio (1)" : "Alto (2)";
    if (!distMap[lvl]) distMap[lvl] = { level: label, IRN: 0, ISR: 0, USA: 0 };
    (distMap[lvl] as Record<string, unknown>)[row.country as string] = row.dias;
  }
  const distribution = [0, 1, 2].map((l) => distMap[l]).filter(Boolean) as DistPoint[];

  return { totalEvents, sourceCounts, recentEvents, latest, timeline, distribution };
}

const escalationBg = (lvl: number) =>
  lvl === 0
    ? "bg-green-950 border-green-800"
    : lvl === 1
    ? "bg-yellow-950 border-yellow-800"
    : "bg-red-950 border-red-800";

const escalationColor = (lvl: number) =>
  lvl === 0 ? "text-green-400" : lvl === 1 ? "text-yellow-400" : "text-red-400";

const escalationLabel = (lvl: number) =>
  lvl === 0 ? "Bajo" : lvl === 1 ? "Medio" : "Alto";

export default async function Home() {
  const { totalEvents, sourceCounts, recentEvents, latest, timeline, distribution } =
    await getStats();

  const bestModel = MODEL_RESULTS[0];

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-8">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium uppercase tracking-widest">
            En vivo — Supabase conectado
          </span>
        </div>
        <h1 className="text-3xl font-bold text-white">
          Sistema de Inteligencia Multifuente
        </h1>
        <p className="mt-2 text-gray-400">
          Conflicto Irán – Israel – EE.UU. &nbsp;|&nbsp; ML1 2026-I &nbsp;|&nbsp;
          Universidad Externado de Colombia
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          label="Eventos en BD"
          value={totalEvents?.toLocaleString("es-CO") ?? "—"}
          sub="raw_events en Supabase"
          color="blue"
        />
        <StatCard
          label="Mejor modelo"
          value={bestModel.model}
          sub={`F1 = ${bestModel.f1.toFixed(3)} ± ${bestModel.std.toFixed(3)}`}
          color="green"
        />
        <StatCard
          label="Días analizados"
          value={String(timeline.length)}
          sub="Ventanas país-día · GDELT"
          color="purple"
        />
        <StatCard
          label="Modelos evaluados"
          value="4"
          sub="CV 5-fold · Escalada 0-1-2"
          color="yellow"
        />
      </div>

      {/* Estado de escalada por país */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Estado de escalada — última fecha disponible
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["IRN", "ISR", "USA"] as const).map((c) => {
            const d = latest[c];
            const lvl = d?.escalation_level ?? 0;
            return (
              <div key={c} className={`rounded-xl border p-5 ${escalationBg(lvl)}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xl text-white">{c}</span>
                  <span
                    className={`text-sm font-bold px-2 py-0.5 rounded ${escalationColor(lvl)}`}
                  >
                    Nivel {lvl} — {escalationLabel(lvl)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{d?.date ?? "sin datos"}</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300">
                  <span>Eventos GDELT</span>
                  <span className="text-right font-mono">
                    {d?.n_conflict_events?.toLocaleString("es-CO") ?? "—"}
                  </span>
                  <span>Goldstein avg</span>
                  <span className="text-right font-mono">
                    {d?.avg_goldstein?.toFixed(2) ?? "—"}
                  </span>
                  <span>Menciones</span>
                  <span className="text-right font-mono">
                    {d?.n_gdelt_mentions?.toLocaleString("es-CO") ?? "—"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Timeline + Distribución */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-1 text-white">
            Nivel de escalada en el tiempo
          </h2>
          <p className="text-xs text-gray-500 mb-4">Modelo KNN · predicciones reales</p>
          <EscalationTimeline data={timeline} />
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-1 text-white">
            Distribución del target por país
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Días por nivel · clases balanceadas por cuartiles GDELT
          </p>
          <DistributionChart data={distribution} />
        </section>
      </div>

      {/* Modelos + Fuentes / Pregunta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">
            Resultados del modelo (CV 5-fold)
          </h2>
          <div className="space-y-3">
            {MODEL_RESULTS.map((r, i) => (
              <ModelRow
                key={r.model}
                model={r.model}
                f1={r.f1}
                std={r.std}
                isBest={i === 0}
              />
            ))}
          </div>
        </section>

        <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col gap-5">
          <div>
            <h2 className="text-xl font-semibold mb-2 text-white">Pregunta analítica</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              ¿Es posible clasificar el nivel de escalada del conflicto
              Irán–Israel–EE.UU. en ventanas país-día usando exclusivamente fuentes
              abiertas y gratuitas: eventos estructurados, noticias, movilidad
              aérea y señales sociales?
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
              Fuentes activas
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <SourceRow
                type="Estructurada"
                name="GDELT"
                desc="Eventos, tono Goldstein, menciones"
                count={sourceCounts["gdelt"]}
              />
              <SourceRow
                type="Satélite"
                name="FIRMS"
                desc="Anomalías térmicas / explosiones"
                count={sourceCounts["firms"]}
              />
              <SourceRow
                type="Textual"
                name="RSS"
                desc="BBC · Al Jazeera · Google News"
                count={sourceCounts["rss"]}
              />
              <SourceRow
                type="Movilidad"
                name="OpenSky"
                desc="Tráfico aéreo Medio Oriente"
                count={sourceCounts["opensky"]}
              />
              <SourceRow
                type="Social"
                name="Bluesky"
                desc="Posts públicos del conflicto"
                count={sourceCounts["bluesky"]}
              />
            </ul>
          </div>
        </section>
      </div>

      {/* Eventos recientes */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">
          Últimos eventos registrados
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-gray-300">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 pr-4">Fuente</th>
                <th className="pb-3 pr-4">País</th>
                <th className="pb-3 pr-4">Tipo</th>
                <th className="pb-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {(recentEvents ?? []).map((ev, i) => (
                <tr
                  key={i}
                  className="border-b border-gray-800/50 hover:bg-gray-800/30"
                >
                  <td className="py-2 pr-4 text-gray-400 text-xs whitespace-nowrap">
                    {new Date(ev.timestamp).toLocaleString("es-CO", {
                      timeZone: "UTC",
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="py-2 pr-4">
                    <SourceBadge source={ev.source} />
                  </td>
                  <td className="py-2 pr-4">{ev.country ?? "—"}</td>
                  <td className="py-2 pr-4 text-gray-400">{ev.event_type}</td>
                  <td className="py-2 text-gray-500 truncate max-w-xs">{ev.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

// ── Componentes ────────────────────────────────────────────────────────────────

const colorMap: Record<string, string> = {
  blue:   "bg-blue-950 border-blue-800 text-blue-300",
  green:  "bg-green-950 border-green-800 text-green-300",
  purple: "bg-purple-950 border-purple-800 text-purple-300",
  yellow: "bg-yellow-950 border-yellow-800 text-yellow-300",
};

function StatCard({
  label,
  value,
  sub,
  color = "blue",
}: {
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className={`rounded-xl p-6 border ${colorMap[color] ?? colorMap.blue}`}>
      <p className="text-sm opacity-70">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      <p className="text-xs mt-1 opacity-50">{sub}</p>
    </div>
  );
}

const typeColors: Record<string, string> = {
  Estructurada: "bg-blue-900 text-blue-300",
  Satélite:     "bg-orange-900 text-orange-300",
  Textual:      "bg-green-900 text-green-300",
  Movilidad:    "bg-yellow-900 text-yellow-300",
  Social:       "bg-purple-900 text-purple-300",
};

function SourceRow({
  type,
  name,
  desc,
  count,
}: {
  type: string;
  name: string;
  desc: string;
  count?: number;
}) {
  return (
    <li className="flex items-start gap-3">
      <span
        className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
          typeColors[type] ?? "bg-gray-700 text-gray-300"
        }`}
      >
        {type}
      </span>
      <span className="flex-1">
        <span className="font-medium text-white">{name}</span>
        <span className="text-gray-400"> — {desc}</span>
      </span>
      {count !== undefined && (
        <span className="text-xs text-gray-500 shrink-0">
          {count.toLocaleString("es-CO")} ev.
        </span>
      )}
    </li>
  );
}

function ModelRow({
  model,
  f1,
  std,
  isBest,
}: {
  model: string;
  f1: number;
  std: number;
  isBest: boolean;
}) {
  const pct = Math.round(f1 * 100);
  return (
    <div
      className={`rounded-lg p-3 ${
        isBest
          ? "bg-green-900/30 border border-green-700"
          : "bg-gray-800"
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-white flex items-center gap-2">
          {isBest && <span className="text-yellow-400">★</span>}
          {model}
        </span>
        <span className="text-sm text-gray-300">
          F1 {f1.toFixed(3)}{" "}
          <span className="text-gray-500">± {std.toFixed(3)}</span>
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${isBest ? "bg-green-400" : "bg-blue-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const sourceBadgeMap: Record<string, string> = {
  firms:   "bg-orange-900 text-orange-300",
  acled:   "bg-red-900 text-red-300",
  gdelt:   "bg-green-900 text-green-300",
  rss:     "bg-teal-900 text-teal-300",
  opensky: "bg-yellow-900 text-yellow-300",
  bluesky: "bg-purple-900 text-purple-300",
};

function SourceBadge({ source }: { source: string }) {
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded font-medium ${
        sourceBadgeMap[source] ?? "bg-gray-700 text-gray-300"
      }`}
    >
      {source}
    </span>
  );
}
