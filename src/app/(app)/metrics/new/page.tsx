import { getTranslations } from "next-intl/server";

import { MetricForm } from "@/components/metrics/metric-form";
import { PageHeader } from "@/components/page-header";
import { getAreas } from "@/core/planning/queries";

export async function generateMetadata() {
  const t = await getTranslations("metrics");
  return { title: t("new") };
}

export default async function NewMetricPage({ searchParams }: { searchParams: Promise<{ area?: string }> }) {
  const { area } = await searchParams;
  const t = await getTranslations();
  const areas = await getAreas();
  const defaultArea = areas.find((a) => a.key === area);
  const back = defaultArea ? `/${defaultArea.key}` : "/metrics";

  return (
    <>
      <PageHeader
        title={t("metrics.new")}
        subtitle={t("metrics.newHint")}
        back={{ href: back, label: defaultArea ? t(`areas.${defaultArea.key}`) : t("nav.metrics") }}
      />
      <MetricForm areas={areas} defaultAreaId={defaultArea?.id} cancelHref={back} />
    </>
  );
}
