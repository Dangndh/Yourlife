import type { Metric, MetricPoint } from "./types";

type T = { (key: string, values?: Record<string, string | number>): string; has: (key: string) => boolean };

/** Seeded metrics are stored with English names; show them translated. Custom names stay as typed. */
export function metricName(t: T, metric: Pick<Metric, "name">) {
  const key = `metricNames.${metric.name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
  return t.has(key) ? t(key) : metric.name;
}

export function formatMetricValue(metric: Pick<Metric, "unit" | "value_type">, value: number, locale: string) {
  if (metric.value_type === "currency" && metric.unit && /^[A-Z]{3}$/.test(metric.unit)) {
    return new Intl.NumberFormat(locale, { style: "currency", currency: metric.unit, maximumFractionDigits: 0 }).format(value);
  }
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value);
  if (!metric.unit || metric.unit === "times") return n;
  if (metric.unit === "%" || metric.unit.startsWith("/")) return `${n}${metric.unit}`;
  return `${n} ${metric.unit}`;
}

/** Combine points that share a period_start using the metric's aggregation. */
export function aggregate(points: MetricPoint[], aggregation: Metric["aggregation"]): MetricPoint[] {
  const groups = new Map<string, number[]>();
  for (const p of points) groups.set(p.period_start, [...(groups.get(p.period_start) ?? []), Number(p.value)]);
  return Array.from(groups.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([period_start, vs]) => {
      const value =
        aggregation === "sum" || aggregation === "count"
          ? vs.reduce((s, v) => s + v, 0)
          : aggregation === "avg"
            ? vs.reduce((s, v) => s + v, 0) / vs.length
            : aggregation === "min"
              ? Math.min(...vs)
              : aggregation === "max"
                ? Math.max(...vs)
                : vs.at(-1)!;
      return { period_start, value };
    });
}

/** "good" | "bad" | "flat" for the change from previous to latest, given the metric's better direction. */
export function trend(metric: Pick<Metric, "direction">, points: MetricPoint[]) {
  if (points.length < 2) return null;
  const last = points.at(-1)!.value;
  const prev = points.at(-2)!.value;
  const delta = last - prev;
  if (delta === 0 || metric.direction === "neutral") return { delta, tone: "flat" as const };
  const good = metric.direction === "up" ? delta > 0 : delta < 0;
  return { delta, tone: good ? ("good" as const) : ("bad" as const) };
}

/** Start of the week (Monday, like Postgres date_trunc) or month for a YYYY-MM-DD day. */
export function periodStart(day: string, period: Metric["period"]) {
  if (period === "month") return `${day.slice(0, 7)}-01`;
  if (period === "week") {
    const d = new Date(`${day}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  return day;
}

/** Options for metric pickers: translated name plus unit. */
export function metricOptions(t: T, metrics: Pick<Metric, "id" | "name" | "unit">[]) {
  return metrics.map((m) => ({ id: m.id, label: m.unit ? `${metricName(t, m)} (${m.unit})` : metricName(t, m) }));
}
