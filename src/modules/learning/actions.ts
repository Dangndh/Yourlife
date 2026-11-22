"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { zonedLocalToIso } from "@/core/planning/dates";
import { getTimeZone, getToday } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

import { COURSE_FORMATS, COURSE_STATUSES, SKILL_CATEGORIES, getLearningAreaId } from "./queries";

export type LearnFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: number;
  values?: Record<string, string>;
  attempt?: number;
};

const fields = (fd: FormData) =>
  Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")) as Record<string, string>;

function failed(prev: LearnFormState, values: Record<string, string>, e: z.ZodError | string): LearnFormState {
  const base = { values, attempt: (prev.attempt ?? 0) + 1 };
  if (typeof e === "string") return { ...base, error: e };
  const fieldErrors: Record<string, string> = {};
  for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= i.message === "inFuture" ? "inFuture" : "invalid";
  return { ...base, fieldErrors };
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
const optId = z
  .union([z.uuid(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));
const optDate = z
  .union([z.iso.date(), z.literal("")])
  .optional()
  .transform((v) => (v ? v : null));
const optInt = (min: number, max: number) =>
  z
    .union([z.literal(""), z.coerce.number().int().min(min).max(max)])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null));
const isId = (v: unknown): v is string => z.uuid().safeParse(v).success;

/** Only same-site paths for "back to" redirects. */
const safeNext = (v: unknown, fallback: string) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : fallback;

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- Courses ----------
const courseSchema = z.object({
  title: z.string().trim().min(1).max(300),
  provider: text(200),
  format: z.enum(COURSE_FORMATS).catch("course"),
  url: z
    .union([z.literal(""), z.url({ protocol: /^https?$/ })])
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(COURSE_STATUSES).catch("planned"),
  started_on: optDate,
  completed_on: optDate,
  est_hours: z
    .union([z.literal(""), z.coerce.number().min(0).max(9999)])
    .optional()
    .transform((v) => (typeof v === "number" ? v : null)),
  skill_id: optId,
  goal_id: optId,
});

export async function saveCourse(prev: LearnFormState, fd: FormData): Promise<LearnFormState> {
  const raw = fields(fd);
  const parsed = courseSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const row = parsed.data;
  const today = await getToday();
  // Fill the dates the status implies, so "started" and "finished" are never empty.
  if (row.status !== "planned" && !row.started_on) row.started_on = today;
  if (row.status === "completed" && !row.completed_on) row.completed_on = today;
  if (row.started_on && row.completed_on && row.completed_on < row.started_on) {
    return { fieldErrors: { completed_on: "targetBeforeStart" }, values: raw, attempt: (prev.attempt ?? 0) + 1 };
  }

  const supabase = await createClient();
  const id = isId(raw.id) ? raw.id : null;
  const { data, error } = id
    ? await supabase.from("lrn_courses").update(row).eq("id", id).select("id").single()
    : await supabase.from("lrn_courses").insert(row).select("id").single();
  if (error || !data) return failed(prev, raw, "saveFailed");
  refresh();
  redirect(`/learning/courses/${data.id}`);
}

export async function setCourseStatus(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const status = z.enum(COURSE_STATUSES).parse(fd.get("status"));
  const today = await getToday();
  const supabase = await createClient();
  const { data: c } = await supabase.from("lrn_courses").select("started_on, completed_on").eq("id", id).maybeSingle();
  await supabase
    .from("lrn_courses")
    .update({
      status,
      started_on: status === "planned" ? c?.started_on : (c?.started_on ?? today),
      completed_on: status === "completed" ? (c?.completed_on ?? today) : null,
    })
    .eq("id", id);
  refresh();
}

export async function deleteCourse(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await createClient();
  await supabase.from("lrn_courses").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  refresh();
  redirect("/learning/courses");
}

// ---------- Study sessions ----------
const sessionSchema = z.object({
  topic: z.string().trim().min(1).max(500),
  duration_min: z.coerce.number().int().min(1).max(24 * 60),
  occurred_local: z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)]).optional(),
  course_id: optId,
  skill_id: optId,
  focus_rating: optInt(1, 5),
  notes: text(5000),
});

export async function saveSession(prev: LearnFormState, fd: FormData): Promise<LearnFormState> {
  const raw = fields(fd);
  const parsed = sessionSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const { occurred_local, ...rest } = parsed.data;
  const occurred_at = occurred_local ? zonedLocalToIso(occurred_local, await getTimeZone()) : new Date().toISOString();
  if (Date.parse(occurred_at) > Date.now() + 5 * 60 * 1000) {
    return { fieldErrors: { occurred_local: "inFuture" }, values: raw, attempt: (prev.attempt ?? 0) + 1 };
  }

  const supabase = await createClient();
  // A session for a course that has not started yet starts it.
  if (rest.course_id) {
    await supabase
      .from("lrn_courses")
      .update({ status: "in_progress", started_on: await getToday() })
      .eq("id", rest.course_id)
      .eq("status", "planned");
  }
  const id = isId(raw.id) ? raw.id : null;
  const row = { ...rest, occurred_at };
  const { error } = id
    ? await supabase.from("lrn_study_sessions").update(row).eq("id", id)
    : await supabase.from("lrn_study_sessions").insert(row);
  if (error) return failed(prev, raw, "saveFailed");
  refresh();
  if (id || raw.redirect === "1") redirect(safeNext(raw.next, "/learning/sessions"));
  return { ok: (prev.ok ?? 0) + 1 };
}

export async function deleteSession(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await createClient();
  await supabase.from("lrn_study_sessions").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  refresh();
  redirect(safeNext(fd.get("next"), "/learning/sessions"));
}

// ---------- Skills ----------
const skillSchema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(SKILL_CATEGORIES).catch("other"),
  target_level: optInt(1, 5),
  notes: text(2000),
});

export async function saveSkill(prev: LearnFormState, fd: FormData): Promise<LearnFormState> {
  const raw = fields(fd);
  const parsed = skillSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const supabase = await createClient();
  const id = isId(raw.id) ? raw.id : null;
  const row = id ? parsed.data : { ...parsed.data, life_area_id: await getLearningAreaId() };
  const { data, error } = id
    ? await supabase.from("skills").update(row).eq("id", id).select("id").single()
    : await supabase.from("skills").insert(row).select("id").single();
  if (error?.code === "23505") return { fieldErrors: { name: "duplicate" }, values: raw, attempt: (prev.attempt ?? 0) + 1 };
  if (error || !data) return failed(prev, raw, "saveFailed");
  refresh();
  redirect(`/learning/skills/${data.id}`);
}

export async function deleteSkill(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await createClient();
  // Soft delete frees the name (unique per user) by suffixing it.
  const { data } = await supabase.from("skills").select("name").eq("id", id).maybeSingle();
  await supabase
    .from("skills")
    .update({ deleted_at: new Date().toISOString(), name: `${data?.name ?? "skill"} (deleted ${id.slice(0, 8)})` })
    .eq("id", id);
  refresh();
  redirect("/learning/skills");
}

const assessmentSchema = z.object({
  skill_id: z.uuid(),
  level: z.coerce.number().int().min(1).max(5),
  assessed_on: z.iso.date(),
  evidence: text(500),
});

export async function addAssessment(prev: LearnFormState, fd: FormData): Promise<LearnFormState> {
  const raw = fields(fd);
  const parsed = assessmentSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  if (parsed.data.assessed_on > (await getToday())) {
    return { fieldErrors: { assessed_on: "inFuture" }, values: raw, attempt: (prev.attempt ?? 0) + 1 };
  }
  const supabase = await createClient();
  const { error } = await supabase.from("skill_assessments").insert(parsed.data);
  if (error) return failed(prev, raw, "saveFailed");
  refresh();
  return { ok: (prev.ok ?? 0) + 1 };
}

export async function deleteAssessment(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await createClient();
  await supabase.from("skill_assessments").delete().eq("id", id);
  refresh();
}
