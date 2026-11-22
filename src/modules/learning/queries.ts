import { cache } from "react";

import { addDays, startOfDayIso } from "@/core/planning/dates";
import { getAreas, getTimeZone } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

import { COURSE_FORMATS, COURSE_STATUSES } from "./constants";

export { COURSE_FORMATS, COURSE_STATUSES, SKILL_CATEGORIES } from "./constants";

export type Course = {
  id: string;
  title: string;
  provider: string | null;
  format: (typeof COURSE_FORMATS)[number];
  url: string | null;
  status: (typeof COURSE_STATUSES)[number];
  started_on: string | null;
  completed_on: string | null;
  est_hours: number | null;
  skill_id: string | null;
  goal_id: string | null;
};

export type StudySession = {
  id: string;
  course_id: string | null;
  skill_id: string | null;
  occurred_at: string;
  duration_min: number;
  topic: string;
  notes: string | null;
  focus_rating: number | null;
};

export type SkillLevel = {
  skill_id: string;
  name: string;
  category: string | null;
  target_level: number | null;
  current_level: number | null;
  assessed_on: string | null;
  study_minutes: number;
};

export type Assessment = { id: string; level: number; assessed_on: string; evidence: string | null };

const COURSE_COLS = "id, title, provider, format, url, status, started_on, completed_on, est_hours, skill_id, goal_id";
const SESSION_COLS = "id, course_id, skill_id, occurred_at, duration_min, topic, notes, focus_rating";

export const getLearningAreaId = cache(async () => (await getAreas()).find((a) => a.key === "learning")?.id ?? null);

export async function getCourses() {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_courses").select(COURSE_COLS).is("deleted_at", null).order("created_at", { ascending: false });
  return (data ?? []) as Course[];
}

export async function getCourse(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_courses").select(COURSE_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as Course | null) ?? null;
}

export async function getSessions(filter: { since?: string; courseId?: string; skillId?: string; limit?: number } = {}) {
  const supabase = await createClient();
  let q = supabase
    .from("lrn_study_sessions")
    .select(SESSION_COLS)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(filter.limit ?? 500);
  if (filter.since) q = q.gte("occurred_at", filter.since);
  if (filter.courseId) q = q.eq("course_id", filter.courseId);
  if (filter.skillId) q = q.eq("skill_id", filter.skillId);
  const { data } = await q;
  return (data ?? []) as StudySession[];
}

export async function getSession(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_study_sessions").select(SESSION_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as StudySession | null) ?? null;
}

/** Total study minutes per course (all time). */
export async function getMinutesByCourse() {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_study_sessions").select("course_id, duration_min").is("deleted_at", null).not("course_id", "is", null);
  const out = new Map<string, number>();
  for (const r of data ?? []) out.set(r.course_id!, (out.get(r.course_id!) ?? 0) + r.duration_min);
  return out;
}

export async function getSkills() {
  const supabase = await createClient();
  const { data } = await supabase.from("v_skill_levels").select("skill_id, name, category, target_level, current_level, assessed_on, study_minutes").order("name");
  return (data ?? []).map((s) => ({ ...s, study_minutes: Number(s.study_minutes ?? 0) })) as SkillLevel[];
}

export async function getSkill(id: string) {
  const supabase = await createClient();
  const [{ data: skill }, { data: assessments }] = await Promise.all([
    supabase.from("skills").select("id, name, category, target_level, notes, life_area_id").eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("skill_assessments").select("id, level, assessed_on, evidence").eq("skill_id", id).order("assessed_on", { ascending: false }).order("created_at", { ascending: false }),
  ]);
  return skill ? { skill, assessments: (assessments ?? []) as Assessment[] } : null;
}

export async function getSkillOptions() {
  const supabase = await createClient();
  const { data } = await supabase.from("skills").select("id, name").is("deleted_at", null).order("name");
  return data ?? [];
}

/** Study hours per week (Monday) for the last `weeks` weeks, oldest first, in the user's time zone. */
export async function getWeeklyHours(today: string, weekStart: string, weeks = 12) {
  const tz = await getTimeZone();
  const first = addDays(weekStart, -7 * (weeks - 1));
  const sessions = await getSessions({ since: startOfDayIso(first, tz), limit: 5000 });
  const buckets = Array.from({ length: weeks }, (_, i) => ({ start: addDays(first, 7 * i), minutes: 0 }));
  for (const s of sessions) {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date(s.occurred_at));
    const idx = Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / (7 * 864e5));
    if (idx >= 0 && idx < weeks && day <= today) buckets[idx].minutes += s.duration_min;
  }
  return buckets;
}
