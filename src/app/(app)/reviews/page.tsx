import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { CheckCircle2, CircleDashed } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getToday } from "@/core/planning/queries";
import { startReview } from "@/core/reviews/actions";
import { formatPeriod, periodFor, previousPeriod, type Period, type PeriodType } from "@/core/reviews/periods";
import { getReviews, getWeekStartsOn, type Review } from "@/core/reviews/queries";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("reviews") };
}

function StartButton({ period, which, review, label }: { period: Period; which: "current" | "previous"; review?: Review; label: string }) {
  return (
    <form action={startReview}>
      <input type="hidden" name="type" value={period.type} />
      <input type="hidden" name="which" value={which} />
      <Button type="submit" variant={review?.status === "completed" ? "ghost" : which === "current" ? "default" : "outline"} size="sm">
        {review?.status === "completed" ? <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" /> : review ? <CircleDashed /> : null}
        {label}
      </Button>
    </form>
  );
}

export default async function ReviewsPage() {
  const t = await getTranslations();
  const [today, weekStartsOn, reviews, locale] = await Promise.all([getToday(), getWeekStartsOn(), getReviews(), getLocale()]);
  const find = (p: Period) => reviews.find((r) => r.period_type === p.type && r.period_start === p.start);
  const label = (p: Period) => {
    const r = find(p);
    return r?.status === "completed" ? t("reviews.doneButton") : r ? t("reviews.continueButton") : t("reviews.startButton");
  };

  return (
    <>
      <PageHeader title={t("nav.reviews")} subtitle={t("reviews.subtitle")} />
      <div className="grid gap-4 md:grid-cols-2">
        {(["weekly", "monthly"] as PeriodType[]).map((type) => {
          const current = periodFor(type, today, weekStartsOn);
          const prev = previousPeriod(current, weekStartsOn);
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle>{t(`reviews.${type}.title`)}</CardTitle>
                <CardDescription>{t(`reviews.${type}.hint`)}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {([
                  [current, "current"],
                  [prev, "previous"],
                ] as const).map(([p, which]) => (
                  <div key={which} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm">
                      <span className="font-medium">{t(`reviews.${type}.${which}`)}</span>
                      <span className="text-muted-foreground"> · {formatPeriod(p, locale)}</span>
                    </span>
                    <StartButton period={p} which={which} review={find(p)} label={label(p)} />
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <h2 className="mt-8 mb-3 text-sm font-medium">{t("reviews.history")}</h2>
      {reviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("reviews.empty")}</p>
      ) : (
        <ul className="bg-card divide-y rounded-xl border">
          {reviews.map((r) => (
            <li key={r.id}>
              <Link href={`/reviews/${r.id}`} className="hover:bg-accent/60 flex items-center gap-3 px-4 py-3 text-sm">
                <Badge variant="outline">{t(`reviews.${r.period_type}.short`)}</Badge>
                <span className="min-w-0 flex-1 truncate font-medium">{formatPeriod({ type: r.period_type, start: r.period_start, end: r.period_end }, locale)}</span>
                {r.overall_score != null && <span className="text-muted-foreground tabular-nums">{r.overall_score}/10</span>}
                <Badge variant={r.status === "completed" ? "success" : "secondary"}>{t(`reviews.status.${r.status}`)}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
