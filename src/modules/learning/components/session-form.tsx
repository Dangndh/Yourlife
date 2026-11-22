"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { saveSession, type LearnFormState } from "../actions";
import type { StudySession } from "../queries";

const DURATIONS = [15, 30, 45, 60, 90];

type Option = { id: string; name: string };

/** Log a study session (new: clears itself after saving; edit: goes back). */
export function SessionForm({
  session,
  occurredLocal,
  courses,
  skills,
  defaultCourseId,
  defaultSkillId,
  next,
  cancelHref,
  compact,
}: {
  session?: StudySession;
  occurredLocal?: string;
  courses: Option[];
  skills: Option[];
  defaultCourseId?: string;
  defaultSkillId?: string;
  next?: string;
  cancelHref?: string;
  /** Inline on a page: fewer fields until "more" is opened. */
  compact?: boolean;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<LearnFormState, FormData>(saveSession, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | number | null | undefined) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));
  const [duration, setDuration] = useState(v("duration_min", session?.duration_min));
  const [focus, setFocus] = useState(v("focus_rating", session?.focus_rating));
  const [more, setMore] = useState(!compact);

  return (
    <form key={`${state.attempt ?? 0}-${state.ok ?? 0}`} action={action} className="grid gap-4 sm:grid-cols-2">
      {session && <input type="hidden" name="id" value={session.id} />}
      {next && <input type="hidden" name="next" value={next} />}
      <Field id="topic" label={t("learning.fields.topic")} error={e.topic} className="sm:col-span-2">
        <Input
          id="topic"
          name="topic"
          required
          maxLength={500}
          autoComplete="off"
          placeholder={t("learning.fields.topicPlaceholder")}
          defaultValue={v("topic", session?.topic)}
        />
      </Field>
      <Field id="duration_min" label={t("log.duration")} error={e.duration_min} className="sm:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          {DURATIONS.map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={duration === String(m)}
              onClick={() => setDuration(String(m))}
              className={cn(
                "h-8 rounded-full border px-3 text-sm",
                duration === String(m) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
              )}
            >
              {t("log.minutes", { count: m })}
            </button>
          ))}
          <Input
            id="duration_min"
            name="duration_min"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            required
            value={duration}
            onChange={(ev) => setDuration(ev.target.value)}
            placeholder={t("log.minutesShort")}
            className="w-24"
          />
        </div>
      </Field>
      <Field id="course_id" label={t("learning.fields.course")} error={e.course_id}>
        <NativeSelect id="course_id" name="course_id" defaultValue={v("course_id", session?.course_id ?? defaultCourseId)}>
          <option value="">{t("planning.fields.none")}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="skill_id" label={t("learning.fields.skill")} error={e.skill_id}>
        <NativeSelect id="skill_id" name="skill_id" defaultValue={v("skill_id", session?.skill_id ?? defaultSkillId)}>
          <option value="">{t("planning.fields.none")}</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {more ? (
        <>
          <Field id="occurred_local" label={t("log.when")} hint={t("log.whenHint")} error={e.occurred_local}>
            <Input id="occurred_local" name="occurred_local" type="datetime-local" defaultValue={v("occurred_local", occurredLocal)} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium">{t("learning.fields.focus")}</legend>
            <input type="hidden" name="focus_rating" value={focus} />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={focus === String(n)}
                  aria-label={`${t("learning.fields.focus")}: ${n}`}
                  onClick={() => setFocus(focus === String(n) ? "" : String(n))}
                  className={cn(
                    "size-9 rounded-full border text-sm tabular-nums",
                    focus === String(n) ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent",
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>
          <Field id="notes" label={t("planning.fields.notes")} error={e.notes} className="sm:col-span-2">
            <Textarea id="notes" name="notes" rows={3} defaultValue={v("notes", session?.notes)} />
          </Field>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setMore(true)}
          className="text-muted-foreground hover:text-foreground w-fit text-sm underline-offset-4 hover:underline sm:col-span-2"
        >
          {t("learning.moreSession")}
        </button>
      )}
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {session ? t("planning.save") : t("learning.logSession")}
        </Button>
        {cancelHref && (
          <Button variant="ghost" asChild>
            <Link href={cancelHref}>{t("planning.cancel")}</Link>
          </Button>
        )}
        {state.ok ? <span className="text-muted-foreground text-xs">{t("learning.sessionSaved")}</span> : null}
        <FormError error={state.error} />
      </div>
    </form>
  );
}
