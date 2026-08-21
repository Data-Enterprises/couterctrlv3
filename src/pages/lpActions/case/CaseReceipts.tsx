import {
  formatCurrency2,
  formatDateSimple,
  transactionLabel,
} from "../../../utils";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { lineQty } from "../../inventory/pricePoints";
import { isAll } from "./caseModel";
import {
  GRID_CELL,
  GRID_HEAD,
  GRID_NOTE,
  GRID_NUM,
  GRID_ROW,
} from "./gridTheme";
import type {
  CashierTransaction,
  TransactionListItem,
} from "../../../interfaces";

/**
 * The receipts behind the case, largest first.
 *
 * Named "largest" rather than "supporting" on purpose: naming the ordering rule
 * stops the list reading as a curated selection of the most incriminating ones.
 *
 * Four columns, because this is an index rather than a report. What was on the
 * receipt, which lane, what time — all of it is one click away in the receipt
 * itself, and printing a summary of it here only invites the reader to trust
 * the summary instead of opening the thing.
 */
interface Props {
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  saleType: string;
  onOpen: (row: CashierTransaction) => void;
}

const SHOWN = 3;

/** Transaction, day, units, amount, chevron. */
const COLS = "1fr 62px 34px 66px 14px";

const CaseReceipts = ({ rows, lines, saleType, onOpen }: Props) => {
  const qtyById = new Map<string, number>();
  for (const l of lines) {
    if (!isAll(saleType) && l.sale_type !== saleType) continue;
    qtyById.set(l.sale_id, (qtyById.get(l.sale_id) ?? 0) + lineQty(l));
  }

  // One row per exception occurrence arrives from the walk, so a receipt with
  // three refunded lines is three rows carrying the same id and the same
  // receipt total. Collapse them, or the list prints one receipt three times
  // and a reader counts it three times.
  const unique = [...new Map(rows.map((r) => [r.sale_id, r])).values()];

  const ranked = [...unique].sort(
    (a, b) => Math.abs(b.total_sales ?? 0) - Math.abs(a.total_sales ?? 0),
  );
  const top = ranked.slice(0, SHOWN);

  return (
    <>
      <div className={GRID_HEAD} style={{ gridTemplateColumns: COLS }}>
        <span>Transaction</span>
        <span>Day</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {top.map((r, index) => (
        <button
          key={r.sale_id}
          onClick={() => onOpen(r)}
          title="Open the whole receipt"
          className={`w-full text-left transition-colors hover:bg-gray-50 ${GRID_ROW} ${
            index % 2 === 1 ? "bg-row_stripe" : ""
          }`}
          style={{ gridTemplateColumns: COLS }}
        >
          <span className={`${GRID_CELL} font-medium tabular-nums`}>
            {transactionLabel(r.sale_id)}
          </span>
          <span className={`${GRID_CELL} tabular-nums opacity-85`}>
            {formatDateSimple(r.sale_date.slice(0, 10))}
          </span>
          <span className={GRID_NUM}>
            {qtyById.has(r.sale_id)
              ? Math.abs(qtyById.get(r.sale_id) ?? 0)
              : "—"}
          </span>
          <span className={GRID_NUM}>
            −{formatCurrency2(Math.abs(r.total_sales ?? 0))}
          </span>
          <ChevronRightIcon className="w-4 h-4 text-content/85" />
        </button>
      ))}

      {ranked.length > SHOWN && (
        <div className={GRID_NOTE}>
          {ranked.length - SHOWN} more · {ranked.length} total
        </div>
      )}
    </>
  );
};

export default CaseReceipts;
