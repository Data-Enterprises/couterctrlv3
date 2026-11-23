// Hooks
import { useLPExport } from "./hooks";

// Interfaces
import type { TransactionOverview } from "../../../../interfaces";
import type { CashierGrade } from "../interfaces";

// Components
import ResizableModalShell from "../../../../components/modals/ResizableModalShell";
import ExportModalHeader from "../../../../components/modals/ExportModalHeader";
import ExportFooter from "../../../../components/modals/ExportFooter";
import PresetsPane from "./components/PresetsPane";
import CustomConfig from "./components/CustomConfig";
import PreviewPane from "./components/PreviewPane";

interface LPExportModalProps {
  onClose: () => void;
  storeName: string;
  saleType: string;
  dateRange: string;
  transactions: TransactionOverview[]; // filtered list currently in view
  cashierGrades: CashierGrade[];
}

/** The Loss Prevention export pop-up: Presets (the transaction list, and a cashier summary
 *  by severity) or Custom (group by and metrics over transactions or cashiers, with a
 *  preview), downloaded as one CSV. */
const LPExportModal = ({
  onClose,
  storeName,
  saleType,
  dateRange,
  transactions,
  cashierGrades,
}: LPExportModalProps) => {
  const ex = useLPExport({
    onClose,
    storeName,
    saleType,
    dateRange,
    transactions,
    cashierGrades,
  });

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:lp:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        subtitle={`${storeName} — ${saleType}`}
        mode={ex.mode}
        onMode={ex.setMode}
        onClose={onClose}
      />

      {ex.mode === "presets" && (
        <>
          <PresetsPane
            transactionCount={transactions.length}
            cashierCount={cashierGrades.length}
            selected={ex.selected}
            setSelected={ex.setSelected}
            cashierSevs={ex.cashierSevs}
            setCashierSevs={ex.setCashierSevs}
            toggleCashierSev={ex.toggleCashierSev}
          />
          <ExportFooter
            spaced
            disabled={ex.selected.size === 0}
            onCancel={onClose}
            onDownload={ex.handlePresetDownload}
          />
        </>
      )}

      {ex.mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
            <CustomConfig
              source={ex.source}
              onSource={ex.switchSource}
              dims={ex.dims}
              groupBy={ex.groupBy}
              onToggleGroupBy={ex.toggleGroupBy}
              mDefs={ex.mDefs}
              metrics={ex.metrics}
              onToggleMetric={ex.toggleMetric}
              onMetricFn={ex.setMetricFn}
            />
            <PreviewPane columns={ex.columns} rows={ex.aggRows} />
          </div>
          <ExportFooter
            disabled={!ex.canCustomDownload}
            onCancel={onClose}
            onDownload={ex.handleCustomDownload}
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default LPExportModal;
