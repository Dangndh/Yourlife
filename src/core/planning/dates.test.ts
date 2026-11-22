import { describe, expect, it } from "vitest";

import { addDays, dayOf, startOfDayIso, zonedLocalToIso } from "./dates";

describe("dates", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-12-30", 3)).toBe("2027-01-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("converts a local time in a zone to UTC", () => {
    expect(zonedLocalToIso("2026-11-22T12:00", "Asia/Ho_Chi_Minh")).toBe("2026-11-22T05:00:00.000Z");
    expect(zonedLocalToIso("2026-07-01T12:00", "Europe/Berlin")).toBe("2026-07-01T10:00:00.000Z");
  });

  it("handles a daylight-saving change", () => {
    // New York moves to summer time on 2026-03-08
    expect(zonedLocalToIso("2026-03-08T12:00", "America/New_York")).toBe("2026-03-08T16:00:00.000Z");
  });

  it("finds the local day of an instant", () => {
    expect(dayOf("2026-11-22T18:30:00Z", "Asia/Ho_Chi_Minh")).toBe("2026-11-23");
    expect(dayOf("2026-11-22T18:30:00Z", "UTC")).toBe("2026-11-22");
  });

  it("gives the start of a local day", () => {
    expect(startOfDayIso("2026-11-22", "Asia/Ho_Chi_Minh")).toBe("2026-11-21T17:00:00.000Z");
  });
});
