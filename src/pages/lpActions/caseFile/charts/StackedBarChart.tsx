import { useEffect, useState } from "react";
import { hueFor } from "../../typeColour";
import type { StackCategory } from "./chartsModel";

/**
 * One chart, two uses: by weekday and by hour.
 *
 * Sized by its container rather than by a constant — `ChartCard` measures the
 * space left over and hands it down, so the same chart fills a large monitor
 * and still fits a laptop. Floors below stop a squeezed panel from collapsing
 * it into an unreadable sliver; past those it scrolls instead.
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
 *
 * The columns grow out of the axis on first draw, and again whenever the data
 * behind them changes — which is what makes isolating a type read as the same
 * chart with the noise removed rather than as a different chart appearing. A
 * resize is not a change and does not re-run it.
 *
 * The axis type sits OUTSIDE the animated group on purpose: scaling a column
 * vertically would stretch any numeral inside it and let it settle, which
 * looks like a rendering fault rather than an animation.
 */
interface Props {
  categories: StackCategory[];
  /** Stacking order, fixed. Never sorted by volume — a stack that reorders
   *  itself between two cashiers cannot be compared across them. */
  types: string[];
  reference?: { value: number; label: string };
  /** The measured well. */
  width: number;
  height: number;
  barWidth?: number;
  label: string;
  /** The picked column's key, when this chart is selectable. */
  selectedKey?: string | null;
  /** Makes the columns clickable. Omit and the chart is read-only. */
  onSelect?: (key: string) => void;
}

const PAD = { top: 18, right: 12, bottom: 30, left: 32 };
const SEGMENT_GAP = 2;

/** Below these the bars stop being readable, so the chart holds its size and
 *  the well scrolls rather than shrinking further. */
const MIN_WIDTH = 260;
const MIN_HEIGHT = 150;

/** Long enough for the eye to follow a column up, short enough that clicking
 *  through five cards never feels like waiting on the chart. */
const GROW_MS = 480;
const STAGGER_MS = 25;

const StackedBarChart = ({
  categories,
  types,
  reference,
  width: given,
  height: givenHeight,
  barWidth = 28,
  label,
  selectedKey,
  onSelect,
}: Props) => {
  const [grown, setGrown] = useState(false);

  /** What the columns are drawn from — a change here is a different chart. */
  const signature = `${types.join("|")}::${categories
    .map((c) => `${c.key}:${c.total}`)
    .join(",")}`;

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setGrown(true);
      return;
    }
    setGrown(false);
    // Two frames: one for the collapsed state to paint, one to transition off
    // it. Both in a single frame and the browser coalesces them into no move.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setGrown(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [signature]);

  if (categories.length === 0) return null;

  const width = Math.max(given, MIN_WIDTH);
  // The reference caption sits under the SVG, so it comes out of the height
  // before the plot is laid out rather than pushing the card over.
  const height = Math.max(givenHeight - (reference ? 16 : 0), MIN_HEIGHT);

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const peak = Math.max(...categories.map((c) => c.total), 1);
  const ceiling = Math.max(Math.ceil(peak / 5) * 5, 5);
  const y = (v: number) => PAD.top + innerH - (v / ceiling) * innerH;

  const step = innerW / categories.length;
  // Bars widen with the container up to the cap, so a chart on a big monitor
  // reads as a chart rather than as pinstripes floating in whitespace.
  const bw = Math.min(barWidth, step * 0.62);
  const hasSublabel = categories.some((c) => c.sublabel);
  const axisY = PAD.top + innerH;

  return (
    <div>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
      >
        {categories.map((c, i) => {
          const picked = selectedKey === c.key;
          if (!c.band && !picked) return null;
          // The picked column is the only shaded one, so a plain fill is
          // enough to find it — the outline it used to carry read as a heavy
          // black box and fought the bars it was meant to frame.
          return (
            <rect
              key={`band-${c.key}`}
              x={PAD.left + i * step}
              y={PAD.top - 6}
              width={step}
              height={innerH + 6}
              className="fill-row_stripe"
            />
          );
        })}

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
                fontSize={11}
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
            className="text-content/85"
          />
        )}

        {categories.map((c, i) => {
          const x = PAD.left + i * step + (step - bw) / 2;
          let acc = 0;
          const timing = {
            transitionDuration: `${GROW_MS}ms`,
            transitionDelay: `${i * STAGGER_MS}ms`,
          };
          const picked = selectedKey === c.key;
          return (
            <g
              key={c.key}
              {...(onSelect
                ? {
                    role: "button" as const,
                    tabIndex: 0,
                    "aria-pressed": picked,
                    "aria-label": `${c.label}: ${c.total}`,
                    style: { cursor: "pointer" },
                    onClick: () => onSelect(c.key),
                    onKeyDown: (e: React.KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(c.key);
                      }
                    },
                  }
                : {})}
            >
              {/* A transparent target over the whole column, so the empty air
                  above a short bar is clickable too. Behind the bars, so their
                  own hover titles still work. */}
              {onSelect && (
                <rect
                  x={PAD.left + i * step}
                  y={PAD.top - 6}
                  width={step}
                  height={innerH + 6}
                  fill="transparent"
                />
              )}

              {/* Anchored to the axis, so the column grows up out of it. */}
              <g
                className="transition-transform ease-out motion-reduce:transition-none"
                style={{
                  ...timing,
                  transformBox: "view-box",
                  transformOrigin: `0px ${axisY}px`,
                  transform: grown ? "scaleY(1)" : "scaleY(0)",
                }}
              >
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
              </g>

              {c.total === peak && c.total > 0 && (
                <text
                  x={x + bw / 2}
                  y={y(c.total) - 5}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={600}
                  className="fill-content transition-opacity ease-out motion-reduce:transition-none"
                  style={{ ...timing, opacity: grown ? 1 : 0 }}
                >
                  {c.total}
                </text>
              )}

              <text
                x={x + bw / 2}
                y={height - (hasSublabel ? 15 : 9)}
                textAnchor="middle"
                fontSize={11}
                fontWeight={picked || c.emphasis ? 700 : 400}
                // Bold on the pick, so the shading is not carrying it alone.
                className={picked ? "fill-content" : "fill-content/85"}
              >
                {c.label}
              </text>
              {c.sublabel && (
                <text
                  x={x + bw / 2}
                  y={height - 3}
                  textAnchor="middle"
                  fontSize={11}
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
        <div className="text-right pr-1 -mt-1.5 text-[12px] text-content/85">
          {reference.label}
        </div>
      )}
    </div>
  );
};

export default StackedBarChart;
