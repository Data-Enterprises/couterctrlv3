// Utils
import { formatCurrency2 } from "../../../../../utils";
import { formatClock, transactionLabel } from "../../utils";

// Interfaces
import type { SignalTransaction } from "../../interfaces";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import Meta from "./Meta";

interface TxnRowMobileProps {
  txn: SignalTransaction;
  onOpen: () => void;
}

/** One transaction on the phone: its number, cashier and amount, then its
 *  date, time and qty. Opens the receipt sheet. */
const TxnRowMobile = ({ txn: r, onOpen }: TxnRowMobileProps) => (
  <button
    type="button"
    onClick={onOpen}
    className="block w-full border-t border-brand_line px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
  >
    <div className="flex items-baseline gap-2">
      <span className="flex-none font-display text-[13.5px] font-semibold text-content">
        #{transactionLabel(r.saleId)}
      </span>
      {/* The cashier is the answer on every lens but Cashier. */}
      <span className="min-w-0 flex-1 truncate text-[12.5px] text-content/95">
        {r.cashierName}
      </span>
      <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
        {formatCurrency2(r.amount)}
      </span>
      <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/95" />
    </div>
    {/* Each figure carries its own label, date and time included. */}
    <div className="mt-1 flex items-center gap-2">
      <span className="min-w-0 truncate font-mono text-[12px] tabular-nums text-content/95">
        <Meta label="Date">
          {r.saleDate.split("T")[0].slice(5).replace("-", "/")}
        </Meta>
        {r.startTime && (
          <>
            {" · "}
            <Meta label="Time">{formatClock(r.startTime)}</Meta>
          </>
        )}
        {" · "}
        <Meta label="Qty">{r.qty}</Meta>
      </span>
    </div>
  </button>
);

export default TxnRowMobile;
