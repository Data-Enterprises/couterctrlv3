// Hooks
import { useState } from "react";
import { useCouponExport } from "../hooks";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../utils/csvExport";
import { buildPresetCsv } from "../utils";

// Interfaces
import type { ModalMode } from "../interfaces";
import type { CouponItem } from "../../../../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import BottomSheet from "../../../../components/BottomSheet";
import CpnExportHeader from "./components/CpnExportHeader";
import CpnStoreFilter from "./components/CpnStoreFilter";
import CpnCustomFields from "./components/CpnCustomFields";

interface CpnExportSheetProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  rows: CouponItem[];
}

/** The phone Coupons export sheet: Presets downloads the coupon records, Custom groups by chosen fields with
 *  sum/count metrics. Multi-store data adds a store checklist. */
const CpnExportSheet = ({
  onClose,
  title,
  subtitle,
  rows,
}: CpnExportSheetProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const {
    uniqueStores,
    isMultiStore,
    selectedStores,
    setSelectedStores,
    toggleStore,
    filteredRows,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  } = useCouponExport(rows);

  const handlePresetDownload = () => {
    const label = `${title} — ${subtitle}`;
    const safeName = title.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(buildPresetCsv(filteredRows, label), `${safeName}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const data = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = title.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(rowsToCsv(headers, data), `${safeName}_custom.csv`);
    onClose();
  };

  const storeFilter = isMultiStore && (
    <CpnStoreFilter
      stores={uniqueStores}
      selected={selectedStores}
      onToggle={toggleStore}
      onAll={() =>
        setSelectedStores(new Set(uniqueStores.map((s) => s.number)))
      }
      onNone={() => setSelectedStores(new Set())}
    />
  );

  return (
    <BottomSheet onClose={onClose}>
      <CpnExportHeader subtitle={subtitle} mode={mode} setMode={setMode} />

      {mode === "presets" ? (
        <div className="px-4 py-4 space-y-4 max-h-[50vh] overflow-y-auto thin-scrollbar">
          {storeFilter}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              checked
              readOnly
              className="mt-0.5 cc-checkbox border-line_strong flex-shrink-0"
            />
            <div>
              <div className="text-[13px] font-medium text-content">
                Coupon Records
              </div>
              <div className="text-[11px] text-content/95 mt-0.5">
                {filteredRows.length} rows
                {isMultiStore && selectedStores.size < uniqueStores.length
                  ? ` · ${selectedStores.size} of ${uniqueStores.length} stores`
                  : ""}
                {" · "}
                {title}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5 max-h-[50vh] overflow-y-auto thin-scrollbar">
          {storeFilter}
          <CpnCustomFields
            groupBy={groupBy}
            onToggleGroupBy={toggleGroupBy}
            metrics={metrics}
            onToggleMetric={toggleMetric}
            onMetricFn={setMetricFn}
          />
          <div className="text-[10px] text-content/95">
            {columns.length === 0
              ? "Select at least one group-by or metric"
              : `${aggRows.length} row${aggRows.length === 1 ? "" : "s"} will be exported`}
          </div>
        </div>
      )}

      <div className="cc-bar-footer">
        <button onClick={onClose} className="text-[12px] text-content/95">
          Cancel
        </button>
        <button
          onClick={
            mode === "presets" ? handlePresetDownload : handleCustomDownload
          }
          disabled={
            mode === "presets"
              ? filteredRows.length === 0
              : !columns.length || !aggRows.length
          }
          className="flex items-center gap-1.5 cc-btn-primary text-[12px]"
        >
          <ArrowDownTrayIcon className="w-3.5 h-3.5" />
          Download CSV
        </button>
      </div>
      <div className="h-4 flex-shrink-0" />
    </BottomSheet>
  );
};

export default CpnExportSheet;
