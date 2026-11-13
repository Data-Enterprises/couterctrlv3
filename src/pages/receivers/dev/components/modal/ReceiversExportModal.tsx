// Hooks
import { useState, useMemo } from "react";

// Utils
import {
  DIMS,
  METRICS,
  buildDetailsCsv,
  defaultMetrics,
  mapColumns,
} from "./utils";
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
  type AggFn,
  type AggRow,
} from "../../../../../utils/csvExport";

// Interfaces
import type { ModalMode, MetricSelection, ActiveMetric } from "./interfaces";
import type {
  ReceiverDetailsItem,
  ReceiverDetailsTotals,
} from "../../../../../interfaces";

// Components
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import ModalHeader from "./components/ModalHeader";
import ModalPresetMode from "./components/ModalPresetMode";
import ModalCustomMode from "./components/ModalCustomMode";

interface ReceiversExportModalProps {
  onClose: () => void;
  vendorName: string;
  invoiceId: number;
  referenceNumber: string;
  details: ReceiverDetailsItem[];
  totals: ReceiverDetailsTotals | null;
}

/** The CSV export pop-up for one receiver's line items.
 *  Presets downloads the line items as they are; Custom groups them by chosen fields and metrics with a live preview. */
const ReceiversExportModal = ({
  onClose,
  vendorName,
  invoiceId,
  referenceNumber,
  details,
  totals,
}: ReceiversExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");

  // Custom builder state — no default selections
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] =
    useState<Map<string, MetricSelection>>(defaultMetrics);

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, enabled: !c.enabled });
      return n;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, fn });
      return n;
    });

  const flatRows = useMemo<AggRow[]>(
    () => details.map((d) => ({ ...d }) as unknown as AggRow),
    [details],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics: ActiveMetric[] = METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const aggRows = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = aggRows.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) out[d.key] = String(row[d.key] ?? "");
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const columns = mapColumns(activeDims, activeMetrics);
    return { aggRows: display, columns };
  }, [flatRows, groupBy, metrics]);

  const handlePresetDownload = () => {
    const label = `${vendorName} — Invoice ${invoiceId} (Ref #${referenceNumber})`;
    const safeName = vendorName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      buildDetailsCsv(details, label, totals),
      `${safeName}_${invoiceId}.csv`,
    );
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = vendorName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_${invoiceId}_custom.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:receivers:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <ModalHeader
        vendorName={vendorName}
        referenceNumber={referenceNumber}
        mode={mode}
        setMode={setMode}
        onClose={onClose}
      />

      {/* ── PRESETS MODE ── */}
      {mode === "presets" && (
        <ModalPresetMode
          onClose={onClose}
          vendorName={vendorName}
          invoiceId={invoiceId}
          referenceNumber={referenceNumber}
          details={details}
          totals={totals}
          handlePresetDownload={handlePresetDownload}
        />
      )}

      {/* ── CUSTOM MODE ── */}
      {mode === "custom" && (
        <ModalCustomMode
          canCustomDownload={canCustomDownload}
          onClose={onClose}
          vendorName={vendorName}
          invoiceId={invoiceId}
          referenceNumber={referenceNumber}
          details={details}
          toggleGroupBy={toggleGroupBy}
          toggleMetric={toggleMetric}
          setMetricFn={setMetricFn}
          groupBy={groupBy}
          metrics={metrics}
          aggRows={aggRows}
          columns={columns}
          handleCustomDownload={handleCustomDownload}
        />
      )}
    </ResizableModalShell>
  );
};

export default ReceiversExportModal;
