import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import {
  setInvoiceLineDescFilter,
  setInvoiceLineUpcFilter,
} from "../../features/invoicesSlice";
import ColFilter from "../../components/filters/ColFilter";
import { colInputStyle } from "../../components/filters/colFilterStyles";
import type { InvoiceRow } from "./present";

/**
 * One invoice in full: the reconciliation first, then the lines it was derived
 * from.
 *
 * Reconciliation leads because it is the only thing here that tells you whether
 * to believe the rest. A list of 151 lines looks equally convincing whether the
 * file was decoded correctly or not — the check is what separates the two.
 */
/** #, item, pack, cases, case cost, unit cost, retail, ext cost, ext retail, GM%.
 *
 *  Three costs, and they answer different questions. **Case cost** is the list
 *  price the vendor billed. **Unit cost** is what one selling unit actually
 *  cost after allowances — the figure that sits against retail. **Ext cost** is
 *  the line's total. Pack is what connects them.
 *
 *  Eight numeric columns sit side by side, so they get a wider gutter than the
 *  8px the rest of the app uses between two or three: right-aligned digits with
 *  no gutter read as one long number. The Item column absorbs the difference. */
const LINE_COLS = "28px 1fr 42px 46px 68px 66px 66px 74px 74px 50px";
const LINE_GAP = "gap-2.5";

/** The app's KPI strip cell — 10px bold label over a 14px bold figure. The
 *  rail tiles in Item Actions use a lighter 12px because they sit nested inside
 *  a section; this one is a top-level strip and takes the standard weight. */
const KpiTile = ({ label, value }: { label: string; value: string }) => (
  <div className="px-4 pt-2.5 pb-2 text-center min-w-0">
    <div className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </div>
    <div className="text-[14px] font-bold text-content tabular-nums truncate">
      {value}
    </div>
  </div>
);

const Reconciliation = ({ row }: { row: InvoiceRow }) => (
  <div className="flex-shrink-0 border-b border-gray-100">
    <div
      className={`px-4 py-2.5 ${
        row.reconciled ? "bg-severity_healthy_bg" : "bg-severity_critical_bg"
      }`}
    >
      <div
        className={`text-[11px] font-bold uppercase tracking-wide ${
          row.reconciled
            ? "text-severity_healthy_text"
            : "text-severity_critical_text"
        }`}
      >
        {row.reconciled ? "Reconciled" : "Did not reconcile"}
      </div>
      <div
        className={`text-[13px] leading-relaxed mt-0.5 ${
          row.reconciled
            ? "text-severity_healthy_text"
            : "text-severity_critical_text"
        }`}
      >
        {row.note
          ? row.note
          : row.reconciled
            ? "Every derived total matches the invoice's own figures to the cent."
            : "A derived total disagrees with the invoice's own figure — a line was missed or misread."}
      </div>
    </div>

    {/* Only when something failed. On a reconciled invoice these four rows
        restate the KPI strip immediately below them — the same four figures,
        twice, to say they agree. The strip already says that; the coloured
        header says it louder. What the strip cannot show is a derived figure
        against the reported one it missed, so that is all this renders. */}
    {!row.reconciled && row.checks.length > 0 && (
      <div className="px-4 py-2">
        {row.checks.map((check) => (
          <div
            key={check.label}
            className="flex items-baseline gap-2 py-1 text-[12px]"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                check.ok
                  ? "bg-severity_healthy_text"
                  : "bg-severity_critical_text"
              }`}
            />
            <span className="flex-1 min-w-0 truncate text-content">
              {check.label}
            </span>
            <span className="tabular-nums text-content font-medium">
              {check.derived}
            </span>
            {/* The reported figure only appears when it disagrees. Printing
                both every time doubles the numbers on screen to say "these are
                the same". */}
            {!check.ok && (
              <span className="tabular-nums text-severity_critical_text">
                vs {check.reported} (off by {check.difference})
              </span>
            )}
          </div>
        ))}
      </div>
    )}
  </div>
);

const InvoiceDetailPanel = () => {
  const dispatch = useAppDispatch();
  const { rows, selectedId, lineUpcFilter, lineDescFilter } = useAppSelector(
    (s) => s.invoices,
  );
  // Draft stays local — a half-typed UPC is not page state, and only the value
  // behind Apply changes what the grid shows.
  const [draftUpc, setDraftUpc] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  const row = rows.find((entry) => entry.id === selectedId) ?? null;

  const upcTerm = lineUpcFilter.trim();
  const descTerm = lineDescFilter.trim().toLowerCase();
  const lines = useMemo(() => {
    if (!row) return [];
    if (!upcTerm && !descTerm) return row.lines;
    return row.lines.filter(
      (line) =>
        (!upcTerm || line.upc.includes(upcTerm)) &&
        (!descTerm || line.description.toLowerCase().includes(descTerm)),
    );
  }, [row, upcTerm, descTerm]);

  if (!row) {
    return (
      <div className="flex-shrink-0 shadow-lg" style={{ width: "61.6%" }}>
        <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center px-4">
          <p className="text-[12px] text-content text-center leading-relaxed">
            Pick an invoice for its lines and totals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "61.6%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2.5">
          <p className="text-custom-white text-[13px] font-semibold truncate">
            Invoice {row.invoiceNbr}
          </p>
          <p className="text-custom-white/85 text-[12px] truncate">
            AWG · Store {row.storeNbr} · Dept {row.retailDept}
            {row.deliveryDate ? ` · ${row.deliveryDate}` : ""}
          </p>
        </div>

        <Reconciliation row={row} />

        <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
          <KpiTile label="Cost" value={`$${row.totalCost}`} />
          <KpiTile label="Retail" value={`$${row.totalRetail}`} />
          <KpiTile label="Allowances" value={`$${row.totalAllowances}`} />
          <KpiTile label="Cases" value={row.totalCases} />
        </div>

        <div
          className={`flex-shrink-0 grid ${LINE_GAP} px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85`}
          style={{ gridTemplateColumns: LINE_COLS }}
        >
          <span className="text-right">#</span>
          {/* The app's column-header filters, same as the item grids. */}
          <span className="flex items-center gap-2 min-w-0">
            Item
            <ColFilter
              label="UPC"
              active={!!lineUpcFilter}
              onApply={() => dispatch(setInvoiceLineUpcFilter(draftUpc))}
              onClear={() => {
                dispatch(setInvoiceLineUpcFilter(""));
                setDraftUpc("");
              }}
            >
              <input
                autoFocus
                style={colInputStyle}
                placeholder="Search UPC…"
                value={draftUpc}
                onChange={(e) => setDraftUpc(e.target.value)}
              />
            </ColFilter>
            <ColFilter
              label="Desc"
              active={!!lineDescFilter}
              onApply={() => dispatch(setInvoiceLineDescFilter(draftDesc))}
              onClear={() => {
                dispatch(setInvoiceLineDescFilter(""));
                setDraftDesc("");
              }}
            >
              <input
                autoFocus
                style={colInputStyle}
                placeholder="Search description…"
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
              />
            </ColFilter>
          </span>
          <span className="text-right">Pack</span>
          <span className="text-right">Cases</span>
          <span className="text-right" title="List cost per case">
            Case cost
          </span>
          <span
            className="text-right"
            title="Net cost of one selling unit, after allowances"
          >
            Unit cost
          </span>
          <span className="text-right" title="Shelf price per selling unit">
            Retail
          </span>
          <span className="text-right">Ext cost</span>
          <span className="text-right">Ext retail</span>
          <span className="text-right">GM%</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {lines.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              {row.lines.length === 0
                ? "No billed lines on this invoice."
                : "No lines matched"}
            </div>
          )}

          {lines.map((line, index) => (
            <div
              key={`${line.lineNumber}-${line.upc}`}
              className={`grid ${LINE_GAP} px-3 py-2 items-center border-b border-gray-100 ${
                index % 2 === 1 ? "bg-row_stripe" : ""
              }`}
              style={{ gridTemplateColumns: LINE_COLS }}
            >
              <span className="text-[12px] font-medium text-right tabular-nums text-content/85">
                {line.lineNumber}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-content truncate">
                  {line.description}
                </span>
                <span className="block text-[12px] text-content/85 truncate">
                  {line.upc}
                </span>
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {line.pack}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {line.cases}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                ${line.caseCost}
              </span>
              <span className="text-[12px] text-right tabular-nums font-medium text-content">
                {line.unitCost === null ? "—" : `$${line.unitCost}`}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {line.retail}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                ${line.extCost}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                ${line.extRetail}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {line.marginPct ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailPanel;
