"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { quickAddTask, type FormState } from "@/core/planning/actions";
import { addDays } from "@/core/planning/dates";
import type { AreaOption } from "@/core/types";

import { areaName } from "./area-name";
import { FormError } from "./field";

type Props = {
  today: string;
  /** When set, new tasks go here and the area picker is hidden. */
  lifeAreaId?: string;
  goalId?: string;
  projectId?: string;
  /** Needed when lifeAreaId is not given. */
  areas?: AreaOption[];
  defaultWhen?: "none" | "today";
};

export function TaskQuickAdd({ today, lifeAreaId, goalId, projectId, areas = [], defaultWhen = "none" }: Props) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<FormState, FormData>(quickAddTask, {});
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // After each successful add: clear the title and keep typing.
  useEffect(() => {
    if (!state.ok) return;
    if (titleRef.current) titleRef.current.value = "";
    titleRef.current?.focus();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {lifeAreaId && <input type="hidden" name="life_area_id" value={lifeAreaId} />}
        {goalId && <input type="hidden" name="goal_id" value={goalId} />}
        {projectId && <input type="hidden" name="project_id" value={projectId} />}
        <Input
          ref={titleRef}
          name="title"
          required
          maxLength={500}
          placeholder={t("planning.addTaskPlaceholder")}
          aria-label={t("planning.fields.title")}
          className="min-w-48 flex-1"
        />
        <NativeSelect
          name="scheduled_for"
          defaultValue={defaultWhen === "today" ? today : ""}
          aria-label={t("planning.fields.scheduledFor")}
          className="w-auto"
        >
          <option value="">{t("planning.when.none")}</option>
          <option value={today}>{t("planning.when.today")}</option>
          <option value={addDays(today, 1)}>{t("planning.when.tomorrow")}</option>
        </NativeSelect>
        {!lifeAreaId && (
          <NativeSelect name="life_area_id" required aria-label={t("planning.fields.area")} className="w-auto">
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {areaName(t, a)}
              </option>
            ))}
          </NativeSelect>
        )}
        <Button type="submit" disabled={pending}>
          <Plus />
          {t("planning.addTask")}
        </Button>
      </div>
      <FormError error={state.error ?? (state.fieldErrors ? "invalid" : undefined)} />
    </form>
  );
}
