import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { getModule } from "@/modules";

type Props = { params: Promise<{ area: string; page: string }> };

export default async function AreaSubPage({ params }: Props) {
  const { area, page } = await params;
  const sub = getModule(area)?.pages.find((p) => p.slug === page);
  if (!sub) notFound();

  const t = await getTranslations();
  return <ComingSoon title={`${t(`areas.${area}`)} · ${t(`pages.${sub.labelKey}`)}`} />;
}
