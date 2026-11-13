// Utils
import { DOC_COLS } from "../utils/supplyRows";

// Interfaces
import type { DocLine, SupplyRow } from "../interfaces";
import type { SupplyRecord } from "../utils/investigationSteps";

// Components
import Document from "./Document";

interface SupplySlideProps {
  row: SupplyRow;
  /** The documents left after the pasted UPCs, newest first. */
  shown: SupplyRecord[];
  says: string;
  /** Said under the headline when the list is empty: why, in a dashed box. */
  note: string | null;
  /** A note about a read that failed, in the notice colours. */
  warn: boolean;
  foot: string;
  linesOf: (rec: SupplyRecord) => DocLine[];
  wholeOf: (rec: SupplyRecord) => DocLine[] | null;
  cash: (v: number) => string;
}

/** One store's orders or receipts: a headline, the documents scrolling inside
 *  the slide with their headings pinned, and a total. */
const SupplySlide = ({
  row,
  shown,
  says,
  note,
  warn,
  foot,
  linesOf,
  wholeOf,
  cash,
}: SupplySlideProps) => (
  <div className="flex-1 min-h-0 flex flex-col gap-3 min-w-0">
    <p className="text-[17px] font-semibold leading-snug text-content">{says}</p>

    {note && (
      <p
        className={`text-[13px] leading-relaxed rounded-md px-3.5 py-2.5 ${
          warn ? "cc-notice" : "border border-dashed border-brand_navy/25 text-content/95"
        }`}
      >
        {note}
      </p>
    )}

    {shown.length > 0 && (
      <div className="cc-scroll flex flex-col">
        <div
          className={`sticky top-0 z-10 bg-custom-white grid ${DOC_COLS.oneStore} gap-3 px-1.5 pb-1.5 border-b border-brand_navy/15 cc-caps text-[10.5px] text-brand_slate`}
        >
          <span>Date</span>
          <span>Vendor</span>
          <span>{row.isOrder ? "Order" : "Invoice"}</span>
          <span>{row.isOrder ? "Status" : "Cost"}</span>
          <span
            className="text-right"
            title={`Lines in this department, not on the whole ${row.isOrder ? "order" : "invoice"}`}
          >
            Dept lines
          </span>
          <span className="text-right">Units</span>
        </div>
        {shown.map((r) => (
          <Document
            key={`${row.isOrder ? "o" : "d"}${r.mine ? "m" : "t"}-${r.id}`}
            rec={r}
            lines={linesOf(r)}
            whole={wholeOf(r)}
            cash={cash}
            isOrder={row.isOrder}
            showStore={false}
          />
        ))}
      </div>
    )}

    {shown.length > 0 && (
      <p className="text-[12.5px] text-content/95 flex-none">{foot}</p>
    )}
  </div>
);

export default SupplySlide;
