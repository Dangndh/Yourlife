import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { PageHeader } from "@/components/page-header";
import { GoalForm } from "@/components/planning/goal-form";
import { metricOptions } from "@/core/metrics/format";
import { getMetrics } from "@/core/metrics/queries";
import { getAreas, getGoal, getGoalOptions } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("planning");
  return { title: t("editGoal") };
}

export default async function EditGoalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const [data, areas, goals, metrics] = await Promise.all([getGoal(id), getAreas(), getGoalOptions(), getMetrics({ includeArchived: true })]);
  if (!data) notFound();

  return (
    <>
      <PageHeader title={t("planning.editGoal")} back={{ href: `/goals/${id}`, label: data.goal.title }} />
      <GoalForm
        goal={data.goal}
        areas={areas}
        parentOptions={goals.filter((g) => g.id !== id)}
        metricOptions={metricOptions(
          t,
          metrics.filter((m) => !m.is_archived || m.id === data.goal.metric_id),
        )}
        cancelHref={`/goals/${id}`}
      />
    </>
  );
}
