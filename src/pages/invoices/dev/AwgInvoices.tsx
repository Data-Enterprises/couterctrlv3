import { useMemo, useRef, useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useDevApi } from "../../../hooks/useDevApi";
import { useToast } from "../../../components/toasts/hooks/useToast";
import ComingSoonHelp from "../../../components-dev/ComingSoonHelp";
import {
  clearInvoiceEdits,
  editInvoiceField,
  toggleSuggestedCorrections,
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
  discardedIn,
  invoiceFailed,
  parseEdiInvoices,
  type InvoiceParseResp,
} from "../../../api/invoices";
import { discardedText } from "./present";
import InvoicesEntry from "./InvoicesEntry";
import { readInvoiceFile } from "./readInvoiceFile";
import InvoiceExportModal from "./InvoiceExportModal";
import { rebuildAwgFile } from "./vendors/awg/rebuildFile";
import InvoiceCard from "./InvoiceCard";
import { useAwgInvoices } from "./useAwgInvoices";
import { parseAwgFile } from "./vendors/awg";
import { awgRecordsToCsv } from "./vendors/awg/exportCsv";
import { awgInvoicesToOrdersCsv } from "./vendors/awg/exportOrders";
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
/**
 * The filter row's pills, in the house filter dress.
 *
 * They wore `border-gray-200`, which reads as no border at all beside the
 * controls in `components-dev/filters` -- those carry a navy hairline idle
 * and the `filter_active` tint with a ring when they are narrowing something.
 * Same tokens here, so the row looks like every other filter row.
 *
 * Navy fill is left to the primary action, which is the one thing on this row
 * that does something rather than narrows something.
 */
const PILL_IDLE =
  "border-brand_navy/75 bg-custom-white text-content hover:border-brand_navy/50";
const PILL_ON =
  "border-filter_active_border bg-filter_active text-content ring-2 ring-filter_active_border/30";

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
  const serverDiscarded = useAppSelector(
    (s) => s.dev.invoices.serverDiscarded,
  );
  const storeid = useAppSelector((s) => s.search.selectedStore?.storeid);

  /** The toolbar button opens this rather than an overlay holding a drop
   *  zone — see the drop handlers on the frame below. */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

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

  /** Corrections somebody typed, as against the suggested ones. Only these
   *  are worth an "undo everything" — the suggested set has its own toggle,
   *  and offering both made two controls for one state. */
  const handEditCount = useMemo(
    () => edits.filter((edit) => edit.kind !== "suggested").length,
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

  /** The invoices as the page has them: parsed fresh, every correction
   *  replayed. Three things want this — both exports and the send — and all
   *  three were deriving it separately. */
  const correctedInvoices = () =>
    applyEdits(parseAwgFile(fileText).invoices, edits);

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
  /** Text back to the bytes it was read from. ISO-8859-1 round trip: every
   *  code point came from one byte, so one byte is what it goes back as. */
  const fileBytes = (text: string) => {
    const bytes = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i += 1) {
      bytes[i] = text.charCodeAt(i) & 0xff;
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
   * No store is asked for. A file carries several AWG stores -- the sample
   * holds ten invoices across two -- so one chosen on screen would stamp the
   * same id on all of them. `storenumber` goes out per invoice, from the
   * file, and the pipeline maps it.
   */
  const handleOrdersExport = () => {
    const base = fileName.replace(/\.[^.]*$/, "") || "awg_invoices";
    const invoices = correctedInvoices();
    const { csv, undatedInvoices } = awgInvoicesToOrdersCsv(invoices);

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
    // The whole point of being able to edit: what the server decodes is
    // what is on screen. This used to upload the file exactly as it arrived,
    // so ten corrections and a send archived the file as if none had been
    // made -- and nothing said so.
    const rebuilt = rebuildAwgFile(fileText, correctedInvoices());
    if (rebuilt.refused.length > 0) {
      // A value that will not fit its column cannot be sent. Saying which is
      // the difference between a refusal and a silent revert.
      toast.warn(
        `${rebuilt.refused.length} correction${
          rebuilt.refused.length === 1 ? "" : "s"
        } will not fit the file's own columns and cannot be sent — ${rebuilt.refused
          .slice(0, 3)
          .join(", ")}${rebuilt.refused.length > 3 ? " and others" : ""}.`,
      );
      return;
    }

    dispatch(setInvoicesSending(true));
    try {
      const res = await parseEdiInvoices(url, token, storeid, [
        fileBytes(rebuilt.text),
      ]);
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
      // Invoices the server read and would not save are not a file error, so
      // without this a send that lost one still toasted as a clean one.
      const discarded = discardedIn(body.files);
      dispatch(
        setInvoicesSent({
          runId: body.runId,
          warnings: body.files.flatMap((f) => f.warnings ?? []),
          discarded,
        }),
      );
      const saved = body.invoices.length;
      if (discarded.length > 0) {
        toast.warn(
          `Sent ${saved} of ${saved + discarded.length} invoices. Not saved: ${discardedText(discarded)}.`,
        );
      } else {
        toast.success(`Sent ${saved} invoice${saved === 1 ? "" : "s"}.`);
      }
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
    /* The page takes the file, so the drop zone is wherever the reader is
       looking. It used to live inside an overlay, which meant clicking a
       button to reach the thing you drag onto. `dragover` has to be
       cancelled or the browser navigates to the file instead. */
    <div
      className="h-[calc(100vh-3rem)] w-full select-none overflow-hidden p-4"
      onDragOver={(e) => {
        e.preventDefault();
        setDraggingFile(true);
      }}
      onDragLeave={(e) => {
        // Only when the pointer leaves the page, not on every child it
        // crosses on the way in.
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDraggingFile(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDraggingFile(false);
        const file = e.dataTransfer.files?.[0];
        if (file) readInvoiceFile(file, handleFile);
      }}
    >
      <div className="mx-auto flex h-full max-w-[1180px] flex-col gap-3">
        {/* ── the file, and what to do with it ───────────────────── */}
        <section className="flex-none overflow-hidden rounded-xl border border-gray-200 bg-custom-white shadow-sm">
          <div className="flex items-center gap-2 px-3.5 pt-3">
            {/* A document, not a magnifier: this loads a file, it does not
                search for one. */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Read another file"
              title="Read another file — or drop one anywhere on this page"
              className="flex h-7 w-7 flex-none items-center justify-center rounded border border-gray-200 text-content/85 hover:bg-bkg"
            >
              <DocumentArrowUpIcon className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) readInvoiceFile(file, handleFile);
                // Cleared so re-picking the same file still fires.
                e.target.value = "";
              }}
            />
            <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold text-content">
              {fileName}
            </span>
            <div className="relative flex-shrink-0">
              <ComingSoonHelp />
            </div>
          </div>

          <div className="px-3.5 pt-2 font-mono text-[11px] uppercase tracking-wider text-content">
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
            {/* Fixed, not flex-1. Growing to fill the row took width the
                store chooser needed more -- a store name is longer than
                anything typed in here. 280 fits its own placeholder. */}
            <div className="flex w-[280px] flex-none items-center gap-2 rounded-lg bg-bkg px-3">
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
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                failedOnly ? PILL_ON : PILL_IDLE
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
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                overTenCentsOnly ? PILL_ON : PILL_IDLE
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
            {/* One pill, two states, like the two beside it. It used to be
                a button that greyed out once pressed and read "Suggested
                corrections applied" — a sentence where its neighbours have a
                name — with "Undo all corrections" appearing next to it as
                the only way back. Two controls for one piece of state, and
                the way back also threw away every figure typed by hand. */}
            <button
              type="button"
              onClick={() => dispatch(toggleSuggestedCorrections())}
              aria-pressed={suggestedApplied}
              title="Recompute retail, cost and allowances the way AWG builds its totals: split repeated random-weight retail, price random-weight lines by weight, use the multi-buy formula, cost and discount random-weight lines per pound, and round once"
              className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                suggestedApplied ? PILL_ON : PILL_IDLE
              }`}
            >
              Suggested corrections
            </button>

            {/* Only for corrections somebody typed. It appeared whenever any
                edit existed, so turning the suggestions on summoned an
                "undo everything" for a state that now has its own switch. */}
            {handEditCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(clearInvoiceEdits())}
                title="Discard every figure typed by hand on this file"
                className={`flex-none rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${PILL_IDLE}`}
              >
                Undo {handEditCount}{" "}
                {handEditCount === 1 ? "correction" : "corrections"}
              </button>
            )}

            {/* One door. Three buttons said what each one did and nothing
                about how they differ, and they differ a lot: two ignore every
                correction on the page and one does not, two make a file and
                one talks to the server. That does not fit on a button. */}
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              title="Download the records, download the order layout, or send the file to be decoded"
              className="flex flex-none items-center gap-1.5 rounded-lg bg-brand_navy px-3.5 py-2 font-display text-[13px] font-semibold text-custom-white hover:bg-brand_navy_hover"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Export or send
            </button>

            <span className="flex-1" />


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
          {sentAt &&
            allReconciled &&
            serverWarnings.length === 0 &&
            serverDiscarded.length === 0 && (
            <p className="border-t border-gray-100 bg-severity_healthy_bg px-3.5 py-2 text-[12px] text-severity_healthy_text">
              Sent. Any correction made from here replaces what was sent.
            </p>
          )}
          {/* Invoices the server read and would not save. Named one by one,
              with the server's reason, because each is an invoice that is
              missing from the import until it is corrected and sent again. */}
          {sentAt && serverDiscarded.length > 0 && (
            <p className="border-t border-gray-100 bg-severity_critical_bg px-3.5 py-2 text-[12px] text-severity_critical_text">
              Sent, but {serverDiscarded.length}{" "}
              {serverDiscarded.length === 1 ? "invoice was" : "invoices were"}{" "}
              not saved: {discardedText(serverDiscarded)}.
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

      {/* Mounted only while open: the shell is the house one, which owns its
          own backdrop and size. */}
      {exportOpen && (
        <InvoiceExportModal
          onClose={() => setExportOpen(false)}
          onRaw={() => {
            setExportOpen(false);
            handleExport();
          }}
          onOrders={() => {
            setExportOpen(false);
            handleOrdersExport();
          }}
          onSend={() => {
            setExportOpen(false);
            void handleSend();
          }}
          sending={sending}
          fileName={fileName}
          storeChosen={!!storeid}
          handEditCount={handEditCount}
          suggestedApplied={suggestedApplied}
        />
      )}

      {/* Said, because the page gives no other sign a drop is allowed —
          the dashed box that used to say it is only on the first read now. */}
      {draggingFile && (
        <div className="pointer-events-none fixed inset-0 z-[5000] flex items-center justify-center bg-brand_navy/10">
          <span className="rounded-lg border-2 border-dashed border-brand_navy bg-custom-white px-5 py-3 font-display text-[14px] font-semibold text-content shadow-lg">
            Drop an AWG file to read it
          </span>
        </div>
      )}
    </div>
  );
};

export default AwgInvoices;
