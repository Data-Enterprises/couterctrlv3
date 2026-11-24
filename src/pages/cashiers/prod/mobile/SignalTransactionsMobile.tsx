// Hooks
import { useEffect, useMemo, useRef } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useCashierSignals, useCashiersState } from "../hooks";

// Redux
import { setExplorerReceipt } from "../../../../features/cashiersSlice";

// Utils
import { formatCurrency2 } from "../../../../utils";
import {
  describeSignal,
  groupSignalByTransaction,
  lensListLabel,
  receiptLinesFor,
} from "../utils";

// Components
import BottomSheet from "../../../../components/BottomSheet";
import MobilePerfDetail from "../../../../components/mobile/MobilePerfDetail";
import Transaction from "../../../../components/transactions/Transaction";
import PhoneFigure from "./components/PhoneFigure";
import TxnRowMobile from "./components/TxnRowMobile";

interface SignalTransactionsMobileProps {
  onBack: () => void;
}

/**
 * One signal's transactions, between the signal list and a receipt: a screen
 * (the receipt is the sheet) in `MobilePerfDetail`, with one tab (no tab row).
 * The band under the header is `describeSignal()`, the explorer's reading of
 * what the signal means.
 */
const SignalTransactionsMobile = ({
  onBack,
}: SignalTransactionsMobileProps) => {
  const {
    explorerSignalKey,
    explorerLens,
    explorerFetchedException,
    explorerAllRows,
    explorerReceiptSaleId: openSaleId,
  } = useCashiersState();
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
        <section className="cc-card-phone">
          <p className="border-b border-brand_line px-3.5 py-2.5 text-[12px] leading-relaxed text-content/95">
            {describeSignal(signal, explorerLens)}
          </p>

          <div className="grid grid-cols-3 gap-x-4 gap-y-2.5 border-b border-brand_line px-3.5 py-2.5">
            <PhoneFigure
              label="Trans"
              value={signal.transactions.toLocaleString()}
              tabular
            />
            <PhoneFigure
              label="Lines"
              value={signal.count.toLocaleString()}
              tabular
            />
            <PhoneFigure
              label="Total"
              value={formatCurrency2(signal.amount)}
              tabular
            />
          </div>

          {rows.map((r) => (
            <TxnRowMobile
              key={r.saleId}
              txn={r}
              onOpen={() => dispatch(setExplorerReceipt(r.saleId))}
            />
          ))}
        </section>
      </MobilePerfDetail>

      {receipt.length > 0 && (
        <BottomSheet
          onClose={() => dispatch(setExplorerReceipt(null))}
          closeRef={sheetCloseRef}
        >
          {/* saleType is passed so the receipt doesn't read Loss
              Prevention's own selected type. */}
          <Transaction
            trans={receipt}
            saleType={explorerFetchedException}
            compact
          />
        </BottomSheet>
      )}
    </>
  );
};

export default SignalTransactionsMobile;
