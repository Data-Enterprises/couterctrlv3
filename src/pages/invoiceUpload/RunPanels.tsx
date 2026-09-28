import { useMemo, useState } from "react";
import {
  ArrowUpTrayIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/20/solid";
import TextFilter from "../../components/filters/TextFilter";
import HeaderIconButton from "../../components/HeaderIconButton";
import { formatDateSimple } from "../../utils";
import type { ExtractedInvoice, FileReport } from "./types";
import type { RunRow } from "./rows";

/**
 * A run's invoices — list on the left, the selected one in full on the right.
 *
 * Laid out like the local Invoices page so the two read as the same tool, but
 * rendering the server's `ExtractedInvoice` shape rather than decoded records.
 * That shape carries cases, case cost and extended cost per line; retail and
 * margin aren't in it, so they aren't shown rather than shown as blanks.
 */

const showDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}/.test(value) ? formatDateSimple(value) : value;

const storeText = (invoice: ExtractedInvoice) =>
  invoice.storeName
    ? `${invoice.storeName}${invoice.storeNumber ? ` (${invoice.storeNumber})` : ""}`
    : invoice.storeNumber
      ? `Store ${invoice.storeNumber}`
      : "";

const LIST_COLS = "1fr 56px 96px";

interface ListProps {
  rows: RunRow[];
  files: FileReport[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUploadOpen: () => void;
}

export const RunListPanel = ({
  rows,
  files,
  selectedId,
  onSelect,
  onUploadOpen,
}: ListProps) => {
  const [failedOnly, setFailedOnly] = useState(false);
  const [textFilter, setTextFilter] = useState("");

  const failedCount = rows.filter((row) => !row.reconciled).length;
  const fileErrors = files.filter((f) => f.error);
  const warningCount = files.reduce((n, f) => n + (f.warningCount ?? 0), 0);

  const term = textFilter.trim().toLowerCase();
  const visible = useMemo(
    () =>
      rows.filter((row) => {
        if (failedOnly && row.reconciled) return false;
        if (!term) return true;
        const inv = row.invoice;
        return (
          inv.invoiceNumber.toLowerCase().includes(term) ||
          (inv.storeNumber ?? "").toLowerCase().includes(term) ||
          (inv.storeName ?? "").toLowerCase().includes(term) ||
          (inv.account ?? "").toLowerCase().includes(term)
        );
      }),
    [rows, failedOnly, term],
  );

  const title =
    files.length === 1 ? files[0].file : `${files.length} files uploaded`;

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="bg-custom-white rounded-xl shadow-sm flex flex-col h-full">
        <div className="flex-shrink-0 bg-[#1e2a4a] rounded-t-xl px-4 pt-1 pb-2.5 flex flex-col gap-0">
          <div className="flex items-center gap-2 min-h-[26px]">
            <span
              title={files.map((f) => f.file).join("\n")}
              className="min-w-0 flex-1 text-custom-white font-semibold text-[13px] truncate"
            >
              {title}
            </span>
            <span className="flex-shrink-0 text-[14px] font-semibold text-custom-white tabular-nums">
              {rows.length} invoices
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-custom-white/[0.08]">
            <HeaderIconButton onClick={onUploadOpen} title="Upload another file">
              <ArrowUpTrayIcon className="w-3.5 h-3.5" />
            </HeaderIconButton>
            <div className="w-px h-4 bg-custom-white/15 flex-shrink-0" />
            <span
              className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                rows.length > 0 && failedCount === 0
                  ? "bg-severity_healthy_bg text-severity_healthy_text"
                  : "bg-severity_critical_bg text-severity_critical_text"
              }`}
            >
              {rows.length === 0
                ? "No invoices decoded"
                : failedCount === 0
                  ? "All invoices reconciled"
                  : `${failedCount} did not reconcile`}
            </span>
          </div>
        </div>

        {/* File-level problems sit above the list: a file that failed, or
            records the decoder didn't understand, means invoices may be
            missing from it rather than wrong within it. */}
        {(fileErrors.length > 0 || warningCount > 0) && (
          <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 bg-amber-50 flex flex-col gap-1">
            {fileErrors.map((f) => (
              <div
                key={f.file}
                className="flex items-start gap-1.5 text-[12px] text-severity_critical_text"
              >
                <ExclamationTriangleIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span className="min-w-0">
                  <span className="font-semibold">{f.file}:</span> {f.error}
                </span>
              </div>
            ))}
            {files
              .filter((f) => (f.warningCount ?? 0) > 0)
              .map((f) => (
                <details key={`w-${f.file}`} className="text-[12px] text-amber-900">
                  <summary className="cursor-pointer">
                    {f.file}: {f.warningCount} record warning
                    {f.warningCount === 1 ? "" : "s"}
                  </summary>
                  <ul className="mt-1 ml-4 list-disc max-h-32 overflow-y-auto thin-scrollbar">
                    {(f.warnings ?? []).map((w, i) => (
                      <li key={i}>
                        {w.lineNumber !== undefined && `Line ${w.lineNumber}: `}
                        {w.recordType !== undefined && `[${w.recordType}] `}
                        {w.message}
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
          </div>
        )}

        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100 flex items-center gap-2">
          <button
            onClick={() => setFailedOnly((v) => !v)}
            className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow bg-severity_critical_bg text-severity_critical_text ${
              failedOnly ? "ring-2 shadow-sm ring-severity_critical_text/40" : ""
            }`}
          >
            Did not reconcile <span className="tabular-nums">{failedCount}</span>
          </button>
          <div className="flex-1 min-w-[140px]">
            <TextFilter
              value={textFilter}
              onChange={setTextFilter}
              placeholder="Filter invoices…"
            />
          </div>
        </div>

        <div
          className="flex-shrink-0 grid gap-3 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
          style={{ gridTemplateColumns: LIST_COLS }}
        >
          <span>Invoice</span>
          <span className="text-right">Lines</span>
          <span className="text-right">Total</span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {visible.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              No invoices matched
            </div>
          )}

          {visible.map((row) => {
            const inv = row.invoice;
            const sub = [
              storeText(inv),
              inv.account ? `Dept ${inv.account}` : "",
              inv.invoiceDate ? showDate(inv.invoiceDate) : "",
            ]
              .filter(Boolean)
              .join(" · ");
            return (
              <button
                key={row.id}
                onClick={() => onSelect(row.id)}
                className={`w-full text-left grid gap-3 px-3 py-2.5 items-center border-b border-gray-100 transition-colors ${
                  row.id === selectedId ? "bg-row_selected" : "hover:bg-gray-50"
                }`}
                style={{ gridTemplateColumns: LIST_COLS }}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        row.reconciled
                          ? "bg-severity_healthy_text"
                          : "bg-severity_critical_text"
                      }`}
                    />
                    <span className="block text-[13px] font-medium text-content truncate">
                      {inv.invoiceNumber}
                    </span>
                  </span>
                  <span className="block text-[12px] text-content/85 truncate">
                    {sub}
                  </span>
                </span>
                <span className="text-[13px] text-right tabular-nums text-content">
                  {inv.lines.length}
                </span>
                <span className="text-[13px] text-right tabular-nums font-medium text-content">
                  ${inv.totals.invoiceTotal}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LINE_COLS = "28px 1fr 84px 52px 76px 84px";

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

const money = (value?: string) => (value ? `$${value}` : "—");

export const RunDetailPanel = ({ row }: { row: RunRow | null }) => {
  const [lineFilter, setLineFilter] = useState("");

  const term = lineFilter.trim().toLowerCase();
  const lines = useMemo(() => {
    if (!row) return [];
    // Numbered before filtering, so a filtered line keeps its invoice position.
    const numbered = row.invoice.lines.map((line, i) => ({ line, n: i + 1 }));
    if (!term) return numbered;
    return numbered.filter(
      ({ line }) =>
        line.description.toLowerCase().includes(term) ||
        (line.upc ?? "").includes(term) ||
        (line.itemCode ?? "").toLowerCase().includes(term),
    );
  }, [row, term]);

  if (!row) {
    return (
      <div className="flex-shrink-0 shadow-lg" style={{ width: "58%" }}>
        <div className="bg-custom-white rounded-xl shadow-sm h-full flex items-center justify-center px-4">
          <p className="text-[12px] text-content text-center leading-relaxed">
            Pick an invoice for its lines and totals.
          </p>
        </div>
      </div>
    );
  }

  const inv = row.invoice;
  const checks = row.recon?.checks ?? [];
  const sub = [
    inv.vendor,
    storeText(inv),
    inv.account ? `Dept ${inv.account}` : "",
    inv.invoiceDate ? showDate(inv.invoiceDate) : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex-shrink-0 shadow-lg" style={{ width: "58%" }}>
      <div className="bg-custom-white rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#1e2a4a] px-4 py-2.5">
          <p className="text-custom-white text-[13px] font-semibold truncate">
            Invoice {inv.invoiceNumber}
          </p>
          <p className="text-custom-white/85 text-[12px] truncate" title={sub}>
            {sub}
          </p>
        </div>

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
              {checks.length === 0
                ? "The invoice has no total record to check against."
                : row.reconciled
                  ? "Every derived total matches the invoice's own figures to the cent."
                  : "A derived total disagrees with the invoice's own figure — the file is inconsistent or was cut short."}
            </div>
          </div>

          {!row.reconciled && checks.length > 0 && (
            <div className="px-4 py-2">
              {checks.map((check) => (
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
                  {!check.ok && (
                    <span className="tabular-nums text-severity_critical_text">
                      vs {check.reported}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50">
          <KpiTile label="Items" value={money(inv.totals.subtotal)} />
          <KpiTile label="Delivery" value={money(inv.totals.serviceFee)} />
          <KpiTile label="Allowances" value={money(inv.totals.discount)} />
          <KpiTile label="Invoice total" value={money(inv.totals.invoiceTotal)} />
        </div>

        <div className="flex-shrink-0 px-3 py-2 border-b border-gray-100">
          <TextFilter
            value={lineFilter}
            onChange={setLineFilter}
            placeholder="Filter lines by description, UPC or item code…"
          />
        </div>

        <div
          className="flex-shrink-0 grid gap-2.5 px-3 py-1.5 border-b border-gray-100 bg-gray-50 text-[11.5px] font-semibold uppercase tracking-wide text-content/85"
          style={{ gridTemplateColumns: LINE_COLS }}
        >
          <span className="text-right">#</span>
          <span>Item</span>
          <span className="text-right">Item code</span>
          <span className="text-right">Cases</span>
          <span className="text-right" title="Cost per case">
            Case cost
          </span>
          <span className="text-right" title="Extended cost, net of allowances">
            Ext cost
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar rounded-b-xl">
          {lines.length === 0 && (
            <div className="py-8 text-center text-[12px] text-content/85">
              {inv.lines.length === 0
                ? "No billed lines on this invoice."
                : "No lines matched"}
            </div>
          )}

          {lines.map(({ line, n }, index) => (
            <div
              key={n}
              className={`grid gap-2.5 px-3 py-2 items-center border-b border-gray-100 ${
                index % 2 === 1 ? "bg-row_stripe" : ""
              }`}
              style={{ gridTemplateColumns: LINE_COLS }}
            >
              <span className="text-[12px] font-medium text-right tabular-nums text-content/85">
                {n}
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-content truncate">
                  {line.description}
                </span>
                <span className="block text-[12px] text-content/85 truncate">
                  {line.upc ?? ""}
                </span>
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {line.itemCode ?? "—"}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {line.qty}
              </span>
              <span className="text-[12px] text-right tabular-nums text-content">
                {money(line.unitPrice)}
              </span>
              <span className="text-[12px] text-right tabular-nums font-medium text-content">
                ${line.ext}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
