import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { GoalRow } from "@/components/planning/goal-card";
import { TaskItem } from "@/components/planning/task-item";
import { TaskQuickAdd } from "@/components/planning/task-quick-add";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAreas, getGoalProgressList, getProjects, getTasks, getToday } from "@/core/planning/queries";
import { getModule } from "@/modules";

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props) {
  const { area } = await params;
  const t = await getTranslations("areas");
  return { title: getModule(area) ? t(area) : undefined };
}

// Module Overview: one layout shared by all 7 areas.
export default async function AreaPage({ params }: Props) {
  const { area } = await params;
  const mod = getModule(area);
  if (!mod) notFound();

  const t = await getTranslations();
  const areas = await getAreas();
  const lifeArea = areas.find((a) => a.key === area);

  const [goals, projects, tasks, today] = lifeArea
    ? await Promise.all([
        getGoalProgressList({ lifeAreaId: lifeArea.id, status: ["active", "planned", "paused"] }),
        getProjects({ lifeAreaId: lifeArea.id, openOnly: true }),
        getTasks({ lifeAreaId: lifeArea.id, open: true }),
        getToday(),
      ])
    : [[], [], [], await getToday()];
  const next = `/${area}`;
  const parentTitle = (task: (typeof tasks)[number]) =>
    (task.project_id && projects.find((p) => p.id === task.project_id)?.title) ||
    (task.goal_id && goals.find((g) => g.goal_id === task.goal_id)?.title) ||
    "";

  return (
    <>
      <PageHeader
        title={t(`areas.${area}`)}
        actions={
          <Button asChild size="sm">
            <Link href={`/goals/new?area=${area}`}>
              <Plus />
              {t("planning.newGoal")}
            </Link>
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("module.goals")}</CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("module.noGoals")}</p>
              ) : (
                <ul className="flex flex-col">
                  {goals.map((g) => (
                    <GoalRow key={g.goal_id} goal={g} today={today} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("planning.openTasks")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {lifeArea && <TaskQuickAdd today={today} lifeAreaId={lifeArea.id} />}
              {tasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("planning.noTasks")}</p>
              ) : (
                <ul className="divide-y">
                  {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} today={today} next={next} meta={[parentTitle(task)]} />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("planning.projects")}</CardTitle>
              <Link
                href={`/projects/new?area=${area}`}
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
                      <Link href={`/projects/${p.id}`} className="hover:bg-accent/60 -mx-2 block truncate rounded-md px-2 py-1.5 text-sm">
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("module.subpages")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              {mod.pages.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${area}/${p.slug}`}
                  className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
                >
                  {t(`pages.${p.labelKey}`)}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
