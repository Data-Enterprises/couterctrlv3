// Utils
import { money } from "../utils";

// Interfaces
import type { TopItemPricePoint } from "../../../../../../api/topItems";
import type { PriceLine } from "../interfaces";

const side = (p: TopItemPricePoint | null) =>
  p === null
    ? null
    : `${(p.weight > 0 ? p.weight : p.units).toLocaleString(undefined, {
        minimumFractionDigits: p.weight > 0 ? 1 : 0,
        maximumFractionDigits: p.weight > 0 ? 1 : 0,
      })} ${p.weight > 0 ? "lb" : "u"} · ${money(p.net_sales)}`;

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
