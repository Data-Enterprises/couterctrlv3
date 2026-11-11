// Hooks
import { useMemo, useState } from "react";

// Utils
import { formatCurrency2 } from "../../../../utils";
import {
  describeSignal,
  formatClock,
  formatQty,
  GRID_COLS,
  groupSignalByTransaction,
  receiptLinesFor,
  transactionLabel,
} from "../utils";

// Interfaces
import type { SortCol, Signal } from "../interfaces";
import type { TransactionListItem } from "../../../../interfaces";
import type { ExplorerLens } from "../../../../features/dev/devCashiersSlice";

// Components
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/20/solid";
import Transaction from "./Transaction";

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
  const [sort, setSort] = useState<{ col: SortCol; dir: "desc" | "asc" } | null>(
    null,
  );

  const finding = describeSignal(signal, lens);
  const isBehaviour = signal.spread === "single" || signal.spread === "narrow";

  // Same tri-state cycle used by the Sub Dept Margins tables: unsorted →
  // desc → asc → back to the default ordering.
  const handleSort = (col: SortCol) =>
    setSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });

  const grouped = useMemo(
    () => groupSignalByTransaction(signal, transactionLengths),
    [signal, transactionLengths],
  );

  const transactions = useMemo(() => {
    if (!sort) return grouped;
    const rows = [...grouped];
    rows.sort((a, b) => {
      let diff: number;
      switch (sort.col) {
        case "date":
          diff = `${a.saleDate}${a.startTime}`.localeCompare(
            `${b.saleDate}${b.startTime}`,
          );
          break;
        case "transaction":
          diff = transactionLabel(a.saleId).localeCompare(
            transactionLabel(b.saleId),
            undefined,
            { numeric: true },
          );
          break;
        case "qty":
          diff = a.qty - b.qty;
          break;
        case "amount":
          diff = a.amount - b.amount;
          break;
      }
      return sort.dir === "asc" ? diff : -diff;
    });
    return rows;
  }, [grouped, sort]);

  const openLines = useMemo(
    () => (openTransaction ? receiptLinesFor(allRows, openTransaction) : []),
    [allRows, openTransaction],
  );

  const isReceiptMode = openTransaction !== null && openLines.length > 0;

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-line_hair flex-shrink-0">
        <div className="text-[13.5px] font-medium text-content">
          {signal.label}
        </div>
        <div className="text-[11px] text-content/95 mt-0.5">
          {signal.count} exception {signal.count === 1 ? "line" : "lines"} ·{" "}
          {signal.transactions}{" "}
          {signal.transactions === 1 ? "transaction" : "transactions"} ·{" "}
          {formatCurrency2(signal.amount)}
        </div>
      </div>

      {isReceiptMode ? (
        <>
          {/* Back bar sits in the same slot as the list's column header so the
              panel doesn't shift height when toggling — same as LP. */}
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-fill_muted border-b border-line_hair">
            <button
              onClick={() => setOpenTransaction(null)}
              className="text-[12px] font-semibold text-brand_navy hover:text-brand_navy/70 transition-colors"
            >
              ← Back
            </button>
            <span className="text-[11px] text-content/95">
              Transaction {transactionLabel(openTransaction!)}
            </span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Transaction trans={openLines} />
          </div>
        </>
      ) : (
        <>
          <div
            className={`px-4 py-2 border-b border-line_hair flex-shrink-0 ${
              isBehaviour ? "bg-severity_critical_bg" : "bg-severity_watch_bg"
            }`}
          >
            <p
              className={`text-[11.5px] leading-relaxed ${
                isBehaviour ? "text-severity_critical_text" : "text-severity_watch_text"
              }`}
            >
              {finding}
            </p>
          </div>

          <div
            className={`grid ${GRID_COLS} px-4 py-1.5 bg-fill_soft text-[10px] cc-caps-strong flex-shrink-0`}
          >
            {(
              [
                { col: "date", label: "Date · time", align: "" },
                { col: "transaction", label: "Transaction", align: "" },
                { col: null, label: "Cashier", align: "" },
                { col: null, label: "Lines", align: "" },
                { col: "qty", label: "Qty", align: "justify-end text-right" },
                { col: "amount", label: "Amount", align: "justify-end text-right" },
              ] as { col: SortCol | null; label: string; align: string }[]
            ).map(({ col, label, align }) =>
              col ? (
                <button
                  key={label}
                  onClick={() => handleSort(col)}
                  className={`flex items-center gap-0.5 uppercase tracking-wide cc-muted-link ${align}`}
                >
                  {label}
                  {sort?.col === col &&
                    (sort.dir === "desc" ? (
                      <ChevronDownIcon className="w-3 h-3" />
                    ) : (
                      <ChevronUpIcon className="w-3 h-3" />
                    ))}
                </button>
              ) : (
                <div key={label} className={align}>
                  {label}
                </div>
              ),
            )}
          </div>

          <div className="cc-scroll divide-y divide-brand_navy/15">
            {transactions.map((t) => (
              <button
                key={t.saleId}
                onClick={() => setOpenTransaction(t.saleId)}
                className={`w-full text-left grid ${GRID_COLS} px-4 py-2 text-[12px] text-content items-center transition-colors even:bg-row_stripe hover:bg-fill_soft`}
              >
                <div className="truncate">
                  {t.saleDate} · {formatClock(t.startTime)}
                </div>
                <div className="truncate text-blue-700 font-medium">
                  {transactionLabel(t.saleId)}
                </div>
                <div className="truncate">
                  {t.cashierName || `#${t.cashierNumber}`}
                </div>
                <div className={t.hasLastLine ? "text-delta_negative_text font-medium" : ""}>
                  {t.lineCount} of {t.totalLines}
                  {t.hasLastLine ? " · last" : ""}
                </div>
                <div className="text-right">{formatQty(t.qty)}</div>
                <div className="text-right">{formatCurrency2(t.amount)}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SignalDetail;
