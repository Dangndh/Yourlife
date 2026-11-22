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

/** Minutes east of UTC for `timeZone` at instant `at`. */
function offsetMinutes(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - at.getTime()) / 60000);
}

/** "2026-11-22T08:30" typed by the user in `timeZone` → ISO instant. */
export function zonedLocalToIso(local: string, timeZone: string): string {
  const guess = new Date(`${local.length === 16 ? `${local}:00` : local}Z`);
  const first = offsetMinutes(guess, timeZone);
  const result = new Date(guess.getTime() - first * 60000);
  // Correct once more around DST switches.
  const second = offsetMinutes(result, timeZone);
  return second === first ? result.toISOString() : new Date(guess.getTime() - second * 60000).toISOString();
}

/** Calendar day (YYYY-MM-DD) of an instant in `timeZone`. */
export function dayOf(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(iso));
}

/** Start of a local day in `timeZone` as an ISO instant. */
export function startOfDayIso(day: string, timeZone: string): string {
  return zonedLocalToIso(`${day}T00:00`, timeZone);
}
