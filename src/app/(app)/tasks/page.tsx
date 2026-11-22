import { getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/page-header";
import { areaName } from "@/components/planning/area-name";
import { TaskItem } from "@/components/planning/task-item";
import { TaskQuickAdd } from "@/components/planning/task-quick-add";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addDays } from "@/core/planning/dates";
import {
  getAreas,
  getGoalOptions,
  getProjectOptions,
  getTasks,
  getTimeZone,
  getToday,
} from "@/core/planning/queries";
import type { Task } from "@/core/types";

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("tasks") };
}

/** Earliest of "do on" and "due" dates: decides which Today section a task falls in. */
function whenOf(task: Task) {
  const dates = [task.scheduled_for, task.due_date].filter((d): d is string => !!d);
  return dates.length ? dates.sort()[0] : null;
}

// Today view: overdue → today → next 7 days → someday, plus what was finished today.
export default async function TasksPage() {
  const t = await getTranslations();
  const [areas, goals, projects, today, timeZone] = await Promise.all([
    getAreas(),
    getGoalOptions(),
    getProjectOptions(),
    getToday(),
    getTimeZone(),
  ]);
  const [open, recentDone] = await Promise.all([
    getTasks({ open: true }),
    // From yesterday 00:00 UTC: covers "today" in any time zone; filtered precisely below.
    getTasks({ doneSince: `${addDays(today, -1)}T00:00:00Z` }),
  ]);

  const weekEnd = addDays(today, 7);
  const overdue: Task[] = [];
  const dueToday: Task[] = [];
  const upcoming: Task[] = [];
  const someday: Task[] = [];
  for (const task of open) {
    const when = whenOf(task);
    if (!when) someday.push(task);
    else if (when < today) overdue.push(task);
    else if (when === today) dueToday.push(task);
    else if (when <= weekEnd) upcoming.push(task);
  }
  const later = open.length - overdue.length - dueToday.length - upcoming.length - someday.length;
  const doneToday = recentDone.filter((task) => task.completed_at && dayIn(task.completed_at, timeZone) === today);
  upcoming.sort((a, b) => (whenOf(a)! < whenOf(b)! ? -1 : 1));

  const meta = (task: Task) => {
    const parts = [areaName(t, areas.find((a) => a.id === task.life_area_id))];
    const parent = task.project_id
      ? projects.find((p) => p.id === task.project_id)?.title
      : task.goal_id
        ? goals.find((g) => g.id === task.goal_id)?.title
        : undefined;
    if (parent) parts.push(parent);
    return parts;
  };

  const section = (key: string, items: Task[], opts: { danger?: boolean; empty?: string } = {}) =>
    items.length === 0 && !opts.empty ? null : (
      <Card key={key}>
        <CardHeader>
          <CardTitle className={opts.danger ? "text-destructive" : undefined}>
            {t(`planning.today.${key}`)}
            <span className="text-muted-foreground ml-2 text-sm font-normal">{items.length || ""}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground text-sm">{opts.empty}</p>
          ) : (
            <ul className="divide-y">
              {items.map((task) => (
                <TaskItem key={task.id} task={task} today={today} next="/tasks" meta={meta(task)} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );

  return (
    <>
      <PageHeader title={t("planning.today.title")} subtitle={t("planning.today.subtitle")} />
      <div className="flex max-w-3xl flex-col gap-4">
        <Card>
          <CardContent>
            <TaskQuickAdd today={today} areas={areas} defaultWhen="today" />
          </CardContent>
        </Card>
        {section("overdue", overdue, { danger: true })}
        {section("today", dueToday, { empty: t("planning.today.allClear") })}
        {section("upcoming", upcoming)}
        {section("someday", someday)}
        {section("doneToday", doneToday)}
        {later > 0 && <p className="text-muted-foreground text-sm">{t("planning.today.later", { count: later })}</p>}
      </div>
    </>
  );
}

function dayIn(iso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
}
