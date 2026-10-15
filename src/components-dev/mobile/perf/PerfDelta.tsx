import { formatCurrency2 } from "../../../utils";
import { DOWN_COLOR, UP_COLOR } from "./perfColors";

interface Props {
  ty: number;
  ly: number;
  /** How the figure reads. Counts are not money, and the margin cards are
   *  neither — same reason `PairedBars` takes one. */
  format?: (n: number) => string;
  /**
   * Nothing on file to compare against, so there is no difference to state.
   *
   * The same distinction the bars draw: an `ly` of 0 is a real reading and
   * differences fine, while no history at all would render as a gain of the
   * whole figure — a rise from nothing, asserted in words.
   */
  unavailable?: boolean;
  /** Trails the headline it belongs to, so it needs to sit on that baseline.
   *  The cards pass `ml-auto` to push it to the card's right edge. */
  className?: string;
}

/**
 * This year minus last year, signed, for the headline of a Performance card.
 *
 * Sits on the headline's row, pushed to the card's right edge, rather than
 * under the bars. The figure and its movement are one thought and read as one
 * line; parked below the comparison it became a fourth number in a column of
 * three and stopped belonging to the headline at all.
 *
 * Right-aligned with `ml-auto` rather than the row's `justify-between`, which
 * would drop it back to the left the moment a long figure wrapped it onto its
 * own line.
 *
 * Green up, red down, matching the TY bar beneath it. That is a direction
 * flag and not a grade — nothing here is measured against a threshold — which
 * is why these are the delta tokens and why mobile Performance can carry them
 * while still showing no severity anywhere.
 *
 * The card header already carries the move as a percentage. This is the money:
 * "down 1.3%" on a six-figure week is the question, and "-$1,672.38" is the
 * answer.
 */
const PerfDelta = ({
  ty,
  ly,
  format = formatCurrency2,
  unavailable = false,
  className = "",
}: Props) => {
  if (unavailable) return null;

  const delta = ty - ly;
  // Signed by hand off the absolute value rather than handing a negative to
  // `format`: the callers pass currency, count and percentage formatters that
  // each punctuate a negative their own way, and a headline reading
  // "+-$1,672.38" is the kind of thing that ships.
  // No sign and no colour at exactly zero: a week that landed on the figure
  // it is measured against did not go either way, and "+$0.00" in green
  // invents a direction the number does not have. Same rule as PerfChange, so
  // the percentage and the money agree on what counts as a move.
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  const label = `${sign}${format(Math.abs(delta))}`;

  return (
    <span
      className={`font-display text-[15px] font-bold leading-none tracking-tight ${className}`}
      style={
        delta > 0
          ? { color: UP_COLOR }
          : delta < 0
            ? { color: DOWN_COLOR }
            : undefined
      }
    >
      {label}
    </span>
  );
};

export default PerfDelta;
