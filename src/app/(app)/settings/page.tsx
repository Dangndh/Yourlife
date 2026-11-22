import { cookies } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Download } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { parseTheme, THEME_COOKIE, THEMES } from "@/lib/theme";

import { setLocale, setTheme } from "./actions";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("settings") };
}

export default async function SettingsPage() {
  const t = await getTranslations();
  const locale = await getLocale();
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
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
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
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
            <CardTitle>{t("settings.theme")}</CardTitle>
            <CardDescription>{t("settings.themeHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={setTheme} className="flex items-center gap-3">
              <select
                name="theme"
                defaultValue={theme}
                aria-label={t("settings.theme")}
                className="border-input bg-background h-9 rounded-md border px-3 text-sm"
              >
                {THEMES.map((th) => (
                  <option key={th} value={th}>
                    {t(`settings.themes.${th}`)}
                  </option>
                ))}
              </select>
              <Button type="submit" size="sm">
                {t("settings.save")}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.backup")}</CardTitle>
            <CardDescription>{t("settings.backupHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              {/* A plain link: the browser downloads the file. */}
              <a href="/settings/export" download>
                <Download />
                {t("settings.exportAll")}
              </a>
            </Button>
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
