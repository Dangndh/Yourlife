/**
 * Spaced repetition scheduler (FSRS-4.5 memory model with short learning steps).
 *
 * Each card keeps a memory state: stability S (days until the chance of recall
 * drops to 90%) and difficulty D (1..10). After every answer we update S and D
 * and schedule the next review when recall is expected to fall to 90%.
 * Pure functions, shared by the server (which saves) and the review screen
 * (which re-queues cards inside a session), so both agree.
 */

export type Rating = 1 | 2 | 3 | 4; // again, hard, good, easy
export const RATINGS: Rating[] = [1, 2, 3, 4];

export const STATE = { new: 0, learning: 1, review: 2, relearning: 3 } as const;
export type CardStateCode = 0 | 1 | 2 | 3;

export type SrsCard = {
  state: CardStateCode;
  step: number;
  stability: number | null;
  difficulty: number | null;
  due_at: string;
  last_review_at: string | null;
  reps: number;
  lapses: number;
};

export type Scheduled = {
  card: SrsCard;
  /** Gap until the next review, in days (fractions for minute steps). */
  intervalDays: number;
};

// FSRS-4.5 default weights.
const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587,
  0.2272, 2.8755,
];
const DECAY = -0.5;
const FACTOR = 19 / 81; // makes R(S, S) = 0.9
const RETENTION = 0.9;
const MAX_INTERVAL = 36500;
const DAY_MS = 86_400_000;
const MIN_MS = 60_000;

/** Minutes between answers while a card is being learned / relearned. */
export const LEARNING_STEPS = [1, 10];
export const RELEARNING_STEPS = [10];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function retrievability(elapsedDays: number, stability: number) {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

const initStability = (g: Rating) => Math.max(W[g - 1], 0.1);
const initDifficulty = (g: Rating) => clamp(W[4] - (g - 3) * W[5], 1, 10);
const nextDifficulty = (d: number, g: Rating) => clamp(W[7] * initDifficulty(4) + (1 - W[7]) * (d - W[6] * (g - 3)), 1, 10);

function recallStability(d: number, s: number, r: number, g: Rating) {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
}

function forgetStability(d: number, s: number, r: number) {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
}

/** Whole days until recall drops to the target retention. */
export function intervalFor(stability: number) {
  const days = (stability / FACTOR) * (Math.pow(RETENTION, 1 / DECAY) - 1);
  return clamp(Math.round(days), 1, MAX_INTERVAL);
}

function inMinutes(card: SrsCard, now: Date, minutes: number, patch: Partial<SrsCard>): Scheduled {
  return {
    card: { ...card, ...patch, due_at: new Date(now.getTime() + minutes * MIN_MS).toISOString() },
    intervalDays: minutes / 1440,
  };
}

function inDays(card: SrsCard, now: Date, days: number, patch: Partial<SrsCard>): Scheduled {
  return {
    card: { ...card, ...patch, state: STATE.review, step: 0, due_at: new Date(now.getTime() + days * DAY_MS).toISOString() },
    intervalDays: days,
  };
}

/** Review intervals for hard/good/easy, kept in increasing order. */
function reviewIntervals(d: number, s: number, r: number) {
  const hard = intervalFor(recallStability(d, s, r, 2));
  const good = Math.max(intervalFor(recallStability(d, s, r, 3)), hard + 1);
  const easy = Math.max(intervalFor(recallStability(d, s, r, 4)), good + 1);
  return { 2: hard, 3: good, 4: easy } as Record<2 | 3 | 4, number>;
}

/** Graduating from learning: good uses S, easy gets a little more. */
function graduateIntervals(s: number) {
  const good = intervalFor(s);
  return { good, easy: Math.max(good + 1, intervalFor(s * 1.5)) };
}

export function schedule(card: SrsCard, rating: Rating, now: Date = new Date()): Scheduled {
  const base = { reps: card.reps + 1, last_review_at: now.toISOString() };

  // New card: first answer sets the memory state.
  if (card.state === STATE.new || card.stability == null || card.difficulty == null) {
    const s = initStability(rating);
    const d = initDifficulty(rating);
    const patch = { ...base, stability: s, difficulty: d };
    if (rating === 4) return inDays(card, now, intervalFor(s), patch);
    if (rating === 3) return inMinutes(card, now, LEARNING_STEPS[1] ?? LEARNING_STEPS[0], { ...patch, state: STATE.learning, step: 1 });
    if (rating === 2) return inMinutes(card, now, (LEARNING_STEPS[0] + (LEARNING_STEPS[1] ?? LEARNING_STEPS[0])) / 2, { ...patch, state: STATE.learning, step: 0 });
    return inMinutes(card, now, LEARNING_STEPS[0], { ...patch, state: STATE.learning, step: 0 });
  }

  const s = card.stability;
  const d = card.difficulty;

  // Learning / relearning: short steps in minutes; same-day answers don't change S.
  if (card.state === STATE.learning || card.state === STATE.relearning) {
    const steps = card.state === STATE.learning ? LEARNING_STEPS : RELEARNING_STEPS;
    const patch = { ...base, difficulty: nextDifficulty(d, rating) };
    if (rating === 1) return inMinutes(card, now, steps[0], { ...patch, step: 0 });
    if (rating === 2) {
      const cur = steps[Math.min(card.step, steps.length - 1)];
      const nxt = steps[card.step + 1];
      return inMinutes(card, now, nxt ? (cur + nxt) / 2 : cur * 1.5, patch);
    }
    const g = graduateIntervals(s);
    if (rating === 3 && card.step + 1 < steps.length) {
      return inMinutes(card, now, steps[card.step + 1], { ...patch, step: card.step + 1 });
    }
    return inDays(card, now, rating === 4 ? g.easy : g.good, patch);
  }

  // Review.
  const elapsed = card.last_review_at ? (now.getTime() - new Date(card.last_review_at).getTime()) / DAY_MS : 0;
  const r = retrievability(elapsed, s);
  const nd = nextDifficulty(d, rating);
  if (rating === 1) {
    return inMinutes(card, now, RELEARNING_STEPS[0], {
      ...base,
      state: STATE.relearning,
      step: 0,
      lapses: card.lapses + 1,
      difficulty: nd,
      stability: forgetStability(d, s, r),
    });
  }
  const days = reviewIntervals(d, s, r)[rating];
  return inDays(card, now, days, { ...base, difficulty: nd, stability: recallStability(d, s, r, rating) });
}

/** Next gap for each button, for labels like "10 min" / "4 d". */
export function previewIntervals(card: SrsCard, now: Date = new Date()): Record<Rating, number> {
  return { 1: schedule(card, 1, now).intervalDays, 2: schedule(card, 2, now).intervalDays, 3: schedule(card, 3, now).intervalDays, 4: schedule(card, 4, now).intervalDays };
}

export const newCard = (now: Date = new Date()): SrsCard => ({
  state: STATE.new,
  step: 0,
  stability: null,
  difficulty: null,
  due_at: now.toISOString(),
  last_review_at: null,
  reps: 0,
  lapses: 0,
});

// ---------------------------------------------------------------------
// Typed answers
// ---------------------------------------------------------------------

export type Grade = "correct" | "almost" | "wrong";

export function normalizeAnswer(s: string) {
  return s
    .normalize("NFC")
    .toLowerCase()
    .replace(/[.,!?;:"'“”‘’()¿¡。、！？]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const stripMarks = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/đ/g, "d");

function editDistance(a: string, b: string) {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

/**
 * Compare a typed answer with the expected term. Alternatives can be given
 * with "/" or ";" (e.g. "colour / color"). "almost" = only accents differ,
 * or one typo in a word of 5+ letters.
 */
export function gradeAnswer(typed: string, expected: string): Grade {
  const answer = normalizeAnswer(typed);
  if (!answer) return "wrong";
  const options = expected
    .split(/[/;]/)
    .map(normalizeAnswer)
    .filter(Boolean);
  if (options.includes(answer)) return "correct";
  for (const o of options) {
    if (stripMarks(o) === stripMarks(answer)) return "almost";
    if (o.length >= 5 && editDistance(o, answer) <= 1) return "almost";
  }
  return "wrong";
}

export const ratingForGrade = (g: Grade): Rating => (g === "correct" ? 3 : g === "almost" ? 2 : 1);
