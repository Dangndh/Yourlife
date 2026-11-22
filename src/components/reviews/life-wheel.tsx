/** Radar chart of 1–10 scores per life area. Pure SVG: works in server and client components. */
export function LifeWheel({
  axes,
  label,
  size = 320,
  className,
}: {
  axes: { label: string; value: number | null; previous?: number | null }[];
  label: string;
  size?: number;
  className?: string;
}) {
  const c = size / 2;
  const r = size / 2 - 36; // room for labels above and below; the sides get extra viewBox space
  const n = axes.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const pt = (i: number, v: number) => [c + Math.cos(angle(i)) * (r * v) / 10, c + Math.sin(angle(i)) * (r * v) / 10];
  const poly = (vals: (number | null | undefined)[]) => vals.map((v, i) => pt(i, v ?? 0).map((x) => x.toFixed(1)).join(",")).join(" ");
  const hasPrev = axes.some((a) => a.previous != null);
  const hasNow = axes.some((a) => a.value != null);

  return (
    <svg viewBox={`-70 0 ${size + 140} ${size}`} role="img" aria-label={label} className={className ?? "mx-auto h-auto w-full max-w-sm"}>
      {[2, 4, 6, 8, 10].map((ring) => (
        <polygon key={ring} points={poly(axes.map(() => ring))} fill="none" className="stroke-border" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, 10);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} className="stroke-border" strokeWidth={1} />;
      })}
      {hasPrev && (
        <polygon
          points={poly(axes.map((a) => a.previous))}
          fill="none"
          className="stroke-muted-foreground"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}
      {hasNow && (
        <polygon points={poly(axes.map((a) => a.value))} className="fill-primary/15 stroke-primary" strokeWidth={2} strokeLinejoin="round" />
      )}
      {axes.map((a, i) => {
        if (a.value == null) return null;
        const [x, y] = pt(i, a.value);
        return <circle key={i} cx={x} cy={y} r={4} className="fill-primary" />;
      })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 10);
        const cos = Math.cos(angle(i));
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        const dx = anchor === "start" ? 6 : anchor === "end" ? -6 : 0;
        const dy = Math.sin(angle(i)) < -0.5 ? -8 : Math.sin(angle(i)) > 0.5 ? 16 : 4;
        return (
          <text key={i} x={x + dx} y={y + dy} textAnchor={anchor} className="fill-foreground text-[14px]">
            {a.label}
            {a.value != null && <tspan className="fill-muted-foreground"> {a.value}</tspan>}
          </text>
        );
      })}
    </svg>
  );
}
