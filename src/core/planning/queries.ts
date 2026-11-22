import { cache } from "react";

import type { AreaOption, Goal, GoalProgressRow, Project, Task } from "@/core/types";
import { createClient } from "@/lib/supabase/server";

import { todayIn } from "./dates";

const GOAL_COLS =
  "id, life_area_id, parent_goal_id, title, description, why, goal_type, status, priority, start_date, target_date, achieved_at";
const PROJECT_COLS = "id, life_area_id, goal_id, title, description, status, start_date, due_date, completed_at";
const TASK_COLS =
  "id, life_area_id, project_id, goal_id, title, notes, status, priority, due_date, scheduled_for, completed_at";

/** The user's time zone (profiles.timezone, default Asia/Ho_Chi_Minh). */
export const getTimeZone = cache(async (): Promise<string> => {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("timezone").maybeSingle();
  return data?.timezone ?? "Asia/Ho_Chi_Minh";
});

/** Today in the user's time zone, as YYYY-MM-DD. */
export const getToday = cache(async (): Promise<string> => todayIn(await getTimeZone()));

export const getAreas = cache(async (): Promise<AreaOption[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("life_areas")
    .select("id, key, name")
    .eq("is_active", true)
    .order("sort_order");
  return (data ?? []) as AreaOption[];
});

export async function getGoalOptions(): Promise<Pick<Goal, "id" | "title" | "life_area_id" | "status">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("goals")
    .select("id, title, life_area_id, status")
    .is("deleted_at", null)
    .in("status", ["planned", "active", "paused"])
    .order("title");
  return data ?? [];
}

export async function getProjectOptions(): Promise<Pick<Project, "id" | "title" | "life_area_id" | "goal_id">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id, title, life_area_id, goal_id")
    .is("deleted_at", null)
    .in("status", ["planned", "active", "on_hold"])
    .order("title");
  return data ?? [];
}

export async function getGoalProgressList(filter: { status?: string[]; lifeAreaId?: string } = {}) {
  const supabase = await createClient();
  let q = supabase.from("v_goal_progress").select("*").order("target_date", { ascending: true, nullsFirst: false });
  if (filter.status) q = q.in("status", filter.status);
  if (filter.lifeAreaId) q = q.eq("life_area_id", filter.lifeAreaId);
  const { data } = await q;
  return (data ?? []) as GoalProgressRow[];
}

export async function getGoal(id: string) {
  const supabase = await createClient();
  const [{ data: goal }, { data: progress }] = await Promise.all([
    supabase.from("goals").select(GOAL_COLS).eq("id", id).is("deleted_at", null).maybeSingle(),
    supabase.from("v_goal_progress").select("*").eq("goal_id", id).maybeSingle(),
  ]);
  return goal ? { goal: goal as Goal, progress: progress as GoalProgressRow | null } : null;
}

export async function getProjects(filter: { goalId?: string; lifeAreaId?: string; openOnly?: boolean } = {}) {
  const supabase = await createClient();
  let q = supabase.from("projects").select(PROJECT_COLS).is("deleted_at", null).order("created_at");
  if (filter.goalId) q = q.eq("goal_id", filter.goalId);
  if (filter.lifeAreaId) q = q.eq("life_area_id", filter.lifeAreaId);
  if (filter.openOnly) q = q.in("status", ["planned", "active", "on_hold"]);
  const { data } = await q;
  return (data ?? []) as Project[];
}

export async function getProject(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select(PROJECT_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as Project | null) ?? null;
}

export async function getTask(id: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("tasks").select(TASK_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as Task | null) ?? null;
}

/** Top-level tasks (no sub-tasks), most urgent first. */
export async function getTasks(
  filter: {
    goalId?: string;
    projectId?: string;
    projectIds?: string[];
    lifeAreaId?: string;
    open?: boolean;
    doneSince?: string;
  } = {},
) {
  const supabase = await createClient();
  let q = supabase
    .from("tasks")
    .select(TASK_COLS)
    .is("deleted_at", null)
    .is("parent_task_id", null)
    .order("status", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });
  if (filter.goalId) q = q.eq("goal_id", filter.goalId);
  if (filter.projectId) q = q.eq("project_id", filter.projectId);
  if (filter.projectIds) q = q.in("project_id", filter.projectIds);
  if (filter.lifeAreaId) q = q.eq("life_area_id", filter.lifeAreaId);
  if (filter.open) q = q.in("status", ["todo", "doing"]);
  if (filter.doneSince) q = q.eq("status", "done").gte("completed_at", filter.doneSince);
  const { data } = await q;
  return (data ?? []) as Task[];
}

export async function getChildGoalIds(parentId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("goals").select("id").eq("parent_goal_id", parentId).is("deleted_at", null);
  return (data ?? []).map((g) => g.id);
}
