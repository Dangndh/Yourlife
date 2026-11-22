import { z } from "zod";

// Form values arrive as strings. Empty string = "not set".
const optionalText = z
  .string()
  .trim()
  .max(5000)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional()
  .transform((v) => v ?? null);

const optionalId = z
  .union([z.uuid(), z.literal("")])
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const optionalDate = z
  .union([z.iso.date(), z.literal("")])
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const optionalNumber = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v ? Number(v.replace(",", ".")) : null))
  .refine((v) => v === null || Number.isFinite(v));

const priority = (fallback: number) =>
  z.coerce.number().int().min(1).max(4).catch(fallback);

export const goalSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    life_area_id: z.uuid(),
    parent_goal_id: optionalId,
    description: optionalText,
    why: optionalText,
    goal_type: z.enum(["outcome", "habit", "milestone"]).catch("outcome"),
    status: z.enum(["planned", "active", "paused", "achieved", "abandoned"]).catch("active"),
    priority: priority(2),
    start_date: optionalDate,
    target_date: optionalDate,
    metric_id: optionalId,
    baseline_value: optionalNumber,
    target_value: optionalNumber,
  })
  .refine((g) => !g.start_date || !g.target_date || g.target_date >= g.start_date, {
    path: ["target_date"],
    message: "targetBeforeStart",
  })
  // A goal measured by a metric needs a target value (the database checks this too).
  .refine((g) => !g.metric_id || g.target_value !== null, { path: ["target_value"], message: "targetRequired" });

export const projectSchema = z
  .object({
    title: z.string().trim().min(1).max(300),
    life_area_id: z.uuid(),
    goal_id: optionalId,
    description: optionalText,
    status: z.enum(["planned", "active", "on_hold", "completed", "cancelled"]).catch("active"),
    start_date: optionalDate,
    due_date: optionalDate,
  })
  .refine((p) => !p.start_date || !p.due_date || p.due_date >= p.start_date, {
    path: ["due_date"],
    message: "targetBeforeStart",
  });

export const taskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  life_area_id: z.uuid(),
  goal_id: optionalId,
  project_id: optionalId,
  notes: optionalText,
  status: z.enum(["todo", "doing", "done", "cancelled"]).catch("todo"),
  priority: priority(3),
  due_date: optionalDate,
  scheduled_for: optionalDate,
});

export type GoalInput = z.infer<typeof goalSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
