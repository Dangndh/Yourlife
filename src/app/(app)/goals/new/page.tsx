import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { GoalForm } from "@/components/planning/goal-form";
import { getAreas, getGoalOptions } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("planning");
  return { title: t("newGoal") };
}

export default async function NewGoalPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  const t = await getTranslations();
  const [areas, goals] = await Promise.all([getAreas(), getGoalOptions()]);
  const defaultArea = areas.find((a) => a.key === area);

  return (
    <>
      <PageHeader
        title={t("planning.newGoal")}
        back={defaultArea ? { href: `/${defaultArea.key}`, label: t(`areas.${defaultArea.key}`) } : { href: "/goals", label: t("nav.goals") }}
      />
      <GoalForm
        areas={areas}
        parentOptions={goals}
        defaultAreaId={defaultArea?.id}
        cancelHref={defaultArea ? `/${defaultArea.key}` : "/goals"}
      />
    </>
  );
}
