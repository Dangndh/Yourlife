"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { areaName } from "@/components/planning/area-name";
import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { saveMetric, type MetricFormState } from "@/core/metrics/actions";
import type { Metric } from "@/core/metrics/types";
import type { AreaOption } from "@/core/types";

type Props = { metric?: Metric; displayName?: string; areas: AreaOption[]; defaultAreaId?: string; cancelHref: string };

/** New manual metric, or edit. A derived metric (computed from a module) only lets you rename it or change its area. */
export function MetricForm({ metric, displayName, areas, defaultAreaId, cancelHref }: Props) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<MetricFormState, FormData>(saveMetric, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | null | undefined) => state.values?.[name] ?? fallback ?? "";
  const derived = metric?.source === "derived";

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      {metric && <input type="hidden" name="id" value={metric.id} />}
      <Field id="name" label={t("metrics.fields.name")} error={e.name} className="sm:col-span-2">
        <Input
          id="name"
          name="name"
          required
          maxLength={120}
          placeholder={t("metrics.fields.namePlaceholder")}
          defaultValue={v("name", displayName ?? metric?.name)}
          autoFocus={!metric}
        />
      </Field>
      <Field id="life_area_id" label={t("planning.fields.area")} error={e.life_area_id}>
        <NativeSelect id="life_area_id" name="life_area_id" defaultValue={v("life_area_id", metric ? metric.life_area_id : defaultAreaId)}>
          <option value="">{t("metrics.fields.noArea")}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {areaName(t, a)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      {derived ? (
        <p className="text-muted-foreground self-end text-sm sm:col-span-2">{t("metrics.derivedHint")}</p>
      ) : (
        <>
          <Field id="unit" label={t("metrics.fields.unit")} hint={t("metrics.fields.unitHint")} error={e.unit}>
            <Input id="unit" name="unit" maxLength={40} defaultValue={v("unit", metric?.unit)} />
          </Field>
          <Field id="value_type" label={t("metrics.fields.valueType")} error={e.value_type}>
            <NativeSelect id="value_type" name="value_type" defaultValue={v("value_type", metric?.value_type ?? "number")}>
              {(["number", "duration", "currency", "percent", "rating"] as const).map((x) => (
                <option key={x} value={x}>
                  {t(`metrics.valueType.${x}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="direction" label={t("metrics.fields.direction")} error={e.direction}>
            <NativeSelect id="direction" name="direction" defaultValue={v("direction", metric?.direction ?? "up")}>
              {(["up", "down", "neutral"] as const).map((x) => (
                <option key={x} value={x}>
                  {t(`metrics.direction.${x}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="period" label={t("metrics.fields.period")} hint={t("metrics.fields.periodHint")} error={e.period}>
            <NativeSelect id="period" name="period" defaultValue={v("period", metric?.period ?? "")}>
              <option value="">{t("metrics.period.entry")}</option>
              {(["day", "week", "month"] as const).map((x) => (
                <option key={x} value={x}>
                  {t(`metrics.period.${x}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="aggregation" label={t("metrics.fields.aggregation")} hint={t("metrics.fields.aggregationHint")} error={e.aggregation}>
            <NativeSelect id="aggregation" name="aggregation" defaultValue={v("aggregation", metric?.aggregation ?? "last")}>
              {(["last", "avg", "sum", "min", "max"] as const).map((x) => (
                <option key={x} value={x}>
                  {t(`metrics.aggregation.${x}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </>
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
