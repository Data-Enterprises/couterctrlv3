import { useState } from "react";
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, formatDate } from "../../utils";
import type { ActualPricePoint } from "./pricePoints";

/**
 * One actual price point, and the receipts behind it on demand.
 *
 * A price point is a count until you can see what it counted. "19 transactions
 * at $13.99" is only trustworthy if the nineteen can be named — and when a
 * price looks wrong, the individual rings are where the reason is: one cashier,
 * one terminal, one afternoon.
 *
 * Shared by the exact and averaged tables rather than written twice. The two
 * differ only in which bucket they were built from, and a second copy of this
 * would drift the first time either table changed.
 */

export const ACT_COLS = "1fr 40px 44px 36px 46px 32px 58px";
const TXN_COLS = "84px 1fr 86px 44px 58px";

interface Props {
  point: ActualPricePoint;
  /** The price the suggestion band is naming. Tinted so the two tie together. */
  isBest?: boolean;
}

/** Receipts read "STORE-123456"; the half before the dash is the store, which
 *  is the same for every row on a single-store page. */
const transactionLabel = (saleId: string) => saleId.split("-")[1] ?? saleId;

/** Scale items ring a fractional quantity, so decimals only when there are
 *  any — "1" reads better than "1.00" nineteen times over. */
const fmtQty = (q: number) => (Number.isInteger(q) ? String(q) : q.toFixed(2));

const ActualPriceRow = ({ point, isBest = false }: Props) => {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div
        className={`grid px-1 py-2 text-[12px] border-b border-gray-50 ${isBest ? "bg-blue-50" : "even:bg-row_stripe"}`}
        style={{ gridTemplateColumns: ACT_COLS }}
      >
        <span
          className={`tabular-nums ${isBest ? "text-blue-900 font-medium" : "text-content"}`}
        >
          {formatCurrency2(point.price)}
        </span>
        <span className="text-content/70">{point.priceType}</span>

        {/* The count is the control — it's the number you'd point at when
            asking "which nineteen?". */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center justify-end gap-0.5 text-right tabular-nums text-blue-700 hover:text-blue-900 hover:underline transition-colors"
          title={open ? "Hide transactions" : "Show transactions"}
          aria-expanded={open}
        >
          {open ? (
            <ChevronDownIcon className="w-3 h-3 flex-shrink-0" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 flex-shrink-0" />
          )}
          {point.trans}
        </button>

        <span className="text-right tabular-nums text-content">
          {fmtQty(point.qty)}
        </span>
        <span
          className={`text-right tabular-nums font-medium ${point.marginPct < 0 ? "text-red-700" : "text-emerald-700"}`}
        >
          {point.marginPct.toFixed(1)}%
        </span>
        <span className="text-right tabular-nums text-content">
          {point.daysSeen}
        </span>
        <span className="text-right tabular-nums text-content">
          {formatCurrency2(point.sales)}
        </span>
      </div>

      {open && (
        <div className="bg-[#1e2a4a]/[0.03] border-b border-gray-100 pl-5 pr-2 py-1.5">
          <div
            className="grid py-1 text-[9px] font-medium uppercase tracking-wide text-content/60"
            style={{ gridTemplateColumns: TXN_COLS }}
          >
            <span>Date</span>
            <span>Transaction</span>
            <span>Cashier</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Amount</span>
          </div>
          {point.lines.map((t) => (
            <div
              key={`${t.sale_id}-${t.line_number}`}
              className="grid py-1 text-[12px]"
              style={{ gridTemplateColumns: TXN_COLS }}
            >
              <span className="text-content tabular-nums">
                {formatDate(t.sale_date)}
              </span>
              <span className="text-content/70 tabular-nums truncate pr-2">
                {transactionLabel(t.sale_id)}
                {t.terminal ? ` · T${t.terminal}` : ""}
              </span>
              <span
                className="text-content/70 truncate pr-2"
                title={t.cashier_name}
              >
                {t.cashier_name || t.cashier_number}
              </span>
              <span className="text-right tabular-nums text-content">
                {fmtQty(t.qty ?? 1)}
              </span>
              <span className="text-right tabular-nums text-content font-medium">
                {formatCurrency2(t.net_sales)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActualPriceRow;
