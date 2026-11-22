import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

import { LogItem, formatMinutes, formatTime } from "@/components/activity/log-item";
import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { QuickLogOpenButton } from "@/components/quick-log/open-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { getLogs, LOG_SOURCES, type ActivityLog, type LogSource } from "@/core/activity/queries";
import { addDays, dayOf, formatDay, startOfDayIso } from "@/core/planning/dates";
import { getAreas, getTimeZone, getToday } from "@/core/planning/queries";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("log") };
}

type Search = { area?: string; type?: string; days?: string };

// Activity timeline: everything you did, newest first, grouped by day in your time zone.
export default async function LogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const t = await getTranslations();
  const locale = await getLocale();
  const [areas, today, timeZone] = await Promise.all([getAreas(), getToday(), getTimeZone()]);

  const days = RANGES.find((r) => String(r) === sp.days) ?? 7;
  const area = areas.find((a) => a.key === sp.area);
  const source = LOG_SOURCES.find((s) => s === sp.type) as LogSource | undefined;
  const firstDay = addDays(today, -(days - 1));
  const logs = await getLogs({ from: startOfDayIso(firstDay, timeZone), lifeAreaId: area?.id, source });

  // Group by local day.
  const byDay = new Map<string, ActivityLog[]>();
  for (const log of logs) {
    const d = dayOf(log.occurred_at, timeZone);
    byDay.set(d, [...(byDay.get(d) ?? []), log]);
  }
  // Minutes per area for the summary.
  const minutesByArea = new Map<string, { count: number; minutes: number }>();
  for (const log of logs) {
    const cur = minutesByArea.get(log.life_area_id) ?? { count: 0, minutes: 0 };
    minutesByArea.set(log.life_area_id, { count: cur.count + 1, minutes: cur.minutes + (log.duration_min ?? 0) });
  }
  const maxCount = Math.max(1, ...Array.from(minutesByArea.values(), (v) => v.count));

  const href = (patch: Partial<Search>) => {
    const next = { area: area?.key, type: source, days: days === 7 ? undefined : String(days), ...patch };
    const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
    return qs ? `/log?${qs}` : "/log";
  };
  const dayLabel = (d: string) =>
    d === today ? t("planning.when.today") : d === addDays(today, -1) ? t("log.yesterday") : formatDay(d, locale, today);

  return (
    <>
      <PageHeader title={t("log.title")} subtitle={t("log.subtitle")} actions={<QuickLogOpenButton label={t("log.quickLog")} />} />

      <form className="mb-5 flex flex-wrap items-center gap-2" action="/log">
        <nav className="bg-muted inline-flex rounded-lg p-1 text-sm" aria-label={t("log.range")}>
          {RANGES.map((r) => (
            <Link
              key={r}
              href={href({ days: r === 7 ? undefined : String(r) })}
              aria-current={r === days ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1",
                r === days ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t("log.lastDays", { count: r })}
            </Link>
          ))}
        </nav>
        {days !== 7 && <input type="hidden" name="days" value={days} />}
        <NativeSelect name="area" defaultValue={area?.key ?? ""} aria-label={t("planning.fields.area")} className="w-auto">
          <option value="">{t("log.allAreas")}</option>
          {areas.map((a) => (
            <option key={a.id} value={a.key}>
              {areaName(t, a)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="type" defaultValue={source ?? ""} aria-label={t("log.type")} className="w-auto">
          <option value="">{t("log.allTypes")}</option>
          {LOG_SOURCES.map((s) => (
            <option key={s} value={s}>
              {t(`log.source.${s}`)}
            </option>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline" size="sm">
          {t("log.filter")}
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {logs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3">
                <p className="text-muted-foreground text-sm">{t("log.empty")}</p>
                <QuickLogOpenButton label={t("log.quickLog")} variant="outline" />
              </CardContent>
            </Card>
          ) : (
            Array.from(byDay.entries()).map(([d, items]) => {
              const minutes = items.reduce((s, l) => s + (l.duration_min ?? 0), 0);
              return (
                <Card key={d}>
                  <CardHeader className="flex-row items-baseline justify-between">
                    <CardTitle>{dayLabel(d)}</CardTitle>
                    <span className="text-muted-foreground text-xs">
                      {t("log.count", { count: items.length })}
                      {minutes > 0 && ` · ${formatMinutes(minutes, t)}`}
                    </span>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y">
                      {items.map((log) => (
                        <LogItem
                          key={log.id}
                          log={log}
                          time={formatTime(log.occurred_at, locale, timeZone)}
                          areaLabel={area ? undefined : areaName(t, areas.find((a) => a.id === log.life_area_id))}
                        />
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("log.byArea")}</CardTitle>
          </CardHeader>
          <CardContent>
            {minutesByArea.size === 0 ? (
              <p className="text-muted-foreground text-sm">–</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {areas
                  .filter((a) => minutesByArea.has(a.id))
                  .map((a) => {
                    const v = minutesByArea.get(a.id)!;
                    return (
                      <li key={a.id} className="flex flex-col gap-1">
                        <div className="flex items-baseline justify-between gap-2 text-sm">
                          <Link href={href({ area: a.key })} className="hover:underline">
                            {areaName(t, a)}
                          </Link>
                          <span className="text-muted-foreground text-xs tabular-nums">
                            {t("log.count", { count: v.count })}
                            {v.minutes > 0 && ` · ${formatMinutes(v.minutes, t)}`}
                          </span>
                        </div>
                        <div className="bg-secondary h-1.5 rounded-full">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${(v.count / maxCount) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
