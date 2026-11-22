"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getToday } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

import { periodFor, previousPeriod } from "./periods";
import { findReview, getWeekStartsOn } from "./queries";

export type ReviewFormState = { error?: string; savedAt?: number; completed?: boolean };

/** Open the review for this (or the previous) week or month, creating a draft the first time. */
export async function startReview(formData: FormData) {
  const type = z.enum(["weekly", "monthly"]).parse(formData.get("type"));
  const which = formData.get("which") === "previous" ? "previous" : "current";
  const [today, weekStartsOn] = await Promise.all([getToday(), getWeekStartsOn()]);
  const current = periodFor(type, today, weekStartsOn);
  const period = which === "previous" ? previousPeriod(current, weekStartsOn) : current;

  const existing = await findReview(type, period.start);
  if (existing) redirect(`/reviews/${existing.id}`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .insert({ period_type: type, period_start: period.start, period_end: period.end })
    .select("id")
    .single();
  if (error || !data) {
    // Another tab may have created it at the same moment (unique period): open that one.
    const again = await findReview(type, period.start);
    if (again) redirect(`/reviews/${again.id}`);
    throw new Error("Could not create the review");
  }
  revalidatePath("/", "layout");
  redirect(`/reviews/${data.id}`);
}

const text = z
  .string()
  .trim()
  .max(10000)
  .optional()
  .transform((v) => (v ? v : null));
const score = z.union([z.literal(""), z.coerce.number().int().min(1).max(10)]).optional();

const reviewSchema = z.object({
  id: z.uuid(),
  wins: text,
  challenges: text,
  lessons: text,
  next_focus: text,
  overall_score: score.transform((v) => (typeof v === "number" ? v : null)),
  intent: z.enum(["save", "complete"]).catch("save"),
});

/**
 * Saves the answers and the Life Wheel. Area scores come as score_<areaId> (1–10, empty = not rated)
 * and note_<areaId>. "complete" also marks the review done.
 */
export async function saveReview(_prev: ReviewFormState, formData: FormData): Promise<ReviewFormState> {
  const raw = Object.fromEntries(Array.from(formData.entries()).filter(([, v]) => typeof v === "string")) as Record<
    string,
    string
  >;
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return { error: "invalid" };
  const { id, intent, ...answers } = parsed.data;

  const rated: { life_area_id: string; score: number; note: string | null }[] = [];
  const cleared: string[] = [];
  for (const [key, value] of Object.entries(raw)) {
    const m = key.match(/^score_(.+)$/);
    if (!m || !z.uuid().safeParse(m[1]).success) continue;
    const s = score.safeParse(value);
    if (!s.success) return { error: "invalid" };
    const note = (raw[`note_${m[1]}`] ?? "").trim().slice(0, 1000) || null;
    if (typeof s.data === "number") rated.push({ life_area_id: m[1], score: s.data, note });
    else cleared.push(m[1]);
  }

  const supabase = await createClient();
  const { data: existing } = await supabase.from("reviews").select("status, completed_at").eq("id", id).maybeSingle();
  if (!existing) return { error: "saveFailed" };
  const complete = intent === "complete" || existing.status === "completed";

  const { error } = await supabase
    .from("reviews")
    .update({
      ...answers,
      status: complete ? "completed" : "draft",
      completed_at: complete ? (existing.completed_at ?? new Date().toISOString()) : null,
    })
    .eq("id", id);
  if (error) return { error: "saveFailed" };

  if (rated.length) {
    const { error: e } = await supabase
      .from("review_area_scores")
      .upsert(rated.map((r) => ({ ...r, review_id: id })), { onConflict: "review_id,life_area_id" });
    if (e) return { error: "saveFailed" };
  }
  if (cleared.length) {
    await supabase.from("review_area_scores").delete().eq("review_id", id).in("life_area_id", cleared);
  }

  revalidatePath("/", "layout");
  return { savedAt: Date.now(), completed: complete };
}

export async function deleteReview(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("reviews").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/reviews");
}
