import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { MetricForm } from "@/components/metrics/metric-form";
import { PageHeader } from "@/components/page-header";
import { metricName } from "@/core/metrics/format";
import { getMetric } from "@/core/metrics/queries";
import { getAreas } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("metrics");
  return { title: t("edit") };
}

export default async function EditMetricPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const t = await getTranslations();
  const [metric, areas] = await Promise.all([getMetric(id), getAreas()]);
  if (!metric) notFound();
  const name = metricName(t, metric);

  return (
    <>
      <PageHeader title={t("metrics.edit")} back={{ href: `/metrics/${id}`, label: name }} />
      <MetricForm metric={metric} displayName={name} areas={areas} cancelHref={`/metrics/${id}`} />
    </>
  );
}
