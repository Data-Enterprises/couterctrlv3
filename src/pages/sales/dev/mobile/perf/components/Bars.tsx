// Interfaces
import type { PerfPair } from "../utils/perfData";

// Components
import PairedBars from "../../../../../../components-dev/mobile/perf/PairedBars";

interface BarsProps {
  p: PerfPair;
  max: number;
  /** How figures read: money or units, per the Sales / Units switch. */
  fmt: (n: number) => string;
}

/**
 * This year against last year and last week, under the row's name.
 *
 * Last week is a third bar (asked for on 28 Oct), graded the same way as the
 * row: the TY bar's colour reads against last year, and against last week
 * only when last year has nothing on file.
 *
 * Was two lines of mono figures, on the reasoning that these lists are read by
 * scanning names and twenty sub departments of bars turn a list into a scroll.
 * The scroll is real and the rows are taller for it, but figures alone made
 * every row its own puzzle: $32,676.83 against $34,115.27 is a subtraction the
 * reader has to perform, and a list of twenty is twenty subtractions. Bars are
 * the comparison, pre-done, and the figures ride along in their value column —
 * so this costs a line per row and gives back the reason the list exists.
 * Asked for by a client, on all three drills.
 *
 * `max` is the list's own largest figure, never the row's, so a $200
 * department and a $20,000 one are not drawn the same width.
 */
const Bars = ({ p, max, fmt }: BarsProps) => (
  <div className="mt-1.5">
    <PairedBars
      ty={p.ty}
      ly={p.ly}
      lw={p.lw ?? 0}
      max={max}
      labels={["TY", "LY", "LW"]}
      format={fmt}
      lyUnavailable={p.noLy}
      lwUnavailable={p.noLw}
      compact
    />
  </div>
);

export default Bars;
