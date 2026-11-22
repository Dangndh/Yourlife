// Hand-written row types for Phase 0.
// Replace with generated types once the Supabase project is linked:
//   npx supabase gen types typescript --linked > src/lib/database.types.ts

/** Row of the view public.v_life_area_summary */
export type LifeAreaSummary = {
  life_area_id: string;
  key: string;
  name: string;
  sort_order: number;
  active_goals: number;
  avg_goal_progress: number | null;
  logs_7d: number;
  minutes_7d: number;
  last_activity_at: string | null;
  last_score: number | null;
  previous_score: number | null;
};

/** Row of the view public.v_goal_progress (subset) */
export type GoalProgress = {
  goal_id: string;
  life_area_id: string;
  title: string;
  status: string;
  target_date: string | null;
  progress: number | null;
};

export type GoalStatus = "planned" | "active" | "paused" | "achieved" | "abandoned";
export type ProjectStatus = "planned" | "active" | "on_hold" | "completed" | "cancelled";
export type TaskStatus = "todo" | "doing" | "done" | "cancelled";

/** Minimal life area row used by pickers. */
export type AreaOption = { id: string; key: string; name: string };

/** Row of public.v_goal_progress (full). */
export type GoalProgressRow = GoalProgress & {
  baseline_value: number | null;
  target_value: number | null;
  current_value: number | null;
  tasks_total: number;
  tasks_done: number;
  time_elapsed: number | null;
};

/** Row of public.goals (columns used by the app). */
export type Goal = {
  id: string;
  life_area_id: string;
  parent_goal_id: string | null;
  title: string;
  description: string | null;
  why: string | null;
  goal_type: "outcome" | "habit" | "milestone";
  status: GoalStatus;
  priority: number;
  start_date: string | null;
  target_date: string | null;
  achieved_at: string | null;
};

/** Row of public.projects (columns used by the app). */
export type Project = {
  id: string;
  life_area_id: string;
  goal_id: string | null;
  title: string;
  description: string | null;
  status: ProjectStatus;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
};

/** Row of public.tasks (columns used by the app). */
export type Task = {
  id: string;
  life_area_id: string;
  project_id: string | null;
  goal_id: string | null;
  title: string;
  notes: string | null;
  status: TaskStatus;
  priority: number;
  due_date: string | null;
  scheduled_for: string | null;
  completed_at: string | null;
};
