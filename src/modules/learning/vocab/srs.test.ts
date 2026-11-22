import { describe, expect, it } from "vitest";

import { gradeAnswer, intervalFor, newCard, previewIntervals, retrievability, schedule, STATE, type SrsCard } from "./srs";

const t0 = new Date("2026-11-22T08:00:00Z");
const after = (days: number) => new Date(t0.getTime() + days * 86_400_000);
const minutesBetween = (a: string, b: Date) => Math.round((new Date(a).getTime() - b.getTime()) / 60000);

describe("FSRS memory model", () => {
  it("recall is 90% when elapsed time equals stability", () => {
    expect(retrievability(10, 10)).toBeCloseTo(0.9, 5);
    expect(intervalFor(10)).toBe(10);
  });

  it("new card: again/good stay in learning steps, easy graduates", () => {
    const c = newCard(t0);
    const again = schedule(c, 1, t0).card;
    expect(again.state).toBe(STATE.learning);
    expect(minutesBetween(again.due_at, t0)).toBe(1);
    const good = schedule(c, 3, t0).card;
    expect(good.state).toBe(STATE.learning);
    expect(minutesBetween(good.due_at, t0)).toBe(10);
    const easy = schedule(c, 4, t0);
    expect(easy.card.state).toBe(STATE.review);
    expect(easy.intervalDays).toBeGreaterThanOrEqual(14);
    expect(easy.card.reps).toBe(1);
  });

  it("good, good graduates to review in days", () => {
    let c: SrsCard = schedule(newCard(t0), 3, t0).card;
    const tenMin = new Date(t0.getTime() + 10 * 60000);
    const s = schedule(c, 3, tenMin);
    c = s.card;
    expect(c.state).toBe(STATE.review);
    expect(s.intervalDays).toBeGreaterThanOrEqual(3);
    expect(s.intervalDays).toBeLessThanOrEqual(5);
  });

  it("successful reviews grow the interval; buttons stay ordered", () => {
    let c: SrsCard = schedule(newCard(t0), 4, t0).card;
    const first = (new Date(c.due_at).getTime() - t0.getTime()) / 86_400_000;
    const p = previewIntervals(c, new Date(c.due_at));
    expect(p[1]).toBeLessThan(1);
    expect(p[2]).toBeLessThan(p[3]);
    expect(p[3]).toBeLessThan(p[4]);
    c = schedule(c, 3, new Date(c.due_at)).card;
    expect(c.state).toBe(STATE.review);
    expect(c.stability!).toBeGreaterThan(first);
  });

  it("forgetting a review card relearns it and lowers stability", () => {
    const c = schedule(newCard(t0), 4, t0).card;
    const s = schedule(c, 1, after(15));
    expect(s.card.state).toBe(STATE.relearning);
    expect(s.card.lapses).toBe(1);
    expect(s.card.stability!).toBeLessThan(c.stability!);
    expect(minutesBetween(s.card.due_at, after(15))).toBe(10);
    const back = schedule(s.card, 3, new Date(after(15).getTime() + 600000));
    expect(back.card.state).toBe(STATE.review);
    expect(back.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it("difficulty stays within 1..10", () => {
    let c = newCard(t0);
    let now = t0;
    for (let i = 0; i < 30; i++) {
      c = schedule(c, 1, now).card;
      now = new Date(c.due_at);
    }
    expect(c.difficulty!).toBeLessThanOrEqual(10);
    expect(c.difficulty!).toBeGreaterThanOrEqual(1);
  });
});

describe("gradeAnswer", () => {
  it("accepts exact answers ignoring case, spaces and punctuation", () => {
    expect(gradeAnswer("  Hello! ", "hello")).toBe("correct");
    expect(gradeAnswer("look  after", "look after")).toBe("correct");
  });
  it("accepts any alternative", () => {
    expect(gradeAnswer("color", "colour / color")).toBe("correct");
  });
  it("treats missing accents or one typo as almost", () => {
    expect(gradeAnswer("cafe", "café")).toBe("almost");
    expect(gradeAnswer("xin chao", "xin chào")).toBe("almost");
    expect(gradeAnswer("beautful", "beautiful")).toBe("almost");
  });
  it("short words need to be exact", () => {
    expect(gradeAnswer("cat", "car")).toBe("wrong");
    expect(gradeAnswer("", "car")).toBe("wrong");
  });
});
