"use client";

import { useSyncExternalStore } from "react";
import { Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";

import { voiceScore } from "../voices";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;

const VOICE_KEY = (lang: string) => `yourlife_voice_${lang}`;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

function subscribeVoices(fn: () => void) {
  listeners.add(fn);
  if (canSpeak()) window.speechSynthesis.addEventListener("voiceschanged", fn);
  return () => {
    listeners.delete(fn);
    if (canSpeak()) window.speechSynthesis.removeEventListener("voiceschanged", fn);
  };
}

const sameLanguage = (v: SpeechSynthesisVoice, lang: string) =>
  v.lang.replace("_", "-").toLowerCase().startsWith(lang.slice(0, 2).toLowerCase());

function voicesFor(lang: string): SpeechSynthesisVoice[] {
  if (!canSpeak()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter((v) => sameLanguage(v, lang))
    .sort((a, b) => voiceScore(b, lang) - voiceScore(a, lang));
}

function chosenVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = voicesFor(lang);
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(VOICE_KEY(lang));
  } catch {
    /* storage may be blocked */
  }
  return voices.find((v) => v.voiceURI === saved) ?? voices[0];
}

/** Read text aloud with the best (or chosen) voice of this device. Returns false if unsupported. */
export function speak(text: string, lang: string): boolean {
  if (!canSpeak()) return false;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.9;
    const voice = chosenVoice(lang);
    if (voice) u.voice = voice;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

let current: HTMLAudioElement | null = null;

/** Play a real recording when there is one; otherwise (or if it fails) use the device voice. */
export function playWord(text: string, lang: string, audioUrl?: string | null) {
  if (!audioUrl) return speak(text, lang);
  try {
    if (canSpeak()) window.speechSynthesis.cancel();
    current?.pause();
    current = new Audio(audioUrl);
    current.play().catch(() => speak(text, lang));
    return true;
  } catch {
    return speak(text, lang);
  }
}

export function SpeakButton({ text, lang, audioUrl, size = "icon" }: { text: string; lang: string; audioUrl?: string | null; size?: "icon" | "sm" }) {
  const t = useTranslations("vocab");
  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      className={size === "icon" ? "size-8" : undefined}
      onClick={() => playWord(text, lang, audioUrl)}
      aria-label={t("listen")}
      title={audioUrl ? t("realVoice") : t("listen")}
    >
      <Volume2 className={audioUrl ? "text-primary" : undefined} />
    </Button>
  );
}

/** Pick which voice of this device reads a language. Saved per browser. */
export function VoicePicker({ lang, sample }: { lang: string; sample: string }) {
  const t = useTranslations("vocab");
  const list = useSyncExternalStore(
    subscribeVoices,
    () => voiceListKey(lang),
    () => "",
  );
  const voices = list ? voicesFor(lang) : [];
  const selected = list ? (chosenVoice(lang)?.voiceURI ?? "") : "";
  if (!list) return <p className="text-muted-foreground text-xs">{t("noVoices")}</p>;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <NativeSelect
          aria-label={t("voice")}
          value={selected}
          onChange={(e) => {
            try {
              localStorage.setItem(VOICE_KEY(lang), e.target.value);
            } catch {
              /* ignore */
            }
            notify();
            setTimeout(() => speak(sample, lang), 0);
          }}
          className="min-w-0 flex-1"
        >
          {voices.map((v) => (
            <option key={v.voiceURI} value={v.voiceURI}>
              {v.name}
            </option>
          ))}
        </NativeSelect>
        <Button type="button" variant="outline" size="icon" onClick={() => speak(sample, lang)} aria-label={t("listen")}>
          <Volume2 />
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">{t("voiceHint")}</p>
    </div>
  );
}

// A string snapshot (stable between renders) of the voice list + saved choice.
function voiceListKey(lang: string) {
  const voices = voicesFor(lang);
  if (!voices.length) return "";
  let saved = "";
  try {
    saved = localStorage.getItem(VOICE_KEY(lang)) ?? "";
  } catch {
    /* ignore */
  }
  return `${voices.map((v) => v.voiceURI).join("|")}#${saved}`;
}
