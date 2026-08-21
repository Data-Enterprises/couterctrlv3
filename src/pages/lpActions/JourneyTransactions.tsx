import { ChevronRightIcon } from "@heroicons/react/20/solid";
import {
  formatCurrency2,
  formatDateSimple,
  transactionLabel,
} from "../../utils";
import { lineQty } from "../inventory/pricePoints";
import { laneOf } from "./lpActionsMetrics";
import {
  GRID_CELL,
  GRID_HEAD,
  GRID_NOTE,
  GRID_NUM,
  GRID_ROW,
} from "./case/gridTheme";
import type { CashierTransaction, TransactionListItem } from "../../interfaces";

/**
 * The transactions currently in scope, as a list you can open.
 *
 * The end of every path through this modal — node, then branch — lands here,
 * because a chart that cannot be reduced to the receipts behind it is a chart
 * nobody should act on.
 *
 * One row per receipt, not per occurrence. The walk returns a row per
 * exception, so a receipt with three voided lines arrives three times carrying
 * the same total; listed as-is a reader counts it three times and reads the
 * amount as $36 rather than $12. The header above already reports occurrences
 * and receipts separately, so this list can be the receipts.
 */
interface Props {
  rows: CashierTransaction[];
  lines: TransactionListItem[];
  saleType: string | null;
  onOpen: (row: CashierTransaction) => void;
}

/** Date, transaction number, lane, units, amount, chevron. */
const COLS = "78px 1fr 54px 40px 78px 14px";

const JourneyTransactions = ({ rows, lines, saleType, onOpen }: Props) => {
  const unique = [...new Map(rows.map((r) => [r.sale_id, r])).values()];

  // Units come off the receipt lines, which only exist once a type has been
  // zoomed into. A lane-filtered list has none, and says so rather than
  // printing a zero it cannot stand behind.
  const qtyById = new Map<string, number>();
  for (const l of lines) {
    if (saleType && l.sale_type !== saleType) continue;
    qtyById.set(l.sale_id, (qtyById.get(l.sale_id) ?? 0) + lineQty(l));
  }

  return (
    <>
      <div className={GRID_HEAD} style={{ gridTemplateColumns: COLS }}>
        <span>Date</span>
        <span>Transaction</span>
        <span>Lane</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Amount</span>
        <span />
      </div>

      {unique.map((r, i) => (
        <button
          key={r.sale_id}
          onClick={() => onOpen(r)}
          title="Open the whole receipt"
          className={`w-full text-left transition-colors hover:bg-gray-50 ${GRID_ROW} ${
            i % 2 === 1 ? "bg-row_stripe" : ""
          }`}
          style={{ gridTemplateColumns: COLS }}
        >
          <span className={`${GRID_CELL} tabular-nums opacity-85`}>
            {formatDateSimple(r.sale_date.slice(0, 10))}
          </span>
          <span className={`${GRID_CELL} font-medium tabular-nums`}>
            {transactionLabel(r.sale_id)}
          </span>
          <span className={`${GRID_CELL} tabular-nums`}>
            {laneOf(r) || "—"}
          </span>
          <span className={GRID_NUM}>
            {qtyById.has(r.sale_id)
              ? Math.abs(qtyById.get(r.sale_id) ?? 0)
              : "—"}
          </span>
          <span className={GRID_NUM}>
            {formatCurrency2(Math.abs(r.total_sales ?? 0))}
          </span>
          <ChevronRightIcon className="w-4 h-4 text-content/85" />
        </button>
      ))}

      {unique.length === 0 && <div className={GRID_NOTE}>Nothing here.</div>}
    </>
  );
};

export default JourneyTransactions;
