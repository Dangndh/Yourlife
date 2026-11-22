import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { TaskItem } from "@/components/planning/task-item";
import { LifeWheel } from "@/components/reviews/life-wheel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays } from "@/core/planning/dates";
import { getAreas, getTasks, getToday } from "@/core/planning/queries";
import { startReview } from "@/core/reviews/actions";
import { formatPeriod, periodFor, previousPeriod } from "@/core/reviews/periods";
import { findReview, getLatestWheel, getWeekStartsOn } from "@/core/reviews/queries";
import type { LifeAreaSummary, Task } from "@/core/types";
import { createClient } from "@/lib/supabase/server";
import { getModule } from "@/modules";

/** Earliest of "do on" and "due". */
const whenOf = (task: Task) => [task.scheduled_for, task.due_date].filter((d): d is string => !!d).sort()[0] ?? null;

/** Which weekly review to nudge: this week's in its last 2 days, last week's in the first 2 days of a week. */
async function reviewNudge(today: string, weekStartsOn: number) {
  const week = periodFor("weekly", today, weekStartsOn);
  if (today >= addDays(week.end, -1)) {
    const r = await findReview("weekly", week.start);
    if (r?.status !== "completed") return { period: week, which: "current" as const, started: !!r };
  }
  if (today <= addDays(week.start, 1)) {
    const last = previousPeriod(week, weekStartsOn);
    const r = await findReview("weekly", last.start);
    if (r?.status !== "completed") return { period: last, which: "previous" as const, started: !!r };
  }
  return null;
}

// Command Center: what to do today, the Life Wheel from the last review, and every life area.
export default async function HomePage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const [{ data }, today, weekStartsOn, areas, open, wheel, locale] = await Promise.all([
    supabase.from("v_life_area_summary").select("*").order("sort_order"),
    getToday(),
    getWeekStartsOn(),
    getAreas(),
    getTasks({ open: true }),
    getLatestWheel(),
    getLocale(),
  ]);
  const summaries = (data ?? []) as LifeAreaSummary[];
  const [nudge, before] = await Promise.all([
    reviewNudge(today, weekStartsOn),
    wheel ? getLatestWheel({ before: wheel.review.period_start }) : Promise.resolve(null),
  ]);

  const overdue = open.filter((task) => (whenOf(task) ?? "9999") < today);
  const dueToday = open.filter((task) => whenOf(task) === today);
  const focus = [...overdue, ...dueToday].slice(0, 6);
  const areaLabel = (id: string) => areaName(t, areas.find((a) => a.id === id));
  const score = (s: { life_area_id: string; score: number }[] | undefined, id: string) =>
    s?.find((x) => x.life_area_id === id)?.score ?? null;

  return (
    <>
      <PageHeader title={t("home.title")} subtitle={t("home.subtitle")} />

      {nudge && (
        <div className="bg-primary/5 border-primary/20 mb-4 flex flex-wrap items-center gap-3 rounded-xl border p-4">
          <ClipboardCheck className="size-5 shrink-0" />
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium">{t("home.reviewNudge")}</p>
            <p className="text-muted-foreground">{formatPeriod(nudge.period, locale)}</p>
          </div>
          <form action={startReview}>
            <input type="hidden" name="type" value="weekly" />
            <input type="hidden" name="which" value={nudge.which} />
            <Button type="submit" size="sm">
              {nudge.started ? t("reviews.continueButton") : t("reviews.startButton")}
            </Button>
          </form>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{t("home.today")}</CardTitle>
              <CardDescription>
                {overdue.length > 0 ? t("home.overdueCount", { count: overdue.length }) : t("home.todayCount", { count: dueToday.length })}
              </CardDescription>
            </div>
            <Link href="/tasks" className="text-muted-foreground hover:text-foreground text-xs">
              {t("log.seeAll")}
            </Link>
          </CardHeader>
          <CardContent>
            {focus.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("home.nothingToday")}</p>
            ) : (
              <ul className="divide-y">
                {focus.map((task) => (
                  <TaskItem key={task.id} task={task} today={today} next="/" meta={[areaLabel(task.life_area_id)]} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>{t("reviews.wheelTitle")}</CardTitle>
              <CardDescription>
                {wheel
                  ? formatPeriod(
                      { type: wheel.review.period_type, start: wheel.review.period_start, end: wheel.review.period_end },
                      locale,
                    )
                  : t("home.noWheel")}
              </CardDescription>
            </div>
            <Link href={wheel ? `/reviews/${wheel.review.id}` : "/reviews"} className="text-muted-foreground hover:text-foreground text-xs">
              {t("nav.reviews")}
            </Link>
          </CardHeader>
          <CardContent>
            {wheel ? (
              <>
                <LifeWheel
                  label={t("reviews.wheelTitle")}
                  className="mx-auto h-auto w-full max-w-xs"
                  axes={areas.map((a) => ({
                    label: areaName(t, a),
                    value: score(wheel.scores, a.id),
                    previous: score(before?.scores, a.id),
                  }))}
                />
                {before && <p className="text-muted-foreground text-center text-xs">{t("reviews.wheelLegend")}</p>}
              </>
            ) : (
              <form action={startReview}>
                <input type="hidden" name="type" value="weekly" />
                <input type="hidden" name="which" value="current" />
                <Button type="submit" variant="outline" size="sm">
                  <ClipboardCheck />
                  {t("home.firstReview")}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

      {summaries.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("home.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((area) => {
            const mod = getModule(area.key);
            const Icon = mod?.icon;
            const name = mod ? t(`areas.${area.key}`) : area.name;
            const delta = area.last_score != null && area.previous_score != null ? area.last_score - area.previous_score : null;
            return (
              <Link key={area.life_area_id} href={`/${area.key}`} className="group">
                <Card className="group-hover:border-foreground/20 h-full transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {Icon && <Icon className="size-4" />}
                      {name}
                    </CardTitle>
                    <CardDescription>
                      {area.last_score != null ? t("home.score", { value: area.last_score }) : t("home.noScore")}
                      {delta != null && delta !== 0 && (
                        <span className={delta > 0 ? "ml-1.5 text-emerald-600 dark:text-emerald-400" : "text-destructive ml-1.5"}>
                          {delta > 0 ? `+${delta}` : delta}
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
                    <span>{t("home.activeGoals", { count: area.active_goals })}</span>
                    {area.avg_goal_progress != null && (
                      <span>{t("home.progress", { value: Math.round(area.avg_goal_progress * 100) })}</span>
                    )}
                    <span>{t("home.logs7d", { count: area.logs_7d })}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
