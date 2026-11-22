import { cache } from "react";

import { addDays, startOfDayIso } from "@/core/planning/dates";
import { getAreas, getTimeZone } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

import type { PeriodType } from "./periods";

export type Review = {
  id: string;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  status: "draft" | "completed";
  wins: string | null;
  challenges: string | null;
  lessons: string | null;
  next_focus: string | null;
  overall_score: number | null;
  completed_at: string | null;
};

export type AreaScore = { life_area_id: string; score: number; note: string | null };

const COLS = "id, period_type, period_start, period_end, status, wins, challenges, lessons, next_focus, overall_score, completed_at";

/** profiles.week_starts_on (0 = Sunday … 6 = Saturday), default Monday. */
export const getWeekStartsOn = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("week_starts_on").maybeSingle();
  return data?.week_starts_on ?? 1;
});

export async function getReviews(limit = 60) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(COLS)
    .in("period_type", ["weekly", "monthly"])
    .order("period_start", { ascending: false })
    .order("period_type")
    .limit(limit);
  return (data ?? []) as Review[];
}

export async function getReview(id: string) {
  const supabase = await createClient();
  const [{ data: review }, { data: scores }] = await Promise.all([
    supabase.from("reviews").select(COLS).eq("id", id).maybeSingle(),
    supabase.from("review_area_scores").select("life_area_id, score, note").eq("review_id", id),
  ]);
  return review ? { review: review as Review, scores: (scores ?? []) as AreaScore[] } : null;
}

export async function findReview(type: PeriodType, start: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("reviews").select(COLS).eq("period_type", type).eq("period_start", start).maybeSingle();
  return (data as Review | null) ?? null;
}

/** Life Wheel of the latest review (completed, or any if `includeDrafts`) that started before `before`. */
export async function getLatestWheel(opts: { before?: string; includeDrafts?: boolean } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("reviews")
    .select(`${COLS}, review_area_scores(life_area_id, score, note)`)
    .order("period_start", { ascending: false })
    .order("completed_at", { ascending: false, nullsFirst: false })
    .limit(5);
  if (!opts.includeDrafts) q = q.eq("status", "completed");
  if (opts.before) q = q.lt("period_start", opts.before);
  const { data } = await q;
  const hit = (data ?? []).find((r) => r.review_area_scores.length > 0);
  if (!hit) return null;
  const { review_area_scores, ...review } = hit;
  return { review: review as Review, scores: review_area_scores as AreaScore[] };
}

export type PeriodSummary = {
  tasksDone: number;
  goalsAchieved: { id: string; title: string }[];
  byArea: { id: string; key: string; name: string; logs: number; minutes: number }[];
  journalDays: number;
  avgMood: number | null;
  avgEnergy: number | null;
};

/** Numbers for a review, counted in the user's time zone (from 00:00 on start to 24:00 on end). */
export async function getPeriodSummary(start: string, end: string): Promise<PeriodSummary> {
  const supabase = await createClient();
  const tz = await getTimeZone();
  const from = startOfDayIso(start, tz);
  const to = startOfDayIso(addDays(end, 1), tz);

  const [areas, tasks, goals, logs, journal] = await Promise.all([
    getAreas(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "done")
      .is("deleted_at", null)
      .gte("completed_at", from)
      .lt("completed_at", to),
    supabase.from("goals").select("id, title").is("deleted_at", null).gte("achieved_at", from).lt("achieved_at", to),
    supabase
      .from("activity_logs")
      .select("life_area_id, duration_min")
      .is("deleted_at", null)
      .gte("occurred_at", from)
      .lt("occurred_at", to)
      .limit(5000),
    supabase
      .from("journal_entries")
      .select("mood, energy")
      .eq("kind", "daily")
      .is("deleted_at", null)
      .gte("entry_date", start)
      .lte("entry_date", end),
  ]);

  const avg = (vs: (number | null)[]) => {
    const xs = vs.filter((v): v is number => v != null);
    return xs.length ? Math.round((xs.reduce((s, v) => s + v, 0) / xs.length) * 10) / 10 : null;
  };
  const entries = journal.data ?? [];
  return {
    tasksDone: tasks.count ?? 0,
    goalsAchieved: goals.data ?? [],
    byArea: areas.map((a) => {
      const mine = (logs.data ?? []).filter((l) => l.life_area_id === a.id);
      return { ...a, logs: mine.length, minutes: mine.reduce((s, l) => s + (l.duration_min ?? 0), 0) };
    }),
    journalDays: entries.length,
    avgMood: avg(entries.map((e) => e.mood)),
    avgEnergy: avg(entries.map((e) => e.energy)),
  };
}
