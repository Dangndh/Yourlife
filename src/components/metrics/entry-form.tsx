"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addEntry, type MetricFormState } from "@/core/metrics/actions";

/** Add one value for a manual metric. Clears itself after each save. */
export function EntryForm({ metricId, unit, today }: { metricId: string; unit: string | null; today: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<MetricFormState, FormData>(addEntry, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string) => state.values?.[name] ?? fallback;

  return (
    <form key={`${state.attempt ?? 0}-${state.ok ?? 0}`} action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
      <input type="hidden" name="metric_id" value={metricId} />
      <Field id="value" label={unit ? `${t("metrics.value")} (${unit})` : t("metrics.value")} error={e.value}>
        <Input id="value" name="value" type="number" step="any" inputMode="decimal" required defaultValue={v("value", "")} />
      </Field>
      <Field id="date" label={t("metrics.date")} error={e.date}>
        <Input id="date" name="date" type="date" required max={today} defaultValue={v("date", today)} />
      </Field>
      <Field id="note" label={t("planning.fields.notes")} error={e.note}>
        <Input id="note" name="note" maxLength={500} defaultValue={v("note", "")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("metrics.addEntry")}
      </Button>
      <FormError error={state.error} />
    </form>
  );
}
