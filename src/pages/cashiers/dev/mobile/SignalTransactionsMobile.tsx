import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setExplorerReceipt } from "../../../../features/dev/devCashiersSlice";
import { formatCurrency2 } from "../../../../utils";
import BottomSheet from "../../../../components-dev/BottomSheet";
import MobilePerfDetail from "../../../../components-dev/mobile/MobilePerfDetail";
import Transaction from "../../../../components-dev/transactions/Transaction";
import {
  describeSignal,
  groupSignalByTransaction,
  formatClock,
  lensListLabel,
  receiptLinesFor,
  transactionLabel,
} from "../explorer/lensUtils";
import { useCashierSignals } from "../useCashierSignals";

/**
 * One signal's transactions — the drill-down between the signal list and a
 * receipt.
 *
 * A screen rather than a sheet, matching Loss Prevention: the receipt itself is
 * the sheet, and stacking one inside another is the thing that pattern exists
 * to avoid. It wears `MobilePerfDetail`, the same wrapper every other mobile
 * Performance drill uses, rather than its own navy bar — the back control, the
 * scope line and the start-at-the-top behaviour all come with it.
 *
 * One tab. `MobilePerfDetail` renders no tab row for a single entry, which is
 * what this wants: there is one breakdown of a signal and a lone tab would be
 * a label pretending to be a control.
 *
 * The band under the header is `describeSignal()` — the explorer's own reading
 * of what the signal means ("…likely an unmapped item rather than cashier
 * behavior"). It is the most useful thing the desktop produces and had no
 * mobile home before this.
 */

/**
 * One labelled figure on a row's second line.
 *
 * The label is the quieter half — it is there so the number can be read
 * without counting positions, not to compete with it. It gets there on case
 * and letter-spacing rather than opacity, which is the caption treatment the
 * rest of these screens use and the only one left now the text floor is /95:
 * dimming a label to subordinate it is exactly what that floor forbids.
 */
const Meta = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <>
    <span className="uppercase tracking-wider">{label}</span>{" "}
    <span className="font-semibold text-content">{children}</span>
  </>
);

const SignalTransactionsMobile = ({ onBack }: { onBack: () => void }) => {
  const {
    explorerSignalKey,
    explorerLens,
    explorerFetchedException,
    explorerAllRows,
    explorerReceiptSaleId: openSaleId,
  } = useAppSelector((s) => s.dev.cashier);
  const dispatch = useAppDispatch();
  const { signals, transactionLengths } = useCashierSignals();
  // A receipt left open shouldn't greet you as a sheet the next time you
  // open the page — it closes when this screen goes away.
  useEffect(
    () => () => {
      dispatch(setExplorerReceipt(null));
    },
    [],
  );
  const sheetCloseRef = useRef<(() => void) | null>(null);

  const signal = useMemo(
    () => signals.find((s) => s.key === explorerSignalKey) ?? null,
    [signals, explorerSignalKey],
  );

  const rows = useMemo(
    () => (signal ? groupSignalByTransaction(signal, transactionLengths) : []),
    [signal, transactionLengths],
  );

  // The whole receipt, the same lines desktop's SignalDetail opens.
  const receipt = useMemo(
    () => (openSaleId ? receiptLinesFor(explorerAllRows, openSaleId) : []),
    [explorerAllRows, openSaleId],
  );

  if (!signal) return null;

  return (
    <>
      <MobilePerfDetail
        tabs={[{ key: "transactions" as const, label: "Transactions" }]}
        active="transactions"
        onTab={() => {}}
        scopeName={signal.label}
        when={`${explorerFetchedException} · ${signal.sublabel}`}
        backLabel={`Back to ${lensListLabel(explorerLens)}`}
        onBack={onBack}
        levelKey={`signal|${signal.key}`}
      >
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
          <p className="border-b border-brand_line px-3.5 py-2.5 text-[12px] leading-relaxed text-content/95">
            {describeSignal(signal, explorerLens)}
          </p>

          <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 border-b border-brand_line px-3.5 py-2.5">
            {(
              [
                ["Trans", signal.transactions.toLocaleString()],
                ["Lines", signal.count.toLocaleString()],
                ["Total", formatCurrency2(signal.amount)],
              ] as [string, string][]
            ).map(([k, v]) => (
              <div key={k} className="flex flex-col items-center text-center">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/95">
                  {k}
                </span>
                <span className="font-display text-[15px] font-bold tabular-nums text-content">
                  {v}
                </span>
              </div>
            ))}
          </div>

          {rows.map((r) => (
            <button
              key={r.saleId}
              type="button"
              onClick={() => dispatch(setExplorerReceipt(r.saleId))}
              className="block w-full border-t border-brand_line px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
            >
              <div className="flex items-baseline gap-2">
                <span className="flex-none font-display text-[13.5px] font-semibold text-content">
                  #{transactionLabel(r.saleId)}
                </span>
                {/* The cashier is the answer on every lens except Cashier —
                    on Store, Item and Terminal it is exactly who you are
                    trying to identify. */}
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-content/95">
                  {r.cashierName}
                </span>
                <span className="flex-none font-display text-[13px] font-bold tabular-nums text-content">
                  {formatCurrency2(r.amount)}
                </span>
                <ChevronRightIcon className="h-4 w-4 flex-none self-center text-content/95" />
              </div>
              {/* Each figure carries its own label rather than sitting under
                  a column band that scrolls away on the second row. Date and
                  time especially: "10/14 · 16:12" is two unlabelled numbers,
                  and on a refund row beside a quantity it is not obvious
                  which is which. */}
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
          ))}
        </section>
      </MobilePerfDetail>

      {receipt.length > 0 && (
        <BottomSheet
          onClose={() => dispatch(setExplorerReceipt(null))}
          closeRef={sheetCloseRef}
        >
          {/* saleType is passed rather than left to the component: LP's
              receipt otherwise reads Loss Prevention's own selected type,
              which has nothing to do with the exception loaded here. */}
          <Transaction trans={receipt} saleType={explorerFetchedException} compact />
        </BottomSheet>
      )}
    </>
  );
};

export default SignalTransactionsMobile;
