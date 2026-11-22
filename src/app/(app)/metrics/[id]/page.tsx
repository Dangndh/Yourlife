import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Archive, ArchiveRestore, Pencil, Trash2 } from "lucide-react";
import { z } from "zod";

import { MetricChart } from "@/components/metrics/chart";
import { EntryForm } from "@/components/metrics/entry-form";
import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteEntry, setMetricArchived } from "@/core/metrics/actions";
import { formatMetricValue, metricName } from "@/core/metrics/format";
import { getEntries, getGoalsForMetric, getMetric, getSeries } from "@/core/metrics/queries";
import { addDays, dayOf, formatDay } from "@/core/planning/dates";
import { getAreas, getTimeZone, getToday } from "@/core/planning/queries";
import { cn } from "@/lib/utils";

const RANGES = { "30": 30, "90": 90, "365": 365, all: null } as const;
type Range = keyof typeof RANGES;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return {};
  const [t, metric] = await Promise.all([getTranslations(), getMetric(id)]);
  return { title: metric ? metricName(t, metric) : undefined };
}

export default async function MetricPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { range: r } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const range: Range = r && r in RANGES ? (r as Range) : "90";

  const t = await getTranslations();
  const [metric, areas, today, timeZone, locale] = await Promise.all([
    getMetric(id),
    getAreas(),
    getToday(),
    getTimeZone(),
    getLocale(),
  ]);
  if (!metric) notFound();
  const days = RANGES[range];
  const [series, entries, goals] = await Promise.all([
    getSeries([metric], days ? addDays(today, -days) : undefined),
    metric.source === "manual" ? getEntries(metric.id) : Promise.resolve([]),
    getGoalsForMetric(metric.id),
  ]);
  const points = series.get(metric.id) ?? [];
  const area = areas.find((a) => a.id === metric.life_area_id);
  const name = metricName(t, metric);
  const fmt = (v: number) => formatMetricValue(metric, v, locale);
  const fmtDay = (d: string) => formatDay(d, locale, today);
  const targets = goals
    .filter((g) => g.target_value !== null && !["achieved", "abandoned"].includes(g.status))
    .map((g) => ({ label: g.title, value: Number(g.target_value) }));

  return (
    <>
      <PageHeader
        title={name}
        back={{ href: "/metrics", label: t("nav.metrics") }}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            {area && (
              <Link href={`/${area.key}`} className="hover:text-foreground hover:underline">
                {areaName(t, area)}
              </Link>
            )}
            <Badge variant="secondary">{t(`metrics.source.${metric.source}`)}</Badge>
            {metric.is_archived && <Badge variant="outline">{t("metrics.archivedBadge")}</Badge>}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/metrics/${metric.id}/edit`}>
                <Pencil />
                {t("planning.edit")}
              </Link>
            </Button>
            <form action={setMetricArchived}>
              <input type="hidden" name="id" value={metric.id} />
              <input type="hidden" name="archived" value={String(!metric.is_archived)} />
              <Button type="submit" variant="ghost" size="sm">
                {metric.is_archived ? <ArchiveRestore /> : <Archive />}
                {metric.is_archived ? t("metrics.unarchive") : t("metrics.archive")}
              </Button>
            </form>
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>{t("metrics.chart")}</CardTitle>
            <nav className="bg-muted inline-flex rounded-lg p-1 text-xs" aria-label={t("log.range")}>
              {(Object.keys(RANGES) as Range[]).map((k) => (
                <Link
                  key={k}
                  href={k === "90" ? `/metrics/${metric.id}` : `/metrics/${metric.id}?range=${k}`}
                  aria-current={k === range ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1",
                    k === range ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t(`metrics.range.${k}`)}
                </Link>
              ))}
            </nav>
          </CardHeader>
          <CardContent>
            {points.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                {metric.source === "manual" ? t("metrics.noDataYet") : t("metrics.noDataDerived")}
              </p>
            ) : (
              <MetricChart points={points} targets={targets} format={fmt} formatDate={fmtDay} label={name} />
            )}
          </CardContent>
        </Card>

        {metric.source === "manual" && !metric.is_archived && (
          <Card>
            <CardHeader>
              <CardTitle>{t("metrics.addEntry")}</CardTitle>
            </CardHeader>
            <CardContent>
              <EntryForm metricId={metric.id} unit={metric.unit} today={today} />
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          {metric.source === "manual" && (
            <Card>
              <CardHeader>
                <CardTitle>{t("metrics.entries")}</CardTitle>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <p className="text-muted-foreground text-sm">{t("metrics.noEntries")}</p>
                ) : (
                  <ul className="divide-y">
                    {entries.map((e) => (
                      <li key={e.id} className="flex items-center gap-3 py-2 text-sm">
                        <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
                          {fmtDay(dayOf(e.recorded_at, timeZone))}
                        </span>
                        <span className="font-medium tabular-nums">{fmt(Number(e.value))}</span>
                        <span className="text-muted-foreground min-w-0 flex-1 truncate">{e.note}</span>
                        <form action={deleteEntry}>
                          <input type="hidden" name="id" value={e.id} />
                          <button
                            type="submit"
                            className="text-muted-foreground hover:text-destructive p-1"
                            aria-label={t("metrics.deleteEntry")}
                            title={t("metrics.deleteEntry")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="h-fit">
            <CardHeader>
              <CardTitle>{t("metrics.goals")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {goals.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("metrics.noGoals")}</p>
              ) : (
                <ul className="flex flex-col">
                  {goals.map((g) => (
                    <li key={g.id}>
                      <Link href={`/goals/${g.id}`} className="hover:bg-accent/60 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm">
                        <span className="truncate font-medium">{g.title}</span>
                        {g.target_value !== null && (
                          <span className="text-muted-foreground shrink-0 tabular-nums">
                            {t("metrics.target")}: {fmt(Number(g.target_value))}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-muted-foreground text-xs">{t("metrics.goalsHint")}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
