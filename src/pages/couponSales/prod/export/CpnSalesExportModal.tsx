// Hooks
import { useCpnSalesExport } from "./hooks";

// Interfaces
import type { CouponItem } from "../../../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../components/modals/ResizableModalShell";
import ExportModalHeader from "../../../../components/modals/ExportModalHeader";
import PresetsPane from "./components/PresetsPane";
import CustomConfig from "./components/CustomConfig";
import PreviewPane from "./components/PreviewPane";

interface CpnSalesExportModalProps {
  /** Coupons for the selected store. The whole-search set is offered too —
   *  the store list is graded across every store, so an export limited to one
   *  of them wouldn't reproduce what the left panel shows. */
  storeCoupons: CouponItem[];
}

/** The Coupon Sales export pop-up: Presets (tick the data sets to include) or Custom (group
 *  by and metrics, with a live preview), for the selected store or all stores in the
 *  search, downloaded as one CSV. */
const CpnSalesExportModal = ({ storeCoupons }: CpnSalesExportModalProps) => {
  const x = useCpnSalesExport(storeCoupons);

  return (
    <ResizableModalShell
      onClose={x.close}
      storageKey="export-modal:coupon-sales:v2"
      defaultWidth={1140}
      defaultHeight={960}
      closeOnBackdrop={false}
    >
      <ExportModalHeader
        subtitle={x.scope === "all" ? "All stores in search" : "Selected store"}
        mode={x.mode}
        onMode={x.setMode}
        onClose={x.close}
      />

      {x.mode === "presets" && (
        <PresetsPane
          scope={x.scope}
          onScope={x.setScope}
          presets={x.presets}
          onTogglePreset={x.togglePreset}
        />
      )}

      {x.mode === "custom" && (
        <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair flex-1 min-h-0">
          <CustomConfig
            scope={x.scope}
            onScope={x.setScope}
            groupBy={x.groupBy}
            onToggleDim={x.toggleDim}
            metrics={x.metrics}
            onToggleMetric={x.toggleMetric}
            onMetricFn={x.setMetricFn}
          />
          <PreviewPane columns={x.previewColumns} rows={x.previewRows} />
        </div>
      )}

      {/* The footer says how many lines the file draws from, so it stays
          this page's own rather than the shared one. */}
      <div className="cc-bar-footer">
        <button onClick={x.close} className="text-[12px] cc-muted-link">
          Cancel
        </button>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-content">
            {x.source.length.toLocaleString()} coupon lines
          </span>
          <button
            onClick={x.handleExport}
            disabled={!x.canExport}
            className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>
    </ResizableModalShell>
  );
};

export default CpnSalesExportModal;
