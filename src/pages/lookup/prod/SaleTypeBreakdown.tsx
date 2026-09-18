import type { SaleTypeSummary } from "../../../features/itemLookupSlice";
import { formatCurrency2 } from "../../../utils";
import { formatUnits, hasSaleTypeBreakdown } from "./lookupMetrics";

interface SaleTypeBreakdownProps {
  saleTypes: SaleTypeSummary[];
  /** Scale item: the units column is pounds. */
  weighed: boolean;
  /** The type whose timeline the daily breakdown is showing. */
  selected: string;
  onSelect: (saleType: string) => void;
  /** Tighter padding for the phone layout. */
  compact?: boolean;
}

/**
 * The window split by register line type — Sale, then Backup (restored
 * transactions), Cancelled and Voided by dollars.
 *
 * Every other figure on the screen counts Sale only, which is how the
 * endpoint's own totals count. This is where the rest show up, each against
 * Sale dollars so a $0.85 cancellation reads as the rounding error it is and a
 * $90 one doesn't.
 *
 * Each row is a button: picking a type swaps the daily breakdown to that
 * type's timeline. Picking it again, or picking Sale, goes back.
 */
const SaleTypeBreakdown = ({
  saleTypes,
  weighed,
  selected,
  onSelect,
  compact = false,
}: SaleTypeBreakdownProps) => {
  if (!hasSaleTypeBreakdown(saleTypes)) return null;

  const saleDollars = saleTypes.find((s) => s.saleType === "Sale")?.sales ?? 0;
  const px = compact ? "px-4" : "px-2";
  const grid = "grid";
  // Qty and weight side by side on a scale item, same as the daily breakdown.
  const gridStyle = {
    gridTemplateColumns: weighed
      ? "1.3fr 0.6fr 1fr 0.7fr 1fr 0.9fr"
      : "1.4fr 0.7fr 1fr 1fr 0.9fr",
  };

  return (
    <div>
      <div
        className={`${grid} ${px} py-1.5 text-[9px] font-medium uppercase tracking-wide text-content border-b border-gray-100`}
        style={gridStyle}
      >
        <span>Sale type</span>
        <span className="text-right">Days</span>
        <span className="text-right">Amount</span>
        <span className="text-right">Qty</span>
        {weighed && <span className="text-right">Weight</span>}
        <span className="text-right">% of sales</span>
      </div>
      {saleTypes.map((s) => {
        const isSale = s.saleType === "Sale";
        const isSelected = s.saleType === selected;
        return (
          <button
            key={s.saleType}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(isSelected && !isSale ? "Sale" : s.saleType)}
            title={
              isSelected && !isSale
                ? "Back to the sales timeline"
                : `Show the ${s.saleType.toLowerCase()} timeline`
            }
            className={`${grid} ${px} w-full py-2 text-left text-[12px] tabular-nums border-b border-gray-50 border-l-2 transition-colors ${
              isSelected
                ? "bg-row_selected border-l-[#1e2a4a] font-semibold text-content"
                : "border-l-transparent text-content hover:bg-gray-50"
            }`}
            style={gridStyle}
          >
            <span>{s.saleType}</span>
            <span className="text-right">{s.days}</span>
            <span className="text-right">{formatCurrency2(s.sales)}</span>
            <span className="text-right">{s.qty.toLocaleString()}</span>
            {weighed && (
              <span className="text-right">{formatUnits(s.units, true)}</span>
            )}
            <span className="text-right text-content/85">
              {isSale || saleDollars <= 0
                ? "—"
                : `${((s.sales / saleDollars) * 100).toFixed(2)}%`}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SaleTypeBreakdown;
