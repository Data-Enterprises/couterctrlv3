import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setLpJourneyCashier } from "../../features/lpActionsSlice";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, formatDateSimple } from "../../utils";
import { buildCashierJourney } from "./journeyModel";
import CashierJourneyChart from "./CashierJourneyChart";
import SummaryCard from "./JourneySummary";
import { summariseByType } from "./summaryModel";
import { useReceiptCase } from "./useReceiptCase";
import ReceiptCase from "./ReceiptCase";

/**
 * A cashier's whole exception picture, over the weeks already walked.
 *
 * Every type they touch, not just the one that led here — the row you clicked
 * was one exception at one store, and the question a link chart answers is
 * what else this person is involved in.
 *
 * Clicking a node filters the receipts below it. The chart is the index; the
 * list is the evidence, and nothing on the chart is worth trusting without it.
 */
const CashierJourney = () => {
  const dispatch = useAppDispatch();
  const { rawRows, windows, journeyCashier } = useAppSelector(
    (s) => s.lpActions,
  );
  const [focus, setFocus] = useState<string | null>(null);
  const { receipt, openReceipt, closeReceipt } = useReceiptCase();

  const journey = useMemo(
    () =>
      journeyCashier === null
        ? null
        : buildCashierJourney(rawRows, windows, journeyCashier),
    [rawRows, windows, journeyCashier],
  );

  const mine = useMemo(
    () =>
      journeyCashier === null
        ? []
        : rawRows.filter((r) => r.cashier_number === journeyCashier),
    [rawRows, journeyCashier],
  );

  /** The focused node, as a plain value — `type:Voided` or `lane:3`. */
  const focusValue = focus ? focus.split(/:(.+)/)[1] : null;
  const focusKind = focus ? focus.split(/:(.+)/)[0] : null;

  const scoped = useMemo(() => {
    if (!focus) return mine;
    return mine.filter((r) =>
      focusKind === "type"
        ? r.sale_type === focusValue
        : (String(r.termainal || "").trim() || "—") === focusValue,
    );
  }, [mine, focus, focusKind, focusValue]);

  const receiptCount = useMemo(
    () => new Set(scoped.map((r) => r.sale_id)).size,
    [scoped],
  );

  // Nothing selected: every type at once, so the shape of the week reads
  // without a click. Selected: that one type, with its receipts under it.
  const summaries = useMemo(
    () => summariseByType(focus ? scoped : mine),
    [focus, scoped, mine],
  );

  if (journeyCashier === null || !journey) return null;

  const close = () => {
    closeReceipt();
    setFocus(null);
    dispatch(setLpJourneyCashier(null));
  };

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={close}
    >
      <div
        className="bg-custom-white rounded-xl shadow-xl w-full max-w-[1120px] max-h-[92vh] flex flex-col overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2.5 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-custom-white text-[13px] font-semibold truncate">
              {journey.cashierName}
            </p>
            <p className="text-custom-white/85 text-[12px] truncate">
              Cashier {journey.cashierNumber} &middot; {journey.storeName}{" "}
              &middot; {journey.total} exceptions across {journey.types.length}{" "}
              {journey.types.length === 1 ? "type" : "types"}
            </p>
          </div>
          <button
            onClick={close}
            title="Close"
            className="flex-shrink-0 p-1 -mr-1 rounded text-custom-white/85 hover:text-custom-white hover:bg-custom-white/10 transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="w-[58%] flex-shrink-0 border-r border-gray-100 p-3 overflow-y-auto thin-scrollbar">
            <CashierJourneyChart
              journey={journey}
              selected={focus}
              onSelect={setFocus}
            />
            <p className="text-[11.5px] text-content/85 leading-snug mt-1 px-1">
              Inner ring is exception types, coloured on this cashier&rsquo;s
              own movement. Outer ring is lanes. A heavier outline means other
              cashiers reach that node too —{" "}
              <span className="font-medium">+n</span> is how many. Click any
              node to filter the receipts.
            </p>
          </div>

          <div className="flex-1 min-w-0 flex flex-col relative">
            <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85 flex-1 truncate">
                {focus
                  ? `${focusValue} · ${scoped.length} occurrences across ${receiptCount} ${receiptCount === 1 ? "receipt" : "receipts"}`
                  : "Summary by exception type"}
              </span>
              {focus && (
                <button
                  onClick={() => setFocus(null)}
                  className="text-[11.5px] font-medium text-content hover:underline flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {summaries.length === 0 && (
                <div className="py-8 text-center text-[12px] text-content/85">
                  Nothing under that node.
                </div>
              )}

              {summaries.map((sum) => (
                <SummaryCard
                  key={sum.saleType}
                  s={sum}
                  active={focus === `type:${sum.saleType}`}
                  onClick={
                    focus ? undefined : () => setFocus(`type:${sum.saleType}`)
                  }
                />
              ))}

              {focus && (
                <>
                  <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-content/85">
                    Transactions
                  </div>
                  {/* Index is part of the key on purpose. `cashier_table`
                      returns a row per exception occurrence, so six cancelled
                      lines on one receipt arrive as six rows with the same
                      sale id, type and date — no field distinguishes them.
                      Duplicate keys let React reuse the previous list's DOM,
                      which is why switching node left the rows stale. */}
                  {scoped.map((r, i) => (
                    <button
                      key={`${r.sale_id}-${r.sale_type}-${r.sale_date}-${i}`}
                      onClick={() => openReceipt(r)}
                      title="Open the whole receipt"
                      className="w-full text-left px-3 py-2 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="text-[12.5px] font-medium text-content truncate flex-1">
                          {r.sale_type}
                        </span>
                        <span className="text-[12px] tabular-nums text-content flex-shrink-0">
                          {formatCurrency2(r.total_sales)}
                        </span>
                      </div>
                      <div className="text-[11.5px] text-content/85 truncate">
                        {formatDateSimple(r.sale_date.slice(0, 10))} · lane{" "}
                        {String(r.termainal || "").trim() || "—"} · {r.sale_id}
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>

            {receipt.saleId && (
              <ReceiptCase state={receipt} onClose={closeReceipt} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierJourney;
