import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { GoalRow } from "@/components/planning/goal-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreas, getGoalProgressList, getProjects, getToday } from "@/core/planning/queries";
import { cn } from "@/lib/utils";

const FILTERS = {
  active: ["active"],
  planned: ["planned", "paused"],
  done: ["achieved", "abandoned"],
  all: undefined,
} as const;
type Filter = keyof typeof FILTERS;

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("goals") };
}

export default async function GoalsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const filter: Filter = status && status in FILTERS ? (status as Filter) : "active";
  const t = await getTranslations();

  const [areas, goals, projects, today] = await Promise.all([
    getAreas(),
    getGoalProgressList({ status: FILTERS[filter] ? [...FILTERS[filter]!] : undefined }),
    getProjects({ openOnly: true }),
    getToday(),
  ]);
  const goalTitle = new Map(goals.map((g) => [g.goal_id, g.title]));

  return (
    <>
      <PageHeader
        title={t("nav.goals")}
        subtitle={t("planning.goalsSubtitle")}
        actions={
          <Button asChild>
            <Link href="/goals/new">
              <Plus />
              {t("planning.newGoal")}
            </Link>
          </Button>
        }
      />

      <nav className="bg-muted mb-5 inline-flex rounded-lg p-1 text-sm" aria-label={t("planning.fields.status")}>
        {(Object.keys(FILTERS) as Filter[]).map((f) => (
          <Link
            key={f}
            href={f === "active" ? "/goals" : `/goals?status=${f}`}
            aria-current={f === filter ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1",
              f === filter ? "bg-background font-medium shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(`planning.filters.${f}`)}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {goals.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-3">
                <p className="text-muted-foreground text-sm">{t("planning.noGoals")}</p>
                <Button asChild variant="outline" size="sm">
                  <Link href="/goals/new">
                    <Plus />
                    {t("planning.newGoal")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            areas
              .map((area) => ({ area, items: goals.filter((g) => g.life_area_id === area.id) }))
              .filter(({ items }) => items.length > 0)
              .map(({ area, items }) => (
                <Card key={area.id}>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>
                      <Link href={`/${area.key}`} className="hover:underline">
                        {areaName(t, area)}
                      </Link>
                    </CardTitle>
                    <Link
                      href={`/goals/new?area=${area.key}`}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={t("planning.newGoal")}
                    >
                      <Plus className="size-4" />
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col">
                      {items.map((g) => (
                        <GoalRow key={g.goal_id} goal={g} today={today} />
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{t("planning.projects")}</CardTitle>
            <Link
              href="/projects/new"
              className="text-muted-foreground hover:text-foreground"
              aria-label={t("planning.newProject")}
            >
              <Plus className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("planning.noProjects")}</p>
            ) : (
              <ul className="flex flex-col">
                {projects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="hover:bg-accent/60 -mx-2 flex flex-col rounded-md px-2 py-2">
                      <span className="truncate text-sm font-medium">{p.title}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {[areaName(t, areas.find((a) => a.id === p.life_area_id)), p.goal_id && goalTitle.get(p.goal_id)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
