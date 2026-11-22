import { describe, expect, it } from "vitest";

import { aggregate, formatMetricValue, periodStart, trend } from "./format";

describe("metric format", () => {
  it("formats units", () => {
    expect(formatMetricValue({ unit: "kg", value_type: "number" }, 70.5, "en")).toBe("70.5 kg");
    expect(formatMetricValue({ unit: "/10", value_type: "rating" }, 8, "en")).toBe("8/10");
    expect(formatMetricValue({ unit: "%", value_type: "percent" }, 12.345, "en")).toBe("12.35%");
    expect(formatMetricValue({ unit: "times", value_type: "number" }, 3, "en")).toBe("3");
    expect(formatMetricValue({ unit: "USD", value_type: "currency" }, 1200, "en")).toBe("$1,200");
  });

  it("groups days into weeks (Monday) and months", () => {
    expect(periodStart("2026-11-22", "week")).toBe("2026-11-16"); // Sunday -> previous Monday
    expect(periodStart("2026-11-16", "week")).toBe("2026-11-16");
    expect(periodStart("2026-11-22", "month")).toBe("2026-11-01");
    expect(periodStart("2026-11-22", null)).toBe("2026-11-22");
  });

  it("combines points in the same period", () => {
    const pts = [
      { period_start: "2026-11-02", value: 2 },
      { period_start: "2026-11-01", value: 4 },
      { period_start: "2026-11-01", value: 6 },
    ];
    expect(aggregate(pts, "sum")).toEqual([
      { period_start: "2026-11-01", value: 10 },
      { period_start: "2026-11-02", value: 2 },
    ]);
    expect(aggregate(pts, "avg")[0].value).toBe(5);
    expect(aggregate(pts, "last")[0].value).toBe(6);
    expect(aggregate(pts, "max")[0].value).toBe(6);
  });

  it("colours the trend by the better direction", () => {
    const pts = [
      { period_start: "a", value: 72 },
      { period_start: "b", value: 71 },
    ];
    expect(trend({ direction: "down" }, pts)).toEqual({ delta: -1, tone: "good" });
    expect(trend({ direction: "up" }, pts)).toEqual({ delta: -1, tone: "bad" });
    expect(trend({ direction: "neutral" }, pts)?.tone).toBe("flat");
    expect(trend({ direction: "up" }, pts.slice(0, 1))).toBeNull();
  });
});
