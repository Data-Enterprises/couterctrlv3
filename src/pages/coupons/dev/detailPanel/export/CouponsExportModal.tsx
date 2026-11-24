// Hooks
import { useState } from "react";
import { useCouponExport } from "../../hooks";

// Utils
import { rowsToCsv, downloadCsv } from "../../../../../utils/csvExport";
import { buildPresetCsv } from "../../utils";

// Interfaces
import type { ModalMode } from "../../interfaces";
import type { CouponItem } from "../../../../../interfaces";

// Components
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "../../../../../components-dev/modals/ExportModalHeader";
import StoreFilter from "./components/StoreFilter";
import RecordsChoice from "./components/RecordsChoice";
import CustomFields from "./components/CustomFields";
import AggPreview from "./components/AggPreview";
import ExportFooter from "../../../../../components-dev/modals/ExportFooter";

interface CouponsExportModalProps {
  onClose: () => void;
  title: string;
  subtitle: string;
  rows: CouponItem[];
}

/** The Coupons CSV export pop-up. Presets downloads the coupon records as they are; Custom groups by chosen fields
 *  with sum/count metrics and a live preview. Multi-store data adds a store checklist. */
const CouponsExportModal = ({
  onClose,
  title,
  subtitle,
  rows,
}: CouponsExportModalProps) => {
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

  const partStores = isMultiStore && selectedStores.size < uniqueStores.length;

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
    <StoreFilter
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
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:coupons:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        subtitle={subtitle}
        mode={mode}
        onMode={setMode}
        onClose={onClose}
      />

      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-4">
            {storeFilter}
            <RecordsChoice
              showCaption={!isMultiStore}
              detail={`${filteredRows.length} rows${
                partStores
                  ? ` · ${selectedStores.size} of ${uniqueStores.length} stores`
                  : ""
              } · ${title}`}
            />
          </div>
          <ExportFooter
            spaced
            disabled={filteredRows.length === 0}
            onCancel={onClose}
            onDownload={handlePresetDownload}
          />
        </>
      )}

      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[220px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              {storeFilter}
              <CustomFields
                groupBy={groupBy}
                onToggleGroupBy={toggleGroupBy}
                metrics={metrics}
                onToggleMetric={toggleMetric}
                onMetricFn={setMetricFn}
              />
              <p className="text-[10px] text-content/95 italic leading-relaxed">
                {filteredRows.length} rows
                {partStores
                  ? ` · ${selectedStores.size}/${uniqueStores.length} stores`
                  : ""}
              </p>
            </div>
            <AggPreview columns={columns} rows={aggRows} />
          </div>
          <ExportFooter
            disabled={!columns.length || !aggRows.length}
            onCancel={onClose}
            onDownload={handleCustomDownload}
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default CouponsExportModal;
