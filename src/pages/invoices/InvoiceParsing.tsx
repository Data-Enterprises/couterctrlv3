import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import {
  getInvoiceHistory,
  getInvoiceResult,
  parseScannedInvoices,
} from "../../api/invoices";
import type {
  InvoiceHistoryFile,
  InvoiceHistoryJsonResp,
  InvoiceResultJsonResp,
  JsonError,
  ParseScannedJsonResp,
} from "../../interfaces";
import type { BulkFileProgress } from ".";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../components/EmptyPrompt";
import ExportModal from "../../components/modals/ExportModal";
import InvoiceUploadCard from "./components/InvoiceUploadCard";
import InvoiceListPanel from "./components/InvoiceListPanel";
import InvoiceDetailPanel from "./components/InvoiceDetailPanel";
import InvoiceHistoryPanel from "./components/InvoiceHistoryPanel";
import InvoiceBulkProgressPanel from "./components/InvoiceBulkProgressPanel";
import {
  ENGINES,
  buildLineExportRows,
  lineExportCols,
  mergeRunResults,
  pairInvoices,
  readableError,
  toParseResult,
} from ".";
import type { InvoiceParseResult } from "./invoiceParsingSlice";
import {
  HISTORY_PAGE_SIZE,
  clearParseResult,
  setBulk,
  setEngine,
  setHistory,
  setHistoryFilters,
  setHistoryLoading,
  setHistoryOffset,
  setInvoiceExportOpen,
  setInvoiceStoreid,
  setInvoiceView,
  setOpeningRunId,
  setParseResult,
  setParsing,
  setSelectedInvoiceIndex,
} from "./invoiceParsingSlice";

const InvoiceParsing = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((s) => s.app);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const lastStore = useAppSelector((s) => s.search.lastStore);
  const {
    view,
    engine,
    storeid,
    bulk,
    runIds,
    runId,
    runEngine,
    runStoreid,
    model,
    pageCount,
    estCostUsd,
    invoices,
    reconciliation,
    files,
    storage,
    isParsing,
    selectedInvoiceIndex,
    exportOpen,
    runArchived,
    runExtractedAt,
    runExtractedBy,
    history,
    historyTotal,
    historyOffset,
    historyLoading,
    historyStoreid,
    historyEngine,
    historyStatus,
    openingRunId,
  } = useAppSelector((s) => s.invoiceParsing);

  // Files being staged for the next run. Local, not Redux — a File isn't
  // serializable, and there is nothing about a half-filled upload box worth
  // surviving a route change.
  const [pending, setPending] = useState<File[]>([]);
  const [notice, setNotice] = useState<string | undefined>(undefined);
  // Per-file state of a bulk run. Local for the same reason as `pending` — it
  // describes work in flight from this screen, and it dies with it.
  const [bulkProgress, setBulkProgress] = useState<BulkFileProgress[]>([]);
  const [canceling, setCanceling] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Start on whatever store the rest of the app is already looking at, but only
  // if it's one this user is actually assigned — the endpoint checks the same
  // thing and rejects the run outright, so seeding a store they can't use would
  // just move the failure later.
  useEffect(() => {
    if (storeid !== 0 || !lastStore) return;
    if (assignedStores.some((s) => s.storeid === lastStore)) {
      dispatch(setInvoiceStoreid(lastStore));
    }
  }, [assignedStores, lastStore]);

  const rows = useMemo(
    () => pairInvoices(invoices, reconciliation),
    [invoices, reconciliation],
  );
  const selected =
    selectedInvoiceIndex === null ? undefined : rows[selectedInvoiceIndex];

  /** Warnings about a finished extraction that aren't about whether it ran:
   *  invoices whose own arithmetic didn't add up, and documents that were read
   *  but never archived. Shared by both paths so a bulk run reports the same
   *  things about the batch that a single request reports about itself. */
  const warnAboutRun = (result: InvoiceParseResult) => {
    const off = result.reconciliation.filter((r) => !r.reconciled).length;
    if (off > 0) {
      toast.warn(
        `${off} invoice${off === 1 ? "" : "s"} did not reconcile against ${off === 1 ? "its" : "their"} printed totals`,
      );
    }
    // Extraction survived, archiving didn't. Worth saying out loud — the
    // audit trail back to the source image is the point of the archive.
    // Source documents and the run's result.json fail independently, so
    // either one going missing gets its own line.
    const unarchived = result.files.filter(
      (f) => !f.error && f.storageError,
    ).length;
    if (unarchived > 0) {
      toast.warn(
        unarchived === 1
          ? "A source document was not archived — its invoices can't be traced back to the scan"
          : `${unarchived} source documents were not archived — their invoices can't be traced back to the scans`,
      );
    }
    if (result.storage?.error) {
      toast.warn("Results were not archived to S3 — " + result.storage.error);
    }
  };

  const handleExtractSingle = () => {
    dispatch(setParsing(true));

    parseScannedInvoices(url, token, pending, engine, storeid)
      .then((resp) => {
        const j: ParseScannedJsonResp = resp.data;
        if (j.error !== 0) {
          setNotice(j.msg || "The extraction failed.");
          dispatch(setInvoiceView("upload"));
          toast.error(j.msg || "Invoice extraction failed");
          return;
        }

        const result = toParseResult(j, engine, storeid);
        dispatch(setParseResult(result));
        setPending([]);

        const failed = result.files.filter((f) => f.error).length;
        const count = result.invoices.length;
        if (count === 0) {
          // Every file failed, or nothing in them parsed — keep the upload card
          // open so the errors sit next to the box they came from.
          setNotice("No invoices came back from this batch.");
          dispatch(setInvoiceView("upload"));
        } else if (failed > 0) {
          toast.warn(
            `${count} invoice${count === 1 ? "" : "s"} extracted — ${failed} file${failed === 1 ? "" : "s"} failed`,
          );
        } else {
          toast.success(`${count} invoice${count === 1 ? "" : "s"} extracted`);
        }

        warnAboutRun(result);
      })
      .catch((err: JsonError) => {
        setNotice(readableError(err));
        dispatch(setInvoiceView("upload"));
        toast.error(readableError(err));
      })
      .finally(() => dispatch(setParsing(false)));
  };

  /**
   * Bulk: one request per staged file, all of them fired at once — drop 20
   * files and 20 requests go out. Every file gets its own runId, its own
   * archive prefix and its own history row, so a file that fails takes nothing
   * else with it, and the results on screen are re-merged each time one lands
   * rather than waiting for the slowest file in the drop.
   *
   * Nothing here paces the batch: the browser keeps about six connections open
   * per origin and queues the rest itself, which is the only throttle.
   */
  const handleExtractBulk = async () => {
    const batch = pending;
    const controller = new AbortController();
    abortRef.current = controller;
    setCanceling(false);
    setBulkProgress(
      batch.map((f) => ({ file: f.name, status: "queued", invoices: 0 })),
    );
    dispatch(setParsing(true));

    const update = (index: number, patch: Partial<BulkFileProgress>) =>
      setBulkProgress((prev) =>
        prev.map((p, i) => (i === index ? { ...p, ...patch } : p)),
      );

    // Runs that came back with something, in the order their file was staged
    // — the merge relies on that order to keep each run's invoices next to its
    // own reconciliation entries.
    const done: (InvoiceParseResult | undefined)[] = new Array(batch.length);
    const settled = () =>
      done.filter((r): r is InvoiceParseResult => r !== undefined);
    // Indexes, not names — two staged files can share a name if they differ in
    // size, and restaging the wrong one would silently re-send a file that
    // already succeeded.
    const restage = new Set<number>();
    let failed = 0;

    await Promise.all(
      batch.map(async (file, index) => {
        update(index, { status: "running" });
        try {
          const resp = await parseScannedInvoices(
            url,
            token,
            [file],
            engine,
            storeid,
            controller.signal,
          );
          const j: ParseScannedJsonResp = resp.data;
          if (j.error !== 0) {
            failed++;
            restage.add(index);
            update(index, {
              status: "failed",
              error: j.msg || "The extraction failed.",
            });
            return;
          }

          const result = toParseResult(j, engine, storeid);
          done[index] = result;
          // Fold this file into what's on screen now — the results screen is
          // already behind the progress card, and it's what the user lands on
          // if they stop the run partway.
          dispatch(setParseResult(mergeRunResults(settled())));

          // The request succeeded; the one file in it may still not have. Its
          // own report is the authority on that.
          const fileError = result.files.find((f) => f.error)?.error ?? null;
          if (fileError) {
            failed++;
            restage.add(index);
          }
          update(index, {
            status: fileError ? "failed" : "done",
            invoices: result.invoices.length,
            error: fileError ?? undefined,
          });
        } catch (err) {
          // An abort lands here as a rejection. Whether the server had already
          // started reading the file is invisible from here, so it isn't
          // reported as the file's failure — but it has no result to show,
          // which leaves it in the same place as one.
          if (controller.signal.aborted) {
            restage.add(index);
            update(index, { status: "canceled" });
            return;
          }
          failed++;
          restage.add(index);
          update(index, { status: "failed", error: readableError(err) });
        }
      }),
    );

    const merged = mergeRunResults(settled());
    const count = merged.invoices.length;

    // Files that failed or were never sent stay staged: the usual next move is
    // to try them again, often on the other engine, and re-picking them from
    // disk is the part nobody wants to do twice.
    setPending(batch.filter((_, i) => restage.has(i)));

    if (count === 0) {
      setNotice(
        controller.signal.aborted
          ? "Stopped before any invoices came back."
          : "No invoices came back from this batch.",
      );
      dispatch(setInvoiceView("upload"));
      if (failed > 0) {
        toast.error(
          `All ${failed} file${failed === 1 ? "" : "s"} failed to extract`,
        );
      }
    } else if (failed > 0) {
      toast.warn(
        `${count} invoice${count === 1 ? "" : "s"} extracted — ${failed} file${failed === 1 ? "" : "s"} failed`,
      );
    } else {
      toast.success(
        `${count} invoice${count === 1 ? "" : "s"} extracted from ${settled().length} file${settled().length === 1 ? "" : "s"}`,
      );
    }
    if (count > 0) warnAboutRun(merged);

    // A stopped run leaves its unfinished files staged, which reads as "these
    // still need doing". True for the ones never sent; for one that was in
    // flight the server finished anyway and filed it, so say where to look
    // before it gets paid for twice.
    if (controller.signal.aborted && restage.size > 0) {
      toast.warn(
        `Stopped with ${restage.size} file${restage.size === 1 ? "" : "s"} unfinished — anything already sent was still read, so check History before re-running ${restage.size === 1 ? "it" : "them"}`,
      );
    }

    abortRef.current = null;
    setCanceling(false);
    dispatch(setParsing(false));
  };

  const handleExtract = () => {
    if (pending.length === 0 || storeid === 0) return;
    setNotice(undefined);
    if (bulk) {
      void handleExtractBulk();
    } else {
      handleExtractSingle();
    }
  };

  /** Stops the queue. Requests already sent are read and billed server-side
   *  whichever way this goes, so aborting them only gives up the answer — and
   *  the archive still holds it, reachable from History. */
  const handleCancelBulk = () => {
    setCanceling(true);
    abortRef.current?.abort();
  };

  const handleNewBatch = () => {
    setNotice(undefined);
    dispatch(setInvoiceView("upload"));
  };

  const loadHistory = (offset = historyOffset) => {
    dispatch(setHistoryLoading(true));
    getInvoiceHistory(url, token, {
      storeid: historyStoreid ?? undefined,
      engine: historyEngine ?? undefined,
      status: historyStatus ?? undefined,
      limit: HISTORY_PAGE_SIZE,
      offset,
    })
      .then((resp) => {
        const j: InvoiceHistoryJsonResp = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Could not load previous runs");
          return;
        }
        dispatch(
          setHistory({
            files: j.files ?? [],
            total: j.total ?? 0,
            offset: j.offset ?? offset,
          }),
        );
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setHistoryLoading(false)));
  };

  // Refetch on entering History and on any filter or page change. The filters
  // live in Redux, so coming back to the page re-runs the same query rather
  // than silently showing a stale list under filters that say otherwise.
  useEffect(() => {
    if (view !== "history") return;
    loadHistory();
  }, [view, historyStoreid, historyEngine, historyStatus, historyOffset]);

  const handleOpenRun = (file: InvoiceHistoryFile) => {
    dispatch(setOpeningRunId(file.runId));
    getInvoiceResult(url, token, file.runId)
      .then((resp) => {
        const j: InvoiceResultJsonResp = resp.data;
        if (j.error !== 0 || !j.result) {
          toast.error(j.msg || "Could not open that run");
          return;
        }
        const r = j.result;
        // The archive deliberately carries no cost — it's derived at read time.
        // Sum what the history rows for this run report instead, and treat a
        // run whose rows we don't all hold, or that has any unpriced row, as
        // unpriced rather than under-reporting it.
        const runRows = history.filter((h) => h.runId === file.runId);
        const allPriced =
          runRows.length === r.files.length &&
          runRows.every((h) => h.estCostUsd !== null);
        const cost = allPriced
          ? runRows
              .reduce((sum, h) => sum + Number(h.estCostUsd), 0)
              .toFixed(4)
          : null;

        dispatch(
          setParseResult({
            runIds: [r.runId],
            runEngine: r.engine,
            runStoreid: r.storeid,
            model: r.model,
            pageCount: r.pageCount ?? null,
            estCostUsd: cost,
            runArchived: true,
            runExtractedAt: r.extractedAt,
            runExtractedBy: r.extractedBy,
            invoices: r.invoices ?? [],
            reconciliation: r.reconciliation ?? [],
            files: r.files ?? [],
            // Reconstructed from the archive's own location — the run key is
            // "<prefix>/result.json", so the prefix is everything before it.
            storage: j.resultS3Uri
              ? {
                  bucket: j.resultS3Uri.replace("s3://", "").split("/")[0],
                  prefix: j.resultS3Uri
                    .replace("s3://", "")
                    .split("/")
                    .slice(1, -1)
                    .join("/"),
                  resultKey: j.resultS3Uri
                    .replace("s3://", "")
                    .split("/")
                    .slice(1)
                    .join("/"),
                  error: null,
                }
              : null,
          }),
        );

        if ((r.invoices ?? []).length === 0) {
          // setParseResult only switches to results when there are invoices to
          // show, so say why the screen didn't change.
          toast.warn("That run archived no invoices — nothing to display.");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setOpeningRunId(null)));
  };

  const exportRows = useMemo(() => buildLineExportRows(rows), [rows]);
  const engineLabel = (id: string) =>
    ENGINES.find((e) => e.id === id)?.label ?? id;
  const storeLabel = (id: number) =>
    assignedStores.find((s) => s.storeid === id)?.store_name ?? `Store ${id}`;

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
    // A bulk run has per-file state worth showing, and something to stop. A
    // single request has neither — it's one opaque wait.
    if (bulk && bulkProgress.length > 0) {
      return (
        <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
          <InvoiceBulkProgressPanel
            files={bulkProgress}
            engineLabel={engineLabel(engine)}
            canceling={canceling}
            onCancel={handleCancelBulk}
          />
        </div>
      );
    }
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator
          message={`Reading ${pending.length} file${pending.length === 1 ? "" : "s"} with ${engineLabel(engine)}... this can take a few minutes`}
        />
      </div>
    );
  }

  if (view === "history") {
    return (
      <div className="w-full p-4 select-none h-[calc(100vh-3rem)] overflow-hidden">
        <InvoiceHistoryPanel
          files={history}
          total={historyTotal}
          offset={historyOffset}
          pageSize={HISTORY_PAGE_SIZE}
          loading={historyLoading}
          openingRunId={openingRunId}
          stores={assignedStores}
          storeid={historyStoreid}
          engine={historyEngine}
          status={historyStatus}
          onFilterChange={(next) => dispatch(setHistoryFilters(next))}
          onOffsetChange={(next) => dispatch(setHistoryOffset(next))}
          onRefresh={() => loadHistory()}
          onOpenRun={handleOpenRun}
          onBack={() =>
            dispatch(setInvoiceView(invoices.length > 0 ? "results" : "upload"))
          }
        />
      </div>
    );
  }

  // No run to show, or the user asked to upload another batch.
  if (view === "upload" || invoices.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <InvoiceUploadCard
          files={pending}
          onFilesChange={setPending}
          engine={engine}
          onEngineChange={(next) => dispatch(setEngine(next))}
          stores={assignedStores}
          storeid={storeid}
          onStoreChange={(next) => dispatch(setInvoiceStoreid(next))}
          bulk={bulk}
          onBulkChange={(next) => dispatch(setBulk(next))}
          onExtract={handleExtract}
          loading={isParsing}
          notice={notice}
          onHistory={() => dispatch(setInvoiceView("history"))}
          onBack={
            invoices.length > 0
              ? () => {
                  setNotice(undefined);
                  dispatch(setInvoiceView("results"));
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
        {runArchived && (
          <span className="font-semibold text-[#1e2a4a] bg-[#1e2a4a]/8 px-1.5 py-0.5 rounded">
            Archived run
          </span>
        )}
        {runEngine && (
          <span className="font-semibold text-content/60">
            {engineLabel(runEngine)}
          </span>
        )}
        {runStoreid !== null && <span>· {storeLabel(runStoreid)}</span>}
        {/* A bulk batch is many runs, each with its own archive prefix and
            history row — naming one of them would misattribute the rest, so
            the count stands in and the ids sit in the tooltip. */}
        {runId ? (
          <span>· Run {runId}</span>
        ) : (
          runIds.length > 1 && (
            <span title={runIds.join("\n")}>· {runIds.length} runs</span>
          )
        )}
        {model && <span>· {model}</span>}
        {pageCount !== null && (
          <span>
            · {pageCount} page{pageCount === 1 ? "" : "s"}
          </span>
        )}
        {/* Priced server-side from invoice_parse_cost. Absent means no pricing
            row matched the engine/model, not that the run was free. */}
        <span>· {estCostUsd === null ? "cost unpriced" : `$${estCostUsd}`}</span>
        {runExtractedAt && (
          <span>
            · {new Date(runExtractedAt).toLocaleString()}
            {runExtractedBy && ` by ${runExtractedBy}`}
          </span>
        )}
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
            onHistory={() => dispatch(setInvoiceView("history"))}
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
