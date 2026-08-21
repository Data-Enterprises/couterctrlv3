import { colourFor } from "./chartTheme";
import { isAll } from "./caseModel";

/**
 * The hover readout both case charts share.
 *
 * Positioned in percentages of the chart box rather than pixels, because the
 * SVGs scale with the panel — a pixel offset computed at one width is wrong at
 * every other. It shifts its own anchor near the edges so a column at the far
 * right does not push the card outside the card it sits in.
 *
 * Every type is listed, not just the one under the cursor: the reader is
 * comparing, and a tooltip that answers only what was pointed at makes them
 * point four times to ask one question.
 */
export interface TooltipRow {
  saleType: string;
  value: number;
}

interface Props {
  /** Horizontal anchor, 0–100, in the chart's own box. */
  xPct: number;
  title: string;
  rows: TooltipRow[];
  /** Every type in the chart, for stable colour assignment. */
  names: string[];
  selected: string;
}

const ChartTooltip = ({ xPct, title, rows, names, selected }: Props) => {
  const shift = xPct < 22 ? "0%" : xPct > 78 ? "-100%" : "-50%";

  return (
    <div
      className="absolute top-0 z-10 pointer-events-none"
      style={{ left: `${xPct}%`, transform: `translateX(${shift})` }}
    >
      <div className="rounded border border-gray-200 bg-custom-white shadow-lg px-2 py-1.5 min-w-[104px]">
        <div className="text-[11px] font-semibold text-content mb-1 whitespace-nowrap">
          {title}
        </div>
        {rows.map((r) => {
          const on = isAll(selected) || r.saleType === selected;
          return (
            <div
              key={r.saleType}
              className="flex items-center gap-1.5 whitespace-nowrap"
            >
              <span
                className="w-2 h-2 rounded-sm flex-shrink-0"
                style={{ background: colourFor(names, r.saleType) }}
              />
              <span
                className={`text-[11px] flex-1 ${on ? "text-content font-medium" : "text-content/85"}`}
              >
                {r.saleType}
              </span>
              <span
                className={`text-[11px] tabular-nums ${on ? "text-content font-semibold" : "text-content/85"}`}
              >
                {r.value}
              </span>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="text-[11px] text-content/85 whitespace-nowrap">
            Nothing this hour
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartTooltip;
