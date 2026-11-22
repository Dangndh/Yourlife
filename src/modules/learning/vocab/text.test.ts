import { describe, expect, it } from "vitest";

import { parseCardList, streak } from "./text";

describe("parseCardList", () => {
  it("reads several separators and optional fields", () => {
    const { cards, invalid } = parseCardList(
      "apple | quả táo | /ˈæp.əl/ | I eat an apple. | Tôi ăn một quả táo.\nriver\tdòng sông\nhouse = ngôi nhà\n\nbook - quyển sách\nnomeaning",
    );
    expect(invalid).toBe(1);
    expect(cards.map((c) => c.term)).toEqual(["apple", "river", "house", "book"]);
    expect(cards[0]).toMatchObject({ pronunciation: "/ˈæp.əl/", example: "I eat an apple.", example_meaning: "Tôi ăn một quả táo." });
    expect(cards[1].pronunciation).toBeNull();
  });
  it("keeps hyphenated words when another separator is used", () => {
    expect(parseCardList("well-known | nổi tiếng").cards[0].term).toBe("well-known");
  });
});

describe("streak", () => {
  it("counts back from today", () => {
    expect(streak(["2026-11-22", "2026-11-21", "2026-11-20", "2026-11-18"], "2026-11-22")).toBe(3);
  });
  it("is still alive if only yesterday is done", () => {
    expect(streak(["2026-11-21", "2026-11-20"], "2026-11-22")).toBe(2);
  });
  it("is zero after a missed day", () => {
    expect(streak(["2026-11-20"], "2026-11-22")).toBe(0);
  });
});
