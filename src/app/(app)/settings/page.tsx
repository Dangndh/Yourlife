import { getLocale, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

import { setLocale } from "./actions";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("currency").maybeSingle();

  return (
    <>
      <PageHeader title={t("nav.settings")} />
      <div className="flex max-w-xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.language")}</CardTitle>
            <CardDescription>{t("settings.languageHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={setLocale} className="flex items-center gap-3">
              <select
                name="locale"
                defaultValue={locale}
                className="border-input h-9 rounded-md border bg-transparent px-3 text-sm"
              >
                <option value="en">English</option>
                <option value="vi">Tiếng Việt</option>
              </select>
              <Button type="submit" size="sm">
                {t("settings.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.baseCurrency")}</CardTitle>
            <CardDescription>{t("settings.baseCurrencyHint")}</CardDescription>
          </CardHeader>
          <CardContent className="text-sm font-medium">{profile?.currency ?? "VND"}</CardContent>
        </Card>
      </div>
    </>
  );
}
