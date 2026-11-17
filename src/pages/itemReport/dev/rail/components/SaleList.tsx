// Utils
import { formatCurrency2, formatDateSimple } from "../../../../../utils";
import { cell, LIST_COLS, num, saleNumber } from "../utils";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";
import type { SaleSummary } from "../interfaces";

interface SaleListProps {
  sales: SaleSummary[];
  onOpen: (sale: TransactionListItem) => void;
}

/** The transactions at the opened price, each opening to its basket. */
const SaleList = ({ sales, onOpen }: SaleListProps) => (
  <>
    <div
      className="cc-thead grid gap-3 px-4 py-1.5 text-[11.5px] cc-caps"
      style={{ gridTemplateColumns: LIST_COLS }}
    >
      <span>Transaction</span>
      <span>Date</span>
      <span>Terminal</span>
      <span>Cashier</span>
      <span>Price type</span>
      <span className="text-right">Qty</span>
      <span className="text-right">Net</span>
    </div>
    {sales.map((r, i) => (
      <div
        key={r.sale.sale_id}
        onClick={() => onOpen(r.sale)}
        className={`grid gap-3 px-4 py-2 items-center border-b border-line_hair cursor-pointer hover:bg-brand_navy/[0.06] ${
          i % 2 === 1 ? "bg-row_stripe" : ""
        }`}
        style={{ gridTemplateColumns: LIST_COLS }}
      >
        <span className="text-[12px] font-medium text-brand_navy underline underline-offset-2 truncate">
          {saleNumber(r.sale.sale_id)}
        </span>
        <span className={cell}>{formatDateSimple(r.sale.sale_date)}</span>
        <span className={cell}>{r.sale.terminal}</span>
        <span className={cell}>{r.sale.cashier_name}</span>
        {/* Why it rang at this price. `TPR` is a planned promotion and
            needs no action; `Regular` at a promotional price is the
            shelf being wrong, which is the whole reason to look. */}
        <span className={cell}>{[...r.priceTypes].join(" · ")}</span>
        <span className={num}>{r.qty}</span>
        <span className={num}>{formatCurrency2(r.net)}</span>
      </div>
    ))}
  </>
);

export default SaleList;
