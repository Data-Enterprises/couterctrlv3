import { useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import ComingSoonHelp from "../../../components-dev/ComingSoonHelp";
import {
  invoiceFailed,
  parseBedrockInvoices,
  type InvoiceParseResp,
} from "../../../api/invoices";
import {
  failScannedParse,
  setScannedExpanded,
  setScannedFailedOnly,
  setScannedResult,
  startScannedParse,
} from "../../../features/dev/devScannedInvoicesSlice";
import { downloadCsv } from "../../../utils/csvExport";
import { callReason } from "../../organization/dev/baseGroups/storeMembership";
import ScannedEntry from "./ScannedEntry";
import ScannedInvoiceCard from "./ScannedInvoiceCard";
import { scannedToInvoicesCsv, scannedToOrdersCsv } from "./exportScanned";
import { scannedRows } from "./present";

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex min-w-[96px] flex-col rounded-lg bg-bkg px-3 py-2">
    <span className="font-mono text-[9.5px] uppercase tracking-wider text-content/85">
      {label}
    </span>
    <span className="font-display text-[17px] font-bold tabular-nums text-content">
      {value}
    </span>
  </div>
);

/**
 * Scanned Invoices — paper invoices read by Claude on Bedrock, checked, and
 * exported in the POS layouts.
 *
 * The AWG page's twin for everything that does not arrive as an AWG file:
 * route tickets, DSD receipts, credit slips, any vendor's scan. The server
 * reads them (`invoices/parse_bedrock`), checks each invoice's lines against
 * its own printed totals, and archives the run; this page shows what came
 * back and turns it into the two CSVs the POS imports.
 *
 * LAYOUT
 * Before a run, the drop card alone. After one, the same frame as the AWG
 * page: a header with the run's figures and the exports, anything the server
 * could not read, and then one card per invoice — closed to its verdict, open
 * to its lines, totals and checks.
 *
 * Exports carry every invoice that came back, reconciled or not. An invoice
 * that does not balance is still an invoice the store received; the header
 * says how many of them there are so nobody exports without knowing.
 */
const ScannedInvoices = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useDevApi();
  const state = useAppSelector((s) => s.dev.scannedInvoices);
  const storeid = useAppSelector((s) => s.search.selectedStore?.storeid);
  const [moreOpen, setMoreOpen] = useState(false);

  const { result } = state;
  const rows = useMemo(() => (result ? scannedRows(result) : []), [result]);
  const failedCount = rows.filter((r) => !r.reconciled).length;
  const lineCount = rows.reduce((n, r) => n + r.invoice.lines.length, 0);
  const visible = state.failedOnly ? rows.filter((r) => !r.reconciled) : rows;

  const problems = (result?.files ?? []).filter(
    (f) => f.error || (f.discarded?.length ?? 0) > 0 || f.storageError,
  );

  const read = async (files: File[]) => {
    if (!storeid) {
      toast.warn("Choose a store before reading.");
      return;
    }
    dispatch(startScannedParse(files.map((f) => f.name)));
    try {
      const res = await parseBedrockInvoices(url, token, storeid, files);
      const body = res.data as InvoiceParseResp;
      if (invoiceFailed(body)) {
        dispatch(failScannedParse(body.msg || "The run was refused."));
        return;
      }
      dispatch(setScannedResult(body));
      setMoreOpen(false);
      const n = body.invoices.length;
      toast.success(`Read ${n} invoice${n === 1 ? "" : "s"}.`);
    } catch (err) {
      dispatch(failScannedParse(callReason(err)));
    }
  };

  const base = () => {
    const date = new Date().toISOString().slice(0, 10);
    return `scanned_${result?.storeid ?? storeid ?? "store"}_${date}`;
  };

  const exportInvoices = () => {
    if (!result) return;
    downloadCsv(
      scannedToInvoicesCsv(result.storeid, result.invoices),
      `${base()}_invoices.csv`,
    );
  };

  const exportOrders = () => {
    if (!result) return;
    downloadCsv(
      scannedToOrdersCsv(result.storeid, result.invoices),
      `${base()}_orders.csv`,
    );
  };

  const entry = (onClose?: () => void) => (
    <ScannedEntry
      onRead={read}
      parsing={state.parsing}
      startedAt={state.startedAt}
      error={state.error}
      storeChosen={Boolean(storeid)}
      onClose={onClose}
    />
  );

  if (!result) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] w-full items-center justify-center p-4">
        {entry()}
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] w-full overflow-hidden p-4">
      <div className="mx-auto flex h-full max-w-[1180px] flex-col gap-3">
        <section className="flex-none overflow-hidden rounded-xl border border-gray-200 bg-custom-white shadow-sm">
          <div className="flex items-center gap-2 px-3.5 pt-3">
            <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold text-content">
              {state.fileNames.join(", ") || "Scanned invoices"}
            </span>
            <span
              className="flex-none font-mono text-[10px] text-content/85"
              title="The run id — how this result is found again"
            >
              {result.model} · {result.runId.slice(0, 8)}
            </span>
            <div className="relative flex-shrink-0">
              <ComingSoonHelp />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-3.5 pt-2.5">
            <Stat label="Invoices" value={String(rows.length)} />
            <Stat label="Lines" value={String(lineCount)} />
            <Stat
              label="Reconciled"
              value={`${rows.length - failedCount} / ${rows.length}`}
            />
            <Stat label="Pages" value={String(result.pageCount ?? "—")} />
            <Stat
              label="Est. cost"
              value={result.estCostUsd ? `$${Number(result.estCostUsd).toFixed(2)}` : "—"}
            />
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-gray-100 px-3.5 py-2.5">
            <button
              type="button"
              onClick={() => dispatch(setScannedFailedOnly(!state.failedOnly))}
              aria-pressed={state.failedOnly}
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                state.failedOnly
                  ? "border-brand_navy bg-brand_navy text-custom-white"
                  : "border-gray-200 bg-custom-white text-content/85"
              }`}
            >
              To check{failedCount > 0 ? ` (${failedCount})` : ""}
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={exportOrders}
              disabled={lineCount === 0}
              title="Download every line in the POS order layout"
              className="flex flex-none items-center gap-1.5 rounded-lg border border-gray-200 bg-custom-white px-3.5 py-2 font-display text-[13px] font-semibold text-content hover:bg-bkg disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export as orders
            </button>
            <button
              type="button"
              onClick={exportInvoices}
              disabled={lineCount === 0}
              title="Download every line in the POS invoice layout"
              className="flex flex-none items-center gap-1.5 rounded-lg border border-gray-200 bg-custom-white px-3.5 py-2 font-display text-[13px] font-semibold text-content hover:bg-bkg disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export as invoices
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex flex-none items-center gap-1.5 rounded-lg bg-brand_navy px-3.5 py-2 font-display text-[13px] font-semibold text-custom-white hover:bg-brand_navy_hover"
            >
              <DocumentArrowUpIcon className="h-4 w-4" />
              Read more scans
            </button>
          </div>

          {failedCount > 0 && (
            <p className="border-t border-gray-100 bg-severity_watch_bg px-3.5 py-2 text-[12px] text-severity_watch_text">
              {failedCount} {failedCount === 1 ? "invoice does" : "invoices do"}{" "}
              not reconcile against its own printed totals. They are in the
              exports too — check them against the scan first.
            </p>
          )}
          {problems.map((f) => (
            <div
              key={f.file}
              className="border-t border-gray-100 bg-severity_critical_bg px-3.5 py-2 text-[12px] text-severity_critical_text"
            >
              <span className="font-semibold">{f.file}: </span>
              {f.error ??
                (f.discarded?.length
                  ? `${f.discarded.length} invoice${f.discarded.length === 1 ? " was" : "s were"} read but left out — ` +
                    f.discarded
                      .map((d) => `${d.invoiceNumber ?? "(no number)"}: ${d.error}`)
                      .join("; ")
                  : `not archived (${f.storageError})`)}
            </div>
          ))}
        </section>

        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto pr-0.5">
          <div className="flex flex-col gap-3 pb-1">
            {visible.map((row) => (
              <ScannedInvoiceCard
                key={row.id}
                row={row}
                open={state.expandedId === row.id}
                onToggle={() =>
                  dispatch(
                    setScannedExpanded(
                      state.expandedId === row.id ? null : row.id,
                    ),
                  )
                }
              />
            ))}
            {visible.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-custom-white px-4 py-8 text-center text-[13px] text-content/85">
                {rows.length === 0
                  ? "No invoices were found in these scans."
                  : "Every invoice reconciles."}
              </p>
            )}
          </div>
        </div>
      </div>

      {moreOpen && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/35 p-4"
          onMouseDown={() => !state.parsing && setMoreOpen(false)}
        >
          <div
            className="w-full max-w-[560px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {entry(() => setMoreOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannedInvoices;
