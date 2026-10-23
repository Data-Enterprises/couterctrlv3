import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import ComingSoonHelp from "../../../components-dev/ComingSoonHelp";
import {
  clearInvoiceEdits,
  editInvoiceField,
  applySuggestedCorrections,
  revertInvoiceField,
  setInvoiceExpanded,
  setInvoiceFailedOnly,
  setInvoiceOverTenCentsOnly,
  setInvoiceNothingBilledOnly,
  setInvoicesError,
  setInvoicesFile,
  setInvoicesParsing,
  setInvoicesSendError,
  setInvoicesSending,
  setInvoicesSent,
  setInvoiceTextFilter,
} from "../../../features/dev/devInvoicesSlice";
import {
  invoiceFailed,
  parseEdiInvoices,
  type InvoiceParseResp,
} from "../../../api/invoices";
import InvoicesEntry from "./InvoicesEntry";
import InvoiceCard from "./InvoiceCard";
import { useAwgInvoices } from "./useAwgInvoices";
import { parseAwgFile } from "./vendors/awg";
import { awgRecordsToCsv } from "./vendors/awg/exportCsv";
import { awgInvoicesToOrdersCsv } from "./vendors/awg/exportOrders";
import SingleSelect from "../../../components-dev/SingleSelect";
import { setSelectedStore, setLastStore } from "../../../features/searchSlice";
import type { Store } from "../../../interfaces";
import { applyEdits } from "./vendors/awg/applyEdit";
import { downloadCsv } from "../../../utils/csvExport";
import type { InvoiceEdit } from "./vendors/awg/applyEdit";

/**
 * AWG Invoices — a vendor's electronic invoice file, decoded, corrected and sent.
 *
 * One list of invoices, each a card that opens where it sits. A file holds ten
 * or more and they are all the same shape, so the question is never "show me
 * this one" but "which of these does not balance" — and a card answers that
 * closed. Opening one is reading, not navigating: nothing is replaced, and the
 * others stay where they were.
 *
 * Every value on a line can be corrected in place. A correction does not
 * recompute its neighbours — the job is to fix what the file *says*, not to
 * recalculate the invoice — but the totals and the four checks are derived
 * from the lines, so they move the moment a cell commits. That loop is the
 * point of the page: correct, watch it reconcile, send.
 *
 * Parsing is local and synchronous, so there is no loading state worth showing.
 * What there is instead is a failure state, because a file in the wrong format
 * produces nothing rather than something wrong.
 */
const AwgInvoices = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { url, token } = useDevApi();

  const fileName = useAppSelector((s) => s.dev.invoices.fileName);
  const fileText = useAppSelector((s) => s.dev.invoices.fileText);
  const edits = useAppSelector((s) => s.dev.invoices.edits);
  const expandedId = useAppSelector((s) => s.dev.invoices.expandedId);
  const failedOnly = useAppSelector((s) => s.dev.invoices.failedOnly);
  const overTenCentsOnly = useAppSelector(
    (s) => s.dev.invoices.overTenCentsOnly,
  );
  const nothingBilledOnly = useAppSelector(
    (s) => s.dev.invoices.nothingBilledOnly,
  );
  const textFilter = useAppSelector((s) => s.dev.invoices.textFilter);
  const error = useAppSelector((s) => s.dev.invoices.error);
  const sending = useAppSelector((s) => s.dev.invoices.sending);
  const sentAt = useAppSelector((s) => s.dev.invoices.sentAt);
  const serverWarnings = useAppSelector((s) => s.dev.invoices.serverWarnings);
  const storeid = useAppSelector((s) => s.search.selectedStore?.storeid);
  const storeName = useAppSelector(
    (s) => s.search.selectedStore?.store_name ?? "",
  );
  const assignedStores = useAppSelector((s) => s.user.assignedStores);

  const [readOpen, setReadOpen] = useState(false);

  const { rows, allReconciled, failedCount, warnings, trailer } =
    useAwgInvoices();

  /** Why the file may not be whole, or null when its trailers agree. */
  const trailerProblem = useMemo(() => {
    if (!trailer || trailer.ok) return null;
    if (trailer.trailers === 0) {
      return "This file has no trailer record, so there is no way to confirm it arrived whole.";
    }
    const gap = trailer.expected - trailer.found;
    return gap > 0
      ? `The trailer counts say this file holds ${trailer.expected} records, but it holds ${trailer.found} — ${gap} missing. The file may be incomplete.`
      : `The trailer counts say this file holds ${trailer.expected} records, but it holds ${trailer.found} — ${-gap} more than any trailer accounts for.`;
  }, [trailer]);

  // Escape closes the re-read overlay. The page behind it is still readable, so
  // an overlay you can only leave by aiming at a button is the wrong trade.
  useEffect(() => {
    if (!readOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReadOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [readOpen]);

  /** Corrections on the open invoice, as the keys the card marks cells with. */
  const editedByDoc = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const edit of edits) {
      if (edit.kind === "suggested") continue;
      const key =
        edit.kind === "header" ? edit.field : `${edit.rowIndex}:${edit.field}`;
      const held = map.get(edit.docId) ?? new Set<string>();
      held.add(key);
      map.set(edit.docId, held);
    }
    return map;
  }, [edits]);

  const suggestedApplied = useMemo(
    () => edits.some((edit) => edit.kind === "suggested"),
    [edits],
  );

  const overTenCentsCount = useMemo(
    () => rows.filter((row) => row.overTenCents).length,
    [rows],
  );

  const nothingBilledCount = useMemo(
    () => rows.filter((row) => row.status === "nothingBilled").length,
    [rows],
  );

  const visible = useMemo(() => {
    const needle = textFilter.trim().toLowerCase();
    return rows.filter((row) => {
      if (failedOnly && row.reconciled) return false;
      if (overTenCentsOnly && !row.overTenCents) return false;
      if (nothingBilledOnly && row.status !== "nothingBilled") return false;
      if (!needle) return true;
      return (
        row.invoiceNbr.toLowerCase().includes(needle) ||
        row.storeNbr.toLowerCase().includes(needle) ||
        row.retailDept.toLowerCase().includes(needle)
      );
    });
  }, [rows, failedOnly, overTenCentsOnly, nothingBilledOnly, textFilter]);

  const handleFile = (text: string, name: string) => {
    dispatch(setInvoicesParsing(true));
    try {
      const parsed = parseAwgFile(text);
      if (parsed.invoices.length === 0) {
        // Nothing recognisable. Almost always the wrong file rather than an
        // empty one, so the message says so instead of showing a blank list.
        dispatch(
          setInvoicesError(
            "No invoices found in that file. It doesn't look like an AWG electronic invoice file.",
          ),
        );
        return;
      }
      dispatch(setInvoicesFile({ fileName: name, fileText: text }));
      setReadOpen(false);
    } catch (e) {
      // A decode error names the field it failed on, which is the one thing
      // that makes a malformed file diagnosable.
      dispatch(
        setInvoicesError(
          e instanceof Error ? e.message : "Could not read that file",
        ),
      );
    }
  };

  /**
   * The file itself, back as bytes.
   *
   * It was read as ISO-8859-1, so every character is one byte and the mapping
   * back is exact. Handing the server a UTF-8 re-encode would shift every
   * column after the first byte above 0x7F — the same failure the reader
   * exists to avoid.
   */
  const fileBytes = () => {
    const bytes = new Uint8Array(fileText.length);
    for (let i = 0; i < fileText.length; i += 1) {
      bytes[i] = fileText.charCodeAt(i) & 0xff;
    }
    return new File([bytes], fileName);
  };

  /** The file's records as decoded — no sums, no corrections. */
  const handleExport = () => {
    const base = fileName.replace(/\.[^.]*$/, "") || "awg_invoices";
    downloadCsv(awgRecordsToCsv(fileText), `${base}_raw.csv`);
  };

  /**
   * The invoices as the page has them — corrections and suggested
   * corrections included — in the order layout.
   *
   * Gated on the store for the same reason Send is: the layout's first column
   * is `storeid`, and a file without one cannot be loaded by anything.
   */
  const handleOrdersExport = () => {
    if (!storeid) {
      toast.warn("Choose a store before exporting orders.");
      return;
    }
    const base = fileName.replace(/\.[^.]*$/, "") || "awg_invoices";
    const invoices = applyEdits(parseAwgFile(fileText).invoices, edits);
    const { csv, undatedInvoices } = awgInvoicesToOrdersCsv(invoices, {
      storeid,
      storeName,
    });

    // A delivery date that could not be read leaves `order_date` blank, and a
    // blank date in a loaded order is the kind of thing nobody notices until
    // it matters. Named here rather than left to the file.
    if (undatedInvoices.length > 0) {
      toast.warn(
        `No delivery date on ${undatedInvoices.length} invoice${
          undatedInvoices.length === 1 ? "" : "s"
        } — ${undatedInvoices.slice(0, 5).join(", ")}${
          undatedInvoices.length > 5 ? " and others" : ""
        }. Those rows export with an empty order_date.`,
      );
    }

    // Which reading it came from, in the name. The same invoices export
    // materially different costs with suggested corrections applied, and two
    // files called the same thing are indistinguishable once downloaded.
    const corrected = invoices.some((invoice) => invoice.suggested === true);
    downloadCsv(
      csv,
      `${base}_orders${corrected ? "_corrected" : ""}.csv`,
    );
  };

  const handleSend = async () => {
    if (!storeid) {
      toast.warn("Choose a store before sending.");
      return;
    }
    dispatch(setInvoicesSending(true));
    try {
      const res = await parseEdiInvoices(url, token, storeid, [fileBytes()]);
      const body = res.data as InvoiceParseResp;
      if (invoiceFailed(body)) {
        dispatch(setInvoicesSendError(body.msg || "The send was refused."));
        toast.warn(body.msg || "The send was refused.");
        return;
      }
      // Per-file failures do not fail the request, so they have to be read
      // off the file report rather than off `error`.
      const failed = body.files.filter((f) => f.error);
      if (failed.length > 0) {
        const why = failed[0].error ?? "The file could not be decoded.";
        dispatch(setInvoicesSendError(why));
        toast.warn(why);
        return;
      }
      dispatch(
        setInvoicesSent({
          runId: body.runId,
          warnings: body.files.flatMap((f) => f.warnings ?? []),
        }),
      );
      toast.success(
        `Sent ${body.invoices.length} invoice${
          body.invoices.length === 1 ? "" : "s"
        }.`,
      );
    } catch {
      dispatch(setInvoicesSendError("The send could not be completed."));
      toast.warn("The send could not be completed.");
    }
  };

  if (!fileText) {
    return (
      <div className="flex min-h-[calc(100vh-3rem)] w-full select-none items-center justify-center p-4">
        <InvoicesEntry onFile={handleFile} error={error} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] w-full select-none overflow-hidden p-4">
      <div className="mx-auto flex h-full max-w-[1180px] flex-col gap-3">
        {/* ── the file, and what to do with it ───────────────────── */}
        <section className="flex-none overflow-hidden rounded-xl border border-gray-200 bg-custom-white shadow-sm">
          <div className="flex items-center gap-2 px-3.5 pt-3">
            <button
              type="button"
              onClick={() => setReadOpen(true)}
              aria-label="Read another file"
              className="flex h-7 w-7 flex-none items-center justify-center rounded border border-gray-200 text-content/85 hover:bg-bkg"
            >
              <MagnifyingGlassIcon className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold text-content">
              {fileName}
            </span>
            <div className="relative flex-shrink-0">
              <ComingSoonHelp />
            </div>
          </div>

          <div className="px-3.5 pt-2 font-mono text-[10px] uppercase tracking-wider text-content/85">
            {rows.length} {rows.length === 1 ? "invoice" : "invoices"} ·{" "}
            {failedCount === 0 ? "all reconciled" : `${failedCount} to check`}
            {edits.length > 0
              ? ` · ${edits.length} ${
                  edits.length === 1 ? "correction" : "corrections"
                }`
              : ""}
            {warnings.length > 0
              ? ` · ${warnings.length} parse ${
                  warnings.length === 1 ? "warning" : "warnings"
                }`
              : ""}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-3.5 py-2.5">
            <div className="flex min-w-[180px] flex-1 items-center gap-2 rounded-lg bg-bkg px-3">
              <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/85" />
              <input
                id="awg-invoice-filter"
                value={textFilter}
                onChange={(e) => dispatch(setInvoiceTextFilter(e.target.value))}
                placeholder="Invoice, store or department"
                inputMode="search"
                aria-label="Filter invoices"
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-[13px] text-content placeholder:text-brand_placeholder"
                style={{ outline: "none", boxShadow: "none" }}
              />
            </div>

            <button
              type="button"
              onClick={() => dispatch(setInvoiceFailedOnly(!failedOnly))}
              aria-pressed={failedOnly}
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                failedOnly
                  ? "border-brand_navy bg-brand_navy text-custom-white"
                  : "border-gray-200 bg-custom-white text-content/85"
              }`}
            >
              To check{failedCount > 0 ? ` (${failedCount})` : ""}
            </button>

            <button
              type="button"
              onClick={() =>
                dispatch(setInvoiceOverTenCentsOnly(!overTenCentsOnly))
              }
              aria-pressed={overTenCentsOnly}
              title="Invoices a check misses by more than 10¢ — past the vendor's penny rounding"
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                overTenCentsOnly
                  ? "border-brand_navy bg-brand_navy text-custom-white"
                  : "border-gray-200 bg-custom-white text-content/85"
              }`}
            >
              Over 10¢{overTenCentsCount > 0 ? ` (${overTenCentsCount})` : ""}
            </button>

            {/* Only when the file has any: a chip that can only ever show an
                empty list is noise. */}
            {nothingBilledCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  dispatch(setInvoiceNothingBilledOnly(!nothingBilledOnly))
                }
                aria-pressed={nothingBilledOnly}
                title="Invoices with no billed lines — only exceptions for items that did not ship"
                className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                  nothingBilledOnly
                    ? "border-brand_navy bg-brand_navy text-custom-white"
                    : "border-gray-200 bg-custom-white text-content/85"
                }`}
              >
                Nothing billed ({nothingBilledCount})
              </button>
            )}

            {/* Everything computed rather than read — retail by weight,
                split runs, per-pound cost and deals — waits behind this, so
                the page shows the file as it is until asked. */}
            <button
              type="button"
              onClick={() => dispatch(applySuggestedCorrections())}
              disabled={suggestedApplied}
              title={
                suggestedApplied
                  ? "Suggested corrections are applied — Undo all corrections takes them back"
                  : "Recompute retail, cost and allowances the way AWG builds its totals: split repeated random-weight retail, price random-weight lines by weight, use the multi-buy formula, cost and discount random-weight lines per pound, and round once"
              }
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                suggestedApplied
                  ? "border-gray-200 bg-bkg text-content/85"
                  : "border-brand_navy bg-custom-white text-brand_navy hover:bg-bkg"
              }`}
            >
              {suggestedApplied
                ? "Suggested corrections applied"
                : "Apply suggested corrections"}
            </button>

            {edits.length > 0 && (
              <button
                type="button"
                onClick={() => dispatch(clearInvoiceEdits())}
                className="flex-none rounded-full border border-gray-200 bg-custom-white px-3 py-1.5 text-[11px] font-medium text-content/85 hover:bg-bkg"
              >
                Undo all corrections
              </button>
            )}

            {/* The store, where the export that needs it is. `storeid` is
                the layout's first column and it went out blank on every
                row. */}
            <SingleSelect<Store>
              label={
                storeid ? (
                  "Store"
                ) : (
                  <>
                    Store{" "}
                    <span className="font-semibold text-brand_danger">
                      — not selected
                    </span>
                  </>
                )
              }
              data={assignedStores}
              displayKey="store_name"
              valueKey="storeid"
              value={storeid}
              defaultQuery={storeName}
              resetQuery
              onSelect={(id) => {
                const store = assignedStores.find(
                  (candidate) => candidate.storeid === Number(id),
                );
                if (!store) return;
                dispatch(setSelectedStore(store));
                dispatch(setLastStore(store.storeid));
              }}
              className="w-[220px] flex-none"
            />

            <button
              type="button"
              onClick={handleExport}
              title="Download every record as decoded, without totals or corrections"
              className="flex flex-none items-center gap-1.5 rounded-lg border border-gray-200 bg-custom-white px-3.5 py-2 font-display text-[13px] font-semibold text-content hover:bg-bkg"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export CSV
            </button>

            <button
              type="button"
              onClick={handleOrdersExport}
              title="Download the invoices in the order layout, one row per billed line, with every correction on the page applied"
              className="flex flex-none items-center gap-1.5 rounded-lg border border-gray-200 bg-custom-white px-3.5 py-2 font-display text-[13px] font-semibold text-content hover:bg-bkg"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export as orders
            </button>

            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !storeid}
              title={
                storeid
                  ? "Send this file to be decoded and archived"
                  : "Choose a store first"
              }
              className="flex flex-none items-center gap-1.5 rounded-lg bg-brand_navy px-3.5 py-2 font-display text-[13px] font-semibold text-custom-white hover:bg-brand_navy_hover disabled:opacity-50"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {sending ? "Sending…" : "Send"}
            </button>
          </div>

          {/* A file cut off between two invoices still reconciles invoice by
              invoice, so the trailer counts are the only sign it is short. */}
          {trailerProblem && (
            <p className="border-t border-gray-100 bg-severity_critical_bg px-3.5 py-2 text-[12px] text-severity_critical_text">
              {trailerProblem}
            </p>
          )}
          {/* Sending a file that does not balance is the one thing this page
              exists to prevent, so the reason sits under the control rather
              than only in its tooltip. */}
          {!allReconciled && (
            <p className="border-t border-gray-100 bg-severity_watch_bg px-3.5 py-2 text-[12px] text-severity_watch_text">
              {failedCount} {failedCount === 1 ? "invoice does" : "invoices do"}{" "}
              not reconcile here. The server decodes the file again and reaches
              its own verdict, so this does not stop a send &mdash; but the two
              disagreeing is worth knowing about.
            </p>
          )}
          {sentAt && allReconciled && serverWarnings.length === 0 && (
            <p className="border-t border-gray-100 bg-severity_healthy_bg px-3.5 py-2 text-[12px] text-severity_healthy_text">
              Sent. Any correction made from here replaces what was sent.
            </p>
          )}
          {/* Record types the decoder had no layout for — AWG's credit memos
              among them. Money it saw and did not understand, so a run that
              carries these must not read as a clean one. */}
          {sentAt && serverWarnings.length > 0 && (
            <p className="border-t border-gray-100 bg-severity_watch_bg px-3.5 py-2 text-[12px] text-severity_watch_text">
              Sent, with {serverWarnings.length}{" "}
              {serverWarnings.length === 1 ? "record type" : "record types"} the
              decoder has no layout for: {serverWarnings.join(", ")}. Nothing
              was dropped silently, but those records were not read.
            </p>
          )}
        </section>

        {/* ── the invoices ───────────────────────────────────────── */}
        <div className="thin-scrollbar min-h-0 flex-1 overflow-y-auto pr-0.5">
          <div className="flex flex-col gap-3 pb-1">
            {visible.map((row) => (
              <InvoiceCard
                key={row.id}
                row={row}
                open={expandedId === row.id}
                onToggle={() =>
                  dispatch(
                    setInvoiceExpanded(expandedId === row.id ? null : row.id),
                  )
                }
                editedKeys={editedByDoc.get(row.id) ?? new Set()}
                onEdit={(edit) =>
                  dispatch(
                    editInvoiceField({ ...edit, docId: row.id } as InvoiceEdit),
                  )
                }
                onRevert={(key) =>
                  dispatch(revertInvoiceField({ ...key, docId: row.id }))
                }
              />
            ))}

            {visible.length === 0 && (
              <p className="rounded-xl border border-gray-200 bg-custom-white px-4 py-8 text-center text-[13px] text-content/85">
                {nothingBilledOnly && (failedOnly || overTenCentsOnly)
                  ? "Invoices that billed nothing have nothing to check."
                  : overTenCentsOnly
                    ? "No invoice in this file misses by more than 10¢."
                    : failedOnly
                      ? "Every invoice in this file reconciles."
                      : "No invoice matches that filter."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* The card itself, on a dimmed page — not wrapped in the generic modal
          shell, which boxes a 560px card inside its own narrower frame and
          leaves the card's full-page centring to stretch the result. */}
      {readOpen && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center backdrop-blur-sm p-4"
          onMouseDown={() => setReadOpen(false)}
        >
          <div
            className="w-full max-w-[560px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <InvoicesEntry
              onFile={handleFile}
              error={error}
              onClose={() => setReadOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AwgInvoices;
