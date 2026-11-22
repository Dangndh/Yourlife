import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { ProjectForm } from "@/components/planning/project-form";
import { getAreas, getGoalOptions } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("planning");
  return { title: t("newProject") };
}

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string; area?: string }>;
}) {
  const { goal, area } = await searchParams;
  const t = await getTranslations();
  const [areas, goals] = await Promise.all([getAreas(), getGoalOptions()]);
  const parentGoal = goals.find((g) => g.id === goal);
  const defaultArea = areas.find((a) => a.key === area) ?? areas.find((a) => a.id === parentGoal?.life_area_id);
  const back = parentGoal ? { href: `/goals/${parentGoal.id}`, label: parentGoal.title } : { href: "/goals", label: t("nav.goals") };

  return (
    <>
      <PageHeader title={t("planning.newProject")} back={back} />
      <ProjectForm
        areas={areas}
        goalOptions={goals}
        defaultGoalId={parentGoal?.id}
        defaultAreaId={defaultArea?.id}
        cancelHref={back.href}
      />
    </>
  );
}
