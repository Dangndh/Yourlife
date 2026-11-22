import { cn } from "@/lib/utils";

/** Progress bar. `value` is 0..1 (null = unknown). `marker` (0..1) draws a thin line, e.g. time elapsed. */
function Progress({
  value,
  marker,
  className,
  label,
}: {
  value: number | null;
  marker?: number | null;
  className?: string;
  label?: string;
}) {
  const pct = value == null ? 0 : Math.round(Math.min(Math.max(value, 0), 1) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value == null ? undefined : pct}
      className={cn("bg-secondary relative h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div className="bg-primary h-full rounded-full transition-[width]" style={{ width: `${pct}%` }} />
      {marker != null && (
        <div
          className="bg-foreground/50 absolute inset-y-0 w-0.5"
          style={{ left: `${Math.round(Math.min(Math.max(marker, 0), 1) * 100)}%` }}
        />
      )}
    </div>
  );
}

export { Progress };
