// Hooks
import { useMemo, useState } from "react";

// Utils
import {
  describeSignal,
  groupSignalByTransaction,
  receiptLinesFor,
  sortSignalTransactions,
} from "../utils";

// Interfaces
import type { SortCol, Signal, TxnSort } from "../interfaces";
import type { TransactionListItem } from "../../../../interfaces";
import type { ExplorerLens } from "../../../../features/cashiersSlice";

// Components
import Transaction from "./Transaction";
import SignalSummary from "./SignalSummary";
import ReceiptBar from "./ReceiptBar";
import SignalFinding from "./SignalFinding";
import TxnSortHead from "./TxnSortHead";
import SignalTxnRow from "./SignalTxnRow";

interface SignalDetailProps {
  signal: Signal;
  lens: ExplorerLens;
  allRows: TransactionListItem[];
  transactionLengths: Record<string, number>;
}

/** The explorer's right panel for the picked signal: a sortable list of its transactions, and the receipt of one
 *  when it is opened. Remounted per signal so an open receipt does not carry over. */
const SignalDetail = ({
  signal,
  lens,
  allRows,
  transactionLengths,
}: SignalDetailProps) => {
  const [openTransaction, setOpenTransaction] = useState<string | null>(null);
  const [sort, setSort] = useState<TxnSort>(null);

  const grouped = useMemo(
    () => groupSignalByTransaction(signal, transactionLengths),
    [signal, transactionLengths],
  );

  const transactions = useMemo(
    () => sortSignalTransactions(grouped, sort),
    [grouped, sort],
  );

  const openLines = useMemo(
    () => (openTransaction ? receiptLinesFor(allRows, openTransaction) : []),
    [allRows, openTransaction],
  );

  const finding = describeSignal(signal, lens);
  const isBehaviour = signal.spread === "single" || signal.spread === "narrow";
  const isReceiptMode = openTransaction !== null && openLines.length > 0;

  // Same tri-state cycle used by the Sub Dept Margins tables: unsorted →
  // desc → asc → back to the default ordering.
  const handleSort = (col: SortCol) =>
    setSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <SignalSummary signal={signal} />

      {isReceiptMode ? (
        <>
          <ReceiptBar
            saleId={openTransaction}
            onBack={() => setOpenTransaction(null)}
          />
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Transaction trans={openLines} />
          </div>
        </>
      ) : (
        <>
          <SignalFinding finding={finding} isBehaviour={isBehaviour} />
          <TxnSortHead sort={sort} onSort={handleSort} />
          <div className="cc-scroll divide-y divide-brand_navy/15">
            {transactions.map((t) => (
              <SignalTxnRow
                key={t.saleId}
                txn={t}
                onOpen={() => setOpenTransaction(t.saleId)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SignalDetail;
