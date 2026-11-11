// Hooks
import { useMemo, useRef, useEffect } from "react";

// Utils
import { formatCurrency2, formatDateSimple } from "../../../../utils";
import { normalizeProductCode } from "../../../../utils/productCode";
import { describeReceipt, ROW_COLS } from "../utils";
import { ACTION_TONE } from "../utils/actionTone";

// Interfaces
import type { ReceiverDetailsItem } from "../../../../interfaces";
import type { ActionKind } from "../interfaces";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";

interface InvoiceSheetProps {
  vendorName: string;
  invoiceId: number;
  date: string;
  /** The item you arrived from, so its line can be found without hunting. */
  fromUpc: string;
  /** That item's suggested action, so its row wears the same colour as the chip
   *  on the sheet behind this modal. Undefined while the walk is still running
   *  and nothing has been decided. */
  fromAction?: ActionKind;
  lines: ReceiverDetailsItem[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
}

/**
 * One delivery, in full.
 *
 * The expanded row in the rail answers "what happened to this item on this
 * delivery". This answers the question that one can't: *was it just my item, or
 * was the whole order off?* Three returns across five lines is a delivery
 * problem, not an item problem, and nothing else on the page can tell you that.
 *
 * Deliberately not a spreadsheet. The obvious build is eight columns — qty,
 * received as, cost, retail, GM, ext cost, ext retail, flags — and it would be
 * accurate and unreadable. Instead the rows use the same shape as the report's
 * own list: description on top, its detail underneath, a few numbers on the
 * right. One row pattern to learn on this page, not two.
 *
 * The `totals` block from the response is ignored on purpose. It reports `cases`
 * and `units`, which mean different things depending on how the vendor billed
 * with nothing in the response to say which — it would announce "30 cases" for a
 * delivery of 82 sellable units. Every figure in the header is summed from the
 * lines.
 */
const InvoiceSheet = ({
  vendorName,
  invoiceId,
  date,
  fromUpc,
  fromAction,
  lines,
  loading,
  error,
  onClose,
}: InvoiceSheetProps) => {
  const fromRef = useRef<HTMLDivElement>(null);

  /** Only the flag counts are rolled up. Every other figure is per line now —
   *  the point of this view is the full order, not a summary of it. */
  const totals = useMemo(
    () => ({
      returned: lines.filter((l) => l.return > 0).length,
      free: lines.filter((l) => l.free > 0).length,
    }),
    [lines],
  );

  // Forty lines in and the one you came for could be anywhere. Scrolled to
  // rather than filtered, because the point of opening this is the context
  // around it.
  useEffect(() => {
    if (!loading && fromRef.current)
      fromRef.current.scrollIntoView({ block: "center" });
  }, [loading, lines]);

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="item-report:invoice-sheet"
      defaultWidth={1040}
      defaultHeight={680}
    >
      <div className="bg-brand_navy px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="cc-navy-title text-[13px] truncate">
              {vendorName}
            </p>
            <p className="text-custom-white/95 text-[12px] truncate">
              Invoice {invoiceId} · {formatDateSimple(date)}
            </p>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="text-custom-white/95 hover:text-custom-white transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!loading && !error && lines.length > 0 && (
        <>
          {/* The reason to open this view at all, said before any scrolling. */}
          {(totals.returned > 0 || totals.free > 0) && (
            <div className="flex-shrink-0 px-4 py-1.5 bg-severity_watch_bg text-[11.5px] text-severity_watch_text">
              {[
                totals.returned > 0 &&
                  `${totals.returned} line${totals.returned === 1 ? "" : "s"} returned`,
                totals.free > 0 &&
                  `${totals.free} line${totals.free === 1 ? "" : "s"} free`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </div>
          )}
        </>
      )}

      <div className="cc-scroll">
        {loading ? (
          <div className="relative h-full min-h-[240px]">
            <LoadingIndicator message="Opening invoice" />
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-[12px] text-content">{error}</div>
        ) : lines.length === 0 ? (
          <div className="px-4 py-6 text-[12px] text-content">
            No lines on this invoice.
          </div>
        ) : (
          <>
            {/* Sticky *inside* the scroller, not fixed above it. Outside, the
                header spans the full width while the rows span width-minus-
                scrollbar, and every column sits a scrollbar's width off its
                heading. Sharing the scroll container is what makes them line
                up; sticky is what keeps them visible. */}
            <div
              className="sticky top-0 z-10 grid gap-3 px-4 py-1.5 border-b border-line_hair bg-fill_soft text-[11.5px] cc-caps"
              style={{ gridTemplateColumns: ROW_COLS }}
            >
              <span className="text-right">#</span>
              <span>Item</span>
              <span>Received as</span>
              <span className="text-right">Qty</span>
              <span className="text-right">U cost</span>
              <span className="text-right">Retail</span>
              <span className="text-right">Ext cost</span>
              <span className="text-right">Ext retail</span>
              <span className="text-right">GM%</span>
            </div>
            {lines.map((l, i) => {
              const isFrom = normalizeProductCode(l.product_code) === fromUpc;
              const flagged = l.free > 0 || l.return > 0;
              // Computed rather than read off the response's own `gm`, so it
              // cannot disagree with the cost and retail printed beside it.
              // Verified identical across 47 lines on four invoices.
              const gm =
                l.retail > 0 ? ((l.retail - l.ucost) / l.retail) * 100 : null;
              // The row's wash and its foreground come from the same action, so
              // the highlighted line reads as one object. Applied per cell
              // rather than inherited — each cell sets its own `text-content`,
              // which would win over anything on the row.
              const ink =
                isFrom && fromAction
                  ? ACTION_TONE[fromAction].text
                  : "text-content";
              return (
                <div
                  key={`${l.line_number}-${l.product_code}`}
                  ref={isFrom ? fromRef : undefined}
                  className={`grid gap-3 px-4 py-2 items-center border-b border-line_hair ${
                    isFrom
                      ? // The same wash as this item's action chip on the sheet
                        // behind the modal, so the line you came for is
                        // recognisable without reading it.
                        fromAction
                        ? ACTION_TONE[fromAction].row
                        : "bg-fill_muted"
                      : i % 2 === 1
                        ? "bg-row_stripe"
                        : ""
                  }`}
                  style={{ gridTemplateColumns: ROW_COLS }}
                >
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${
                      isFrom ? ink : "text-content/95"
                    }`}
                  >
                    {l.line_number}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-[13px] font-medium truncate ${ink}`}>
                      {l.product_description}
                    </div>
                    <div
                      className={`text-[12px] font-medium truncate ${
                        // A flag still outranks the row's colour: "returned" is
                        // the more urgent thing this line has to say.
                        flagged
                          ? "text-severity_watch_text"
                          : isFrom
                            ? ink
                            : "text-content/95"
                      }`}
                    >
                      {l.product_code}
                      {l.return > 0 && " · returned"}
                      {l.free > 0 && " · free"}
                      {isFrom && " · this item"}
                    </div>
                  </div>
                  {/* Words, so left-aligned — the numeric columns to its right
                      stay right-aligned and the two don't blur together. */}
                  <span className={`text-[12px] font-medium truncate ${ink}`}>
                    {describeReceipt(l.qty, l.cases)}
                  </span>
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${ink}`}
                  >
                    {l.qty}
                  </span>
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${ink}`}
                  >
                    {formatCurrency2(l.ucost)}
                  </span>
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${ink}`}
                  >
                    {l.retail > 0 ? formatCurrency2(l.retail) : "—"}
                  </span>
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${ink}`}
                  >
                    {formatCurrency2(l.ext_cost)}
                  </span>
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${ink}`}
                  >
                    {l.ext_retail > 0 ? formatCurrency2(l.ext_retail) : "—"}
                  </span>
                  <span
                    className={`text-[12px] font-medium text-right tabular-nums ${ink}`}
                  >
                    {gm === null ? "—" : `${gm.toFixed(1)}%`}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </ResizableModalShell>
  );
};

export default InvoiceSheet;
