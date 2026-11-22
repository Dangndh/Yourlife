"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { goalSchema, projectSchema, taskSchema } from "./schemas";

export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: number;
  /** What the user typed, so a form that failed can show it again (React resets forms after an action). */
  values?: Record<string, string>;
  /** Changes on every failed submit; forms use it as `key` to re-mount with `values`. */
  attempt?: number;
};

type Supabase = Awaited<ReturnType<typeof createClient>>;

function fields(formData: FormData) {
  return Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string")) as Record<
    string,
    string
  >;
}

function fieldErrors(error: z.ZodError): FormState {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message === "targetBeforeStart" ? "targetBeforeStart" : "invalid";
  }
  return { fieldErrors: out };
}

function failed(prev: FormState, values: Record<string, string>, state: FormState): FormState {
  return { ...state, values, attempt: (prev.attempt ?? 0) + 1 };
}

/** Only allow same-site relative paths as redirect targets. */
function safeNext(value: FormDataEntryValue | null, fallback: string) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

const idSchema = z.uuid();

function refresh() {
  // Goals, tasks and progress show up on many pages (home, area, goals, tasks): refresh them all.
  revalidatePath("/", "layout");
}

async function softDelete(supabase: Supabase, table: "goals" | "projects" | "tasks", id: string) {
  return supabase.from(table).update({ deleted_at: new Date().toISOString() }).eq("id", id);
}

/* ───────────── Goals ───────────── */

export async function saveGoal(prev: FormState, formData: FormData): Promise<FormState> {
  const raw = fields(formData);
  const parsed = goalSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, fieldErrors(parsed.error));
  const id = idSchema.safeParse(raw.id).success ? raw.id : null;
  const input = parsed.data;
  const supabase = await createClient();

  let achieved_at: string | null = null;
  if (input.status === "achieved") {
    const { data: prev } = id
      ? await supabase.from("goals").select("achieved_at").eq("id", id).maybeSingle()
      : { data: null };
    achieved_at = prev?.achieved_at ?? new Date().toISOString();
  }
  if (id && input.parent_goal_id === id) input.parent_goal_id = null;

  const row = { ...input, achieved_at };
  const { data, error } = id
    ? await supabase.from("goals").update(row).eq("id", id).select("id").single()
    : await supabase.from("goals").insert(row).select("id").single();
  if (error || !data) return failed(prev, raw, { error: "saveFailed" });

  refresh();
  redirect(`/goals/${data.id}`);
}

export async function setGoalStatus(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const status = z.enum(["planned", "active", "paused", "achieved", "abandoned"]).parse(formData.get("status"));
  const supabase = await createClient();
  await supabase
    .from("goals")
    .update({ status, achieved_at: status === "achieved" ? new Date().toISOString() : null })
    .eq("id", id);
  refresh();
}

export async function deleteGoal(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const supabase = await createClient();
  await softDelete(supabase, "goals", id);
  refresh();
  redirect("/goals");
}

/* ───────────── Projects ───────────── */

export async function saveProject(prev: FormState, formData: FormData): Promise<FormState> {
  const raw = fields(formData);
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, fieldErrors(parsed.error));
  const id = idSchema.safeParse(raw.id).success ? raw.id : null;
  const input = parsed.data;
  const supabase = await createClient();

  // A project under a goal always belongs to that goal's area.
  if (input.goal_id) {
    const { data: goal } = await supabase.from("goals").select("life_area_id").eq("id", input.goal_id).maybeSingle();
    if (!goal) return failed(prev, raw, { fieldErrors: { goal_id: "invalid" } });
    input.life_area_id = goal.life_area_id;
  }

  let completed_at: string | null = null;
  if (input.status === "completed") {
    const { data: prev } = id
      ? await supabase.from("projects").select("completed_at").eq("id", id).maybeSingle()
      : { data: null };
    completed_at = prev?.completed_at ?? new Date().toISOString();
  }

  const row = { ...input, completed_at };
  const { data, error } = id
    ? await supabase.from("projects").update(row).eq("id", id).select("id").single()
    : await supabase.from("projects").insert(row).select("id").single();
  if (error || !data) return failed(prev, raw, { error: "saveFailed" });

  refresh();
  redirect(`/projects/${data.id}`);
}

export async function deleteProject(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const supabase = await createClient();
  const { data: project } = await supabase.from("projects").select("goal_id").eq("id", id).maybeSingle();
  await softDelete(supabase, "projects", id);
  refresh();
  redirect(project?.goal_id ? `/goals/${project.goal_id}` : "/goals");
}

/* ───────────── Tasks ───────────── */

/** Keeps area/goal consistent with the chosen project or goal, and completed_at with status. */
async function normalizeTask(
  supabase: Supabase,
  input: z.infer<typeof taskSchema>,
  previousCompletedAt: string | null,
): Promise<{ row?: Record<string, unknown>; error?: FormState }> {
  if (input.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("life_area_id")
      .eq("id", input.project_id)
      .maybeSingle();
    if (!project) return { error: { fieldErrors: { project_id: "invalid" } } };
    input.life_area_id = project.life_area_id;
    input.goal_id = null; // goal progress already counts tasks through their project
  } else if (input.goal_id) {
    const { data: goal } = await supabase.from("goals").select("life_area_id").eq("id", input.goal_id).maybeSingle();
    if (!goal) return { error: { fieldErrors: { goal_id: "invalid" } } };
    input.life_area_id = goal.life_area_id;
  }
  const completed_at = input.status === "done" ? (previousCompletedAt ?? new Date().toISOString()) : null;
  return { row: { ...input, completed_at } };
}

export async function saveTask(prev: FormState, formData: FormData): Promise<FormState> {
  const raw = fields(formData);
  const parsed = taskSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, fieldErrors(parsed.error));
  const id = idSchema.safeParse(raw.id).success ? raw.id : null;
  const supabase = await createClient();

  const { data: existing } = id
    ? await supabase.from("tasks").select("completed_at").eq("id", id).maybeSingle()
    : { data: null };
  const { row, error: invalid } = await normalizeTask(supabase, parsed.data, existing?.completed_at ?? null);
  if (invalid || !row) return failed(prev, raw, invalid ?? { error: "saveFailed" });

  const { error } = id
    ? await supabase.from("tasks").update(row).eq("id", id)
    : await supabase.from("tasks").insert(row);
  if (error) return failed(prev, raw, { error: "saveFailed" });

  refresh();
  redirect(safeNext(formData.get("next"), "/tasks"));
}

/** Inline "add a task" form: stays on the page and clears itself. */
export async function quickAddTask(prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = taskSchema.safeParse(fields(formData));
  if (!parsed.success) return fieldErrors(parsed.error);
  const supabase = await createClient();
  const { row, error: invalid } = await normalizeTask(supabase, parsed.data, null);
  if (invalid || !row) return invalid ?? { error: "saveFailed" };
  const { error } = await supabase.from("tasks").insert(row);
  if (error) return { error: "saveFailed" };
  refresh();
  return { ok: (prev.ok ?? 0) + 1 };
}

export async function setTaskDone(id: string, done: boolean) {
  idSchema.parse(id);
  const supabase = await createClient();
  await supabase
    .from("tasks")
    .update(done ? { status: "done", completed_at: new Date().toISOString() } : { status: "todo", completed_at: null })
    .eq("id", id);
  refresh();
}

export async function deleteTask(formData: FormData) {
  const id = idSchema.parse(formData.get("id"));
  const supabase = await createClient();
  await softDelete(supabase, "tasks", id);
  refresh();
  redirect(safeNext(formData.get("next"), "/tasks"));
}
