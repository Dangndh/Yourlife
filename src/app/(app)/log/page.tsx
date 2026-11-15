import { getTranslations } from "next-intl/server";

import { ComingSoon } from "@/components/coming-soon";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("log") };
}

export default async function Page() {
  const t = await getTranslations("nav");
  return <ComingSoon title={t("log")} />;
}
