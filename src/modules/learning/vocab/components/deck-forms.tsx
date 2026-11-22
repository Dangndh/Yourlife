"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Field, FormError } from "@/components/planning/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

import { importCards, saveCard, saveDailyGoal, saveDeck, type VocabFormState } from "../actions";
import { DECK_LANGUAGES, languageName } from "../constants";
import type { Deck, VocabCard } from "../queries";

type Option = { id: string; name: string };

function useVals(state: VocabFormState) {
  return (name: string, fallback: string | number | null | undefined) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));
}

export function DeckForm({ deck, skills, cancelHref }: { deck?: Deck; skills: Option[]; cancelHref: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [state, action, pending] = useActionState<VocabFormState, FormData>(saveDeck, {});
  const e = state.fieldErrors ?? {};
  const v = useVals(state);
  return (
    <form key={state.attempt ?? 0} action={action} className="grid gap-4 sm:grid-cols-2">
      {deck && <input type="hidden" name="id" value={deck.id} />}
      <Field id="name" label={t("vocab.fields.deckName")} error={e.name} className="sm:col-span-2">
        <Input id="name" name="name" required maxLength={200} placeholder={t("vocab.fields.deckNamePlaceholder")} defaultValue={v("name", deck?.name)} />
      </Field>
      <Field id="language" label={t("vocab.fields.language")} hint={t("vocab.fields.languageHint")} error={e.language}>
        <NativeSelect id="language" name="language" defaultValue={v("language", deck?.language ?? "en-US")}>
          {DECK_LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {languageName(l, locale)}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="new_per_day" label={t("vocab.fields.newPerDay")} hint={t("vocab.fields.newPerDayHint")} error={e.new_per_day}>
        <Input id="new_per_day" name="new_per_day" type="number" min={0} max={200} required defaultValue={v("new_per_day", deck?.new_per_day ?? 10)} />
      </Field>
      <Field id="skill_id" label={t("learning.fields.skill")} hint={t("vocab.fields.skillHint")} error={e.skill_id}>
        <NativeSelect id="skill_id" name="skill_id" defaultValue={v("skill_id", deck?.skill_id)}>
          <option value="">{t("planning.fields.none")}</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </NativeSelect>
      </Field>
      <Field id="description" label={t("planning.fields.notes")} error={e.description} className="sm:col-span-2">
        <Textarea id="description" name="description" rows={2} defaultValue={v("description", deck?.description)} />
      </Field>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {deck ? t("planning.save") : t("vocab.createDeck")}
        </Button>
        <Button variant="ghost" asChild>
          <Link href={cancelHref}>{t("planning.cancel")}</Link>
        </Button>
        <FormError error={state.error} />
      </div>
    </form>
  );
}

/** Add one word (clears itself after saving) or edit a card (goes back to the deck). */
export function CardForm({ deckId, card, cancelHref }: { deckId: string; card?: VocabCard; cancelHref?: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<VocabFormState, FormData>(saveCard, {});
  const e = state.fieldErrors ?? {};
  const v = useVals(state);
  const duplicate = e.term === "duplicate";
  return (
    <form key={`${state.attempt ?? 0}-${state.ok ?? 0}`} action={action} className="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="deck_id" value={deckId} />
      {card && <input type="hidden" name="id" value={card.id} />}
      {duplicate && <input type="hidden" name="allow_duplicate" value="1" />}
      <Field id="term" label={t("vocab.fields.term")} error={duplicate ? "duplicateTerm" : e.term}>
        <Input id="term" name="term" required maxLength={500} autoComplete="off" autoFocus={!card && (state.ok ?? 0) > 0} defaultValue={v("term", card?.term)} />
      </Field>
      <Field id="meaning" label={t("vocab.fields.meaning")} error={e.meaning}>
        <Input id="meaning" name="meaning" required maxLength={1000} autoComplete="off" defaultValue={v("meaning", card?.meaning)} />
      </Field>
      <details className="group sm:col-span-2" open={!!card}>
        <summary className="text-muted-foreground hover:text-foreground w-fit cursor-pointer text-sm">{t("vocab.moreFields")}</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field id="pronunciation" label={t("vocab.fields.pronunciation")} error={e.pronunciation}>
            <Input id="pronunciation" name="pronunciation" maxLength={200} placeholder="/ˈæp.əl/" defaultValue={v("pronunciation", card?.pronunciation)} />
          </Field>
          <Field id="notes" label={t("planning.fields.notes")} error={e.notes}>
            <Input id="notes" name="notes" maxLength={2000} defaultValue={v("notes", card?.notes)} />
          </Field>
          <Field id="example" label={t("vocab.fields.example")} error={e.example}>
            <Textarea id="example" name="example" rows={2} maxLength={1000} defaultValue={v("example", card?.example)} />
          </Field>
          <Field id="example_meaning" label={t("vocab.fields.exampleMeaning")} error={e.example_meaning}>
            <Textarea id="example_meaning" name="example_meaning" rows={2} maxLength={1000} defaultValue={v("example_meaning", card?.example_meaning)} />
          </Field>
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {card ? t("planning.save") : duplicate ? t("vocab.addAnyway") : t("vocab.addCard")}
        </Button>
        {cancelHref && (
          <Button variant="ghost" asChild>
            <Link href={cancelHref}>{t("planning.cancel")}</Link>
          </Button>
        )}
        {state.ok ? <span className="text-muted-foreground text-xs">{t("vocab.cardAdded")}</span> : null}
        <FormError error={state.error} />
      </div>
    </form>
  );
}

export function ImportForm({ deckId }: { deckId: string }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<VocabFormState, FormData>(importCards, {});
  const e = state.fieldErrors ?? {};
  return (
    <form key={`${state.attempt ?? 0}-${state.ok ?? 0}`} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="deck_id" value={deckId} />
      <Field id="list" label={t("vocab.importLabel")} hint={t("vocab.importHint")} error={e.list === "empty" ? "emptyList" : e.list}>
        <Textarea
          id="list"
          name="list"
          rows={6}
          className="font-mono text-xs"
          placeholder={"apple | quả táo | /ˈæp.əl/ | I eat an apple. | Tôi ăn một quả táo.\nriver | dòng sông\nhouse = ngôi nhà"}
          defaultValue={state.values?.list ?? ""}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="outline" disabled={pending}>
          {t("vocab.import")}
        </Button>
        {state.ok ? (
          <span className="text-muted-foreground text-xs">{t("vocab.imported", { imported: state.imported ?? 0, skipped: state.skipped ?? 0 })}</span>
        ) : null}
        <FormError error={state.error} />
      </div>
    </form>
  );
}

export function DailyGoalForm({ goal }: { goal: number }) {
  const t = useTranslations();
  const [state, action, pending] = useActionState<VocabFormState, FormData>(saveDailyGoal, {});
  return (
    <form key={`${state.attempt ?? 0}-${state.ok ?? 0}`} action={action} className="flex flex-wrap items-end gap-2">
      <Field id="daily_review_goal" label={t("vocab.dailyGoal")} error={state.fieldErrors?.daily_review_goal}>
        <Input
          id="daily_review_goal"
          name="daily_review_goal"
          type="number"
          min={1}
          max={1000}
          className="w-28"
          defaultValue={state.values?.daily_review_goal ?? goal}
        />
      </Field>
      <Button type="submit" variant="outline" disabled={pending}>
        {t("planning.save")}
      </Button>
      {state.ok ? <span className="text-muted-foreground pb-2 text-xs">{t("learning.sessionSaved")}</span> : null}
    </form>
  );
}
