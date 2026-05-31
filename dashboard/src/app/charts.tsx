"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
} from "recharts";

const COUNTRY_COLORS: Record<string, string> = {
  IRN: "#ef4444",
  ISR: "#3b82f6",
  USA: "#22c55e",
};

const LEVEL_LABELS: Record<number, string> = { 0: "Bajo", 1: "Medio", 2: "Alto" };

export type TimelinePoint = {
  date: string;
  IRN?: number;
  ISR?: number;
  USA?: number;
};

export type DistPoint = {
  level: string;
  IRN: number;
  ISR: number;
  USA: number;
};

export function EscalationTimeline({ data }: { data: TimelinePoint[] }) {
  const [active, setActive] = useState<Set<string>>(new Set(["IRN", "ISR", "USA"]));

  const toggle = (c: string) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(c)) {
        if (next.size > 1) next.delete(c);
      } else {
        next.add(c);
      }
      return next;
    });

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {(["IRN", "ISR", "USA"] as const).map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`px-3 py-1 rounded text-xs font-medium transition-opacity ${
              active.has(c) ? "opacity-100" : "opacity-25"
            }`}
            style={{
              backgroundColor: COUNTRY_COLORS[c] + "22",
              color: COUNTRY_COLORS[c],
              border: `1px solid ${COUNTRY_COLORS[c]}`,
            }}
          >
            {c}
          </button>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            tickFormatter={(d: string) => d.slice(5)}
            interval={Math.floor(data.length / 8)}
          />
          <YAxis
            domain={[0, 2]}
            ticks={[0, 1, 2]}
            tickFormatter={(v: number) => LEVEL_LABELS[v] ?? String(v)}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1f2937",
              border: "1px solid #374151",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any, name: any) => [LEVEL_LABELS[v as number] ?? String(v), String(name ?? "")]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
          {(["IRN", "ISR", "USA"] as const).map((c) =>
            active.has(c) ? (
              <Line
                key={c}
                type="stepAfter"
                dataKey={c}
                stroke={COUNTRY_COLORS[c]}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistributionChart({ data }: { data: DistPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="level" tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: 8,
          }}
          labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(v: any, name: any) => [`${v} días`, String(name ?? "")]}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
        <Bar dataKey="IRN" fill={COUNTRY_COLORS.IRN} radius={[3, 3, 0, 0]} />
        <Bar dataKey="ISR" fill={COUNTRY_COLORS.ISR} radius={[3, 3, 0, 0]} />
        <Bar dataKey="USA" fill={COUNTRY_COLORS.USA} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
