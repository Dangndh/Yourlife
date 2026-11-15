import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoalProgress } from "@/core/types";
import { createClient } from "@/lib/supabase/server";
import { getModule } from "@/modules";

type Props = { params: Promise<{ area: string }> };

export async function generateMetadata({ params }: Props) {
  const { area } = await params;
  const t = await getTranslations("areas");
  return { title: getModule(area) ? t(area) : undefined };
}

// Module Overview: one layout shared by all 7 areas.
export default async function AreaPage({ params }: Props) {
  const { area } = await params;
  const mod = getModule(area);
  if (!mod) notFound();

  const t = await getTranslations();
  const supabase = await createClient();
  const { data: lifeArea } = await supabase.from("life_areas").select("id").eq("key", area).maybeSingle();
  const { data } = lifeArea
    ? await supabase
        .from("v_goal_progress")
        .select("goal_id, title, status, target_date, progress")
        .eq("life_area_id", lifeArea.id)
        .eq("status", "active")
    : { data: [] };
  const goals = (data ?? []) as GoalProgress[];

  return (
    <>
      <PageHeader title={t(`areas.${area}`)} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("module.goals")}</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("module.noGoals")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {goals.map((g) => (
                  <li key={g.goal_id} className="flex items-center justify-between gap-4 text-sm">
                    <span className="truncate">{g.title}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {g.progress != null ? `${Math.round(g.progress * 100)}%` : "–"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("module.subpages")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {mod.pages.map((p) => (
              <Link
                key={p.slug}
                href={`/${area}/${p.slug}`}
                className="hover:bg-accent rounded-md px-2 py-1.5 text-sm"
              >
                {t(`pages.${p.labelKey}`)}
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
