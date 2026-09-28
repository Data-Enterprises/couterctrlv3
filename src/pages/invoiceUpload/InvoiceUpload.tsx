import { useCallback, useEffect, useMemo, useState } from "react";
import { useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import {
  getInvoiceResult,
  getInvoiceHistory,
  postEdiInvoice,
} from "../../api/invoices";
import type { JsonError } from "../../interfaces";
import UploadEntry from "./UploadEntry";
import { RunDetailPanel, RunListPanel } from "./RunPanels";
import { toRows } from "./rows";
import type {
  HistoryFile,
  HistoryResponse,
  InvoiceRun,
  ParseResponse,
  ResultResponse,
} from "./types";

/**
 * Invoice Upload — AWG EDI files sent to goliath's /invoices/parse_edi.
 *
 * The server twin of the local Invoices page: the same file, decoded the same
 * way, but archived to S3 and logged against a store so it can be reopened
 * later from the run history instead of re-dropped.
 *
 * A failure on one file doesn't fail the request — the server reports it per
 * file — so a run with some invoices and some file errors still opens, with
 * the errors shown above the list.
 */
const HISTORY_LIMIT = 20;

const InvoiceUpload = () => {
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { assignedStores } = useAppSelector((s) => s.user);
  const lastStore = useAppSelector((s) => s.search.lastStore);

  const [storeid, setStoreid] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<InvoiceRun | null>(null);
  const [opening, setOpening] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [history, setHistory] = useState<HistoryFile[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const rows = useMemo(() => (run ? toRows(run) : []), [run]);
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  const loadHistory = useCallback(
    (id: number) => {
      if (!id) {
        setHistory([]);
        return;
      }
      setHistoryLoading(true);
      getInvoiceHistory(url, token, {
        storeid: id,
        engine: "awg_edi",
        limit: HISTORY_LIMIT,
        offset: 0,
      })
        .then((resp) => {
          const j: HistoryResponse = resp.data;
          setHistory(j.error === 0 ? j.files : []);
        })
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    },
    [url, token],
  );

  // Start on the store the user last searched, like the other store pickers.
  // An effect rather than the initial state because assignedStores can still
  // be loading when the page mounts.
  useEffect(() => {
    if (storeid !== 0 || assignedStores.length === 0) return;
    const initial = assignedStores.some((st) => st.storeid === lastStore)
      ? lastStore
      : assignedStores.length === 1
        ? assignedStores[0].storeid
        : 0;
    if (initial) setStoreid(initial);
  }, [storeid, assignedStores, lastStore]);

  useEffect(() => {
    loadHistory(storeid);
  }, [storeid, loadHistory]);

  useEffect(() => {
    if (!uploadOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setUploadOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [uploadOpen]);

  const showRun = (next: InvoiceRun) => {
    setRun(next);
    const first = toRows(next)[0];
    setSelectedId(first?.id ?? null);
    setUploadOpen(false);
    setError(null);
  };

  const handleUpload = (files: File[]) => {
    if (!storeid) {
      toast.warn("Please select a store");
      return;
    }
    setUploading(true);
    setError(null);
    postEdiInvoice(url, token, storeid, files)
      .then((resp) => {
        const j: ParseResponse = resp.data;
        if (j.error !== 0) {
          setError(j.msg || "Upload failed");
          return;
        }
        if (j.invoices.length === 0) {
          // Every file failed on its own — say why rather than opening an
          // empty list.
          const reasons = j.files
            .filter((f) => f.error)
            .map((f) => `${f.file}: ${f.error}`);
          setError(
            reasons.length > 0
              ? reasons.join("\n")
              : "No invoices found in that file.",
          );
          loadHistory(storeid);
          return;
        }
        if (j.storage.error) {
          toast.warn("Decoded, but the archive copy failed to save");
        }
        showRun(j);
        loadHistory(storeid);
      })
      .catch((err: JsonError) => setError(err.message))
      .finally(() => setUploading(false));
  };

  const handleOpenRun = (runId: string) => {
    setOpening(true);
    getInvoiceResult(url, token, runId)
      .then((resp) => {
        const j: ResultResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg || "Could not open that run");
          return;
        }
        showRun(j.result);
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setOpening(false));
  };

  const entry = (onClose?: () => void) => (
    <UploadEntry
      stores={assignedStores}
      storeid={storeid}
      onStoreSelect={setStoreid}
      onUpload={handleUpload}
      uploading={uploading}
      error={error}
      history={history}
      historyLoading={historyLoading}
      onOpenRun={handleOpenRun}
      onClose={onClose}
    />
  );

  if (opening) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Opening run" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry()}
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <RunListPanel
          rows={rows}
          files={run.files}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onUploadOpen={() => {
            setError(null);
            setUploadOpen(true);
          }}
        />
        <RunDetailPanel key={selectedId ?? ""} row={selected} />
      </div>

      {uploadOpen && (
        <div
          className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/35 p-4"
          onMouseDown={() => setUploadOpen(false)}
        >
          <div
            className="w-full max-w-[560px]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            {entry(() => setUploadOpen(false))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceUpload;
