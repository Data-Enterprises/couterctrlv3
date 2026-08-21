import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { setLpJourneyCashier } from "../../features/lpActionsSlice";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { buildCashierJourney } from "./journeyModel";
import CashierJourneyChart from "./CashierJourneyChart";
import { NEUTRAL_FILL, SEV_FILL } from "./journeyTheme";
import SummaryCard from "./JourneySummary";
import { summariseByType } from "./summaryModel";
import { useReceiptCase } from "./useReceiptCase";
import { isCashier, laneOf } from "./lpActionsMetrics";
import ReceiptCase from "./ReceiptCase";
import JourneyTransactions from "./JourneyTransactions";
import DrillPanel from "./drill/DrillPanel";
import DrillExportModal from "./drill/DrillExportModal";
import FacetDetail from "./drill/FacetDetail";
import { buildBranches } from "./drill/facetModel";
import type { FacetKey } from "./drill/facetModel";
import { useCaseReceipts } from "./case/useCaseReceipts";
import type { TypeScope } from "./case/useCaseReceipts";

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
  const [facet, setFacet] = useState<FacetKey>("dow");
  const [branchKey, setBranchKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
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
        : rawRows.filter((r) => isCashier(r, journeyCashier)),
    [rawRows, journeyCashier],
  );

  const pickNode = (next: string | null) => {
    setFocus(next);
    setBranchKey(null);
  };

  const pickFacet = (next: FacetKey) => {
    setFacet(next);
    setBranchKey(null);
  };

  /** The focused node, as a plain value — `type:Voided` or `lane:3`. */
  const focusValue = focus ? focus.split(/:(.+)/)[1] : null;
  const focusKind = focus ? focus.split(/:(.+)/)[0] : null;

  const scoped = useMemo(() => {
    if (!focus) return mine;
    return mine.filter((r) =>
      focusKind === "type"
        ? r.sale_type === focusValue
        : (laneOf(r) || "—") === focusValue,
    );
  }, [mine, focus, focusKind, focusValue]);

  /** Zoomed into one exception type, rather than filtering by a node. */
  const drilled = focusKind === "type" ? focusValue : null;

  // Item, hour and tender all live on the receipt lines, which the walk does
  // not download. One request per type, the same shape the case report uses,
  // and only once a reader has actually zoomed into something.
  const scopes = useMemo<TypeScope[]>(() => {
    if (!drilled) return [];
    const ids = [...new Set(scoped.map((r) => r.sale_id))].sort();
    if (ids.length === 0) return [];
    // Tender is not an exception, but it is on the same receipts, and how a
    // suspect transaction was paid for is the question LP asks next.
    return [
      { saleType: drilled, saleIds: ids },
      { saleType: "Tender", saleIds: ids },
    ];
  }, [drilled, scoped]);

  const detail = useCaseReceipts(scopes);

  const branches = useMemo(
    () =>
      drilled
        ? buildBranches(scoped, detail.lines, windows, drilled, facet)
        : [],
    [drilled, scoped, detail.lines, windows, facet],
  );

  const branch = branches.find((b) => b.key === branchKey) ?? null;

  /** Node, then branch — each step narrows the one before it. */
  const branchScoped = useMemo(() => {
    if (!branch) return scoped;
    const ids = new Set(branch.saleIds);
    return scoped.filter((r) => ids.has(r.sale_id));
  }, [scoped, branch]);

  const receiptCount = useMemo(
    () => new Set(branchScoped.map((r) => r.sale_id)).size,
    [branchScoped],
  );

  // Nothing selected: every type at once, so the shape of the week reads
  // without a click. Selected: that one type, with its receipts under it.
  const summaries = useMemo(
    () => summariseByType(focus ? branchScoped : mine),
    [focus, branchScoped, mine],
  );

  if (journeyCashier === null || !journey) return null;

  const close = () => {
    closeReceipt();
    pickNode(null);
    dispatch(setLpJourneyCashier(null));
  };

  /** The colour of the thing that was clicked, so the bars agree with the node. */
  const timelineFill =
    focusKind === "type"
      ? (journey.types.find((t) => t.name === focusValue)?.severity ?? "steady")
      : null;

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
            {drilled ? (
              <DrillPanel
                saleType={drilled}
                total={scoped.length}
                fill={timelineFill ? SEV_FILL[timelineFill] : NEUTRAL_FILL}
                facet={facet}
                onFacet={pickFacet}
                branches={branches}
                selected={branchKey}
                onSelect={setBranchKey}
                onBack={() => pickNode(null)}
                onExport={() => setExporting(true)}
                linesLoading={detail.loading}
              />
            ) : (
              <>
                <CashierJourneyChart
                  journey={journey}
                  selected={focus}
                  onSelect={pickNode}
                />
                <p className="text-[11.5px] text-content/85 leading-snug mt-1 px-1">
                  Inner ring is exception types, coloured on this
                  cashier&rsquo;s own movement. Outer ring is lanes. A heavier
                  outline means other cashiers reach that node too —{" "}
                  <span className="font-medium">+n</span> is how many. Click a
                  type to zoom into it; click a lane to filter the receipts.
                </p>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col relative">
            <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/85 flex-1 truncate">
                {focus
                  ? `${[focusValue, branch?.label].filter(Boolean).join(" · ")} · ${branchScoped.length} occurrences across ${receiptCount} ${receiptCount === 1 ? "receipt" : "receipts"}`
                  : "Summary by exception type"}
              </span>
              {focus && (
                <button
                  onClick={() => pickNode(null)}
                  className="text-[11.5px] font-medium text-content hover:underline flex-shrink-0"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
              {drilled && branch && (
                <FacetDetail
                  branch={branch}
                  facet={facet}
                  saleType={drilled}
                  rows={scoped}
                  lines={detail.lines}
                  windows={windows}
                  linesLoading={detail.loading}
                />
              )}

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
                    focus ? undefined : () => pickNode(`type:${sum.saleType}`)
                  }
                />
              ))}

              {focus && (
                <JourneyTransactions
                  rows={branchScoped}
                  lines={detail.lines}
                  saleType={drilled}
                  onOpen={openReceipt}
                />
              )}
            </div>

            {receipt.saleId && (
              <ReceiptCase state={receipt} onClose={closeReceipt} />
            )}
          </div>
        </div>
      </div>

      {/* The shell paints its own backdrop at z-50, which is *under* this
          modal's z-[5000]. A positioned wrapper gives it a stacking context
          that outranks the journey, and swallowing mousedown stops the
          backdrop click from closing the journey underneath it. */}
      {exporting && drilled && (
        <div
          className="relative z-[6000]"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DrillExportModal
            onClose={() => setExporting(false)}
            rows={scoped}
            lines={detail.lines}
            windows={windows}
            saleType={drilled}
            cashierName={journey.cashierName}
            cashierNumber={journey.cashierNumber}
            storeName={journey.storeName}
            currentFacet={facet}
            linesLoading={detail.loading}
          />
        </div>
      )}
    </div>
  );
};

export default CashierJourney;
