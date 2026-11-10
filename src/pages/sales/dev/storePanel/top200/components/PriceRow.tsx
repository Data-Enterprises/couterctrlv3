// Utils
import { money, side } from "../utils";

// Interfaces
import type { PriceLine } from "../interfaces";

/** One price in the Top 200 rail's grid: the price and how much each store rang at it, or "never rang it". */
const PriceRow = ({ line }: { line: PriceLine }) => (
  <>
    <span className="tabular-nums font-bold">{money(line.price)}</span>
    <span className="text-right tabular-nums">
      {side(line.mine) ?? (
        <span className="text-content">never rang it</span>
      )}
    </span>
    <span className="text-right tabular-nums">
      {side(line.theirs) ?? (
        <span className="text-content">never rang it</span>
      )}
    </span>
  </>
);

export default PriceRow;
