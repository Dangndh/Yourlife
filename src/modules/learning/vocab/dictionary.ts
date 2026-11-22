/**
 * Real-speaker pronunciation for English words from the free Dictionary API
 * (dictionaryapi.dev, recordings from Wiktionary / Wikimedia Commons). No key needed.
 */

export type DictionaryResult = { audio: string | null; ipa: string | null };

type Entry = { phonetic?: string; phonetics?: { text?: string; audio?: string }[] };

/** Pick the best recording and IPA from the API's entries, preferring the deck's accent. */
export function pickPronunciation(entries: unknown, language: string): DictionaryResult {
  if (!Array.isArray(entries)) return { audio: null, ipa: null };
  const accent = language === "en-GB" ? "uk" : language === "en-AU" ? "au" : "us";
  const phonetics = (entries as Entry[]).flatMap((e) => e.phonetics ?? []);
  const withAudio = phonetics.filter((p) => typeof p.audio === "string" && p.audio.startsWith("https://"));
  const preferred =
    withAudio.find((p) => p.audio!.toLowerCase().includes(`-${accent}.`)) ??
    withAudio.find((p) => !/-(uk|us|au|ca)\./i.test(p.audio!)) ??
    withAudio[0];
  const ipa =
    preferred?.text ||
    phonetics.find((p) => p.text)?.text ||
    (entries as Entry[]).find((e) => e.phonetic)?.phonetic ||
    null;
  return { audio: preferred?.audio ?? null, ipa: ipa ? ipa.slice(0, 200) : null };
}

/** Words or short phrases only; sentences won't be in the dictionary. */
export function isLookupCandidate(term: string, language: string) {
  return language.startsWith("en") && /^[a-zA-Z][a-zA-Z' -]{0,40}$/.test(term.trim()) && term.trim().split(/\s+/).length <= 3;
}

export async function lookupEnglish(term: string, language: string, timeoutMs = 4000): Promise<DictionaryResult | null> {
  if (!isLookupCandidate(term, language)) return { audio: null, ipa: null };
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(term.trim().toLowerCase())}`, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { accept: "application/json" },
    });
    if (res.status === 404) return { audio: null, ipa: null };
    if (!res.ok) return null; // try again another time
    return pickPronunciation(await res.json(), language);
  } catch {
    return null;
  }
}
