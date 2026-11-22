"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";

import { saveCourse, type LearnFormState } from "../actions";
import { COURSE_FORMATS, COURSE_STATUSES } from "../constants";
import type { Course } from "../queries";

type Option = { id: string; name: string };

export function CourseForm({
  course,
  skills,
  goals,
  cancelHref,
}: {
  course?: Course;
  skills: Option[];
  goals: Option[];
  cancelHref: string;
}) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<LearnFormState, FormData>(saveCourse, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | number | null | undefined) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      {course && <input type="hidden" name="id" value={course.id} />}
      <Field id="title" label={t("planning.fields.title")} error={e.title} className="sm:col-span-2">
        <Input
          id="title"
          name="title"
          required
          maxLength={300}
          autoFocus={!course}
          placeholder={t("learning.fields.titlePlaceholder")}
          defaultValue={v("title", course?.title)}
        />
      </Field>
      <Field id="provider" label={t("learning.fields.provider")} error={e.provider}>
        <Input id="provider" name="provider" maxLength={200} placeholder="Coursera, British Council…" defaultValue={v("provider", course?.provider)} />
      </Field>
      <Field id="format" label={t("learning.fields.format")} error={e.format}>
        <NativeSelect id="format" name="format" defaultValue={v("format", course?.format ?? "course")}>
          {COURSE_FORMATS.map((f) => (
            <option key={f} value={f}>
              {t(`learning.format.${f}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="status" label={t("planning.fields.status")} error={e.status}>
        <NativeSelect id="status" name="status" defaultValue={v("status", course?.status ?? "planned")}>
          {COURSE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`learning.status.${s}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="est_hours" label={t("learning.fields.estHours")} hint={t("learning.fields.estHoursHint")} error={e.est_hours}>
        <Input id="est_hours" name="est_hours" type="number" step="0.5" min={0} inputMode="decimal" defaultValue={v("est_hours", course?.est_hours)} />
      </Field>
      <Field id="started_on" label={t("learning.fields.startedOn")} error={e.started_on}>
        <Input id="started_on" name="started_on" type="date" defaultValue={v("started_on", course?.started_on)} />
      </Field>
      <Field id="completed_on" label={t("learning.fields.completedOn")} error={e.completed_on}>
        <Input id="completed_on" name="completed_on" type="date" defaultValue={v("completed_on", course?.completed_on)} />
      </Field>
      <Field id="url" label={t("learning.fields.url")} error={e.url} className="sm:col-span-2">
        <Input id="url" name="url" type="url" placeholder="https://" defaultValue={v("url", course?.url)} />
      </Field>
      <Field id="skill_id" label={t("learning.fields.skill")} hint={t("learning.fields.skillHint")} error={e.skill_id}>
        <NativeSelect id="skill_id" name="skill_id" defaultValue={v("skill_id", course?.skill_id)}>
          <option value="">{t("planning.fields.none")}</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="goal_id" label={t("planning.fields.goal")} error={e.goal_id}>
        <NativeSelect id="goal_id" name="goal_id" defaultValue={v("goal_id", course?.goal_id)}>
          <option value="">{t("planning.fields.none")}</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {t("planning.save")}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={cancelHref}>{t("planning.cancel")}</Link>
        </Button>
        <FormError error={state.error} />
      </div>
    </form>
  );
}
