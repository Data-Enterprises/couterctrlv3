// Hooks
import { useState } from "react";

// Utils
import { onDay } from "../utils";

// Interfaces
import type { SupplyRecord } from "../utils/investigationSteps";
import type { DocLine } from "../interfaces";

/** One order or receipt row: date, vendor, number, status or cost, lines and units.
 *  Click to open its lines, with a switch between this department's lines and the whole document. */
const Document = ({
  rec,
  lines,
  whole,
  cash,
  isOrder,
}: {
  rec: SupplyRecord;
  /** This department's lines on it. */
  lines: DocLine[];
  /** Every line on it, where the whole document is in hand. */
  whole: DocLine[] | null;
  cash: (v: number) => string;
  isOrder: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [everything, setEverything] = useState(false);
  const rows = everything && whole ? whole : lines;
  const n = (v: number) => Math.round(v).toLocaleString("en-US");

  return (
    <div className="border-b border-brand_navy/15 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full grid gap-3 items-center px-1.5 py-2 text-left hover:bg-bkg rounded transition-colors"
        style={{
          gridTemplateColumns:
            "62px 16px minmax(0,1fr) 88px minmax(0,110px) 62px 76px",
        }}
      >
        <span className="text-[12px] text-content/95 whitespace-nowrap">
          {onDay(rec.date)}
        </span>
        <span
          className={`block w-2 h-2 rounded-full ${
            rec.mine ? "bg-store_open" : "bg-store_compare"
          }`}
        />
        <span
          className={`min-w-0 truncate text-[12.5px] ${
            rec.mine ? "font-semibold text-content" : "text-content/95"
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
        <div className="bg-bkg px-1.5 pb-2">
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
                      : "text-content/95 hover:bg-custom-white"
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
            rows.map((l) => (
              <div
                key={l.code}
                className="grid gap-3 items-center px-2 py-1 text-[12px] border-t border-brand_navy/10"
                style={{ gridTemplateColumns: "110px minmax(0,1fr) 76px 86px" }}
              >
                <span className="font-mono text-content/95 truncate">
                  {l.code}
                </span>
                <span className="min-w-0 truncate text-content">
                  {l.description}
                </span>
                <span className="text-right tabular-nums text-content">
                  {n(l.units)}
                </span>
                <span className="text-right tabular-nums text-content/95">
                  {l.cost === 0 ? "—" : cash(l.cost)}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Document;
