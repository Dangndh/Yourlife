import type { MetricPoint } from "@/core/metrics/types";

type Target = { label: string; value: number };

const H = 220;
const PAD = { l: 56, r: 16, t: 16, b: 28 };

function scale(points: MetricPoint[], targets: Target[], W: number) {
  const xs = points.map((p) => Date.parse(p.period_start));
  const ys = [...points.map((p) => p.value), ...targets.map((t) => t.value)];
  let lo = Math.min(...ys);
  let hi = Math.max(...ys);
  if (lo === hi) {
    lo -= Math.abs(lo) * 0.1 || 1;
    hi += Math.abs(hi) * 0.1 || 1;
  }
  const pad = (hi - lo) * 0.1;
  lo -= pad;
  hi += pad;
  const x0 = Math.min(...xs);
  const x1 = Math.max(...xs);
  const X = (d: string) =>
    x1 === x0 ? (PAD.l + W - PAD.r) / 2 : PAD.l + ((Date.parse(d) - x0) / (x1 - x0)) * (W - PAD.l - PAD.r);
  const Y = (v: number) => PAD.t + (1 - (v - lo) / (hi - lo)) * (H - PAD.t - PAD.b);
  return { X, Y, lo, hi };
}

type ChartProps = {
  points: MetricPoint[];
  targets?: Target[];
  format: (v: number) => string;
  formatDate: (d: string) => string;
  label: string;
};

/**
 * Line chart of one metric over time, with dashed lines for goal targets. Server-rendered SVG.
 * Drawn twice (narrow for phones, wide from sm up) so the labels keep a readable size.
 */
export function MetricChart(props: ChartProps) {
  return (
    <>
      <ChartSvg {...props} W={360} className="sm:hidden" />
      <ChartSvg {...props} W={640} className="hidden sm:block" />
    </>
  );
}

function ChartSvg({
  points,
  targets = [],
  format,
  formatDate,
  label,
  W,
  className,
}: ChartProps & { W: number; className: string }) {
  const { X, Y, lo, hi } = scale(points, targets, W);
  const ticks = [lo + (hi - lo) * 0.1, (lo + hi) / 2, hi - (hi - lo) * 0.1];
  const path = points.map((p, i) => `${i ? "L" : "M"}${X(p.period_start).toFixed(1)} ${Y(p.value).toFixed(1)}`).join("");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className={`h-auto w-full ${className}`}>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={Y(v)} y2={Y(v)} className="stroke-border" strokeWidth={1} />
          <text x={PAD.l - 8} y={Y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
            {format(v)}
          </text>
        </g>
      ))}
      {targets.map((t) => (
        <g key={`${t.label}-${t.value}`}>
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={Y(t.value)}
            y2={Y(t.value)}
            className="stroke-emerald-600 dark:stroke-emerald-400"
            strokeWidth={1.25}
            strokeDasharray="5 4"
          />
          <text x={W - PAD.r} y={Y(t.value) - 6} textAnchor="end" className="fill-emerald-700 text-[11px] dark:fill-emerald-400">
            {t.label} · {format(t.value)}
          </text>
        </g>
      ))}
      {points.length > 1 && <path d={path} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" />}
      {points.map((p) => (
        <circle key={p.period_start} cx={X(p.period_start)} cy={Y(p.value)} r={points.length > 40 ? 2 : 3.5} className="fill-primary">
          <title>{`${formatDate(p.period_start)}: ${format(p.value)}`}</title>
        </circle>
      ))}
      <text x={PAD.l} y={H - 8} className="fill-muted-foreground text-[11px]">
        {formatDate(points[0].period_start)}
      </text>
      {points.length > 1 && (
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="fill-muted-foreground text-[11px]">
          {formatDate(points.at(-1)!.period_start)}
        </text>
      )}
    </svg>
  );
}

/** Tiny trend line for cards. */
export function Sparkline({ points, className }: { points: MetricPoint[]; className?: string }) {
  if (points.length < 2) return null;
  const w = 96;
  const h = 28;
  const vs = points.map((p) => p.value);
  const lo = Math.min(...vs);
  const hi = Math.max(...vs);
  const d = points
    .map((p, i) => {
      const x = (i / (points.length - 1)) * (w - 4) + 2;
      const y = hi === lo ? h / 2 : 2 + (1 - (p.value - lo) / (hi - lo)) * (h - 4);
      return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join("");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} aria-hidden="true" className={className} width={w} height={h}>
      <path d={d} fill="none" className="stroke-primary" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
