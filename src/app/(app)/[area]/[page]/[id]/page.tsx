import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { getModule } from "@/modules";
import { moduleViews } from "@/modules/views";

type Props = {
  params: Promise<{ area: string; page: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props) {
  const { area, page } = await params;
  const sub = getModule(area)?.pages.find((p) => p.slug === page);
  if (!sub) return {};
  const t = await getTranslations();
  return { title: `${t(`pages.${sub.labelKey}`)} · ${t(`areas.${area}`)}` };
}

/** Detail page of a module record, e.g. /learning/courses/<id> (or /new). */
export default async function AreaDetailPage({ params, searchParams }: Props) {
  const { area, page, id } = await params;
  const View = moduleViews[area]?.detail[page];
  if (!View) notFound();
  return <View id={id} searchParams={await searchParams} />;
}
