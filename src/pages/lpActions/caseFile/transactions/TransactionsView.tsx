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
 * Laid out the way Loss Prevention's own right panel is — two flush columns
 * split by a hairline, each with its own `gray-100` header and its own
 * scroller, rather than two rounded cards floating in a padded area. The panel
 * is already the card; a bordered box inside it reads as a second one.
 *
 * This is the step that costs. Everything before it derives from rows the walk
 * already had; here the receipt lines are read, one request per exception type
 * plus one for tender. They are cached by scope, so coming back to a case, or
 * arriving from the charts that already needed the hours, finds them waiting.
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
  const { rawRows, caseSubject, facets, openReceipt } = useAppSelector(
    (s) => s.lpActions,
  );

  const scopes = useMemo(() => {
    const byType = buildTypeScopes(rawRows, caseSubject);
    const tender = buildTenderScope(rawRows, caseSubject);
    return tender ? [...byType, tender] : byType;
  }, [rawRows, caseSubject]);

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
      <div className="h-full flex">
        <div className="w-[224px] flex-shrink-0 flex flex-col min-h-0 border-r border-gray-100">
          <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gray-100 border-b border-gray-100">
            <span className="flex-1 text-[12px] font-semibold text-content">
              Filters
            </span>
            {filtered && (
              <button
                onClick={() => dispatch(clearLpFacets())}
                className="text-[12px] font-semibold text-[#1e2a4a] hover:text-[#1e2a4a]/70 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            <FacetRail groups={groups} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col min-h-0">
          <div className="flex-shrink-0 px-3.5 py-1.5 bg-gray-100 border-b border-gray-100">
            <div className="text-[13px] font-semibold text-content">
              {rows.length} {rows.length === 1 ? "exception" : "exceptions"}{" "}
              &middot; {formatCurrency2(value)}
            </div>
          </div>

          {receipts.error && (
            <p className="flex-shrink-0 px-3.5 py-2 text-[12px] text-severity_critical_text border-b border-gray-100">
              {receipts.error}
            </p>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
            <EvidenceTable rows={rows} storeid={caseSubject?.storeid ?? 0} />
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
