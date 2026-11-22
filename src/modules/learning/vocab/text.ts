import { MAX_IMPORT_LINES } from "./constants";

export type ParsedCard = {
  term: string;
  meaning: string;
  pronunciation: string | null;
  example: string | null;
  example_meaning: string | null;
};

const SEPARATORS = ["\t", "|", " = ", " - ", " – ", ";", ":"];

/**
 * One card per line: term | meaning | pronunciation | example | example meaning.
 * Tab, "|", " = ", " - ", ";" or ":" all work as the separator (the first one found
 * in the line is used), so lists copied from a spreadsheet or a note both import.
 */
export function parseCardList(text: string): { cards: ParsedCard[]; invalid: number } {
  const cards: ParsedCard[] = [];
  let invalid = 0;
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, MAX_IMPORT_LINES);
  for (const line of lines) {
    const sep = SEPARATORS.find((s) => line.includes(s));
    const parts = sep ? line.split(sep).map((p) => p.trim()) : [line];
    const [term, meaning, pronunciation, example, exampleMeaning] = parts;
    if (!term || !meaning || term.length > 500 || meaning.length > 1000) {
      invalid++;
      continue;
    }
    cards.push({
      term,
      meaning,
      pronunciation: pronunciation || null,
      example: example || null,
      example_meaning: exampleMeaning || null,
    });
  }
  return { cards, invalid };
}

export const termKey = (term: string) => term.normalize("NFC").trim().toLowerCase();

/** Days in a row with at least one review, ending today (or yesterday, if today isn't done yet). */
export function streak(days: Iterable<string>, today: string): number {
  const set = new Set(days);
  const prev = (d: string) => {
    const dt = new Date(`${d}T00:00:00Z`);
    dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
  };
  let day = set.has(today) ? today : prev(today);
  let n = 0;
  while (set.has(day)) {
    n++;
    day = prev(day);
  }
  return n;
}
