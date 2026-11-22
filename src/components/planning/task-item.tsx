"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { setTaskDone } from "@/core/planning/actions";
import { formatDay } from "@/core/planning/dates";
import type { Task } from "@/core/types";
import { cn } from "@/lib/utils";

type Props = {
  task: Task;
  today: string;
  /** Path to come back to after editing. */
  next: string;
  /** Small grey labels, e.g. area or goal name. */
  meta?: string[];
};

export function TaskItem({ task, today, next, meta = [] }: Props) {
  const t = useTranslations("planning");
  const locale = useLocale();
  const [, startTransition] = useTransition();
  const [done, setDone] = useOptimistic(task.status === "done");

  const toggle = () =>
    startTransition(async () => {
      setDone(!done);
      await setTaskDone(task.id, !done);
    });

  const overdue = !done && task.due_date != null && task.due_date < today;
  const cancelled = task.status === "cancelled";

  return (
    <li className="flex items-start gap-3 py-2">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={done ? t("markUndone") : t("markDone")}
        onClick={toggle}
        disabled={cancelled}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          "focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]",
          done ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50 hover:border-foreground",
          task.priority === 1 && !done && "border-destructive",
        )}
      >
        {done && <Check className="size-3.5" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          href={`/tasks/${task.id}?next=${encodeURIComponent(next)}`}
          className={cn(
            "truncate text-sm hover:underline",
            (done || cancelled) && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </Link>
        {(meta.length > 0 || task.due_date || task.status === "doing") && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {task.status === "doing" && <Badge variant="outline">{t("taskStatus.doing")}</Badge>}
            {task.due_date && (
              <span className={cn(overdue && "text-destructive font-medium")}>
                {t("due", { date: formatDay(task.due_date, locale, today) })}
              </span>
            )}
            {meta.filter(Boolean).map((m) => (
              <span key={m} className="truncate">
                {m}
              </span>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
