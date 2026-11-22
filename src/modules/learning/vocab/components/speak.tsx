"use client";

import { Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

/** Read text aloud with the browser's built-in voice for the language. Returns false if unsupported. */
export function speak(text: string, lang: string): boolean {
  if (!canSpeak()) return false;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()));
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function SpeakButton({ text, lang, size = "icon" }: { text: string; lang: string; size?: "icon" | "sm" }) {
  const t = useTranslations("vocab");
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={size === "icon" ? "size-8" : undefined}
      onClick={() => speak(text, lang)}
      aria-label={t("listen")}
      title={t("listen")}
    >
      <Volume2 />
    </Button>
  );
}
