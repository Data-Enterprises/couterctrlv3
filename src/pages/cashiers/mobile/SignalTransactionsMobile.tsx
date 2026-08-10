import { useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import BottomSheet from "../../../components/BottomSheet";
import Transaction from "../../lossPrevention/Transaction";
import type { TransactionListItem } from "../../../interfaces";
import {
  describeSignal,
  groupSignalByTransaction,
  formatClock,
} from "../explorer/lensUtils";
import { useCashierSignals } from "../useCashierSignals";

/**
 * One signal's transactions — the drill-down between the signal list and a
 * receipt.
 *
 * A screen rather than a sheet, matching Loss Prevention: the receipt itself is
 * the sheet, and stacking one inside another is the thing that pattern exists
 * to avoid.
 *
 * The band under the header is `describeSignal()` — the explorer's own reading
 * of what the signal means ("…likely an unmapped item rather than cashier
 * behavior"). It is the most useful thing the desktop produces and had no
 * mobile home before this.
 */

const SignalTransactionsMobile = ({ onBack }: { onBack: () => void }) => {
  const { explorerSignalKey, explorerLens, explorerFetchedException } =
    useAppSelector((s) => s.cashier);
  const { signals, transactionLengths } = useCashierSignals();
  const [receipt, setReceipt] = useState<TransactionListItem[] | null>(null);
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const signal = useMemo(
    () => signals.find((s) => s.key === explorerSignalKey) ?? null,
    [signals, explorerSignalKey],
  );

  const rows = useMemo(
    () => (signal ? groupSignalByTransaction(signal, transactionLengths) : []),
    [signal, transactionLengths],
  );

  if (!signal) return null;

  return (
    <>
      <div className="flex flex-col h-[calc(100dvh-3rem)] bg-gray-50 overflow-hidden">
        <div className="bg-[#1e2a4a] px-3 pt-2 pb-2.5 flex items-start gap-3 flex-shrink-0">
          <button
            onClick={onBack}
            aria-label="Back to signals"
            className="text-custom-white/85 mt-0.5 flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold text-custom-white truncate">
              {signal.label}
            </div>
            <div className="text-[11px] mt-0.5 text-custom-white/85 truncate">
              {explorerFetchedException} · {signal.sublabel}
            </div>
          </div>
        </div>

        <div className="px-3 py-2 bg-custom-white border-b border-[#1e2a4a]/15 flex-shrink-0">
          <p className="text-[11px] leading-relaxed text-content/85">
            {describeSignal(signal, explorerLens)}
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-gray-100 bg-custom-white border-b border-[#1e2a4a]/15 flex-shrink-0">
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              Trans
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums">
              {signal.transactions.toLocaleString()}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              Lines
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums">
              {signal.count.toLocaleString()}
            </div>
          </div>
          <div className="px-3 py-2">
            <div className="text-[10px] font-medium uppercase tracking-wide text-content/85">
              Total
            </div>
            <div className="text-[12px] font-semibold text-content mt-0.5 tabular-nums">
              {formatCurrency2(signal.amount)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b border-[#1e2a4a]/15 flex-shrink-0 text-[10px] font-medium uppercase tracking-wide text-content/85">
          <span>Transaction · cashier</span>
          <span>Lines · qty · amount</span>
        </div>

        {/* pb-14 clears the fixed bottom tab bar. */}
        <div className="flex-1 overflow-y-auto pb-14">
          {rows.map((r) => (
            <button
              key={r.saleId}
              onClick={() =>
                setReceipt(
                  signal.rows.filter((row) => String(row.sale_id) === r.saleId),
                )
              }
              className="w-full px-3 py-2.5 bg-custom-white border-b border-[#1e2a4a]/15 even:bg-row_stripe text-left active:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-content">
                  #{r.saleId}
                </span>
                {/* The cashier is the answer on every lens except Cashier —
                    on Store, Item and Terminal it is exactly who you are
                    trying to identify. */}
                <span className="flex-1 text-[12px] text-content/85 truncate">
                  {r.cashierName}
                </span>
                <span className="text-[12px] font-semibold text-content tabular-nums">
                  {formatCurrency2(r.amount)}
                </span>
                <ChevronRightIcon className="w-4 h-4 text-content/85 flex-shrink-0" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="flex-1 text-[11px] text-content/85 tabular-nums truncate">
                  {r.saleDate.split("T")[0].slice(5).replace("-", "/")}
                  {r.startTime ? ` · ${formatClock(r.startTime)}` : ""}
                </span>
                {/* "1 of 2 · last" — position in the receipt, and whether the
                    exception was the final line. Voiding the last line is the
                    classic tell, and desktop calls it out in its own summary,
                    so it cannot be dropped on mobile. */}
                <span className="text-[11px] text-content/85 tabular-nums">
                  {r.lineCount} of {r.totalLines}
                </span>
                {r.hasLastLine && (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    last
                  </span>
                )}
                <span className="text-[11px] text-content/85 tabular-nums">
                  {r.qty} qty
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {receipt && (
        <BottomSheet onClose={() => setReceipt(null)} closeRef={sheetCloseRef}>
          <Transaction trans={receipt} compact />
        </BottomSheet>
      )}
    </>
  );
};

export default SignalTransactionsMobile;
