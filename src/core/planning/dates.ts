/** Dates are stored as 'YYYY-MM-DD' (Postgres date). These helpers never shift them by time zone. */

/** Today's date in the given IANA time zone, as YYYY-MM-DD. */
export function todayIn(timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  }
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Short display, e.g. "Nov 22" / "22 thg 11". Adds the year when it is not the current one. */
export function formatDay(date: string, locale: string, today?: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const sameYear = today ? today.slice(0, 4) === date.slice(0, 4) : true;
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(d);
}
