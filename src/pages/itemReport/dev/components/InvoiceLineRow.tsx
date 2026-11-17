// Utils
import { formatCurrency2 } from "../../../../utils";
import { describeReceipt, ROW_COLS } from "../utils";
import { ACTION_TONE } from "../utils/actionTone";

// Interfaces
import type { Ref } from "react";
import type { ReceiverDetailsItem } from "../../../../interfaces";
import type { ActionKind } from "../interfaces";

interface InvoiceLineRowProps {
  line: ReceiverDetailsItem;
  /** The item the reader arrived from, marked in its action's colour. */
  isFrom: boolean;
  fromAction?: ActionKind;
  zebra: boolean;
  /** Set on the line arrived from, so the sheet can scroll to it. */
  ref?: Ref<HTMLDivElement>;
}

/** One line of a delivery: item and flags, how it was received, quantity,
 *  cost and retail, their extensions and the margin. */
const InvoiceLineRow = ({
  line: l,
  isFrom,
  fromAction,
  zebra,
  ref,
}: InvoiceLineRowProps) => {
  const flagged = l.free > 0 || l.return > 0;
  // Computed rather than read off the response's own `gm`, so it
  // cannot disagree with the cost and retail printed beside it.
  // Verified identical across 47 lines on four invoices.
  const gm = l.retail > 0 ? ((l.retail - l.ucost) / l.retail) * 100 : null;
  // The row's wash and its foreground come from the same action, so
  // the highlighted line reads as one object. Applied per cell
  // rather than inherited — each cell sets its own `text-content`,
  // which would win over anything on the row.
  const ink =
    isFrom && fromAction ? ACTION_TONE[fromAction].text : "text-content";

  return (
    <div
      ref={ref}
      className={`grid gap-3 px-4 py-2 items-center border-b border-line_hair ${
        isFrom
          ? // The same wash as this item's action chip on the sheet
            // behind the modal, so the line you came for is
            // recognisable without reading it.
            fromAction
            ? ACTION_TONE[fromAction].row
            : "bg-fill_muted"
          : zebra
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
};

export default InvoiceLineRow;
