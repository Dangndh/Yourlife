import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { MetricCard } from "@/components/metrics/metric-card";
import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { Button } from "@/components/ui/button";
import { getMetrics, getSeries } from "@/core/metrics/queries";
import { addDays } from "@/core/planning/dates";
import { getAreas, getToday } from "@/core/planning/queries";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("metrics") };
}

export default async function MetricsPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const t = await getTranslations();
  const [areas, all, today] = await Promise.all([getAreas(), getMetrics({ includeArchived: showArchived }), getToday()]);
  const metrics = showArchived ? all.filter((m) => m.is_archived) : all;
  const series = await getSeries(metrics, addDays(today, -400));

  const groups = [
    ...areas.map((area) => ({ key: area.key, label: areaName(t, area), items: metrics.filter((m) => m.life_area_id === area.id) })),
    { key: "other", label: t("metrics.otherArea"), items: metrics.filter((m) => !areas.some((a) => a.id === m.life_area_id)) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader
        title={t("nav.metrics")}
        subtitle={t("metrics.subtitle")}
        actions={
          <Button asChild>
            <Link href="/metrics/new">
              <Plus />
              {t("metrics.new")}
            </Link>
          </Button>
        }
      />

      <nav className="bg-muted mb-5 inline-flex rounded-lg p-1 text-sm">
        {[false, true].map((a) => (
          <Link
            key={String(a)}
            href={a ? "/metrics?archived=1" : "/metrics"}
            aria-current={a === showArchived ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1",
              a === showArchived ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {a ? t("metrics.archived") : t("metrics.active")}
          </Link>
        ))}
      </nav>

      {groups.length === 0 ? (
        <p className="text-muted-foreground text-sm">{showArchived ? t("metrics.noArchived") : t("metrics.empty")}</p>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map((g) => (
            <section key={g.key} className="flex flex-col gap-3">
              <h2 className="text-muted-foreground text-sm font-medium">
                {g.key === "other" ? g.label : <Link href={`/${g.key}`} className="hover:text-foreground hover:underline">{g.label}</Link>}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((m) => (
                  <MetricCard key={m.id} metric={m} points={series.get(m.id) ?? []} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
