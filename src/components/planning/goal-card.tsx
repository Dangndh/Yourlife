import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDay } from "@/core/planning/dates";
import type { GoalProgressRow } from "@/core/types";

/** One goal with its auto-computed progress (from v_goal_progress). */
export function GoalRow({ goal, today, areaLabel }: { goal: GoalProgressRow; today: string; areaLabel?: string }) {
  const t = useTranslations("planning");
  const locale = useLocale();
  const pct = goal.progress != null ? Math.round(goal.progress * 100) : null;
  const behind =
    goal.status === "active" && goal.progress != null && goal.time_elapsed != null && goal.progress + 0.1 < goal.time_elapsed;
  const overdue = goal.status === "active" && goal.target_date != null && goal.target_date < today;

  return (
    <li>
      <Link href={`/goals/${goal.goal_id}`} className="hover:bg-accent/60 -mx-2 flex flex-col gap-2 rounded-md px-2 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <span className="truncate text-sm font-medium">{goal.title}</span>
          <span className="text-muted-foreground shrink-0 text-xs tabular-nums">{pct != null ? `${pct}%` : "–"}</span>
        </div>
        <Progress value={goal.progress} marker={goal.time_elapsed} label={goal.title} />
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {goal.status !== "active" && <Badge variant={goal.status === "achieved" ? "success" : "secondary"}>{t(`goalStatus.${goal.status}`)}</Badge>}
          {areaLabel && <span>{areaLabel}</span>}
          {goal.tasks_total > 0 && <span>{t("tasksDone", { done: goal.tasks_done, total: goal.tasks_total })}</span>}
          {goal.target_date && (
            <span className={overdue ? "text-destructive font-medium" : undefined}>
              {t("target", { date: formatDay(goal.target_date, locale, today) })}
            </span>
          )}
          {behind && <span className="text-amber-600 dark:text-amber-400">{t("behind")}</span>}
        </div>
      </Link>
    </li>
  );
}
