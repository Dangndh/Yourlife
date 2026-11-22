import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { DeleteButton } from "@/components/planning/delete-button";
import { TaskForm } from "@/components/planning/task-form";
import { deleteTask } from "@/core/planning/actions";
import { getAreas, getGoal, getGoalOptions, getProject, getProjectOptions, getTask } from "@/core/planning/queries";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ next?: string }> };

export async function generateMetadata() {
  const t = await getTranslations("planning");
  return { title: t("editTask") };
}

export default async function TaskPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { next: rawNext } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();
  const next = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/tasks";

  const t = await getTranslations();
  const [task, areas, goals, projects] = await Promise.all([
    getTask(id),
    getAreas(),
    getGoalOptions(),
    getProjectOptions(),
  ]);
  if (!task) notFound();
  // Keep the current goal/project selectable even if it is no longer open.
  const [currentGoal, currentProject] = await Promise.all([
    task.goal_id && !goals.some((g) => g.id === task.goal_id) ? getGoal(task.goal_id) : null,
    task.project_id && !projects.some((p) => p.id === task.project_id) ? getProject(task.project_id) : null,
  ]);
  const goalOptions = currentGoal ? [currentGoal.goal, ...goals] : goals;
  const projectOptions = currentProject ? [currentProject, ...projects] : projects;

  return (
    <>
      <PageHeader title={t("planning.editTask")} back={{ href: next, label: t("planning.back") }} />
      <div className="flex flex-col gap-8">
        <TaskForm task={task} areas={areas} goalOptions={goalOptions} projectOptions={projectOptions} next={next} />
        <DeleteButton action={deleteTask} id={task.id} next={next} label={t("planning.deleteTask")} />
      </div>
    </>
  );
}
