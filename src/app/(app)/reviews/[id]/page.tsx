import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { formatMinutes } from "@/components/activity/log-item";
import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { DeleteButton } from "@/components/planning/delete-button";
import { ReviewEditor } from "@/components/reviews/review-editor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreas } from "@/core/planning/queries";
import { deleteReview } from "@/core/reviews/actions";
import { formatPeriod } from "@/core/reviews/periods";
import { getLatestWheel, getPeriodSummary, getReview } from "@/core/reviews/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("nav");
  if (!z.uuid().safeParse(id).success) return {};
  return { title: t("reviews") };
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [t, locale, data, areas] = await Promise.all([getTranslations(), getLocale(), getReview(id), getAreas()]);
  if (!data) notFound();
  const { review, scores } = data;
  const [summary, before] = await Promise.all([
    getPeriodSummary(review.period_start, review.period_end),
    getLatestWheel({ before: review.period_start, includeDrafts: true }),
  ]);
  const previous = Object.fromEntries((before?.scores ?? []).map((s) => [s.life_area_id, s.score]));
  const period = formatPeriod({ type: review.period_type, start: review.period_start, end: review.period_end }, locale);
  const totalMinutes = summary.byArea.reduce((s, a) => s + a.minutes, 0);
  const maxMinutes = Math.max(1, ...summary.byArea.map((a) => a.minutes));

  return (
    <>
      <PageHeader
        title={t(`reviews.${review.period_type}.title`)}
        back={{ href: "/reviews", label: t("nav.reviews") }}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <span>{period}</span>
            <Badge variant={review.status === "completed" ? "success" : "secondary"}>{t(`reviews.status.${review.status}`)}</Badge>
          </span>
        }
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("reviews.summaryTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              [t("reviews.stats.tasksDone"), summary.tasksDone],
              [t("reviews.stats.goalsAchieved"), summary.goalsAchieved.length],
              [t("reviews.stats.timeLogged"), formatMinutes(totalMinutes, t)],
              [t("reviews.stats.journalDays"), summary.journalDays],
              [t("reviews.stats.avgMood"), summary.avgMood != null ? `${summary.avgMood}/5` : "–"],
              [t("reviews.stats.avgEnergy"), summary.avgEnergy != null ? `${summary.avgEnergy}/5` : "–"],
            ].map(([k, v]) => (
              <div key={String(k)}>
                <dt className="text-muted-foreground text-xs">{k}</dt>
                <dd className="text-lg font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
            {summary.goalsAchieved.length > 0 && (
              <div className="col-span-2 flex flex-wrap gap-1.5">
                {summary.goalsAchieved.map((g) => (
                  <Link key={g.id} href={`/goals/${g.id}`}>
                    <Badge variant="success">{g.title}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </dl>
          <div className="flex flex-col gap-2">
            <p className="text-muted-foreground text-xs">{t("reviews.stats.byArea")}</p>
            {summary.byArea.map((a) => (
              <div key={a.id} className="grid grid-cols-[7rem_1fr_auto] items-center gap-2 text-sm">
                <span className="truncate">{areaName(t, a)}</span>
                <span className="bg-muted h-2 overflow-hidden rounded-full">
                  <span className="bg-primary block h-full rounded-full" style={{ width: `${(a.minutes / maxMinutes) * 100}%` }} />
                </span>
                <span className="text-muted-foreground text-right text-xs whitespace-nowrap tabular-nums">
                  {a.logs ? `${t("log.count", { count: a.logs })} · ${formatMinutes(a.minutes, t)}` : "–"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <ReviewEditor
        review={review}
        scores={scores}
        previous={previous}
        areas={areas.map((a) => ({ id: a.id, label: areaName(t, a) }))}
      />

      <div className="mt-10">
        <DeleteButton action={deleteReview} id={review.id} label={t("reviews.delete")} />
      </div>
    </>
  );
}
