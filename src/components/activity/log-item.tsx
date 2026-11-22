import Link from "next/link";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { ActivityLog } from "@/core/activity/queries";

/** Where a log row links to: manual logs are edited in place, task logs open the task. */
function hrefFor(log: ActivityLog) {
  if (!log.source_table) return `/log/${log.id}`;
  if (log.source_table === "tasks" && log.task_id) return `/tasks/${log.task_id}?next=/log`;
  if (log.source_table === "lrn_study_sessions" && log.source_id) return `/learning/sessions/${log.source_id}`;
  return null;
}

export function formatTime(iso: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale, { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}

export function formatMinutes(min: number, t: (key: string, values?: Record<string, number>) => string) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return t("log.hoursMinutes", { h, m });
  if (h) return t("log.hours", { h });
  return t("log.minutes", { count: m });
}

export function LogItem({
  log,
  time,
  areaLabel,
}: {
  log: ActivityLog;
  /** Pre-formatted time or date label shown on the left. */
  time: string;
  areaLabel?: string;
}) {
  const t = useTranslations();
  const href = hrefFor(log);
  const title = href ? (
    <Link href={href} className="hover:underline">
      {log.title}
    </Link>
  ) : (
    log.title
  );

  return (
    <li className="flex gap-3 py-2.5">
      <span className="text-muted-foreground w-12 shrink-0 pt-0.5 text-xs tabular-nums">{time}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm break-words">{title}</span>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {areaLabel && <span>{areaLabel}</span>}
          {log.duration_min != null && log.duration_min > 0 && <span>{formatMinutes(log.duration_min, t)}</span>}
          {log.source_table && <Badge variant="outline">{t(`log.source.${log.source_table}`)}</Badge>}
        </div>
        {log.notes && <p className="text-muted-foreground text-xs whitespace-pre-wrap">{log.notes}</p>}
      </div>
    </li>
  );
}
