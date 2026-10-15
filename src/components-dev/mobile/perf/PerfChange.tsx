import { DOWN_COLOR, UP_COLOR } from "./perfColors";

interface Props {
  /** The change, or null when there is nothing to compare against. */
  pct: number | null;
  /** The page's own wording. Sales and the margin pages each have a
   *  `fmtChange`; both print `+` above zero, `−` below and no sign at zero,
   *  which is the rule the colour follows. */
  format: (n: number) => string;
  className?: string;
}

/**
 * The change percentage on a Performance card or row, in the direction's
 * colour.
 *
 * Green up, red down, and PLAIN AT EXACTLY ZERO — a week that landed on last
 * year's figure did not go either way, and painting it green for the sake of
 * having a colour would invent a direction the number does not have. That is
 * also where the sign glyph stops: `fmtChange` prints no `+` or `−` at zero,
 * so the colour and the text agree on what counts as a move.
 *
 * A direction flag, not a grade. Nothing here is measured against a
 * threshold, which is why it reads off the delta tokens and why mobile
 * Performance can carry it while still showing no severity anywhere. It used
 * to be neutral on the grounds that a figure is not a verdict — but the bars
 * beneath it now carry the same direction in the same two colours, and a
 * percentage in grey above a red bar reads as a different fact rather than
 * the same one said twice.
 *
 * Null renders as an em dash, uncoloured: no comparison is not a flat week.
 */
const PerfChange = ({ pct, format, className = "" }: Props) => {
  if (pct === null) return <span className={className}>—</span>;

  return (
    <span
      className={className}
      style={pct > 0 ? { color: UP_COLOR } : pct < 0 ? { color: DOWN_COLOR } : undefined}
    >
      {format(pct)}
    </span>
  );
};

export default PerfChange;
