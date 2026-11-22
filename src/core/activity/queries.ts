import { createClient } from "@/lib/supabase/server";

export type ActivityLog = {
  id: string;
  life_area_id: string;
  occurred_at: string;
  title: string;
  notes: string | null;
  duration_min: number | null;
  goal_id: string | null;
  project_id: string | null;
  task_id: string | null;
  source_table: string | null;
  source_id: string | null;
};

const COLS =
  "id, life_area_id, occurred_at, title, notes, duration_min, goal_id, project_id, task_id, source_table, source_id";

/** Kinds shown as filters. "manual" = Quick Log; the rest are written by triggers from other tables. */
export const LOG_SOURCES = [
  "manual",
  "tasks",
  "lrn_study_sessions",
  "hlt_workouts",
  "hlt_medical_records",
  "rel_interactions",
  "car_achievements",
  "grw_experiences",
] as const;
export type LogSource = (typeof LOG_SOURCES)[number];

export async function getLogs(filter: {
  from: string; // ISO instant, inclusive
  to?: string; // ISO instant, exclusive
  lifeAreaId?: string;
  source?: LogSource;
  limit?: number;
}) {
  const supabase = await createClient();
  let q = supabase
    .from("activity_logs")
    .select(COLS)
    .is("deleted_at", null)
    .gte("occurred_at", filter.from)
    .order("occurred_at", { ascending: false })
    .limit(filter.limit ?? 300);
  if (filter.to) q = q.lt("occurred_at", filter.to);
  if (filter.lifeAreaId) q = q.eq("life_area_id", filter.lifeAreaId);
  if (filter.source === "manual") q = q.is("source_table", null);
  else if (filter.source) q = q.eq("source_table", filter.source);
  const { data } = await q;
  return (data ?? []) as ActivityLog[];
}

export async function getLog(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("activity_logs").select(COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as ActivityLog | null) ?? null;
}

export async function getRecentLogs(lifeAreaId: string, limit = 8) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_logs")
    .select(COLS)
    .is("deleted_at", null)
    .eq("life_area_id", lifeAreaId)
    .order("occurred_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ActivityLog[];
}
