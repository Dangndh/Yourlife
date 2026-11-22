"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Lock } from "lucide-react";

import { FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveJournal, type JournalFormState } from "@/core/journal/actions";
import type { JournalEntry } from "@/core/journal/queries";
import { cn } from "@/lib/utils";

function Scale({
  name,
  label,
  value,
  onChange,
  labels,
}: {
  name: string;
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  labels: string[];
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">
        {label}
        {value != null && <span className="text-muted-foreground ml-2 font-normal">{labels[value - 1]}</span>}
      </legend>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${label}: ${n} – ${labels[n - 1]}`}
            title={labels[n - 1]}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "size-10 rounded-full border text-sm font-medium tabular-nums transition-colors",
              "focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              value === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function JournalEditor({ date, entry }: { date: string; entry: JournalEntry | null }) {
  const t = useTranslations("journal");
  const locale = useLocale();
  const [state, action, pending] = useActionState<JournalFormState, FormData>(saveJournal, {});
  const [body, setBody] = useState(entry?.body ?? "");
  const [mood, setMood] = useState<number | null>(entry?.mood ?? null);
  const [energy, setEnergy] = useState<number | null>(entry?.energy ?? null);
  const [isPrivate, setPrivate] = useState(entry?.is_private ?? false);
  const formRef = useRef<HTMLFormElement>(null);
  // "Unsaved" = what is on screen differs from what was last sent (or loaded).
  const snapshot = JSON.stringify([body, mood, energy, isPrivate]);
  const [initial] = useState(snapshot);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const dirty = snapshot !== (state.savedAt && submitted ? submitted : initial);

  // Cmd/Ctrl + S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const change = <T,>(set: (v: T) => void) => (v: T) => set(v);
  const savedTime = state.savedAt
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(state.savedAt))
    : null;

  return (
    <form ref={formRef} action={action} onSubmit={() => setSubmitted(snapshot)} className="flex flex-col gap-6">
      <input type="hidden" name="entry_date" value={date} />
      <div className="flex flex-wrap gap-x-10 gap-y-4">
        <Scale name="mood" label={t("mood")} value={mood} onChange={change(setMood)} labels={t("moodLabels").split("|")} />
        <Scale
          name="energy"
          label={t("energy")}
          value={energy}
          onChange={change(setEnergy)}
          labels={t("energyLabels").split("|")}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">{t("body")}</Label>
        <Textarea
          id="body"
          name="body"
          rows={14}
          value={body}
          onChange={(e) => change(setBody)(e.target.value)}
          placeholder={t("placeholder")}
          className="font-[inherit] leading-relaxed"
        />
        <p className="text-muted-foreground text-xs">{t("markdownHint")}</p>
      </div>
      <label className="flex w-fit items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_private"
          checked={isPrivate}
          onChange={(e) => change(setPrivate)(e.target.checked)}
          className="accent-primary size-4"
        />
        <Lock className="size-3.5" />
        {t("private")}
        <span className="text-muted-foreground text-xs">{t("privateHint")}</span>
      </label>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {t("save")}
        </Button>
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {pending ? t("saving") : dirty ? t("unsaved") : savedTime ? t("savedAt", { time: savedTime }) : ""}
        </span>
        <FormError error={state.error} />
      </div>
    </form>
  );
}
