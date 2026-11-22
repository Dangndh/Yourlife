"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { areaName } from "@/components/planning/area-name";
import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { updateLog, type LogFormState } from "@/core/activity/actions";
import type { ActivityLog } from "@/core/activity/queries";
import type { AreaOption } from "@/core/types";

export function LogEditForm({ log, areas, occurredLocal }: { log: ActivityLog; areas: AreaOption[]; occurredLocal: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<LogFormState, FormData>(updateLog, {});
  const e = state.fieldErrors ?? {};
  const v = (k: string, fallback: string | null | undefined) => state.values?.[k] ?? fallback ?? "";

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      <input type="hidden" name="id" value={log.id} />
      <Field id="title" label={t("log.what")} error={e.title} className="sm:col-span-2">
        <Input id="title" name="title" required maxLength={500} defaultValue={v("title", log.title)} />
      </Field>
      <Field id="life_area_id" label={t("planning.fields.area")} error={e.life_area_id}>
        <NativeSelect id="life_area_id" name="life_area_id" defaultValue={v("life_area_id", log.life_area_id)}>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {areaName(t, a)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="duration_min" label={t("log.duration")} error={e.duration_min}>
        <Input
          id="duration_min"
          name="duration_min"
          type="number"
          min={0}
          max={1440}
          placeholder={t("log.minutesShort")}
          defaultValue={v("duration_min", log.duration_min?.toString())}
        />
      </Field>
      <Field id="occurred_local" label={t("log.when")} error={e.occurred_local}>
        <Input
          id="occurred_local"
          name="occurred_local"
          type="datetime-local"
          required
          defaultValue={v("occurred_local", occurredLocal)}
        />
      </Field>
      <Field id="notes" label={t("planning.fields.notes")} error={e.notes} className="sm:col-span-2">
        <Textarea id="notes" name="notes" rows={4} defaultValue={v("notes", log.notes)} />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {t("planning.save")}
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/log">{t("planning.cancel")}</Link>
        </Button>
        <FormError error={state.error} />
      </div>
    </form>
  );
}
