"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { saveGoal, type FormState } from "@/core/planning/actions";
import type { AreaOption, Goal } from "@/core/types";

import { areaName } from "./area-name";
import { Field, FormError } from "./field";

type Props = {
  goal?: Goal;
  areas: AreaOption[];
  parentOptions: { id: string; title: string }[];
  defaultAreaId?: string;
  cancelHref: string;
};

export function GoalForm({ goal, areas, parentOptions, defaultAreaId, cancelHref }: Props) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<FormState, FormData>(saveGoal, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | null | undefined) => state.values?.[name] ?? fallback ?? "";

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      {goal && <input type="hidden" name="id" value={goal.id} />}
      <Field id="title" label={t("planning.fields.title")} error={e.title} className="sm:col-span-2">
        <Input id="title" name="title" required maxLength={300} defaultValue={v("title", goal?.title)} autoFocus={!goal} />
      </Field>
      <Field id="life_area_id" label={t("planning.fields.area")} error={e.life_area_id}>
        <NativeSelect id="life_area_id" name="life_area_id" required defaultValue={v("life_area_id", goal?.life_area_id ?? defaultAreaId)}>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {areaName(t, a)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="status" label={t("planning.fields.status")} error={e.status}>
        <NativeSelect id="status" name="status" defaultValue={v("status", goal?.status ?? "active")}>
          {(["planned", "active", "paused", "achieved", "abandoned"] as const).map((s) => (
            <option key={s} value={s}>
              {t(`planning.goalStatus.${s}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="start_date" label={t("planning.fields.startDate")} error={e.start_date}>
        <Input id="start_date" name="start_date" type="date" defaultValue={v("start_date", goal?.start_date ?? "")} />
      </Field>
      <Field id="target_date" label={t("planning.fields.targetDate")} error={e.target_date}>
        <Input id="target_date" name="target_date" type="date" defaultValue={v("target_date", goal?.target_date ?? "")} />
      </Field>
      <Field id="goal_type" label={t("planning.fields.goalType")} error={e.goal_type}>
        <NativeSelect id="goal_type" name="goal_type" defaultValue={v("goal_type", goal?.goal_type ?? "outcome")}>
          {(["outcome", "milestone", "habit"] as const).map((g) => (
            <option key={g} value={g}>
              {t(`planning.goalType.${g}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="priority" label={t("planning.fields.priority")} error={e.priority}>
        <NativeSelect id="priority" name="priority" defaultValue={v("priority", String(goal?.priority ?? 2))}>
          {[1, 2, 3, 4].map((p) => (
            <option key={p} value={p}>
              {t(`planning.priority.p${p}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field
        id="why"
        label={t("planning.fields.why")}
        hint={t("planning.fields.whyHint")}
        error={e.why}
        className="sm:col-span-2"
      >
        <Textarea id="why" name="why" rows={2} defaultValue={v("why", goal?.why ?? "")} />
      </Field>
      <Field id="description" label={t("planning.fields.description")} error={e.description} className="sm:col-span-2">
        <Textarea id="description" name="description" rows={3} defaultValue={v("description", goal?.description ?? "")} />
      </Field>
      {parentOptions.length > 0 && (
        <Field
          id="parent_goal_id"
          label={t("planning.fields.parentGoal")}
          hint={t("planning.fields.parentGoalHint")}
          error={e.parent_goal_id}
          className="sm:col-span-2"
        >
          <NativeSelect id="parent_goal_id" name="parent_goal_id" defaultValue={v("parent_goal_id", goal?.parent_goal_id ?? "")}>
            <option value="">{t("planning.fields.none")}</option>
            {parentOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.title}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}
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
