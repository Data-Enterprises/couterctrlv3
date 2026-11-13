// Utils
import { count, money } from "../utils";

// Interfaces
import type { PricePoint } from "../interfaces";

interface PriceChartProps {
  points: PricePoint[];
  weighed: boolean;
}

/**
 * Units sold at each price, in ten-cent steps.
 *
 * The ladder is exact and unshaped: thirteen rows, and the fact that four
 * fifths of the units went inside one dime takes adding up to see. Binned,
 * that shape is the picture — one tall bar and a scatter of stubs either
 * side, or two towers, which is a different week entirely.
 *
 * Bars are units, not money: the question is what customers actually paid,
 * and money would make a dear price with three sales look like a busy one.
 */
const PriceChart = ({ points, weighed }: PriceChartProps) => {
  if (points.length < 2) return null;

  /* A bar is how much went out at that price. On a scale item that is pounds,
     derived the same way the rows are — a bar counting rings would say four
     packages were four of something, when one of them was three times another. */
  const amount = (pt: PricePoint) =>
    weighed ? (pt.weight > 0 ? pt.weight : pt.units) : pt.units;

  const bins = new Map<number, number>();
  for (const p of points) {
    const k = Math.round(Math.floor(p.price * 10 + 1e-9)) / 10;
    bins.set(k, (bins.get(k) ?? 0) + amount(p));
  }
  const keys = [...bins.keys()].sort((x, y) => x - y);
  const lo = keys[0];
  const hi = keys[keys.length - 1] + 0.1;
  const tallest = Math.max(...bins.values());
  const widest = points.reduce(
    (m, p) => (amount(p) > amount(m) ? p : m),
    points[0],
  );
  const hot = Math.round(Math.floor(widest.price * 10 + 1e-9)) / 10;

  const W = 440;
  const H = 96;
  const base = H - 18;
  const span = Math.max(0.1, hi - lo);
  const at = (p: number) => ((p - lo) / span) * W;
  const bw = Math.max(3, W / (span * 10) - 2);

  /* Four marks across, whatever the span: a tick a bin would be forty of
     them on a department that rings in cents. */
  const ticks = [0, 1, 2, 3].map((i) => lo + (span * i) / 3);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Units sold at each price, in ten-cent steps. Most at ${money(widest.price)}.`}
    >
      <line
        x1={0}
        x2={W}
        y1={base}
        y2={base}
        className="stroke-brand_navy/20"
      />
      {keys.map((k) => {
        const u = bins.get(k) ?? 0;
        const h = Math.max(2, (u / tallest) * (base - 6));
        return (
          <rect
            key={k}
            x={at(k) + 1}
            y={base - h}
            width={bw}
            height={h}
            rx={2}
            className={k === hot ? "fill-brand_navy" : "fill-brand_navy/35"}
          >
            <title>
              {money(k)}–{money(k + 0.09)} ·{" "}
              {weighed
                ? `${u.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} lb`
                : `${count(u)} qty`}
            </title>
          </rect>
        );
      })}
      {ticks.map((t, i) => (
        <text
          key={i}
          x={Math.min(W - 2, Math.max(2, at(t)))}
          y={H - 4}
          textAnchor={i === 0 ? "start" : i === 3 ? "end" : "middle"}
          className="fill-content/85 text-[9px]"
        >
          {money(t)}
        </text>
      ))}
    </svg>
  );
};

export default PriceChart;
