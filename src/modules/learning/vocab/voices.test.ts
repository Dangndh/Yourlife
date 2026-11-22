import { describe, expect, it } from "vitest";

import { voiceScore } from "./voices";

const v = (name: string, lang = "en-US", localService = true) => ({ name, lang, localService });

describe("voiceScore", () => {
  it("ranks natural voices above old ones", () => {
    const voices = [v("Fred"), v("Microsoft Aria Online (Natural) - English (United States)", "en-US", false), v("Google US English", "en-US", false), v("Samantha (Enhanced)")];
    const best = [...voices].sort((a, b) => voiceScore(b, "en-US") - voiceScore(a, "en-US")).map((x) => x.name);
    expect(best[0]).toContain("Natural");
    expect(best.at(-1)).toBe("Fred");
  });
  it("prefers the exact accent", () => {
    expect(voiceScore(v("Daniel", "en-GB"), "en-GB")).toBeGreaterThan(voiceScore(v("Alex", "en-US"), "en-GB"));
  });
  it("pushes novelty voices down", () => {
    expect(voiceScore(v("Zarvox"), "en-US")).toBeLessThan(voiceScore(v("Alex"), "en-US"));
  });
});
