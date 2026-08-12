import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { parseScannedInvoices } from "../../api/invoices";
import type { JsonError, ParseScannedJsonResp } from "../../interfaces";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../components/EmptyPrompt";
import ExportModal from "../../components/modals/ExportModal";
import InvoiceUploadCard from "./components/InvoiceUploadCard";
import InvoiceListPanel from "./components/InvoiceListPanel";
import InvoiceDetailPanel from "./components/InvoiceDetailPanel";
import { ENGINES, buildLineExportRows, lineExportCols, pairInvoices } from ".";
import {
  clearParseResult,
  setEngine,
  setInvoiceExportOpen,
  setParseResult,
  setParsing,
  setSelectedInvoiceIndex,
} from "./invoiceParsingSlice";

const InvoiceParsing = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((s) => s.app);
  const {
    engine,
    runId,
    runEngine,
    model,
    invoices,
    reconciliation,
    files,
    storage,
    isParsing,
    selectedInvoiceIndex,
    exportOpen,
  } = useAppSelector((s) => s.invoiceParsing);

  // Files being staged for the next run. Local, not Redux — a File isn't
  // serializable, and there is nothing about a half-filled upload box worth
  // surviving a route change.
  const [pending, setPending] = useState<File[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState<string | undefined>(undefined);

  const rows = useMemo(
    () => pairInvoices(invoices, reconciliation),
    [invoices, reconciliation],
  );
  const selected =
    selectedInvoiceIndex === null ? undefined : rows[selectedInvoiceIndex];

  const handleExtract = () => {
    if (pending.length === 0) return;
    setNotice(undefined);
    dispatch(setParsing(true));
    setUploadOpen(false);

    parseScannedInvoices(url, token, pending, engine)
      .then((resp) => {
        const j: ParseScannedJsonResp = resp.data;
        if (j.error !== 0) {
          setNotice(j.msg || "The extraction failed.");
          setUploadOpen(true);
          toast.error(j.msg || "Invoice extraction failed");
          return;
        }

        dispatch(
          setParseResult({
            runId: j.runId ?? null,
            // Server echoes the engine; fall back to the one we asked for.
            runEngine: j.engine ?? engine,
            model: j.model ?? null,
            invoices: j.invoices ?? [],
            reconciliation: j.reconciliation ?? [],
            files: j.files ?? [],
            storage: j.storage ?? null,
          }),
        );
        setPending([]);

        const failed = (j.files ?? []).filter((f) => f.error).length;
        const count = (j.invoices ?? []).length;
        if (count === 0) {
          // Every file failed, or nothing in them parsed — keep the upload card
          // open so the errors sit next to the box they came from.
          setNotice("No invoices came back from this batch.");
          setUploadOpen(true);
        } else if (failed > 0) {
          toast.warn(
            `${count} invoice${count === 1 ? "" : "s"} extracted — ${failed} file${failed === 1 ? "" : "s"} failed`,
          );
        } else {
          toast.success(
            `${count} invoice${count === 1 ? "" : "s"} extracted`,
          );
        }

        const off = (j.reconciliation ?? []).filter((r) => !r.reconciled).length;
        if (off > 0) {
          toast.warn(
            `${off} invoice${off === 1 ? "" : "s"} did not reconcile against ${off === 1 ? "its" : "their"} printed totals`,
          );
        }
        // Extraction survived, archiving didn't. Worth saying out loud — the
        // audit trail back to the source image is the point of the archive.
        // Source documents and the run's result.json fail independently, so
        // either one going missing gets its own line.
        const unarchived = (j.files ?? []).filter(
          (f) => !f.error && f.storageError,
        ).length;
        if (unarchived > 0) {
          toast.warn(
            unarchived === 1
              ? "A source document was not archived — its invoices can't be traced back to the scan"
              : `${unarchived} source documents were not archived — their invoices can't be traced back to the scans`,
          );
        }
        if (j.storage?.error) {
          toast.warn("Results were not archived to S3 — " + j.storage.error);
        }
      })
      .catch((err: JsonError) => {
        setNotice(err.message);
        setUploadOpen(true);
        toast.error(err.message);
      })
      .finally(() => dispatch(setParsing(false)));
  };

  const handleNewBatch = () => {
    setNotice(undefined);
    setUploadOpen(true);
  };

  const exportRows = useMemo(() => buildLineExportRows(rows), [rows]);
  const engineLabel = (id: string) =>
    ENGINES.find((e) => e.id === id)?.label ?? id;

  if (isMobile) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] p-4">
        <EmptyPrompt
          title="Invoice Parsing is desktop only"
          description="Scanned invoices are read side by side with their line items — use a desktop for this one."
        />
      </div>
    );
  }

  if (isParsing) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={`Reading ${pending.length} file${pending.length === 1 ? "" : "s"} with ${engineLabel(engine)}... this can take a few minutes`}
        />
      </div>
    );
  }

  // No run yet, or the user asked to upload another batch.
  if (invoices.length === 0 || uploadOpen) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <InvoiceUploadCard
          files={pending}
          onFilesChange={setPending}
          engine={engine}
          onEngineChange={(next) => dispatch(setEngine(next))}
          onExtract={handleExtract}
          loading={isParsing}
          notice={notice}
          onBack={
            invoices.length > 0
              ? () => {
                  setNotice(undefined);
                  setUploadOpen(false);
                }
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none h-[calc(100vh-3rem)] overflow-hidden flex flex-col">
      <ExportModal
        resizable
        isOpen={exportOpen}
        columns={lineExportCols}
        data={exportRows}
        onClose={() => dispatch(setInvoiceExportOpen(false))}
      />

      {/* Run provenance. The prefix is what a disputed invoice gets traced
          through, so it's on screen rather than buried in a log table. */}
      <div className="flex items-center gap-3 px-1 pb-2 text-[11px] text-content/45 flex-shrink-0">
        {runEngine && (
          <span className="font-semibold text-content/60">
            {engineLabel(runEngine)}
          </span>
        )}
        {runId && <span>· Run {runId}</span>}
        {model && <span>· {model}</span>}
        {storage?.prefix && (
          <span className="truncate">
            · {storage.bucket}/{storage.prefix}
          </span>
        )}
        <button
          onClick={() => dispatch(clearParseResult())}
          className="ml-auto underline underline-offset-2 hover:text-content transition-colors"
        >
          Clear results
        </button>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        <div
          className="flex flex-col min-w-0"
          style={{ flexBasis: "34%", flexShrink: 0 }}
        >
          <InvoiceListPanel
            rows={rows}
            files={files}
            selectedIndex={selectedInvoiceIndex}
            onSelect={(index) => dispatch(setSelectedInvoiceIndex(index))}
            onNewBatch={handleNewBatch}
            onExport={() => dispatch(setInvoiceExportOpen(true))}
          />
        </div>

        <div className="flex-1 min-w-0">
          {selected ? (
            <InvoiceDetailPanel
              invoice={selected.invoice}
              reconciliation={selected.reconciliation}
            />
          ) : (
            <EmptyPrompt
              title="Select an invoice"
              description="Pick an invoice on the left to see its line items and reconciliation."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceParsing;
