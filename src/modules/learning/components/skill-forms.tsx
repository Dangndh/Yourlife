"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import { addAssessment, saveSkill, type LearnFormState } from "../actions";
import { SKILL_CATEGORIES } from "../constants";

type Skill = { id: string; name: string; category: string | null; target_level: number | null; notes: string | null };

export function SkillForm({ skill, cancelHref }: { skill?: Skill; cancelHref: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<LearnFormState, FormData>(saveSkill, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string | number | null | undefined) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));

  return (
    <form key={state.attempt ?? 0} action={action} className="grid max-w-2xl gap-5 sm:grid-cols-2">
      {skill && <input type="hidden" name="id" value={skill.id} />}
      <Field id="name" label={t("learning.fields.skillName")} error={e.name} className="sm:col-span-2">
        <Input id="name" name="name" required maxLength={120} autoFocus={!skill} placeholder={t("learning.fields.skillPlaceholder")} defaultValue={v("name", skill?.name)} />
      </Field>
      <Field id="category" label={t("learning.fields.category")} error={e.category}>
        <NativeSelect id="category" name="category" defaultValue={v("category", skill?.category ?? "other")}>
          {SKILL_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {t(`learning.category.${c}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="target_level" label={t("learning.fields.targetLevel")} error={e.target_level}>
        <NativeSelect id="target_level" name="target_level" defaultValue={v("target_level", skill?.target_level)}>
          <option value="">{t("planning.fields.none")}</option>
          {[1, 2, 3, 4, 5].map((l) => (
            <option key={l} value={l}>
              {l} · {t(`learning.levels.l${l}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="notes" label={t("planning.fields.notes")} error={e.notes} className="sm:col-span-2">
        <Textarea id="notes" name="notes" rows={3} defaultValue={v("notes", skill?.notes)} />
      </Field>
      <p className="text-muted-foreground text-xs sm:col-span-2">{t("learning.levelsHint")}</p>
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

export function AssessmentForm({ skillId, today }: { skillId: string; today: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<LearnFormState, FormData>(addAssessment, {});
  const e = state.fieldErrors ?? {};
  const v = (name: string, fallback: string) => state.values?.[name] ?? fallback;

  return (
    <form key={`${state.attempt ?? 0}-${state.ok ?? 0}`} action={action} className="grid gap-4 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
      <input type="hidden" name="skill_id" value={skillId} />
      <Field id="level" label={t("learning.fields.level")} error={e.level}>
        <NativeSelect id="level" name="level" required defaultValue={v("level", "")}>
          <option value="" disabled>
            –
          </option>
          {[1, 2, 3, 4, 5].map((l) => (
            <option key={l} value={l}>
              {l} · {t(`learning.levels.l${l}`)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="assessed_on" label={t("metrics.date")} error={e.assessed_on}>
        <Input id="assessed_on" name="assessed_on" type="date" required max={today} defaultValue={v("assessed_on", today)} />
      </Field>
      <Field id="evidence" label={t("learning.fields.evidence")} error={e.evidence}>
        <Input id="evidence" name="evidence" maxLength={500} placeholder={t("learning.fields.evidencePlaceholder")} defaultValue={v("evidence", "")} />
      </Field>
      <Button type="submit" disabled={pending}>
        {t("learning.addAssessment")}
      </Button>
      <FormError error={state.error} />
    </form>
  );
}
