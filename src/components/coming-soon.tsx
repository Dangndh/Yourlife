import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function ComingSoon({ title }: { title: string }) {
  const t = await getTranslations("comingSoon");
  return (
    <>
      <PageHeader title={title} />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}
