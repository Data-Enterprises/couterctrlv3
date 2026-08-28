import { hueFor } from "../../typeColour";
import type { StackCategory } from "./chartsModel";

/**
 * One chart, three uses: per shift, per hour, per weekday.
 *
 * Hand-rolled SVG rather than a charting library. What this needs is a 2px
 * surface gap between stacked segments, a reference line whose label sits in
 * the right gutter outside the plot, and colours that come from the app's own
 * tokens — three things that all fight a library's defaults harder than
 * writing the scales out costs.
 *
 * Marks, deliberately:
 *  - the gap between segments is a GAP, not a stroke around each mark, so a
 *    one-count segment stays its own colour instead of turning into an outline
 *  - gridlines are solid hairlines, never dashed
 *  - only the tallest bar is labelled; labelling every one turns the axis into
 *    noise and hides the peak it exists to show
 */
interface Props {
  categories: StackCategory[];
  /** Stacking order, fixed. Never sorted by volume — a stack that reorders
   *  itself between two cashiers cannot be compared across them. */
  types: string[];
  reference?: { value: number; label: string };
  width?: number;
  height?: number;
  barWidth?: number;
  label: string;
}

const PAD = { top: 16, right: 12, bottom: 26, left: 28 };
const SEGMENT_GAP = 2;

const StackedBarChart = ({
  categories,
  types,
  reference,
  width = 820,
  height = 196,
  barWidth = 28,
  label,
}: Props) => {
  if (categories.length === 0) return null;

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const peak = Math.max(...categories.map((c) => c.total), 1);
  const ceiling = Math.max(Math.ceil(peak / 5) * 5, 5);
  const y = (v: number) => PAD.top + innerH - (v / ceiling) * innerH;

  const step = innerW / categories.length;
  const bw = Math.min(barWidth, step * 0.62);
  const hasSublabel = categories.some((c) => c.sublabel);

  return (
    <div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        {categories.map((c, i) =>
          c.band ? (
            <rect
              key={`band-${c.key}`}
              x={PAD.left + i * step}
              y={PAD.top - 6}
              width={step}
              height={innerH + 6}
              className="fill-row_stripe"
            />
          ) : null,
        )}

        {[0, 1, 2, 3, 4].map((g) => {
          const v = (ceiling * g) / 4;
          return (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(v)}
                y2={y(v)}
                stroke="currentColor"
                strokeWidth={1}
                className="text-gray-200"
              />
              <text
                x={PAD.left - 5}
                y={y(v) + 3}
                textAnchor="end"
                fontSize={8.5}
                className="fill-content/85"
              >
                {v}
              </text>
            </g>
          );
        })}

        {reference && reference.value > 0 && (
          <line
            x1={PAD.left}
            x2={width - PAD.right}
            y1={y(reference.value)}
            y2={y(reference.value)}
            stroke="currentColor"
            strokeWidth={1.5}
            className="text-content/60"
          />
        )}

        {categories.map((c, i) => {
          const x = PAD.left + i * step + (step - bw) / 2;
          let acc = 0;
          return (
            <g key={c.key}>
              {types.map((t) => {
                const n = c.counts[t] ?? 0;
                if (n === 0) return null;
                const top = y(acc + n);
                const h = Math.max(1, y(acc) - top - SEGMENT_GAP);
                acc += n;
                return (
                  <rect
                    key={t}
                    x={x}
                    y={top}
                    width={bw}
                    height={h}
                    rx={2}
                    fill={hueFor(t)}
                  >
                    <title>{`${c.label} · ${t}: ${n}`}</title>
                  </rect>
                );
              })}

              {c.total === peak && c.total > 0 && (
                <text
                  x={x + bw / 2}
                  y={y(c.total) - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={600}
                  className="fill-content"
                >
                  {c.total}
                </text>
              )}

              <text
                x={x + bw / 2}
                y={height - (hasSublabel ? 13 : 8)}
                textAnchor="middle"
                fontSize={9.5}
                fontWeight={c.emphasis ? 700 : 400}
                className="fill-content/85"
              >
                {c.label}
              </text>
              {c.sublabel && (
                <text
                  x={x + bw / 2}
                  y={height - 3}
                  textAnchor="middle"
                  fontSize={8.5}
                  className="fill-content/85"
                >
                  {c.sublabel}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {reference && reference.value > 0 && (
        // Outside the plot, so it can never sit on top of a bar.
        <div className="text-right pr-1 -mt-1.5 text-[9px] text-content/85">
          {reference.label}
        </div>
      )}
    </div>
  );
};

export default StackedBarChart;
