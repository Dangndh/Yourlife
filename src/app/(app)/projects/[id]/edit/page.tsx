import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/planning/project-form";
import { getAreas, getGoalOptions, getProject } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("planning");
  return { title: t("editProject") };
}

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const [project, areas, goals] = await Promise.all([getProject(id), getAreas(), getGoalOptions()]);
  if (!project) notFound();

  return (
    <>
      <PageHeader title={t("planning.editProject")} back={{ href: `/projects/${id}`, label: project.title }} />
      <ProjectForm project={project} areas={areas} goalOptions={goals} cancelHref={`/projects/${id}`} />
    </>
  );
}
