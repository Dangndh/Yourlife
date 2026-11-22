import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Flame, Pencil, Plus, RotateCcw } from "lucide-react";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/planning/delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { getSkillOptions } from "../queries";
import { deleteCard, deleteDeck, resetCard } from "./actions";
import { CardForm, DailyGoalForm, DeckForm, ImportForm } from "./components/deck-forms";
import { ReviewSession } from "./components/review-session";
import { SpeakButton } from "./components/speak";
import { KNOWN_STABILITY_DAYS, languageName, REVIEW_MODES, type ReviewMode } from "./constants";
import { getCard, getCards, getChoicePool, getDeck, getDecks, getReviewQueue, getVocabProgress, type DeckWithStats, type VocabCard } from "./queries";
import { STATE } from "./srs";

type T = Awaited<ReturnType<typeof getTranslations>>;
type SearchParams = Record<string, string | string[] | undefined>;
const isId = (v: unknown): v is string => z.uuid().safeParse(v).success;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const backToVocab = (t: T) => ({ href: "/learning/vocab", label: t("pages.vocab") });

function reviewHref(deckId?: string, mode?: ReviewMode) {
  const q = new URLSearchParams();
  if (deckId) q.set("deck", deckId);
  if (mode && mode !== "mix") q.set("mode", mode);
  const s = q.toString();
  return `/learning/vocab/review${s ? `?${s}` : ""}`;
}

/** Status of one card, e.g. "New", "Learning", "Known", "in 4 d". */
function cardStatus(c: VocabCard, t: T): { label: string; tone: "new" | "learning" | "known" | "review" } {
  if (c.state === STATE.new) return { label: t("vocab.state.new"), tone: "new" };
  if (c.state !== STATE.review) return { label: t("vocab.state.learning"), tone: "learning" };
  if ((c.stability ?? 0) >= KNOWN_STABILITY_DAYS) return { label: t("vocab.state.known"), tone: "known" };
  return { label: t("vocab.state.young"), tone: "review" };
}

function dueLabel(c: VocabCard, t: T) {
  if (c.state === STATE.new) return "";
  const days = (new Date(c.due_at).getTime() - Date.now()) / 86_400_000;
  if (days <= 0) return t("vocab.dueNow");
  if (days < 1) return t("vocab.dueToday");
  return t("vocab.dueIn", { n: Math.round(days) });
}

function StatPills({ deck, t }: { deck: DeckWithStats; t: T }) {
  const s = deck.stats;
  const items = [
    { label: t("vocab.state.new"), value: s.new_cards, cls: "bg-sky-500" },
    { label: t("vocab.state.learning"), value: s.learning + s.young, cls: "bg-amber-500" },
    { label: t("vocab.state.known"), value: s.known, cls: "bg-emerald-500" },
  ];
  return (
    <div className="flex flex-col gap-2">
      <div className="bg-muted flex h-2 overflow-hidden rounded-full" aria-hidden>
        {s.total > 0 && items.map((i) => <div key={i.label} className={i.cls} style={{ width: `${(i.value / s.total) * 100}%` }} />)}
      </div>
      <div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {items.map((i) => (
          <span key={i.label} className="inline-flex items-center gap-1">
            <span className={cn("size-2 rounded-full", i.cls)} />
            {i.label} <span className="text-foreground tabular-nums">{i.value}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TodayCounts({ deck, t }: { deck: DeckWithStats; t: T }) {
  return (
    <span className="text-muted-foreground text-xs">
      {t("vocab.todayCounts", { due: deck.dueToday, fresh: deck.newToday })}
    </span>
  );
}

/** Today's goal, streak and last 30 days. Used on the vocabulary page and the Learning overview. */
async function ProgressCard({ compact }: { compact?: boolean }) {
  const t = await getTranslations();
  const [p, decks] = await Promise.all([getVocabProgress(), getDecks()]);
  const due = decks.reduce((n, d) => n + d.dueToday + d.newToday, 0);
  const max = Math.max(p.goal, ...p.days.map((d) => d.reviews));
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2">
        <CardTitle>{t("vocab.today")}</CardTitle>
        {decks.length > 0 && (
          <Button asChild size="sm" disabled={due === 0} variant={due ? "default" : "outline"}>
            <Link href={reviewHref()}>{due ? t("vocab.reviewAll", { count: due }) : t("vocab.allDone")}</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {decks.length === 0 ? (
          <Link href="/learning/vocab/new" className="text-muted-foreground hover:text-foreground text-sm">
            {t("vocab.noDecks")}
          </Link>
        ) : (
          <>
            <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
              <div>
                <span className="text-2xl font-semibold tabular-nums">{p.today}</span>
                <span className="text-muted-foreground text-sm"> / {p.goal}</span>
                <div className="text-muted-foreground text-xs">{t("vocab.reviewsToday")}</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Flame className={cn("size-6", p.streak > 0 ? "text-orange-500" : "text-muted-foreground/40")} />
                <div>
                  <span className="text-2xl font-semibold tabular-nums">{p.streak}</span>
                  <div className="text-muted-foreground text-xs">{t("vocab.streakDays")}</div>
                </div>
              </div>
            </div>
            <Progress value={p.today / p.goal} label={t("vocab.reviewsToday")} />
            {!compact && (
              <div className="flex h-12 items-end gap-0.5" role="img" aria-label={t("vocab.last30")}>
                {p.days.map((d) => (
                  <div
                    key={d.day}
                    title={`${d.day}: ${d.reviews}`}
                    className={cn("flex-1 rounded-sm", d.reviews >= p.goal ? "bg-emerald-500" : d.reviews > 0 ? "bg-emerald-500/40" : "bg-muted")}
                    style={{ height: `${Math.max(8, (d.reviews / max) * 100)}%` }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

async function VocabPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const [decks, progress] = await Promise.all([getDecks(), getVocabProgress()]);
  return (
    <>
      <PageHeader
        title={t("pages.vocab")}
        subtitle={t("vocab.subtitle")}
        back={{ href: "/learning", label: t("areas.learning") }}
        actions={
          <Button asChild variant={decks.length ? "outline" : "default"}>
            <Link href="/learning/vocab/new">
              <Plus />
              {t("vocab.newDeck")}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {decks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col gap-3 py-6">
                <p className="text-sm">{t("vocab.intro")}</p>
                <Button asChild className="w-fit">
                  <Link href="/learning/vocab/new">
                    <Plus />
                    {t("vocab.newDeck")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            decks.map((d) => (
              <Card key={d.id}>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="break-words">
                      <Link href={`/learning/vocab/${d.id}`} className="hover:underline">
                        {d.name}
                      </Link>
                    </CardTitle>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {languageName(d.language, locale)} · {t("vocab.cardCount", { count: d.stats.total })}
                    </p>
                  </div>
                  <Button asChild size="sm" variant={d.dueToday + d.newToday ? "default" : "outline"} disabled={!d.dueToday && !d.newToday}>
                    <Link href={reviewHref(d.id)}>{t("vocab.study")}</Link>
                  </Button>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <StatPills deck={d} t={t} />
                  <TodayCounts deck={d} t={t} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
        <div className="flex flex-col gap-4">
          <ProgressCard />
          <Card>
            <CardContent>
              <DailyGoalForm goal={progress.goal} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("vocab.howTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground flex flex-col gap-2 text-sm">
              <p>{t("vocab.how1")}</p>
              <p>{t("vocab.how2")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

async function ReviewPage({ searchParams }: { searchParams: SearchParams }) {
  const t = await getTranslations();
  const deckParam = one(searchParams.deck);
  const deckId = isId(deckParam) ? deckParam : undefined;
  const modeParam = one(searchParams.mode);
  const mode: ReviewMode = (REVIEW_MODES as readonly string[]).includes(modeParam ?? "") ? (modeParam as ReviewMode) : "mix";
  const [decks, cards] = await Promise.all([getDecks(), getReviewQueue(deckId)]);
  const deck = deckId ? decks.find((d) => d.id === deckId) : undefined;
  if (deckId && !deck) notFound();
  const pool = await getChoicePool(deck ? [deck.id] : decks.map((d) => d.id));
  const backHref = deck ? `/learning/vocab/${deck.id}` : "/learning/vocab";
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-lg font-semibold break-words">{deck ? deck.name : t("vocab.allDecks")}</h1>
        <nav className="flex flex-wrap gap-1" aria-label={t("vocab.modeLabel")}>
          {REVIEW_MODES.map((m) => (
            <Link
              key={m}
              href={reviewHref(deckId, m)}
              aria-current={m === mode ? "page" : undefined}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                m === mode ? "bg-primary text-primary-foreground border-primary" : "hover:bg-accent text-muted-foreground",
              )}
            >
              {t(`vocab.mode.${m}`)}
            </Link>
          ))}
        </nav>
      </div>
      <ReviewSession key={`${deckId ?? "all"}-${mode}`} cards={cards} pool={pool} mode={mode} backHref={backHref} />
    </>
  );
}

async function DeckPage({ id, searchParams }: { id: string; searchParams: SearchParams }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const deck = await getDeck(id);
  if (!deck) notFound();
  const skills = (await getSkillOptions()).map((s) => ({ id: s.id, name: s.name }));

  if (one(searchParams.edit) === "1") {
    return (
      <>
        <PageHeader title={t("vocab.editDeck")} back={{ href: `/learning/vocab/${id}`, label: deck.name }} />
        <Card>
          <CardContent className="flex flex-col gap-6 pt-6">
            <DeckForm deck={deck} skills={skills} cancelHref={`/learning/vocab/${id}`} />
            <DeleteButton action={deleteDeck} id={deck.id} label={t("vocab.deleteDeck")} />
          </CardContent>
        </Card>
      </>
    );
  }

  const cardParam = one(searchParams.card);
  if (isId(cardParam)) {
    const card = await getCard(cardParam);
    if (!card || card.deck_id !== id) notFound();
    return (
      <>
        <PageHeader title={t("vocab.editCard")} back={{ href: `/learning/vocab/${id}`, label: deck.name }} />
        <Card>
          <CardContent className="flex flex-col gap-6 pt-6">
            <CardForm deckId={id} card={card} cancelHref={`/learning/vocab/${id}`} />
            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <span>{cardStatus(card, t).label}</span>
              {card.state !== STATE.new && <span>{dueLabel(card, t)}</span>}
              <span>{t("vocab.repsLapses", { reps: card.reps, lapses: card.lapses })}</span>
            </div>
            <div className="flex flex-wrap items-start gap-6">
              {card.state !== STATE.new && (
                <form action={resetCard}>
                  <input type="hidden" name="id" value={card.id} />
                  <input type="hidden" name="deck_id" value={id} />
                  <button type="submit" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm">
                    <RotateCcw className="size-4" />
                    {t("vocab.resetCard")}
                  </button>
                </form>
              )}
              <DeleteButton action={deleteCard} id={card.id} label={t("vocab.deleteCard")} />
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  const cards = await getCards(id);
  const due = deck.dueToday + deck.newToday;
  return (
    <>
      <PageHeader
        title={deck.name}
        subtitle={`${languageName(deck.language, locale)} · ${t("vocab.cardCount", { count: deck.stats.total })}`}
        back={backToVocab(t)}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={`/learning/vocab/${id}?edit=1`}>
                <Pencil />
                {t("vocab.editDeck")}
              </Link>
            </Button>
            <Button asChild disabled={!due}>
              <Link href={reviewHref(id)}>{due ? t("vocab.studyCount", { count: due }) : t("vocab.allDone")}</Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("vocab.addCard")}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardForm deckId={id} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {t("vocab.words")} <span className="text-muted-foreground font-normal">{cards.length}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cards.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("vocab.noCards")}</p>
              ) : (
                <ul className="divide-y">
                  {cards.map((c) => {
                    const st = cardStatus(c, t);
                    return (
                      <li key={c.id} className="flex items-center gap-2 py-2">
                        <SpeakButton text={c.term} lang={deck.language} />
                        <Link href={`/learning/vocab/${id}?card=${c.id}`} className="min-w-0 flex-1 hover:underline">
                          <span className="text-sm font-medium break-words" lang={deck.language}>
                            {c.term}
                          </span>
                          <span className="text-muted-foreground ml-2 text-sm break-words">{c.meaning}</span>
                        </Link>
                        <span className="text-muted-foreground hidden text-xs sm:inline">{dueLabel(c, t)}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            st.tone === "new" && "border-sky-500/50 text-sky-700 dark:text-sky-300",
                            st.tone === "learning" && "border-amber-500/50 text-amber-700 dark:text-amber-300",
                            st.tone === "known" && "border-emerald-500/50 text-emerald-700 dark:text-emerald-300",
                          )}
                        >
                          {st.label}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("vocab.progress")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <StatPills deck={deck} t={t} />
              <TodayCounts deck={deck} t={t} />
              <div className="flex flex-wrap gap-1 pt-1">
                {REVIEW_MODES.filter((m) => m !== "mix").map((m) => (
                  <Link key={m} href={reviewHref(id, m)} className="hover:bg-accent text-muted-foreground rounded-full border px-3 py-1 text-xs">
                    {t(`vocab.mode.${m}`)}
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("vocab.importTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ImportForm deckId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

async function NewDeckPage() {
  const t = await getTranslations();
  const skills = (await getSkillOptions()).map((s) => ({ id: s.id, name: s.name }));
  return (
    <>
      <PageHeader title={t("vocab.newDeck")} back={backToVocab(t)} />
      <Card>
        <CardContent className="pt-6">
          <DeckForm skills={skills} cancelHref="/learning/vocab" />
        </CardContent>
      </Card>
    </>
  );
}

async function VocabDetail({ id, searchParams }: { id: string; searchParams: SearchParams }) {
  if (id === "new") return <NewDeckPage />;
  if (id === "review") return <ReviewPage searchParams={searchParams} />;
  if (!isId(id)) notFound();
  return <DeckPage id={id} searchParams={searchParams} />;
}

export const vocabViews = {
  page: VocabPage,
  detail: VocabDetail,
  /** Shown first on the Learning area page. */
  Overview: () => ProgressCard({ compact: true }),
};
