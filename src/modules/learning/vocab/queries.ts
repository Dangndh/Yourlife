import { cache } from "react";

import { addDays, startOfDayIso } from "@/core/planning/dates";
import { getTimeZone, getToday } from "@/core/planning/queries";
import { createClient } from "@/lib/supabase/server";

import type { CardStateCode } from "./srs";
import { streak } from "./text";

export type Deck = {
  id: string;
  name: string;
  language: string;
  description: string | null;
  new_per_day: number;
  skill_id: string | null;
};

export type DeckStats = { total: number; new_cards: number; learning: number; young: number; known: number; due_now: number };
export type DeckWithStats = Deck & { stats: DeckStats; dueToday: number; newToday: number };

export type VocabCard = {
  id: string;
  deck_id: string;
  term: string;
  meaning: string;
  pronunciation: string | null;
  example: string | null;
  example_meaning: string | null;
  notes: string | null;
  state: CardStateCode;
  step: number;
  stability: number | null;
  difficulty: number | null;
  due_at: string;
  last_review_at: string | null;
  reps: number;
  lapses: number;
};

const DECK_COLS = "id, name, language, description, new_per_day, skill_id";
export const CARD_COLS =
  "id, deck_id, term, meaning, pronunciation, example, example_meaning, notes, state, step, stability, difficulty, due_at, last_review_at, reps, lapses";
const EMPTY: DeckStats = { total: 0, new_cards: 0, learning: 0, young: 0, known: 0, due_now: 0 };

async function todayBounds() {
  const [today, tz] = await Promise.all([getToday(), getTimeZone()]);
  return { today, start: startOfDayIso(today, tz), end: startOfDayIso(addDays(today, 1), tz) };
}

/** New cards already started today, per deck (counts against each deck's daily limit). */
async function newStartedToday(): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { start } = await todayBounds();
  const { data } = await supabase.from("lrn_reviews").select("deck_id").eq("state_before", 0).gte("reviewed_at", start);
  const m = new Map<string, number>();
  for (const r of data ?? []) m.set(r.deck_id, (m.get(r.deck_id) ?? 0) + 1);
  return m;
}

/** Cards that have been studied and are due before the end of today, per deck. */
async function dueBy(end: string): Promise<Map<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_cards").select("deck_id").is("deleted_at", null).neq("state", 0).lt("due_at", end);
  const m = new Map<string, number>();
  for (const r of data ?? []) m.set(r.deck_id, (m.get(r.deck_id) ?? 0) + 1);
  return m;
}

export const getDecks = cache(async (): Promise<DeckWithStats[]> => {
  const supabase = await createClient();
  const { end } = await todayBounds();
  const [{ data: decks }, { data: stats }, due, started] = await Promise.all([
    supabase.from("lrn_decks").select(DECK_COLS).is("deleted_at", null).order("created_at"),
    supabase.from("v_deck_stats").select("*"),
    dueBy(end),
    newStartedToday(),
  ]);
  const byDeck = new Map((stats ?? []).map((s) => [s.deck_id, s]));
  return (decks ?? []).map((d) => {
    const s = byDeck.get(d.id);
    const st: DeckStats = s
      ? { total: s.total ?? 0, new_cards: s.new_cards ?? 0, learning: s.learning ?? 0, young: s.young ?? 0, known: s.known ?? 0, due_now: s.due_now ?? 0 }
      : EMPTY;
    const newToday = Math.min(st.new_cards, Math.max(0, d.new_per_day - (started.get(d.id) ?? 0)));
    return { ...d, stats: st, dueToday: due.get(d.id) ?? 0, newToday };
  });
});

export async function getDeck(id: string): Promise<DeckWithStats | null> {
  return (await getDecks()).find((d) => d.id === id) ?? null;
}

export async function getCards(deckId: string): Promise<VocabCard[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lrn_cards")
    .select(CARD_COLS)
    .eq("deck_id", deckId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(2000);
  return (data ?? []) as VocabCard[];
}

export async function getCard(id: string): Promise<VocabCard | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_cards").select(CARD_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
  return (data as VocabCard | null) ?? null;
}

export type QueueCard = VocabCard & { language: string };

/**
 * Today's review queue: studied cards due before the end of today (earliest first),
 * then new cards up to each deck's daily limit (oldest first). One deck, or all.
 */
export async function getReviewQueue(deckId?: string): Promise<QueueCard[]> {
  const supabase = await createClient();
  const decks = (await getDecks()).filter((d) => !deckId || d.id === deckId);
  if (!decks.length) return [];
  const ids = decks.map((d) => d.id);
  const lang = new Map(decks.map((d) => [d.id, d.language]));
  const { end } = await todayBounds();

  const { data: due } = await supabase
    .from("lrn_cards")
    .select(CARD_COLS)
    .in("deck_id", ids)
    .is("deleted_at", null)
    .neq("state", 0)
    .lt("due_at", end)
    .order("due_at")
    .limit(500);

  const fresh: VocabCard[] = [];
  for (const d of decks) {
    if (d.newToday <= 0) continue;
    const { data } = await supabase
      .from("lrn_cards")
      .select(CARD_COLS)
      .eq("deck_id", d.id)
      .is("deleted_at", null)
      .eq("state", 0)
      .order("created_at")
      .limit(d.newToday);
    fresh.push(...((data ?? []) as VocabCard[]));
  }
  return [...((due ?? []) as VocabCard[]), ...fresh].map((c) => ({ ...c, language: lang.get(c.deck_id) ?? "en-US" }));
}

/** Terms and meanings to build wrong options for multiple choice. */
export async function getChoicePool(deckIds: string[]): Promise<{ term: string; meaning: string }[]> {
  if (!deckIds.length) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_cards").select("term, meaning").in("deck_id", deckIds).is("deleted_at", null).limit(400);
  return data ?? [];
}

export const getDailyGoal = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { data } = await supabase.from("lrn_preferences").select("daily_review_goal").maybeSingle();
  return data?.daily_review_goal ?? 20;
});

export type VocabProgress = { goal: number; today: number; streak: number; minutesToday: number; days: { day: string; reviews: number }[] };

/** Today's reviews vs the goal, the streak, and the last 30 days. */
export const getVocabProgress = cache(async (): Promise<VocabProgress> => {
  const supabase = await createClient();
  const today = await getToday();
  const [{ data }, goal] = await Promise.all([
    supabase.from("v_vocab_daily").select("day, reviews, duration_ms").gte("day", addDays(today, -400)).order("day"),
    getDailyGoal(),
  ]);
  const rows = (data ?? []).filter((r): r is { day: string; reviews: number; duration_ms: number } => r.day != null);
  const t = rows.find((r) => r.day === today);
  const since = addDays(today, -29);
  const byDay = new Map(rows.map((r) => [r.day, r.reviews ?? 0]));
  const days = Array.from({ length: 30 }, (_, i) => {
    const day = addDays(since, i);
    return { day, reviews: byDay.get(day) ?? 0 };
  });
  return {
    goal,
    today: t?.reviews ?? 0,
    minutesToday: Math.round((t?.duration_ms ?? 0) / 60000),
    streak: streak(rows.filter((r) => (r.reviews ?? 0) > 0).map((r) => r.day), today),
    days,
  };
});
