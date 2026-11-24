// Utils
import { ACT_COLS } from "../../utils";

interface ActualTableHeadProps {
  /** "Price", or "$/lb" for a weighed item's exact prices. */
  priceLabel: string;
}

/** The heading row of an actual-price table. */
const ActualTableHead = ({ priceLabel }: ActualTableHeadProps) => (
  <div
    className="grid px-1 py-1.5 text-[10px] font-medium uppercase tracking-wide text-content border-b border-line_hair"
    style={{ gridTemplateColumns: ACT_COLS }}
  >
    <span>{priceLabel}</span>
    <span>Type</span>
    <span className="text-right">Trans</span>
    <span className="text-right">Qty</span>
    <span className="text-right">GM%</span>
    <span className="text-right">Days</span>
    <span className="text-right">Total</span>
  </div>
);

export default ActualTableHead;
