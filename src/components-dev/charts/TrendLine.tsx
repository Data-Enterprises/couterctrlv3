export interface TrendSeries {
  id: string;
  /** Any CSS colour. Series are periods, not verdicts, so avoid the severity
   *  palette here — a line is not good or bad, the comparison is. */
  color: string;
  /** One entry per label. `null` breaks the line rather than dropping it to
   *  the floor, which is the honest rendering of "no figure for this point". */
  points: (number | null)[];
  /** Draws the line dashed. Two series distinguished only by shade become
   *  indistinguishable exactly where they cross, which is the moment worth
   *  reading — dash carries the difference where colour alone fails. */
  dashed?: boolean;
}

/**
 * Tick values on round numbers spanning the data.
 *
 * Interpolating between the exact min and max gives ticks like $16.1K and
 * $20.7K, which are precise and unreadable: an axis exists to be glanced at,
 * and no one holds an odd number in their head while comparing two lines.
 */
const niceTicks = (min: number, max: number, count: number): number[] => {
  const span = max - min || Math.abs(max) || 1;
  const rawStep = span / Math.max(1, count - 1);
  const mag = 10 ** Math.floor(Math.log10(rawStep));
  const norm = rawStep / mag;
  const step = (norm > 5 ? 10 : norm > 2 ? 5 : norm > 1 ? 2 : 1) * mag;

  const first = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = first; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks.length >= 2 ? ticks : [min, max];
};

interface TrendLineProps {
  series: TrendSeries[];
  labels: string[];
  /** Drawing height in viewBox units; the SVG scales to its container width
   *  and this sets the aspect ratio. */
  height?: number;
  /** Y-axis tick text. */
  formatValue?: (v: number) => string;
  /** Hover text for a point. */
  formatPoint?: (seriesId: string, i: number, v: number) => string;
  tickCount?: number;
}

const W = 620;
const PAD_L = 62;
const PAD_R = 12;
const PAD_T = 22;
const PAD_B = 26;

/**
 * A small multi-series line chart, drawn as plain SVG.
 *
 * Deliberately not a charting library. The tracker needs one shape — a few
 * series over a few labelled points — and a library brings a layout engine, a
 * theme system and a legend renderer to do it, none of which match the app's
 * type scale without being fought. This takes the app's own colours and sizes
 * as arguments instead.
 *
 * Scaling is uniform: one `viewBox`, default `preserveAspectRatio`, so text and
 * strokes keep their proportions at any container width. Stretching the
 * drawing to fill and then correcting the text is the version of this that
 * looks fine until somebody resizes the panel.
 *
 * The y-axis is padded rather than zero-based. Two periods a few percent apart
 * are indistinguishable on a zero-based axis, and telling them apart is the
 * whole reason the chart is here — the tick labels state the range, so the
 * scale is never left implied.
 */
const TrendLine = ({
  series,
  labels,
  height = 190,
  formatValue = (v) => String(Math.round(v)),
  formatPoint,
  tickCount = 4,
}: TrendLineProps) => {
  const values = series
    .flatMap((s) => s.points)
    .filter((v): v is number => v !== null);

  if (values.length === 0 || labels.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-[11px] text-content">
        Nothing to plot for this period
      </div>
    );
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // A flat series would collapse the scale onto a single line; give it room.
  const pad =
    rawMax === rawMin ? Math.abs(rawMax || 1) * 0.1 : (rawMax - rawMin) * 0.15;
  const min = rawMin - pad;
  const max = rawMax + pad;

  const x = (i: number) =>
    labels.length === 1
      ? PAD_L + (W - PAD_L - PAD_R) / 2
      : PAD_L + (i * (W - PAD_L - PAD_R)) / (labels.length - 1);
  const y = (v: number) =>
    PAD_T + ((max - v) / (max - min)) * (height - PAD_T - PAD_B);

  const ticks = niceTicks(min, max, tickCount);

  /** Contiguous runs of present points, so a gap breaks the line. */
  const runsOf = (points: (number | null)[]) => {
    const runs: { i: number; v: number }[][] = [];
    let run: { i: number; v: number }[] = [];
    points.forEach((v, i) => {
      if (v === null) {
        if (run.length) runs.push(run);
        run = [];
      } else run.push({ i, v });
    });
    if (run.length) runs.push(run);
    return runs;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label={`${series.map((s) => s.id).join(" and ")} across ${labels.join(", ")}`}
    >
      {ticks.map((t, i) => (
        <g key={`t${i}`}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(t)}
            y2={y(t)}
            stroke="currentColor"
            strokeWidth={1}
            className="text-gray-200"
          />
          <text
            x={PAD_L - 8}
            y={y(t) + 3.5}
            textAnchor="end"
            fontSize={10}
            className="fill-content"
          >
            {formatValue(t)}
          </text>
        </g>
      ))}

      {/* Legend on the top edge, clear of the plot rather than over it. */}
      {series.map((s, si) => (
        <g key={`l${s.id}`}>
          {/* The swatch is a line segment, not a dot, so the legend shows the
              dash pattern that tells the two series apart. */}
          <line
            x1={PAD_L + si * 104}
            x2={PAD_L + si * 104 + 18}
            y1={PAD_T - 11}
            y2={PAD_T - 11}
            stroke={s.color}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "5 4" : undefined}
            strokeLinecap="round"
          />
          <text
            x={PAD_L + si * 104 + 24}
            y={PAD_T - 7.5}
            fontSize={10}
            className="fill-content"
          >
            {s.id}
          </text>
        </g>
      ))}

      {series.map((s) => (
        <g key={s.id}>
          {runsOf(s.points).map((r, ri) => (
            <polyline
              key={ri}
              points={r.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth={2}
              strokeDasharray={s.dashed ? "5 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
          {s.points.map((v, i) =>
            v === null ? null : (
              <circle key={i} cx={x(i)} cy={y(v)} r={3} fill={s.color}>
                {formatPoint && <title>{formatPoint(s.id, i, v)}</title>}
              </circle>
            ),
          )}
        </g>
      ))}

      {labels.map((l, i) => (
        <text
          key={l + i}
          x={x(i)}
          y={height - 7}
          textAnchor="middle"
          fontSize={10}
          className="fill-content"
        >
          {l}
        </text>
      ))}
    </svg>
  );
};

export default TrendLine;
