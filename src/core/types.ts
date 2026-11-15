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
