import { createClient } from "@/lib/supabase/server";

import { aggregate, periodStart } from "./format";
import type { Metric, MetricEntry, MetricPoint } from "./types";

const COLS = "id, life_area_id, name, unit, value_type, aggregation, direction, source, derived_key, period, is_archived";

export async function getMetrics(filter: { lifeAreaId?: string; includeArchived?: boolean; manualOnly?: boolean } = {}) {
  const supabase = await createClient();
  let q = supabase.from("metrics").select(COLS).is("deleted_at", null).order("created_at");
  if (!filter.includeArchived) q = q.eq("is_archived", false);
  if (filter.lifeAreaId) q = q.eq("life_area_id", filter.lifeAreaId);
  if (filter.manualOnly) q = q.eq("source", "manual");
  const { data } = await q;
  return (data ?? []) as Metric[];
}

export async function getMetric(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("metrics").select(COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as Metric | null) ?? null;
}

/** Series per metric (from v_metric_series), one point per period, oldest first. */
export async function getSeries(metrics: Metric[], since?: string) {
  const out = new Map<string, MetricPoint[]>();
  if (metrics.length === 0) return out;
  const supabase = await createClient();
  let q = supabase
    .from("v_metric_series")
    .select("metric_id, period_start, value")
    .in(
      "metric_id",
      metrics.map((m) => m.id),
    )
    .order("period_start");
  if (since) q = q.gte("period_start", since);
  const { data } = await q;
  for (const m of metrics) {
    // Manual entries are stored per day; group them into the metric's period (e.g. one point per week).
    const rows = (data ?? [])
      .filter((r): r is typeof r & { period_start: string } => r.metric_id === m.id && r.period_start !== null)
      .map((r) => ({
        period_start: m.source === "manual" ? periodStart(r.period_start, m.period) : r.period_start,
        value: Number(r.value),
      }));
    out.set(m.id, aggregate(rows, m.aggregation));
  }
  return out;
}

export async function getEntries(metricId: string, limit = 50) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("metric_entries")
    .select("id, value, recorded_at, note")
    .eq("metric_id", metricId)
    .is("deleted_at", null)
    .order("recorded_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as MetricEntry[];
}

/** Goals that use this metric, with their targets (drawn on the chart). */
export async function getGoalsForMetric(metricId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("id, title, target_value, baseline_value, target_date, status")
    .eq("metric_id", metricId)
    .is("deleted_at", null);
  return (data ?? []) as {
    id: string;
    title: string;
    target_value: number | null;
    baseline_value: number | null;
    target_date: string | null;
    status: string;
  }[];
}
