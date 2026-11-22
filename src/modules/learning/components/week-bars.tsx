/** Bar chart of study hours per week. Plain HTML, so it scales and themes well. */
export function WeekBars({
  weeks,
  formatWeek,
  formatHours,
  label,
}: {
  weeks: { start: string; minutes: number }[];
  formatWeek: (start: string) => string;
  formatHours: (minutes: number) => string;
  label: string;
}) {
  const max = Math.max(60, ...weeks.map((w) => w.minutes));
  return (
    <div role="img" aria-label={label} className="flex h-36 items-end gap-1.5">
      {weeks.map((w, i) => (
        <div key={w.start} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1" title={`${formatWeek(w.start)}: ${formatHours(w.minutes)}`}>
          {w.minutes > 0 && <span className="text-muted-foreground text-[10px] tabular-nums">{Math.round((w.minutes / 60) * 10) / 10}</span>}
          <div
            className={i === weeks.length - 1 ? "bg-primary w-full rounded-t" : "bg-primary/40 w-full rounded-t"}
            style={{ height: `${Math.max(w.minutes ? 4 : 1, (w.minutes / max) * 100)}%` }}
          />
          {/* Every other label (counting back from this week) so they never wrap. */}
          <span className="text-muted-foreground hidden h-3 text-[10px] leading-3 whitespace-nowrap sm:block">
            {(weeks.length - 1 - i) % 2 === 0 ? formatWeek(w.start) : ""}
          </span>
        </div>
      ))}
    </div>
  );
}
