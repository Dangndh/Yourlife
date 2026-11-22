"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveReview, type ReviewFormState } from "@/core/reviews/actions";
import type { AreaScore, Review } from "@/core/reviews/queries";
import { cn } from "@/lib/utils";

import { LifeWheel } from "./life-wheel";

type Area = { id: string; label: string };

function ScoreRow({
  name,
  label,
  value,
  previous,
  onChange,
}: {
  name: string;
  label: string;
  value: number | null;
  previous?: number | null;
  onChange: (v: number | null) => void;
}) {
  const t = useTranslations("reviews");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        {previous != null && <span className="text-muted-foreground text-xs">{t("previousScore", { value: previous })}</span>}
      </div>
      <input type="hidden" name={name} value={value ?? ""} />
      <div className="grid grid-cols-10 gap-1" role="group" aria-label={label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            aria-label={`${label}: ${n}`}
            onClick={() => onChange(value === n ? null : n)}
            className={cn(
              "h-8 rounded-md border text-xs font-medium tabular-nums transition-colors",
              "focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
              value === n
                ? "bg-primary text-primary-foreground border-primary"
                : value != null && n < value
                  ? "bg-primary/15 border-transparent"
                  : "hover:bg-accent",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReviewEditor({
  review,
  scores,
  previous,
  areas,
}: {
  review: Review;
  scores: AreaScore[];
  /** Score per area id from the review before this one. */
  previous: Record<string, number>;
  areas: Area[];
}) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(saveReview, {});
  const formRef = useRef<HTMLFormElement>(null);
  const intentRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState<Record<string, number | null>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, scores.find((s) => s.life_area_id === a.id)?.score ?? null])),
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(areas.map((a) => [a.id, scores.find((s) => s.life_area_id === a.id)?.note ?? ""])),
  );
  const [answers, setAnswers] = useState({
    wins: review.wins ?? "",
    challenges: review.challenges ?? "",
    lessons: review.lessons ?? "",
    next_focus: review.next_focus ?? "",
  });
  const [overall, setOverall] = useState<number | null>(review.overall_score);

  const snapshot = JSON.stringify([values, notes, answers, overall]);
  const [initial] = useState(snapshot);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const dirty = snapshot !== (state.savedAt && submitted ? submitted : initial);
  const completed = state.completed ?? review.status === "completed";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (intentRef.current) intentRef.current.value = "save";
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const savedTime = state.savedAt
    ? new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(new Date(state.savedAt))
    : null;
  const rated = areas.filter((a) => values[a.id] != null).length;

  const questions = ["wins", "challenges", "lessons", "next_focus"] as const;

  return (
    <form ref={formRef} action={action} onSubmit={() => setSubmitted(snapshot)} className="flex flex-col gap-8">
      <input type="hidden" name="id" value={review.id} />
      <input ref={intentRef} type="hidden" name="intent" defaultValue="save" />

      <section className="grid gap-6 lg:grid-cols-[1fr_minmax(0,380px)]">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("wheelTitle")}</h2>
            <p className="text-muted-foreground text-sm">{t("wheelHint")}</p>
          </div>
          {areas.map((a) => (
            <div key={a.id} className="flex flex-col gap-1.5">
              <ScoreRow
                name={`score_${a.id}`}
                label={a.label}
                value={values[a.id]}
                previous={previous[a.id]}
                onChange={(v) => setValues((s) => ({ ...s, [a.id]: v }))}
              />
              {values[a.id] != null && (
                <Input
                  name={`note_${a.id}`}
                  value={notes[a.id]}
                  onChange={(e) => setNotes((s) => ({ ...s, [a.id]: e.target.value }))}
                  placeholder={t("notePlaceholder")}
                  aria-label={t("noteFor", { area: a.label })}
                  maxLength={1000}
                  className="h-8 text-sm"
                />
              )}
            </div>
          ))}
        </div>
        <div className="bg-card h-fit rounded-xl border p-4 lg:sticky lg:top-6">
          <LifeWheel
            label={t("wheelTitle")}
            axes={areas.map((a) => ({ label: a.label, value: values[a.id], previous: previous[a.id] ?? null }))}
          />
          <p className="text-muted-foreground mt-2 text-center text-xs">
            {t("wheelLegend")} · {t("rated", { count: rated, total: areas.length })}
          </p>
        </div>
      </section>

      <section className="flex max-w-3xl flex-col gap-5">
        <h2 className="text-lg font-semibold">{t("questionsTitle")}</h2>
        {questions.map((q) => (
          <div key={q} className="flex flex-col gap-2">
            <Label htmlFor={q}>{t(`questions.${q}`)}</Label>
            <Textarea
              id={q}
              name={q}
              rows={3}
              value={answers[q]}
              onChange={(e) => setAnswers((s) => ({ ...s, [q]: e.target.value }))}
              placeholder={t(`placeholders.${q}`)}
            />
          </div>
        ))}
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">{t("overall")}</legend>
          <input type="hidden" name="overall_score" value={overall ?? ""} />
          <div className="grid max-w-md grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={overall === n}
                aria-label={`${t("overall")}: ${n}`}
                onClick={() => setOverall(overall === n ? null : n)}
                className={cn(
                  "h-9 rounded-md border text-sm font-medium tabular-nums",
                  overall === n ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="bg-background/95 sticky bottom-16 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t px-4 py-3 md:bottom-0 md:mx-0 md:rounded-lg md:border">
        {completed ? (
          <Button type="submit" disabled={pending} onClick={() => intentRef.current && (intentRef.current.value = "save")}>
            {t("save")}
          </Button>
        ) : (
          <>
            <Button type="submit" disabled={pending} onClick={() => intentRef.current && (intentRef.current.value = "complete")}>
              <CheckCircle2 />
              {t("complete")}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
              onClick={() => intentRef.current && (intentRef.current.value = "save")}
            >
              {t("saveDraft")}
            </Button>
          </>
        )}
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {pending
            ? t("saving")
            : dirty
              ? t("unsaved")
              : savedTime
                ? t("savedAt", { time: savedTime })
                : ""}
        </span>
        {completed && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            {t("completedBadge")}
          </span>
        )}
        <FormError error={state.error} />
      </div>
    </form>
  );
}
