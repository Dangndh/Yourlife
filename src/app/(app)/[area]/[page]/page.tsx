import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";
import { getModule } from "@/modules";
import { moduleViews } from "@/modules/views";

type Props = {
  params: Promise<{ area: string; page: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { area, page } = await params;
  const sub = getModule(area)?.pages.find((p) => p.slug === page);
  if (!sub) return {};
  const t = await getTranslations();
  return { title: `${t(`pages.${sub.labelKey}`)} · ${t(`areas.${area}`)}` };
}

export default async function AreaSubPage({ params, searchParams }: Props) {
  const { area, page } = await params;
  const sub = getModule(area)?.pages.find((p) => p.slug === page);
  if (!sub) notFound();

  const View = moduleViews[area]?.pages[page];
  if (View) return <View searchParams={await searchParams} />;

  const t = await getTranslations();
  return <ComingSoon title={`${t(`areas.${area}`)} · ${t(`pages.${sub.labelKey}`)}`} />;
}
