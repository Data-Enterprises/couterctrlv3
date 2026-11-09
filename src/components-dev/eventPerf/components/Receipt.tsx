// Utils
import { formatCurrency2 } from "../../../utils";
import { receiptLabel } from "../utils";
import { fmtInt } from "../utils/display";

// Interfaces
import type { EventReceiptState } from "../../../features/dev/devEventPerfSlice";
import type { EventReceipt } from "../utils";
import type { ReceiptLine } from "../interfaces";

// Components
import Rule from "./Rule";
import Total from "./Total";

/**
 * One transaction, laid out like the paper it came off.
 *
 * Monospace, centred header, dashed rules, amounts hard right. The point is
 * recognition: someone holding the printed copy should be able to read the two
 * side by side without translating between them. Legibility still wins where
 * the two disagree — 12px rather than a true till roll's 8, and the store and
 * cashier named in full rather than abbreviated.
 */
const Receipt = ({
  txn,
  receipt,
  when,
}: {
  txn: EventReceipt;
  /** Null until the slice has a state for this receipt — read as loading. */
  receipt: EventReceiptState | null;
  when: string;
}) => {
  const status = receipt?.status ?? "loading";
  const lines: ReceiptLine[] = receipt?.lines ?? [];
  const items = lines.filter((l) => l.kind !== "tender");
  const tenders = lines.filter((l) => l.kind === "tender");
  const itemTotal = items.reduce((a, l) => a + l.amount, 0);

  return (
    <>
      <div className="mx-auto w-full max-w-md flex-shrink-0 px-5 pt-1 text-center">
        <div className="font-mono text-[13px] font-bold uppercase tracking-wider text-content">
          {txn.storeName}
        </div>
        <div className="mt-0.5 font-mono text-[11px] text-content/95">
          {[txn.cashierName, txn.terminal ? `Lane ${txn.terminal}` : "", when]
            .filter(Boolean)
            .join("  ·  ")}
        </div>
        <Rule>#{receiptLabel(txn.saleId)}</Rule>
      </div>

      <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-6">
        {status === "loading" ? (
          <div className="py-8 text-center font-mono text-[12px] text-content/95">
            Loading receipt...
          </div>
        ) : status === "error" ? (
          // Not "no lines": a fetch that failed says nothing about what was on
          // the receipt, and reading it as empty is the wrong conclusion.
          <div className="py-8 text-center font-mono text-[12px] text-content">
            Couldn't load this receipt. Close it and tap the transaction to try
            again.
          </div>
        ) : lines.length === 0 ? (
          <div className="py-8 text-center font-mono text-[12px] text-content/95">
            No lines came back for this transaction.
          </div>
        ) : (
          <>
            {items.map((l, i) => (
              <div
                // Receipts repeat: two of the same item ring as two lines, and
                // collapsing them would hide exactly the pattern LP looks for.
                key={`${l.description}-${i}`}
                className="flex items-baseline gap-3 py-1.5"
              >
                <span className="min-w-0 flex-1 font-mono text-[12px] uppercase leading-snug text-content">
                  {l.description}
                  {Math.abs(l.qty) !== 1 && l.qty !== 0 && (
                    <span className="mt-0.5 block text-[11px] normal-case text-content/95">
                      {l.qty.toLocaleString("en-US")} @{" "}
                      {formatCurrency2(l.amount / l.qty)}
                    </span>
                  )}
                </span>
                <span className="flex-none font-mono text-[12.5px] font-semibold tabular-nums text-content">
                  {formatCurrency2(l.amount)}
                </span>
              </div>
            ))}

            <Rule />
            <Total label="Items" value={fmtInt(items.length)} />
            <Total label="Total" value={formatCurrency2(itemTotal)} strong />

            {tenders.length > 0 && (
              <>
                <Rule />
                {tenders.map((t, i) => (
                  <Total
                    key={`${t.description}-${i}`}
                    label={t.description}
                    value={formatCurrency2(t.amount)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Receipt;
