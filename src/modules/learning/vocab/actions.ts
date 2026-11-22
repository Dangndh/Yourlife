"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

import { DECK_LANGUAGES } from "./constants";
import { ensureAudio } from "./media-actions";
import { CARD_COLS, type VocabCard } from "./queries";
import { schedule, type Rating } from "./srs";
import { parseCardList, termKey } from "./text";

export type VocabFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  ok?: number;
  values?: Record<string, string>;
  attempt?: number;
  imported?: number;
  skipped?: number;
};

const fields = (fd: FormData) =>
  Object.fromEntries(Array.from(fd.entries()).filter(([, v]) => typeof v === "string")) as Record<string, string>;

function failed(prev: VocabFormState, values: Record<string, string>, e: z.ZodError | string): VocabFormState {
  const base = { values, attempt: (prev.attempt ?? 0) + 1 };
  if (typeof e === "string") return { ...base, error: e };
  const fieldErrors: Record<string, string> = {};
  for (const i of e.issues) fieldErrors[String(i.path[0] ?? "form")] ??= "invalid";
  return { ...base, fieldErrors };
}

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));
const isId = (v: unknown): v is string => z.uuid().safeParse(v).success;

function refresh() {
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------
// Decks
// ---------------------------------------------------------------------

const deckSchema = z.object({
  name: z.string().trim().min(1).max(200),
  language: z.enum(DECK_LANGUAGES),
  description: text(2000),
  new_per_day: z.coerce.number().int().min(0).max(200),
  skill_id: z
    .union([z.uuid(), z.literal("")])
    .optional()
    .transform((v) => (v ? v : null)),
});

export async function saveDeck(prev: VocabFormState, formData: FormData): Promise<VocabFormState> {
  const raw = fields(formData);
  const parsed = deckSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const supabase = await createClient();
  let id = raw.id;
  if (isId(id)) {
    const { error } = await supabase.from("lrn_decks").update(parsed.data).eq("id", id);
    if (error) return failed(prev, raw, "saveFailed");
  } else {
    const { data, error } = await supabase.from("lrn_decks").insert(parsed.data).select("id").single();
    if (error || !data) return failed(prev, raw, "saveFailed");
    id = data.id;
  }
  refresh();
  redirect(`/learning/vocab/${id}`);
}

export async function deleteDeck(formData: FormData) {
  const id = formData.get("id");
  if (!isId(id)) return;
  const supabase = await createClient();
  await supabase.from("lrn_decks").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  refresh();
  redirect("/learning/vocab");
}

// ---------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------

const cardSchema = z.object({
  term: z.string().trim().min(1).max(500),
  meaning: z.string().trim().min(1).max(1000),
  pronunciation: text(200),
  example: text(1000),
  example_meaning: text(1000),
  notes: text(2000),
});

/** New card: stays on the page with an empty form. Edit: back to the deck. */
export async function saveCard(prev: VocabFormState, formData: FormData): Promise<VocabFormState> {
  const raw = fields(formData);
  if (!isId(raw.deck_id)) return failed(prev, raw, "saveFailed");
  const parsed = cardSchema.safeParse(raw);
  if (!parsed.success) return failed(prev, raw, parsed.error);
  const supabase = await createClient();
  if (isId(raw.id)) {
    const { data: before } = await supabase.from("lrn_cards").select("term").eq("id", raw.id).maybeSingle();
    // A changed word needs its recording looked up again.
    const audioReset = before && termKey(before.term) !== termKey(parsed.data.term) ? { audio_url: null, audio_checked_at: null } : {};
    const { error } = await supabase.from("lrn_cards").update({ ...parsed.data, ...audioReset }).eq("id", raw.id);
    if (error) return failed(prev, raw, "saveFailed");
    if ("audio_url" in audioReset) await ensureAudio([raw.id]);
    refresh();
    redirect(`/learning/vocab/${raw.deck_id}`);
  }
  const { data: same } = await supabase
    .from("lrn_cards")
    .select("id")
    .eq("deck_id", raw.deck_id)
    .is("deleted_at", null)
    .ilike("term", parsed.data.term.replace(/[\\%_]/g, (c) => `\\${c}`));
  if (same?.length && raw.allow_duplicate !== "1") {
    return { ...failed(prev, raw, "x"), error: undefined, fieldErrors: { term: "duplicate" } };
  }
  const { data: created, error } = await supabase
    .from("lrn_cards")
    .insert({ ...parsed.data, deck_id: raw.deck_id })
    .select("id")
    .single();
  if (error || !created) return failed(prev, raw, "saveFailed");
  // Fetch the recording (and IPA) right away for one word; lists are done during review.
  await ensureAudio([created.id]);
  refresh();
  return { ok: (prev.ok ?? 0) + 1 };
}

/** Paste a list: one card per line. Words already in the deck are skipped. */
export async function importCards(prev: VocabFormState, formData: FormData): Promise<VocabFormState> {
  const raw = fields(formData);
  if (!isId(raw.deck_id)) return failed(prev, raw, "saveFailed");
  const { cards, invalid } = parseCardList(raw.list ?? "");
  if (!cards.length) return { ...failed(prev, raw, "x"), error: undefined, fieldErrors: { list: "empty" } };
  const supabase = await createClient();
  const { data: existing } = await supabase.from("lrn_cards").select("term").eq("deck_id", raw.deck_id).is("deleted_at", null);
  const seen = new Set((existing ?? []).map((c) => termKey(c.term)));
  const rows = [];
  for (const c of cards) {
    const k = termKey(c.term);
    if (seen.has(k)) continue;
    seen.add(k);
    rows.push({ ...c, deck_id: raw.deck_id });
  }
  if (rows.length) {
    const { error } = await supabase.from("lrn_cards").insert(rows);
    if (error) return failed(prev, raw, "saveFailed");
  }
  refresh();
  return { ok: (prev.ok ?? 0) + 1, imported: rows.length, skipped: cards.length - rows.length + invalid };
}

export async function deleteCard(formData: FormData) {
  const id = formData.get("id");
  if (!isId(id)) return;
  const supabase = await createClient();
  const { data } = await supabase
    .from("lrn_cards")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("deck_id")
    .maybeSingle();
  refresh();
  redirect(data ? `/learning/vocab/${data.deck_id}` : "/learning/vocab");
}

/** Start a card over as new (e.g. after fixing a wrong meaning). */
export async function resetCard(formData: FormData) {
  const id = formData.get("id");
  const deck = formData.get("deck_id");
  if (!isId(id) || !isId(deck)) return;
  const supabase = await createClient();
  await supabase
    .from("lrn_cards")
    .update({ state: 0, step: 0, stability: null, difficulty: null, due_at: new Date().toISOString(), last_review_at: null })
    .eq("id", id);
  refresh();
  redirect(`/learning/vocab/${deck}`);
}

// ---------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------

const reviewSchema = z.object({
  cardId: z.uuid(),
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  mode: z.enum(["flip", "choice", "type", "listen"]),
  durationMs: z.number().int().min(0).max(600000),
});

/** Save one answer: the server schedules from the stored state, then logs the review. */
export async function submitReview(input: z.input<typeof reviewSchema>): Promise<{ ok: boolean }> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const { cardId, rating, mode, durationMs } = parsed.data;
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_cards").select(CARD_COLS).eq("id", cardId).is("deleted_at", null).maybeSingle();
  const card = data as VocabCard | null;
  if (!card) return { ok: false };

  const now = new Date();
  const next = schedule(card, rating as Rating, now);
  const { error } = await supabase
    .from("lrn_cards")
    .update({
      state: next.card.state,
      step: next.card.step,
      stability: next.card.stability,
      difficulty: next.card.difficulty,
      due_at: next.card.due_at,
      last_review_at: next.card.last_review_at,
      reps: next.card.reps,
      lapses: next.card.lapses,
    })
    .eq("id", cardId);
  if (error) return { ok: false };
  const { error: logError } = await supabase.from("lrn_reviews").insert({
    card_id: cardId,
    deck_id: card.deck_id,
    rating,
    mode,
    state_before: card.state,
    interval_days: next.intervalDays,
    duration_ms: durationMs,
    reviewed_at: now.toISOString(),
  });
  return { ok: !logError };
}

/** Called when a session ends, so pages show the new numbers. */
export async function finishReview() {
  refresh();
}

export async function saveDailyGoal(prev: VocabFormState, formData: FormData): Promise<VocabFormState> {
  const raw = fields(formData);
  const goal = z.coerce.number().int().min(1).max(1000).safeParse(raw.daily_review_goal);
  if (!goal.success) return failed(prev, raw, goal.error);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return failed(prev, raw, "saveFailed");
  const { error } = await supabase
    .from("lrn_preferences")
    .upsert({ user_id: auth.user.id, daily_review_goal: goal.data }, { onConflict: "user_id" });
  if (error) return failed(prev, raw, "saveFailed");
  refresh();
  return { ok: (prev.ok ?? 0) + 1 };
}
