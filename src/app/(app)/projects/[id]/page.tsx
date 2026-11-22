import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { Pencil } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { DeleteButton } from "@/components/planning/delete-button";
import { TaskItem } from "@/components/planning/task-item";
import { TaskQuickAdd } from "@/components/planning/task-quick-add";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deleteProject } from "@/core/planning/actions";
import { formatDay } from "@/core/planning/dates";
import { getAreas, getGoal, getProject, getTasks, getToday } from "@/core/planning/queries";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const project = z.uuid().safeParse(id).success ? await getProject(id) : null;
  return { title: project?.title };
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const locale = await getLocale();
  const project = await getProject(id);
  if (!project) notFound();

  const [areas, tasks, goalData, today] = await Promise.all([
    getAreas(),
    getTasks({ projectId: id }),
    project.goal_id ? getGoal(project.goal_id) : Promise.resolve(null),
    getToday(),
  ]);
  const area = areas.find((a) => a.id === project.life_area_id);
  const counted = tasks.filter((x) => x.status !== "cancelled");
  const done = counted.filter((x) => x.status === "done").length;
  const next = `/projects/${id}`;

  return (
    <>
      <PageHeader
        title={project.title}
        back={
          goalData
            ? { href: `/goals/${goalData.goal.id}`, label: goalData.goal.title }
            : { href: area ? `/${area.key}` : "/goals", label: area ? areaName(t, area) : t("nav.goals") }
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-2">
            <Badge variant={project.status === "completed" ? "success" : project.status === "active" ? "default" : "secondary"}>
              {t(`planning.projectStatus.${project.status}`)}
            </Badge>
            {area && <span>{areaName(t, area)}</span>}
            {project.due_date && (
              <>
                <span>·</span>
                <span>{t("planning.due", { date: formatDay(project.due_date, locale, today) })}</span>
              </>
            )}
          </span>
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={`/projects/${id}/edit`}>
              <Pencil />
              {t("planning.edit")}
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("planning.tasks")}
              {counted.length > 0 && (
                <span className="text-muted-foreground text-sm font-normal">
                  {t("planning.tasksDone", { done, total: counted.length })}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {counted.length > 0 && <Progress value={done / counted.length} label={t("planning.progressTitle")} />}
            <TaskQuickAdd today={today} lifeAreaId={project.life_area_id} projectId={project.id} />
            {tasks.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("planning.noTasks")}</p>
            ) : (
              <ul className="divide-y">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} today={today} next={next} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {project.description && (
            <Card>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">{project.description}</p>
              </CardContent>
            </Card>
          )}
          <DeleteButton action={deleteProject} id={project.id} label={t("planning.deleteProject")} />
        </div>
      </div>
    </>
  );
}
