import { describe, expect, it } from "vitest";

import { isLookupCandidate, pickPronunciation } from "./dictionary";

const sample = [
  {
    phonetic: "/ˈnɒlɪdʒ/",
    phonetics: [
      { text: "/ˈnɒlɪdʒ/", audio: "https://api.dictionaryapi.dev/media/pronunciations/en/knowledge-uk.mp3" },
      { text: "/ˈnɑlɪdʒ/", audio: "https://api.dictionaryapi.dev/media/pronunciations/en/knowledge-us.mp3" },
      { text: "/x/", audio: "" },
    ],
  },
];

describe("pickPronunciation", () => {
  it("prefers the deck's accent", () => {
    expect(pickPronunciation(sample, "en-US")).toEqual({
      audio: "https://api.dictionaryapi.dev/media/pronunciations/en/knowledge-us.mp3",
      ipa: "/ˈnɑlɪdʒ/",
    });
    expect(pickPronunciation(sample, "en-GB").audio).toContain("-uk.mp3");
  });
  it("handles no audio and bad input", () => {
    expect(pickPronunciation([{ phonetic: "/a/", phonetics: [{ audio: "" }] }], "en-US")).toEqual({ audio: null, ipa: "/a/" });
    expect(pickPronunciation({ title: "No Definitions Found" }, "en-US")).toEqual({ audio: null, ipa: null });
  });
});

describe("isLookupCandidate", () => {
  it("only English words and short phrases", () => {
    expect(isLookupCandidate("apple", "en-US")).toBe(true);
    expect(isLookupCandidate("look after", "en-GB")).toBe(true);
    expect(isLookupCandidate("I eat an apple every day", "en-US")).toBe(false);
    expect(isLookupCandidate("りんご", "ja-JP")).toBe(false);
    expect(isLookupCandidate("pomme", "fr-FR")).toBe(false);
  });
});
