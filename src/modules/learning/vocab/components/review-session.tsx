"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Check, PartyPopper, Volume2, VolumeX, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { finishReview, submitReview } from "../actions";
import type { ReviewMode } from "../constants";
import type { QueueCard } from "../queries";
import { gradeAnswer, previewIntervals, ratingForGrade, RATINGS, schedule, STATE, type Grade, type Rating } from "../srs";
import { canSpeak, speak } from "./speak";

type CardMode = "flip" | "choice" | "type" | "listen";
type Item = QueueCard & { availableAt: number };
type Pool = { term: string; meaning: string }[];

const MAX_ANSWER_MS = 60_000; // longer than this counts as a break, not study
const SOUND_KEY = "yourlife_vocab_sound";

// Sound on/off is a per-browser preference.
const soundListeners = new Set<() => void>();
const noopSubscribe = () => () => {};
function subscribeSound(fn: () => void) {
  soundListeners.add(fn);
  return () => soundListeners.delete(fn);
}
function readSound() {
  try {
    return localStorage.getItem(SOUND_KEY) !== "off";
  } catch {
    return true;
  }
}
function writeSound(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? "on" : "off");
  } catch {
    /* storage may be blocked */
  }
  soundListeners.forEach((fn) => fn());
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Which exercise to show for a card. New words are always shown first as a flashcard. */
function pickMode(card: QueueCard, mode: ReviewMode, choiceOk: boolean, speechOk: boolean): CardMode {
  if (card.state === STATE.new) return "flip";
  const ok = (m: CardMode) => (m === "choice" ? choiceOk : m === "listen" ? speechOk : true);
  if (mode !== "mix") return ok(mode) ? mode : mode === "listen" ? "type" : "flip";
  // Learning cards get the easier exercise; review cards rotate through the harder ones.
  if (card.state !== STATE.review) return choiceOk ? "choice" : "flip";
  const rotation = (["type", "choice", "listen", "type"] as CardMode[]).filter(ok);
  return rotation[card.reps % rotation.length] ?? "flip";
}

function nextItem(queue: Item[], justAnswered?: string): Item | null {
  if (!queue.length) return null;
  const now = Date.now();
  const due = queue.find((c) => c.availableAt <= now && c.id !== justAnswered);
  if (due) return due;
  // Nothing due yet: study ahead, but not the same card twice in a row if there's another.
  const others = queue.filter((c) => c.id !== justAnswered);
  const pool = others.length ? others : queue;
  return pool.reduce((a, b) => (b.availableAt < a.availableAt ? b : a));
}

/** Rendered in the browser only: options are shuffled and the queue depends on the clock and voices. */
export function ReviewSession(props: { cards: QueueCard[]; pool: Pool; mode: ReviewMode; backHref: string }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <div className="bg-card mx-auto min-h-72 w-full max-w-xl animate-pulse rounded-xl border" />;
  return <Session {...props} />;
}

function Session({
  cards,
  pool,
  mode,
  backHref,
}: {
  cards: QueueCard[];
  pool: Pool;
  mode: ReviewMode;
  backHref: string;
}) {
  const t = useTranslations("vocab");
  const [queue, setQueue] = useState<Item[]>(() => cards.map((c) => ({ ...c, availableAt: 0 })));
  const [current, setCurrent] = useState<Item | null>(() => nextItem(queue));
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [grade, setGrade] = useState<Grade | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [done, setDone] = useState({ reviewed: 0, correct: 0, ms: 0 });
  const [saveErrors, setSaveErrors] = useState(0);
  const sound = useSyncExternalStore(subscribeSound, readSound, () => true);
  const speechOk = useSyncExternalStore(noopSubscribe, canSpeak, () => false);
  const shownAt = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const finished = useRef(false);
  const total = cards.length;

  const toggleSound = () => writeSound(!sound);

  const meanings = useMemo(() => Array.from(new Set(pool.map((p) => p.meaning))), [pool]);
  const choiceOk = meanings.length >= 4;
  const cardMode: CardMode | null = current ? pickMode(current, mode, choiceOk, speechOk) : null;

  const options = useMemo(() => {
    if (!current || cardMode !== "choice") return [];
    const wrong = shuffle(meanings.filter((m) => m !== current.meaning)).slice(0, 3);
    return shuffle([current.meaning, ...wrong]);
    // a new set of options for each card shown
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.reps, cardMode]);

  const say = useCallback((text: string, lang: string) => sound && speak(text, lang), [sound]);

  // When a card appears: start the timer, read it out where useful, focus the input.
  useEffect(() => {
    if (!current) return;
    shownAt.current = Date.now();
    if (cardMode === "listen") speak(current.term, current.language);
    else if (cardMode === "flip" || cardMode === "choice") say(current.term, current.language);
    if (cardMode === "type" || cardMode === "listen") setTimeout(() => inputRef.current?.focus(), 30);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.reps]);

  useEffect(() => {
    if (current || finished.current || done.reviewed === 0) return;
    finished.current = true;
    void finishReview();
  }, [current, done.reviewed]);

  const answer = useCallback(
    (rating: Rating) => {
      if (!current || !cardMode) return;
      const ms = Math.min(MAX_ANSWER_MS, Date.now() - shownAt.current);
      const next = schedule(current, rating, new Date());
      submitReview({ cardId: current.id, rating, mode: cardMode, durationMs: ms })
        .then((r) => !r.ok && setSaveErrors((n) => n + 1))
        .catch(() => setSaveErrors((n) => n + 1));

      const rest = queue.filter((c) => c.id !== current.id);
      // Still being learned (minutes away): it comes back later in this session.
      if (next.intervalDays < 1) {
        rest.push({ ...current, ...next.card, availableAt: new Date(next.card.due_at).getTime() });
      }
      setQueue(rest);
      setDone((d) => ({ reviewed: d.reviewed + 1, correct: d.correct + (rating > 1 ? 1 : 0), ms: d.ms + ms }));
      setRevealed(false);
      setTyped("");
      setGrade(null);
      setPicked(null);
      setCurrent(nextItem(rest, current.id));
    },
    [current, cardMode, queue],
  );

  const checkTyped = useCallback(() => {
    if (!current || grade) return;
    const g = gradeAnswer(typed, current.term);
    setGrade(g);
    setRevealed(true);
    say(current.term, current.language);
  }, [current, grade, typed, say]);

  const pick = useCallback(
    (i: number) => {
      if (!current || picked != null) return;
      setPicked(i);
      setRevealed(true);
    },
    [current, picked],
  );

  const choiceRating: Rating | null = picked == null ? null : options[picked] === current?.meaning ? 3 : 1;

  // Keyboard: space/enter to reveal or continue, 1-4 to rate or pick.
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (!current || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement) return;
      const n = Number(ev.key);
      if (cardMode === "flip") {
        if (!revealed && (ev.key === " " || ev.key === "Enter")) {
          ev.preventDefault();
          setRevealed(true);
        } else if (revealed && n >= 1 && n <= 4) answer(n as Rating);
        else if (revealed && (ev.key === " " || ev.key === "Enter")) {
          ev.preventDefault();
          answer(3);
        }
      } else if (cardMode === "choice") {
        if (picked == null && n >= 1 && n <= options.length) pick(n - 1);
        else if (picked != null && (ev.key === "Enter" || ev.key === " ") && choiceRating) {
          ev.preventDefault();
          answer(choiceRating);
        }
      }
      // Typing exercises use their own form (Enter submits).
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, cardMode, revealed, picked, options.length, answer, pick, choiceRating]);

  if (!current) {
    const minutes = Math.max(1, Math.round(done.ms / 60000));
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-12 text-center">
        <PartyPopper className="text-primary size-10" />
        <h2 className="text-xl font-semibold">{done.reviewed ? t("doneTitle") : t("nothingDue")}</h2>
        {done.reviewed > 0 && (
          <p className="text-muted-foreground text-sm">
            {t("doneSummary", { count: done.reviewed, pct: Math.round((done.correct / done.reviewed) * 100), minutes })}
          </p>
        )}
        {saveErrors > 0 && <p className="text-destructive text-sm">{t("saveErrors", { count: saveErrors })}</p>}
        <Button asChild>
          <Link href={backHref}>{t("backToDecks")}</Link>
        </Button>
      </div>
    );
  }

  const intervals = cardMode === "flip" && revealed ? previewIntervals(current) : null;
  const left = queue.length;
  const progress = total ? Math.min(1, done.reviewed / (done.reviewed + left)) : 0;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild aria-label={t("stop")} title={t("stop")}>
          <Link href={backHref}>
            <X />
          </Link>
        </Button>
        <Progress value={progress} className="flex-1" label={t("progress")} />
        <span className="text-muted-foreground w-10 text-right text-xs tabular-nums">{left}</span>
        <Button variant="ghost" size="icon" onClick={toggleSound} aria-label={t("sound")} title={t("sound")} aria-pressed={sound}>
          {sound ? <Volume2 /> : <VolumeX />}
        </Button>
      </div>

      <div className="bg-card flex min-h-52 sm:min-h-72 flex-col items-center justify-center gap-3 rounded-xl border p-6 text-center shadow-xs">
        <span className="text-muted-foreground text-xs tracking-wide uppercase">
          {current.state === STATE.new ? t("newWord") : t(`modeHint.${cardMode}`)}
        </span>

        {/* Prompt */}
        {cardMode === "type" ? (
          <p className="text-2xl font-semibold break-words">{current.meaning}</p>
        ) : cardMode === "listen" ? (
          <Button variant="outline" size="lg" onClick={() => speak(current.term, current.language)} className="h-16 w-16 rounded-full" aria-label={t("listenAgain")}>
            <Volume2 className="size-7" />
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <p className="text-3xl font-semibold break-words" lang={current.language}>
              {current.term}
            </p>
            <Button variant="ghost" size="icon" onClick={() => speak(current.term, current.language)} aria-label={t("listen")}>
              <Volume2 />
            </Button>
          </div>
        )}
        {cardMode !== "listen" && cardMode !== "type" && current.pronunciation && (
          <p className="text-muted-foreground text-sm">{current.pronunciation}</p>
        )}

        {/* Answer */}
        {revealed && (cardMode === "type" || cardMode === "listen") && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              <p className="text-2xl font-semibold" lang={current.language}>
                {current.term}
              </p>
              <Button variant="ghost" size="icon" onClick={() => speak(current.term, current.language)} aria-label={t("listen")}>
                <Volume2 />
              </Button>
            </div>
            {current.pronunciation && <p className="text-muted-foreground text-sm">{current.pronunciation}</p>}
            {cardMode === "listen" && <p className="text-lg">{current.meaning}</p>}
          </div>
        )}
        {revealed && cardMode === "flip" && <p className="text-xl">{current.meaning}</p>}
        {revealed && (current.example || current.notes) && (
          <div className="text-muted-foreground mt-2 flex flex-col gap-1 text-sm">
            {current.example && (
              <p className="italic" lang={current.language}>
                {current.example}
              </p>
            )}
            {current.example_meaning && <p>{current.example_meaning}</p>}
            {current.notes && <p className="text-xs">{current.notes}</p>}
          </div>
        )}
      </div>

      {/* Controls */}
      {cardMode === "flip" &&
        (!revealed ? (
          <Button size="lg" onClick={() => setRevealed(true)}>
            {t("showAnswer")}
          </Button>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {RATINGS.map((r) => (
              <Button
                key={r}
                variant={r === 3 ? "default" : "outline"}
                className={cn("h-auto flex-col gap-0.5 py-2", r === 1 && "text-destructive")}
                onClick={() => answer(r)}
              >
                <span>{t(`rating.${r}`)}</span>
                <span className="text-[11px] font-normal opacity-70">{intervals && formatInterval(intervals[r], t)}</span>
              </Button>
            ))}
          </div>
        ))}

      {cardMode === "choice" && (
        <div className="grid gap-2 sm:grid-cols-2">
          {options.map((o, i) => {
            const isRight = o === current.meaning;
            return (
              <Button
                key={`${i}-${o}`}
                variant="outline"
                className={cn(
                  "h-auto min-h-12 justify-start py-3 text-left whitespace-normal",
                  picked != null && isRight && "border-emerald-500 bg-emerald-500/15 text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-200",
                  picked === i && !isRight && "border-destructive bg-destructive/15 text-destructive hover:bg-destructive/15",
                )}
                onClick={() => pick(i)}
                disabled={picked != null && picked !== i && !isRight}
              >
                <span className="text-muted-foreground mr-1 text-xs tabular-nums">{i + 1}</span>
                <span className="flex-1">{o}</span>
                {picked != null && isRight && <Check className="size-4" />}
                {picked === i && !isRight && <X className="size-4" />}
              </Button>
            );
          })}
          {choiceRating && (
            <Button size="lg" className="sm:col-span-2" onClick={() => answer(choiceRating)}>
              {t("continue")}
            </Button>
          )}
        </div>
      )}

      {(cardMode === "type" || cardMode === "listen") && (
        <form
          className="flex flex-col gap-2"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (grade) answer(ratingForGrade(grade));
            else checkTyped();
          }}
        >
          <Input
            ref={inputRef}
            value={typed}
            onChange={(ev) => setTyped(ev.target.value)}
            readOnly={!!grade}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang={current.language}
            placeholder={cardMode === "listen" ? t("typeWhatYouHear") : t("typeTheWord")}
            aria-label={cardMode === "listen" ? t("typeWhatYouHear") : t("typeTheWord")}
            className={cn(
              "h-12 text-center text-lg",
              grade === "correct" && "border-emerald-500",
              grade === "almost" && "border-amber-500",
              grade === "wrong" && "border-destructive",
            )}
          />
          {grade && (
            <p
              className={cn(
                "flex items-center justify-center gap-1 text-sm",
                grade === "correct" ? "text-emerald-600 dark:text-emerald-400" : grade === "almost" ? "text-amber-600 dark:text-amber-400" : "text-destructive",
              )}
            >
              {grade === "correct" ? <Check className="size-4" /> : <X className="size-4" />}
              {t(`grade.${grade}`)}
            </p>
          )}
          <div className="flex gap-2">
            {!grade ? (
              <>
                <Button type="button" variant="outline" onClick={() => { setTyped(""); setGrade("wrong"); setRevealed(true); say(current.term, current.language); }}>
                  {t("dontKnow")}
                </Button>
                <Button type="submit" size="lg" className="flex-1">
                  {t("check")}
                </Button>
              </>
            ) : (
              <>
                {grade !== "correct" && (
                  <Button type="button" variant="outline" onClick={() => answer(3)}>
                    {t("iWasRight")}
                  </Button>
                )}
                <Button type="submit" size="lg" className="flex-1" autoFocus>
                  {t("continue")}
                </Button>
              </>
            )}
          </div>
        </form>
      )}

      {saveErrors > 0 && <p className="text-destructive text-center text-xs">{t("saveErrors", { count: saveErrors })}</p>}
      <p className="text-muted-foreground hidden text-center text-xs sm:block">{t(`keys.${cardMode}`)}</p>
    </div>
  );
}

function formatInterval(days: number, t: (k: string, v?: Record<string, number>) => string) {
  if (days < 1) return t("in.min", { n: Math.max(1, Math.round(days * 1440)) });
  if (days < 30) return t("in.day", { n: Math.round(days) });
  if (days < 365) return t("in.month", { n: Math.round(days / 30) });
  return t("in.year", { n: Math.round((days / 365) * 10) / 10 });
}
