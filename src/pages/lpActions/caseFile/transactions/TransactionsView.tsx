import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { clearLpFacets } from "../../../../features/lpActionsSlice";
import { formatCurrency2 } from "../../../../utils";
import { useCaseReceipts } from "../../case/useCaseReceipts";
import { buildTypeScopes, buildTenderScope } from "../caseScopes";
import FacetRail from "./FacetRail";
import EvidenceTable from "./EvidenceTable";
import ReceiptSheet from "./ReceiptSheet";
import {
  buildEvidence,
  buildFacets,
  applyFacets,
  type EvidenceRow,
} from "./facetsModel";
import { buildFinding, hotLaneOf } from "./findingModel";
import type { CaseFile } from "../caseFileModel";

/**
 * The evidence half: filters on the left, receipts on the right.
 *
 * This is the step that costs. Everything before it derives from rows the walk
 * already had; here the receipt lines are read, one request per exception type
 * plus one for tender. They are cached by scope, so coming back to a case, or
 * arriving here from the charts that already needed the hours, finds them
 * waiting.
 *
 * Tender is not an exception and never arrives with them, but how a suspect
 * transaction was paid for is the question LP asks next — so it is read
 * alongside and joined on the sale id.
 */
interface Props {
  file: CaseFile;
}

const TransactionsView = ({ file }: Props) => {
  const dispatch = useAppDispatch();
  const { rawRows, caseCashier, facets, openReceipt } = useAppSelector(
    (s) => s.lpActions,
  );

  const scopes = useMemo(() => {
    const byType = buildTypeScopes(rawRows, caseCashier);
    const tender = buildTenderScope(rawRows, caseCashier);
    return tender ? [...byType, tender] : byType;
  }, [rawRows, caseCashier]);

  const receipts = useCaseReceipts(scopes);

  const types = useMemo(
    () => file.cards.filter((c) => c.count > 0).map((c) => c.saleType),
    [file.cards],
  );

  /** Sale id -> how it was paid. Built from the tender lines, which are in the
   *  same response set but are not evidence themselves. */
  const tenderBySale = useMemo(() => {
    const map = new Map<string, string>();
    for (const line of receipts.lines) {
      if (!/tender/i.test(line.sale_type)) continue;
      const label = (line.product_description ?? "").trim();
      if (label && !map.has(line.sale_id)) map.set(line.sale_id, label);
    }
    return map;
  }, [receipts.lines]);

  const all = useMemo(
    () => buildEvidence(receipts.lines, types, tenderBySale),
    [receipts.lines, types, tenderBySale],
  );

  const groups = useMemo(() => buildFacets(all, facets), [all, facets]);
  const rows = useMemo(() => applyFacets(all, facets), [all, facets]);

  const finding = useMemo(() => buildFinding(all), [all]);
  const hotLane = useMemo(() => hotLaneOf(all), [all]);

  const value = useMemo(
    () => rows.reduce((acc, r) => acc + Math.abs(r.amount), 0),
    [rows],
  );

  const clicked: EvidenceRow | null = useMemo(
    () =>
      openReceipt
        ? (rows.find(
            (r) =>
              r.saleId === openReceipt.saleId &&
              r.saleType === openReceipt.saleType,
          ) ??
          rows.find((r) => r.saleId === openReceipt.saleId) ??
          null)
        : null,
    [rows, openReceipt],
  );

  const filtered = Object.keys(facets).length > 0;

  if (receipts.loading && all.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-[12px] text-content/85">
        Reading the receipts behind this case…
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-y-auto thin-scrollbar p-4">
        <div className="grid gap-3 grid-cols-[206px_minmax(0,1fr)]">
          <FacetRail groups={groups} />

          <div className="rounded-lg border border-gray-200 overflow-hidden flex flex-col min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap px-3 py-2 border-b border-gray-100">
              <span className="text-[12px] font-semibold text-content">
                {rows.length}{" "}
                {rows.length === 1 ? "exception" : "exceptions"} ·{" "}
                {formatCurrency2(value)}
              </span>
              <span className="text-[11px] text-content/85">
                {filtered
                  ? "Filtered — each group's counts exclude its own filter."
                  : "No filters — showing every exception in the period."}
              </span>
              {filtered && (
                <button
                  onClick={() => dispatch(clearLpFacets())}
                  className="ml-auto text-[11px] font-medium text-content hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {receipts.error && (
              <p className="px-3 py-2 text-[11px] text-severity_critical_text">
                {receipts.error}
              </p>
            )}

            <div className="max-h-[460px] overflow-hidden">
              <EvidenceTable
                rows={rows}
                storeid={caseCashier?.storeid ?? 0}
              />
            </div>
          </div>
        </div>
      </div>

      <ReceiptSheet
        row={clicked}
        all={all}
        finding={finding}
        hotLane={hotLane}
      />
    </>
  );
};

export default TransactionsView;
