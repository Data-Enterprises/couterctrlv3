/**
 * The hover readout both bar charts on this page share.
 *
 * Anchored in percentages of the chart box rather than pixels: these strips
 * stretch with the panel, so an offset computed at one width is wrong at every
 * other. It flips its own anchor near the edges, or the first and last bars
 * would push the card outside the panel it sits in.
 *
 * Sits BELOW the bars rather than over them. Both charts exist to be read as a
 * shape, and a card floating across the middle of a 28-day run hides the very
 * comparison the reader is making.
 *
 * Follows the LP case charts' tooltip shell — same border, surface and shadow —
 * at this page's 12px floor rather than their 11px.
 */
export interface BarTooltipRow {
  label: string;
  value: string;
  /** Dimmed, for the supporting line under the headline figure. */
  soft?: boolean;
}

interface Props {
  /** Horizontal anchor, 0–100, in the chart's own box. */
  xPct: number;
  title: string;
  rows: BarTooltipRow[];
}

const BarTooltip = ({ xPct, title, rows }: Props) => {
  const shift = xPct < 18 ? "0%" : xPct > 82 ? "-100%" : "-50%";

  return (
    <div
      className="absolute z-30 pointer-events-none"
      style={{
        left: `${xPct}%`,
        top: "calc(100% + 6px)",
        transform: `translateX(${shift})`,
      }}
    >
      <div className="rounded border border-gray-200 bg-custom-white shadow-lg px-2.5 py-2 min-w-[132px]">
        <div className="text-[12px] font-semibold text-content whitespace-nowrap">
          {title}
        </div>
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-baseline justify-between gap-3 whitespace-nowrap mt-1"
          >
            <span className="text-[12px] text-content/85">{r.label}</span>
            <span
              className={`text-[12px] tabular-nums ${
                r.soft ? "text-content/85" : "text-content font-semibold"
              }`}
            >
              {r.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarTooltip;
