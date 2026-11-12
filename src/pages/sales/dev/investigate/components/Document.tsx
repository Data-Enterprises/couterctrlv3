// Hooks
import { useState } from "react";

// Utils
import { onDay } from "../utils";
import { DOC_COLS, DOC_LINE_COLS } from "../utils/supplyRows";

// Interfaces
import type { SupplyRecord } from "../utils/investigationSteps";
import type { DocLine } from "../interfaces";

interface DocumentProps {
  rec: SupplyRecord;
  /** This department's lines on it. */
  lines: DocLine[];
  /** Every line on it, where the whole document is in hand. */
  whole: DocLine[] | null;
  cash: (v: number) => string;
  isOrder: boolean;
  /** Draw the store's dot. Off in a list that holds one store only. */
  showStore?: boolean;
}

/** One order or receipt row: date, vendor, number, status or cost, lines and units.
 *  Click to open its lines, with a switch between this department's lines and the whole document. */
const Document = ({ rec, lines, whole, cash, isOrder, showStore = true }: DocumentProps) => {
  const [open, setOpen] = useState(false);
  const [everything, setEverything] = useState(false);
  const rows = everything && whole ? whole : lines;
  const n = (v: number) => Math.round(v).toLocaleString("en-US");

  return (
    <div
      className={`border-b border-brand_navy/15 last:border-b-0 ${
        open ? "" : "even:bg-row_stripe"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`w-full grid ${
          showStore ? DOC_COLS.withStore : DOC_COLS.oneStore
        } gap-3 items-center px-1.5 py-2 text-left rounded border transition-colors ${
          open ? "cc-row-selected" : "border-transparent hover:bg-fill_soft"
        }`}
      >
        <span className="text-[12px] text-content/95 whitespace-nowrap">
          {onDay(rec.date)}
        </span>
        {showStore && (
          <span
            className={`block w-2 h-2 rounded-full ${
              rec.mine ? "bg-store_open" : "bg-store_compare"
            }`}
          />
        )}
        <span
          className={`min-w-0 truncate text-[12.5px] ${
            rec.mine || !showStore ? "font-semibold text-content" : "text-content/95"
          }`}
        >
          {rec.vendor}
        </span>
        <span className="text-[12.5px] tabular-nums text-content truncate">
          #{rec.id}
        </span>
        <span className="text-[11.5px] text-content/95 truncate">
          {isOrder ? (rec.status ?? "—") : cash(rec.cost)}
        </span>
        <span className="text-right text-[11.5px] text-content/95 tabular-nums">
          {rec.lines}
        </span>
        <span
          className={`text-right text-[12.5px] font-bold tabular-nums whitespace-nowrap ${
            rec.units < 0 ? "text-delta_negative_text" : "text-content"
          }`}
        >
          {n(rec.units)}
        </span>
      </button>

      {open && (
        /* On the card's white, tied to the document by a rail in its
           store's colour, rather than on a grey block of its own. */
        <div
          className={`ml-3.5 mt-1.5 mb-2.5 pl-2.5 border-l-2 ${
            rec.mine ? "border-store_open" : "border-store_compare"
          }`}
        >
          {/* The department's lines, or the order entire. A buyer looking
              at an order wants to know what else is on it before they ring
              anybody about it — and the whole document came down with the
              same request, so it costs nothing to offer. */}
          {whole && whole.length > lines.length && (
            <div className="flex items-center gap-2 px-2 py-1.5">
              {[
                { on: false, label: `This department · ${lines.length}` },
                { on: true, label: `Whole order · ${whole.length}` },
              ].map((o) => (
                <button
                  key={o.label}
                  onClick={() => setEverything(o.on)}
                  aria-pressed={everything === o.on}
                  className={`text-[11.5px] font-semibold px-2 py-0.5 rounded transition-colors ${
                    everything === o.on
                      ? "bg-brand_navy text-custom-white"
                      : "text-content/95 hover:bg-fill_soft"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}

          {rows.length === 0 ? (
            <p className="text-[12px] text-content/95 py-2 px-2">
              No lines in this department on it.
            </p>
          ) : (
            <>
              <div
                className={`grid ${
                  isOrder ? DOC_LINE_COLS.order : DOC_LINE_COLS.receipt
                } gap-3 px-2 pt-0.5 pb-1 cc-caps text-[10.5px] text-brand_slate`}
              >
                <span>UPC</span>
                <span>Item</span>
                <span className="text-right">Units</span>
                {!isOrder && <span className="text-right">Cost</span>}
              </div>
              <div className="flex flex-col">
                {/* Keyed by position too: one order can carry the same code
                    on two lines. */}
                {rows.map((l, i) => (
                  <div
                    key={`${l.code}-${i}`}
                    className={`grid ${
                      isOrder ? DOC_LINE_COLS.order : DOC_LINE_COLS.receipt
                    } gap-3 items-center px-2 py-1 rounded-sm text-[12.5px] even:bg-row_stripe`}
                  >
                    <span className="font-mono text-[12px] text-brand_slate truncate">
                      {l.code}
                    </span>
                    <span className="min-w-0 truncate text-content">
                      {l.description}
                    </span>
                    <span className="text-right tabular-nums font-semibold text-content">
                      {n(l.units)}
                    </span>
                    {!isOrder && (
                      <span className="text-right tabular-nums text-content">
                        {l.cost === 0 ? "—" : cash(l.cost)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Document;
