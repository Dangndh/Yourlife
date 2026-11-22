"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveProject, type FormState } from "@/core/planning/actions";
import type { AreaOption, Project } from "@/core/types";

import { areaName } from "./area-name";
import { Field, FormError } from "./field";

type Props = {
  project?: Project;
  areas: AreaOption[];
  goalOptions: { id: string; title: string }[];
  defaultAreaId?: string;
  defaultGoalId?: string;
  cancelHref: string;
};

export function ProjectForm({ project, areas, goalOptions, defaultAreaId, defaultGoalId, cancelHref }: Props) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<FormState, FormData>(saveProject, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | null | undefined) => state.values?.[name] ?? fallback ?? "";

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      {project && <input type="hidden" name="id" value={project.id} />}
      <Field id="title" label={t("planning.fields.title")} error={e.title} className="sm:col-span-2">
        <Input id="title" name="title" required maxLength={300} defaultValue={v("title", project?.title)} autoFocus={!project} />
      </Field>
      <Field
        id="goal_id"
        label={t("planning.fields.goal")}
        hint={t("planning.fields.projectGoalHint")}
        error={e.goal_id}
        className="sm:col-span-2"
      >
        <NativeSelect id="goal_id" name="goal_id" defaultValue={v("goal_id", project?.goal_id ?? defaultGoalId ?? "")}>
          <option value="">{t("planning.fields.none")}</option>
          {goalOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="life_area_id" label={t("planning.fields.area")} error={e.life_area_id}>
        <NativeSelect
          id="life_area_id"
          name="life_area_id"
          required
          defaultValue={v("life_area_id", project?.life_area_id ?? defaultAreaId)}
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {areaName(t, a)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="status" label={t("planning.fields.status")} error={e.status}>
        <NativeSelect id="status" name="status" defaultValue={v("status", project?.status ?? "active")}>
          {(["planned", "active", "on_hold", "completed", "cancelled"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`planning.projectStatus.${s}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="start_date" label={t("planning.fields.startDate")} error={e.start_date}>
        <Input id="start_date" name="start_date" type="date" defaultValue={v("start_date", project?.start_date ?? "")} />
      </Field>
      <Field id="due_date" label={t("planning.fields.dueDate")} error={e.due_date}>
        <Input id="due_date" name="due_date" type="date" defaultValue={v("due_date", project?.due_date ?? "")} />
      </Field>
      <Field id="description" label={t("planning.fields.description")} error={e.description} className="sm:col-span-2">
        <Textarea id="description" name="description" rows={3} defaultValue={v("description", project?.description ?? "")} />
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
