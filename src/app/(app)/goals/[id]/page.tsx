import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { Pencil, Plus } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { DeleteButton } from "@/components/planning/delete-button";
import { GoalRow } from "@/components/planning/goal-card";
import { TaskItem } from "@/components/planning/task-item";
import { TaskQuickAdd } from "@/components/planning/task-quick-add";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deleteGoal, setGoalStatus } from "@/core/planning/actions";
import { formatMetricValue, metricName } from "@/core/metrics/format";
import { getMetric } from "@/core/metrics/queries";
import { formatDay } from "@/core/planning/dates";
import { getAreas, getChildGoalIds, getGoal, getGoalProgressList, getProjects, getTasks, getToday } from "@/core/planning/queries";
import type { GoalStatus } from "@/core/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = z.uuid().safeParse(id).success ? await getGoal(id) : null;
  return { title: data?.goal.title };
}

/** Status changes offered for each status (one click, no form). */
const NEXT_STATUS: Record<GoalStatus, GoalStatus[]> = {
  planned: ["active"],
  active: ["achieved", "paused", "abandoned"],
  paused: ["active", "abandoned"],
  achieved: ["active"],
  abandoned: ["active"],
};

export default async function GoalPage({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const locale = await getLocale();
  const data = await getGoal(id);
  if (!data) notFound();
  const { goal, progress } = data;

  const [areas, projects, directTasks, allGoals, childIds, today, metric] = await Promise.all([
    getAreas(),
    getProjects({ goalId: id }),
    getTasks({ goalId: id }),
    getGoalProgressList(),
    getChildGoalIds(id),
    getToday(),
    goal.metric_id ? getMetric(goal.metric_id) : Promise.resolve(null),
  ]);
  const fmt = (v: number | null | undefined) => (v == null || !metric ? "–" : formatMetricValue(metric, Number(v), locale));
  const area = areas.find((a) => a.id === goal.life_area_id);
  const parent = allGoals.find((g) => g.goal_id === goal.parent_goal_id);
  const subGoals = allGoals.filter((g) => childIds.includes(g.goal_id));

  const projectTasks = projects.length ? await getTasks({ projectIds: projects.map((p) => p.id), open: true }) : [];
  const pct = progress?.progress != null ? Math.round(progress.progress * 100) : null;
  const next = `/goals/${id}`;

  return (
    <>
      <PageHeader
        title={goal.title}
        back={area ? { href: `/${area.key}`, label: areaName(t, area) } : { href: "/goals", label: t("nav.goals") }}
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={goal.status === "achieved" ? "success" : goal.status === "active" ? "default" : "secondary"}>
              {t(`planning.goalStatus.${goal.status}`)}
            </Badge>
            <span>{t(`planning.goalType.${goal.goal_type}`)}</span>
            <span>·</span>
            <span>{t(`planning.priority.p${goal.priority}`)}</span>
            {goal.target_date && (
              <>
                <span>·</span>
                <span>{t("planning.target", { date: formatDay(goal.target_date, locale, today) })}</span>
              </>
            )}
          </span>
        }
        actions={
          <>
            {NEXT_STATUS[goal.status].map((s) => (
              <form key={s} action={setGoalStatus}>
                <input type="hidden" name="id" value={goal.id} />
                <input type="hidden" name="status" value={s} />
                <Button type="submit" variant={s === "achieved" ? "default" : "outline"} size="sm">
                  {t(`planning.statusAction.${s}`)}
                </Button>
              </form>
            ))}
            <Button asChild variant="outline" size="sm">
              <Link href={`/goals/${id}/edit`}>
                <Pencil />
                {t("planning.edit")}
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {t("planning.progressTitle")}
                <span className="text-2xl tabular-nums">{pct != null ? `${pct}%` : "–"}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Progress value={progress?.progress ?? null} marker={progress?.time_elapsed} label={t("planning.progressTitle")} />
              {metric && (
                <Link
                  href={`/metrics/${metric.id}`}
                  className="hover:bg-accent/60 -mx-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-md px-2 py-1.5 text-sm"
                >
                  <span className="font-medium">{metricName(t, metric)}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {t("planning.metricProgress", {
                      current: fmt(progress?.current_value),
                      target: fmt(goal.target_value),
                      baseline: fmt(goal.baseline_value),
                    })}
                  </span>
                </Link>
              )}
              <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                <span>
                  {metric
                    ? t("planning.progressFromMetric")
                    : progress && progress.tasks_total > 0
                    ? t("planning.tasksDone", { done: progress.tasks_done, total: progress.tasks_total })
                    : t("planning.progressHint")}
                </span>
                {progress?.time_elapsed != null && (
                  <span>{t("planning.timeElapsed", { value: Math.round(progress.time_elapsed * 100) })}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("planning.tasks")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <TaskQuickAdd today={today} lifeAreaId={goal.life_area_id} goalId={goal.id} />
              {directTasks.length === 0 && projectTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("planning.noTasks")}</p>
              ) : (
                <ul className="divide-y">
                  {directTasks.map((task) => (
                    <TaskItem key={task.id} task={task} today={today} next={next} />
                  ))}
                  {projectTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      today={today}
                      next={next}
                      meta={[projects.find((p) => p.id === task.project_id)?.title ?? ""]}
                    />
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          {(goal.why || goal.description) && (
            <Card>
              <CardContent className="flex flex-col gap-3 text-sm">
                {goal.why && (
                  <div>
                    <div className="text-muted-foreground mb-1 text-xs font-medium uppercase">{t("planning.fields.why")}</div>
                    <p className="whitespace-pre-wrap">{goal.why}</p>
                  </div>
                )}
                {goal.description && <p className="text-muted-foreground whitespace-pre-wrap">{goal.description}</p>}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("planning.projects")}</CardTitle>
              <Link
                href={`/projects/new?goal=${goal.id}`}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t("planning.newProject")}
              >
                <Plus className="size-4" />
              </Link>
            </CardHeader>
            <CardContent>
              {projects.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t("planning.noProjectsForGoal")}</p>
              ) : (
                <ul className="flex flex-col">
                  {projects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="hover:bg-accent/60 -mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-2 text-sm"
                      >
                        <span className="truncate">{p.title}</span>
                        <Badge variant={p.status === "completed" ? "success" : "secondary"}>
                          {t(`planning.projectStatus.${p.status}`)}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {(parent || subGoals.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>{t("planning.relatedGoals")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {parent && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">{t("planning.fields.parentGoal")}: </span>
                    <Link href={`/goals/${parent.goal_id}`} className="hover:underline">
                      {parent.title}
                    </Link>
                  </p>
                )}
                {subGoals.length > 0 && (
                  <ul className="flex flex-col">
                    {subGoals.map((g) => (
                      <GoalRow key={g.goal_id} goal={g} today={today} />
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          <DeleteButton action={deleteGoal} id={goal.id} label={t("planning.deleteGoal")} />
        </div>
      </div>
    </>
  );
}
