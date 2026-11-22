"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveTask, type FormState } from "@/core/planning/actions";
import type { AreaOption, Task } from "@/core/types";

import { areaName } from "./area-name";
import { Field, FormError } from "./field";

type Props = {
  task: Task;
  areas: AreaOption[];
  goalOptions: { id: string; title: string }[];
  projectOptions: { id: string; title: string }[];
  next: string;
};

export function TaskForm({ task, areas, goalOptions, projectOptions, next }: Props) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<FormState, FormData>(saveTask, {});
  const [projectId, setProjectId] = useState(task.project_id ?? "");
  const [goalId, setGoalId] = useState(task.goal_id ?? "");
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | null | undefined) => state.values?.[name] ?? fallback ?? "";

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={task.id} />
      <input type="hidden" name="next" value={next} />
      <Field id="title" label={t("planning.fields.title")} error={e.title} className="sm:col-span-2">
        <Input id="title" name="title" required maxLength={500} defaultValue={v("title", task.title)} />
      </Field>
      <Field id="status" label={t("planning.fields.status")} error={e.status}>
        <NativeSelect id="status" name="status" defaultValue={v("status", task.status)}>
          {(["todo", "doing", "done", "cancelled"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`planning.taskStatus.${s}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="priority" label={t("planning.fields.priority")} error={e.priority}>
        <NativeSelect id="priority" name="priority" defaultValue={v("priority", String(task.priority))}>
          {[1, 2, 3, 4].map((p) => (
            <option key={p} value={p}>
              {t(`planning.priority.p${p}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        id="scheduled_for"
        label={t("planning.fields.scheduledFor")}
        hint={t("planning.fields.scheduledForHint")}
        error={e.scheduled_for}
      >
        <Input id="scheduled_for" name="scheduled_for" type="date" defaultValue={v("scheduled_for", task.scheduled_for ?? "")} />
      </Field>
      <Field id="due_date" label={t("planning.fields.dueDate")} error={e.due_date}>
        <Input id="due_date" name="due_date" type="date" defaultValue={v("due_date", task.due_date ?? "")} />
      </Field>
      <Field id="project_id" label={t("planning.fields.project")} error={e.project_id}>
        <NativeSelect id="project_id" name="project_id" value={projectId} onChange={(ev) => setProjectId(ev.target.value)}>
          <option value="">{t("planning.fields.none")}</option>
          {projectOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        id="goal_id"
        label={t("planning.fields.goal")}
        hint={projectId ? t("planning.fields.goalFromProject") : undefined}
        error={e.goal_id}
      >
        <NativeSelect
          id="goal_id"
          name="goal_id"
          value={projectId ? "" : goalId}
          disabled={!!projectId}
          onChange={(ev) => setGoalId(ev.target.value)}
        >
          <option value="">{t("planning.fields.none")}</option>
          {goalOptions.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        id="life_area_id"
        label={t("planning.fields.area")}
        hint={projectId || goalId ? t("planning.fields.areaFromParent") : undefined}
        error={e.life_area_id}
      >
        <NativeSelect id="life_area_id" name="life_area_id" required defaultValue={v("life_area_id", task.life_area_id)}>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {areaName(t, a)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="notes" label={t("planning.fields.notes")} error={e.notes} className="sm:col-span-2">
        <Textarea id="notes" name="notes" rows={4} defaultValue={v("notes", task.notes ?? "")} />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {t("planning.save")}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={next}>{t("planning.cancel")}</Link>
        </Button>
        <FormError error={state.error} />
      </div>
    </form>
  );
}
