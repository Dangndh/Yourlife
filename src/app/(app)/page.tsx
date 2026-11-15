import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { LifeAreaSummary } from "@/core/types";
import { createClient } from "@/lib/supabase/server";
import { getModule } from "@/modules";

// Command Center: reads the view v_life_area_summary only (no stored copies).
export default async function HomePage() {
  const t = await getTranslations();
  const supabase = await createClient();
  const { data } = await supabase.from("v_life_area_summary").select("*").order("sort_order");
  const areas = (data ?? []) as LifeAreaSummary[];

  return (
    <>
      <PageHeader title={t("home.title")} subtitle={t("home.subtitle")} />
      {areas.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("home.empty")}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const mod = getModule(area.key);
            const Icon = mod?.icon;
            const name = mod ? t(`areas.${area.key}`) : area.name;
            return (
              <Link key={area.life_area_id} href={`/${area.key}`} className="group">
                <Card className="group-hover:border-foreground/20 h-full transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {Icon && <Icon className="size-4" />}
                      {name}
                    </CardTitle>
                    <CardDescription>
                      {area.last_score != null ? t("home.score", { value: area.last_score }) : t("home.noScore")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-muted-foreground flex flex-col gap-1 text-sm">
                    <span>{t("home.activeGoals", { count: area.active_goals })}</span>
                    {area.avg_goal_progress != null && (
                      <span>{t("home.progress", { value: Math.round(area.avg_goal_progress * 100) })}</span>
                    )}
                    <span>{t("home.logs7d", { count: area.logs_7d })}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
