// Utils
import { formatCurrency2 } from "../../../../../utils";
import { dash } from "../../utils";

// Components
import ItemKpi from "./ItemKpi";

interface ItemKpiStripProps {
  totals: {
    sales: number;
    units: number;
    marginPct: number | null;
    unitCost: number | null;
    prices: number;
    trans: number;
  };
  /** Where the unit cost came from: an invoice date, a lookup, or the item file. */
  costNote: string;
  /** The register read is still out, so Trans has no count yet. */
  transLoading: boolean;
}

/** The item's six figures: sales, cost per unit and its source, units, GM%,
 *  price count and transactions. */
const ItemKpiStrip = ({
  totals,
  costNote,
  transLoading,
}: ItemKpiStripProps) => (
  <div className="grid grid-cols-6 divide-x divide-line_hair border-b border-line_hair bg-fill_soft flex-shrink-0">
    <ItemKpi label="Sales">{formatCurrency2(totals.sales)}</ItemKpi>
    {/* The floor under every price on this screen. Without it a reader can
        see that $6.50 moves fastest but not that it's below cost. Its note
        says where the figure came from: the two sources can differ by a
        dollar a unit. */}
    <ItemKpi label="Cost / unit" note={costNote}>
      {totals.unitCost !== null ? formatCurrency2(totals.unitCost) : dash}
    </ItemKpi>
    <ItemKpi label="Units">
      {totals.units % 1 === 0 ? totals.units : totals.units.toFixed(2)}
    </ItemKpi>
    <ItemKpi
      label="GM%"
      valueClass={
        totals.marginPct === null
          ? "text-content"
          : totals.marginPct < 0
            ? "text-delta_negative_text"
            : "text-delta_positive_text"
      }
    >
      {totals.marginPct !== null ? `${totals.marginPct.toFixed(2)}%` : dash}
    </ItemKpi>
    <ItemKpi label="Prices">{totals.prices}</ItemKpi>
    <ItemKpi label="Trans">
      {transLoading ? <span className="text-content/95">…</span> : totals.trans}
    </ItemKpi>
  </div>
);

export default ItemKpiStrip;
