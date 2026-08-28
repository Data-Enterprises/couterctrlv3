import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { setLpOpenReceipt } from "../../../../features/lpActionsSlice";
import { XMarkIcon } from "@heroicons/react/20/solid";
import Transaction from "../../../lossPrevention/Transaction";
import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import VerdictStrip from "./VerdictStrip";
import { useBasket } from "./useBasket";
import { buildVerdict } from "./verdictModel";
import type { CaseFinding } from "./findingModel";
import type { EvidenceRow } from "./facetsModel";

/**
 * One receipt, over the transactions list.
 *
 * A panel overlay, not a modal: it is bounded by the white content area, so
 * the header, the KPI strip and the footer stay live behind it. Sliding a
 * whole-screen dialog over a page someone is meant to work THROUGH is the
 * wrong posture for evidence.
 *
 * The verdict is the first row, then LP's own receipt below it — the same
 * `Transaction` component the rest of Loss Prevention renders, rather than a
 * second one that would drift from it.
 */
interface Props {
  /** The occurrence the reader clicked, for the verdict's own position and
   *  item. */
  row: EvidenceRow | null;
  /** Everything currently in the table, for the "does it repeat" check. */
  all: EvidenceRow[];
  finding: CaseFinding | null;
  hotLane: string | null;
}

const ReceiptSheet = ({ row, all, finding, hotLane }: Props) => {
  const dispatch = useAppDispatch();
  const openReceipt = useAppSelector((s) => s.lpActions.openReceipt);
  const basket = useBasket(openReceipt);

  const close = () => dispatch(setLpOpenReceipt(null));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [dispatch]);

  const verdict = useMemo(
    () =>
      row && basket.lines.length > 0
        ? buildVerdict(row, all, basket.lines, finding, hotLane)
        : null,
    [row, all, basket.lines, finding, hotLane],
  );

  const open = openReceipt !== null;

  return (
    <>
      <div
        onClick={close}
        aria-hidden={!open}
        className={`absolute inset-0 z-20 bg-content/30 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        aria-label="Transaction"
        className={`absolute inset-y-0 right-0 z-30 w-[410px] max-w-[92%] bg-custom-white shadow-xl flex flex-col transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {verdict && <VerdictStrip verdict={verdict} />}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
          <button
            onClick={close}
            aria-label="Close transaction"
            className="absolute top-2.5 right-3 z-10 w-6 h-6 flex items-center justify-center rounded border border-gray-200 text-content/85 hover:text-content hover:border-gray-300 transition-colors bg-custom-white"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>

          {basket.loading && (
            <div className="flex-1 relative">
              <LoadingIndicator message="Opening receipt…" />
            </div>
          )}

          {!basket.loading && basket.error && (
            <p className="p-4 text-[12px] text-content/85">{basket.error}</p>
          )}

          {!basket.loading && !basket.error && basket.lines.length > 0 && (
            <Transaction
              trans={basket.lines}
              saleType={openReceipt?.saleType}
            />
          )}
        </div>
      </aside>
    </>
  );
};

export default ReceiptSheet;
