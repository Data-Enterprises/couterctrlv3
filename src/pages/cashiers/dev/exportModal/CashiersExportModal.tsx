// Hooks
import { useState, useMemo } from "react";
import { useCustomExport } from "./hooks";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import {
  buildLinesCsv,
  buildSignalsCsv,
  buildTransactionsCsv,
  groupSignalByTransaction,
  LENS_LABEL,
} from "../utils";

// Interfaces
import type { Dataset, ModalMode, Signal } from "../interfaces";
import type { TransactionListItem } from "../../../../interfaces";
import type { ExplorerLens } from "../../../../features/dev/devCashiersSlice";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "../../../../components-dev/modals/ExportModalHeader";
import PresetChoices from "./components/PresetChoices";
import CustomConfig from "./components/CustomConfig";
import AggPreview from "./components/AggPreview";
import ExportFooter from "../../../../components-dev/modals/ExportFooter";

interface CashiersExportModalProps {
  onClose: () => void;
  scopeLabel: string;
  exception: string;
  dateRange: string;
  lens: ExplorerLens;
  /** The signal rows currently listed, after the text filter. */
  signals: Signal[];
  /** Every exception line in the loaded window. */
  exceptionRows: TransactionListItem[];
  /** sale_id -> total lines on that transaction, for basket position. */
  transactionLengths: Record<string, number>;
}

/** The Cashiers Export CSV modal, in Presets and Custom modes. Presets export the signals list, transactions or
 *  exception lines; Custom aggregates the exception lines (the only granular dataset, since signals and
 *  transactions are already roll-ups) by chosen group-by dimensions and metrics. */
const CashiersExportModal = ({
  onClose,
  scopeLabel,
  exception,
  dateRange,
  lens,
  signals,
  exceptionRows,
  transactionLengths,
}: CashiersExportModalProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<Dataset>>(new Set(["signals"]));
  const {
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  } = useCustomExport(exceptionRows);

  const transactionCount = useMemo(
    () =>
      signals.reduce(
        (acc, s) =>
          acc + groupSignalByTransaction(s, transactionLengths).length,
        0,
      ),
    [signals, transactionLengths],
  );

  const toggleDataset = (d: Dataset) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });

  const fileStem = `cashiers_${exception.replace(/\s+/g, "-").toLowerCase()}`;

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("signals"))
      sections.push(
        `${LENS_LABEL[lens]} Summary\n${buildSignalsCsv(signals, lens)}`,
      );
    if (selected.has("transactions"))
      sections.push(
        `Transactions\n${buildTransactionsCsv(signals, transactionLengths, lens)}`,
      );
    if (selected.has("lines"))
      sections.push(`Exception Lines\n${buildLinesCsv(exceptionRows)}`);
    if (!sections.length) return;
    downloadCsv(sections.join("\n\n"), `${fileStem}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length) return;
    const data = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(
      rowsToCsv(
        columns.map((c) => c.label),
        data,
      ),
      `${fileStem}_custom.csv`,
    );
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:cashiers:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        subtitle={`${scopeLabel} — ${exception} · ${dateRange}`}
        mode={mode}
        onMode={setMode}
        onClose={onClose}
        subtitleSize="md"
      />

      {mode === "presets" && (
        <>
          <PresetChoices
            choices={[
              {
                key: "signals",
                title: `${LENS_LABEL[lens]} Summary`,
                sub: `${signals.length} rows as listed — totals, cashier spread, and top item`,
              },
              {
                key: "transactions",
                title: "Transactions",
                sub: `${transactionCount} transactions with basket position and time`,
              },
              {
                key: "lines",
                title: "Exception Lines",
                sub: `${exceptionRows.length} raw lines — every field behind the views above`,
              },
            ]}
            selected={selected}
            onToggle={toggleDataset}
          />
          <ExportFooter
            spaced
            disabled={selected.size === 0}
            onCancel={onClose}
            onDownload={handlePresetDownload}
          />
        </>
      )}

      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
            <CustomConfig
              lineCount={exceptionRows.length}
              groupBy={groupBy}
              onToggleGroupBy={toggleGroupBy}
              metrics={metrics}
              onToggleMetric={toggleMetric}
              onMetricFn={setMetricFn}
            />
            <AggPreview columns={columns} rows={aggRows} />
          </div>
          <ExportFooter
            disabled={columns.length === 0}
            onCancel={onClose}
            onDownload={handleCustomDownload}
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default CashiersExportModal;
