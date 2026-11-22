import { addDays } from "@/core/planning/dates";

export type PeriodType = "weekly" | "monthly";
export type Period = { type: PeriodType; start: string; end: string };

/** First day of the week containing `day`. weekStartsOn: 0 = Sunday … 6 = Saturday (1 = Monday). */
export function weekStart(day: string, weekStartsOn = 1) {
  const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((dow - weekStartsOn + 7) % 7));
}

function monthEnd(start: string) {
  const d = new Date(`${start}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

/** The week or month that contains `day`. */
export function periodFor(type: PeriodType, day: string, weekStartsOn = 1): Period {
  if (type === "weekly") {
    const start = weekStart(day, weekStartsOn);
    return { type, start, end: addDays(start, 6) };
  }
  const start = `${day.slice(0, 7)}-01`;
  return { type, start, end: monthEnd(start) };
}

/** The period just before `period`. */
export function previousPeriod(period: Period, weekStartsOn = 1): Period {
  return periodFor(period.type, addDays(period.start, -1), weekStartsOn);
}

/** "Nov 16 – 22" for a week, "November 2026" for a month. */
export function formatPeriod(period: Pick<Period, "type" | "start" | "end">, locale: string) {
  const d = (s: string) => new Date(`${s}T00:00:00Z`);
  if (period.type === "monthly") {
    return new Intl.DateTimeFormat(locale, { timeZone: "UTC", month: "long", year: "numeric" }).format(d(period.start));
  }
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", day: "numeric", month: "short" }).formatRange(
    d(period.start),
    d(period.end),
  );
}
