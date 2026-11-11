// Utils
import { formatCurrency2 } from "../../../../utils";
import { basisWord, PILL_FILL } from "../utils";
import { changeTone, signed, signedPct } from "../utils/trackerTone";
import { NUM } from "../utils/trackerColumns";

// Interfaces
import type { TrackerBasis } from "../interfaces";

interface VsLyProps {
  dollarChange: number | null;
  pctChange: number | null;
  /** Row level. `sub` for the department list, `day` one step down. */
  size?: "sub" | "day";
  /**
   * Green/red on the sign. Off for day rows inside an open week, so the week
   * line keeps the colour that matters.
   */
  colored?: boolean;
  /**
   * A filled pill with an `LY` label, matching the panel header: it names the
   * basis and fills its column.
   */
  variant?: "plain" | "pill";
  /** What the figure is measured against. Names the pill and the tooltip. */
  basis?: TrackerBasis;
}

/**
 * The comparison to last year, dollars and percent in one cell: dollars lead
 * at full weight, the percent follows a step down (a small department's
 * percent can be huge on a few dollars).
 */
const VsLy = ({
  dollarChange,
  pctChange,
  size = "sub",
  colored = true,
  variant = "plain",
  basis = "LY",
}: VsLyProps) => {
  const big = size === "sub" ? "text-[13.5px]" : "text-[12px]";
  const small = size === "sub" ? "text-[12px]" : "text-[11px]";
  const isPill = variant === "pill";

  const tone = isPill
    ? PILL_FILL(dollarChange)
    : colored
      ? changeTone(dollarChange)
      : "text-content";

  if (dollarChange === null && pctChange === null) {
    return isPill ? (
      <span
        className={`inline-flex items-baseline gap-1.5 px-2 py-0.5 rounded-full bg-fill_muted ml-auto ${NUM}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-wide text-content">
          {basis}
        </span>
        <span className={`${big} font-semibold text-content`}>—</span>
      </span>
    ) : (
      <span className={`${big} text-content text-right ${NUM}`}>—</span>
    );
  }

  return (
    <span
      className={`items-baseline gap-1.5 ${NUM} ${tone} ${
        isPill
          ? // Same shape as the panel header's pill: fully rounded, and padded
            // only enough to clear the text. It hugs its content and sits at
            // the right of its column rather than stretching to fill it.
            "inline-flex px-2 py-0.5 rounded-full ml-auto"
          : "flex justify-end"
      }`}
      title={`Change against the same period ${basisWord(basis)}`}
    >
      {isPill && (
        <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
          {basis}
        </span>
      )}
      <span className={`${big} font-semibold`}>
        {signed(dollarChange, formatCurrency2)}
      </span>
      <span
        className={isPill ? "opacity-40" : "text-brand_line_2"}
        aria-hidden="true"
      >
        |
      </span>
      <span className={`${small} font-semibold`}>{signedPct(pctChange)}</span>
    </span>
  );
};

export default VsLy;
