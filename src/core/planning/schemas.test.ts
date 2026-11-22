import { describe, expect, it } from "vitest";

import { goalSchema } from "./schemas";

const base = { title: "Reach 68 kg", life_area_id: "a0000000-0000-4000-8000-000000000003" };

describe("goalSchema", () => {
  it("accepts a plain goal and turns empty fields into null", () => {
    const g = goalSchema.parse({ ...base, start_date: "", metric_id: "", target_value: "" });
    expect(g.start_date).toBeNull();
    expect(g.metric_id).toBeNull();
    expect(g.target_value).toBeNull();
  });

  it("rejects a target date before the start date", () => {
    const r = goalSchema.safeParse({ ...base, start_date: "2026-11-22", target_date: "2026-11-01" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toBe("targetBeforeStart");
  });

  it("needs a target value when a metric is chosen", () => {
    const metric_id = "90000000-0000-4000-8000-000000000001";
    const r = goalSchema.safeParse({ ...base, metric_id, target_value: "" });
    expect(r.error?.issues[0].message).toBe("targetRequired");
    expect(goalSchema.parse({ ...base, metric_id, baseline_value: "72,5", target_value: "68" })).toMatchObject({
      baseline_value: 72.5,
      target_value: 68,
    });
  });
});
