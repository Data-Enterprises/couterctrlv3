// Utils
import { HOUR_COLS } from "../utils";

// Interfaces
import type { Row } from "../interfaces";

interface CompareHourRowProps {
  row: Row;
  /** The hour the right side is reading. */
  on: boolean;
  /** The two bars' widths, already scaled to the list's biggest. */
  mineWidth: string;
  theirsWidth: string;
  /** The gap, for its colour, and as the text shown. */
  gap: number;
  gapText: string;
  onPick: () => void;
}

/** One hour of the store-against-store list: both stores' bars and the gap
 *  between them. Clicking it focuses the hour on the right. */
const CompareHourRow = ({
  row: r,
  on,
  mineWidth,
  theirsWidth,
  gap,
  gapText,
  onPick,
}: CompareHourRowProps) => (
  <button
    onClick={onPick}
    className={`w-full text-left grid gap-2.5 items-center px-3 py-2 border-b transition-colors ${
      on ? "cc-row-selected" : "border-brand_navy/15 hover:bg-fill_soft"
    }`}
    style={{ gridTemplateColumns: HOUR_COLS }}
  >
    <span className="tabular-nums text-[12.5px] font-medium text-content">
      {r.label}
    </span>

    <span className="grid gap-[3px] min-w-0">
      <span className="block h-2 rounded-sm bg-bkg">
        <span
          className="block h-2 rounded-sm bg-store_open"
          style={{ width: mineWidth }}
        />
      </span>
      {/* An hour they were shut gets a hatched full track, not a zero-width bar
          nobody can see. */}
      <span className="block h-2 rounded-sm bg-bkg">
        <span
          className="block h-2 rounded-sm"
          style={
            r.b === 0
              ? {
                  width: "100%",
                  background:
                    "repeating-linear-gradient(45deg, rgb(var(--color-severity-watch-bg)) 0 4px, transparent 4px 8px)",
                }
              : {
                  width: theirsWidth,
                  background: "rgb(var(--color-store-compare))",
                }
          }
        />
      </span>
    </span>

    <span
      className={`text-right tabular-nums text-[12px] font-semibold ${
        gap >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
      }`}
    >
      {gapText}
    </span>
  </button>
);

export default CompareHourRow;
