// Utils
import { cmpLabels } from "../utils/perfData";

// Interfaces
import type { CmpBasis } from "../utils/perfData";

// Components
import PairedBars from "../../../../../../components-dev/mobile/perf/PairedBars";

/**
 * This year against last year, under the row's name.
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
const Bars = ({
  ty,
  ly,
  noLy,
  max,
  basis,
}: {
  ty: number;
  ly: number;
  noLy?: boolean;
  max: number;
  basis: CmpBasis;
}) => (
  <div className="mt-1.5">
    <PairedBars
      ty={ty}
      ly={ly}
      max={max}
      labels={cmpLabels(basis)}
      lyUnavailable={noLy}
      compact
    />
  </div>
);

export default Bars;
