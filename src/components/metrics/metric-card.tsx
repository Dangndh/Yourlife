import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

import { formatMetricValue, metricName, trend } from "@/core/metrics/format";
import type { Metric, MetricPoint } from "@/core/metrics/types";
import { cn } from "@/lib/utils";

import { Sparkline } from "./chart";

/** Latest value, change since the previous period, and a sparkline. */
export function MetricCard({ metric, points, areaLabel }: { metric: Metric; points: MetricPoint[]; areaLabel?: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const last = points.at(-1);
  const tr = trend(metric, points);
  const Icon = !tr || tr.delta === 0 ? ArrowRight : tr.delta > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Link
      href={`/metrics/${metric.id}`}
      className="hover:border-foreground/20 bg-card flex flex-col gap-2 rounded-xl border p-4 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{metricName(t, metric)}</div>
          {areaLabel && <div className="text-muted-foreground truncate text-xs">{areaLabel}</div>}
        </div>
        <Sparkline points={points.slice(-12)} className="shrink-0" />
      </div>
      {last ? (
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-semibold tabular-nums">{formatMetricValue(metric, last.value, locale)}</span>
          {tr && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs tabular-nums",
                tr.tone === "good" && "text-emerald-600 dark:text-emerald-400",
                tr.tone === "bad" && "text-destructive",
                tr.tone === "flat" && "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {formatMetricValue(metric, Math.abs(tr.delta), locale)}
            </span>
          )}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">
          {metric.source === "manual" ? t("metrics.noData") : t("metrics.noDataDerived")}
        </span>
      )}
    </Link>
  );
}
