import { describe, expect, it } from "vitest";

import { formatPeriod, periodFor, previousPeriod, weekStart } from "./periods";

describe("review periods", () => {
  it("finds the week start for Monday and Sunday weeks", () => {
    expect(weekStart("2026-11-22", 1)).toBe("2026-11-16"); // Sunday -> Monday before
    expect(weekStart("2026-11-16", 1)).toBe("2026-11-16");
    expect(weekStart("2026-11-22", 0)).toBe("2026-11-22");
    expect(weekStart("2026-11-21", 0)).toBe("2026-11-15");
  });

  it("builds weeks and months", () => {
    expect(periodFor("weekly", "2026-11-22")).toEqual({ type: "weekly", start: "2026-11-16", end: "2026-11-22" });
    expect(periodFor("monthly", "2026-11-22")).toEqual({ type: "monthly", start: "2026-11-01", end: "2026-11-30" });
    expect(periodFor("monthly", "2028-02-10").end).toBe("2028-02-29");
  });

  it("steps back one period", () => {
    expect(previousPeriod(periodFor("weekly", "2026-11-22")).start).toBe("2026-11-09");
    expect(previousPeriod(periodFor("monthly", "2026-01-15"))).toEqual({
      type: "monthly",
      start: "2025-12-01",
      end: "2025-12-31",
    });
  });

  it("formats periods", () => {
    expect(formatPeriod(periodFor("monthly", "2026-11-22"), "en")).toBe("November 2026");
    expect(formatPeriod(periodFor("weekly", "2026-11-22"), "en")).toMatch(/Nov 16\s*–\s*22/);
  });
});
