// Utils
import { money, side } from "../utils";

// Interfaces
import type { PriceLine } from "../interfaces";

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
