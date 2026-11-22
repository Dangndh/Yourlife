/** Languages offered for a deck (BCP 47; used for text-to-speech). Labels come from Intl.DisplayNames. */
export const DECK_LANGUAGES = [
  "en-US",
  "en-GB",
  "zh-CN",
  "ja-JP",
  "ko-KR",
  "fr-FR",
  "de-DE",
  "es-ES",
  "it-IT",
  "pt-BR",
  "ru-RU",
  "th-TH",
  "vi-VN",
] as const;

export const REVIEW_MODES = ["mix", "flip", "choice", "type", "listen"] as const;
export type ReviewMode = (typeof REVIEW_MODES)[number];

/** A card counts as "known" once it would be remembered for 3 weeks. */
export const KNOWN_STABILITY_DAYS = 21;
export const MAX_IMPORT_LINES = 1000;

/** e.g. "en-US" → "English (United States)" / "Tiếng Anh (Hoa Kỳ)". */
export function languageName(code: string, locale: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}
