import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";

import { JournalEditor } from "@/components/journal/journal-editor";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDailyEntry, getRecentEntries } from "@/core/journal/queries";
import { addDays, formatDay } from "@/core/planning/dates";
import { getToday } from "@/core/planning/queries";
import { cn } from "@/lib/utils";

type Props = { params: Promise<{ date: string }> };

export async function generateMetadata() {
  const t = await getTranslations("nav");
  return { title: t("journal") };
}

export default async function JournalDayPage({ params }: Props) {
  const { date } = await params;
  if (!z.iso.date().safeParse(date).success) notFound();
  const today = await getToday();
  if (date > today) redirect(`/journal/${today}`);

  const t = await getTranslations();
  const locale = await getLocale();
  const [entry, recent] = await Promise.all([getDailyEntry(date), getRecentEntries(30)]);

  const long = new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));

  return (
    <>
      <PageHeader
        title={date === today ? t("journal.today") : long}
        subtitle={date === today ? long : undefined}
        actions={
          <>
            <Button asChild variant="outline" size="icon" aria-label={t("journal.prevDay")}>
              <Link href={`/journal/${addDays(date, -1)}`}>
                <ChevronLeft />
              </Link>
            </Button>
            {date < today ? (
              <Button asChild variant="outline" size="icon" aria-label={t("journal.nextDay")}>
                <Link href={`/journal/${addDays(date, 1)}`}>
                  <ChevronRight />
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="icon" disabled aria-label={t("journal.nextDay")}>
                <ChevronRight />
              </Button>
            )}
            {date !== today && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/journal/${today}`}>{t("journal.today")}</Link>
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>
            {/* key: a fresh editor per day */}
            <JournalEditor key={date} date={date} entry={entry} />
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("journal.recent")}</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("journal.noEntries")}</p>
            ) : (
              <ul className="flex flex-col">
                {recent.map((e) => (
                  <li key={e.id}>
                    <Link
                      href={`/journal/${e.entry_date}`}
                      aria-current={e.entry_date === date ? "page" : undefined}
                      className={cn(
                        "hover:bg-accent/60 -mx-2 flex flex-col gap-0.5 rounded-md px-2 py-2",
                        e.entry_date === date && "bg-accent",
                      )}
                    >
                      <span className="flex items-center justify-between gap-2 text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                          {formatDay(e.entry_date, locale, today)}
                          {e.is_private && <Lock className="text-muted-foreground size-3" />}
                        </span>
                        <span className="text-muted-foreground text-xs font-normal tabular-nums">
                          {e.mood != null && t("journal.moodShort", { value: e.mood })}
                          {e.mood != null && e.energy != null && " · "}
                          {e.energy != null && t("journal.energyShort", { value: e.energy })}
                        </span>
                      </span>
                      {e.body && <span className="text-muted-foreground line-clamp-2 text-xs">{e.body}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
