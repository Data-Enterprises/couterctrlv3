// Hooks
import { useVendorExport } from "./hooks";

// Interfaces
import type { VendorExportProps } from "./interfaces";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "./components/ExportModalHeader";
import DayPills from "./components/DayPills";
import PresetOption from "./components/PresetOption";
import GradedOption from "./components/GradedOption";
import VendorPick from "./components/VendorPick";
import SourcePicker from "./components/SourcePicker";
import GroupByPicker from "./components/GroupByPicker";
import MetricsPicker from "./components/MetricsPicker";
import CustomPreview from "./components/CustomPreview";
import ExportFooter from "./components/ExportFooter";

/**
 * CSV export for Vendors.
 *
 * Same shell and the same Presets/Custom split as the other export modals.
 * Scope differs by preset: the vendor list covers every vendor, while items and
 * departments cover the open one — which is all the panel has loaded per
 * selection.
 */
const VendorExportModal = (props: VendorExportProps) => {
  const { onClose, storeName, vendorName, rows, weekDates, itemThreshold } = props;
  const x = useVendorExport(props);
  const basis = `${x.gradingMetric} at ${itemThreshold}%`;
  const days = (
    <DayPills
      weekDates={weekDates}
      exportDays={x.exportDays}
      onAll={() => x.setExportDays(new Set())}
      onToggle={x.toggleDay}
    />
  );

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:vendors:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        vendorName={vendorName}
        storeName={storeName}
        mode={x.mode}
        onMode={x.setMode}
        onClose={onClose}
      />

      {x.mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3 overflow-y-auto thin-scrollbar">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>

            {/* Scope. Above the datasets because it changes what every one of
                them contains; All week is the cleared state. */}
            {days}
            <span className="block text-[10px] text-content">{x.scopeNote}</span>

            {x.presetDatasets.map(({ id, label, description, disabled }) => (
              <PresetOption
                key={id}
                label={label}
                description={description}
                disabled={disabled}
                checked={x.selected.has(id)}
                onToggle={() => x.togglePreset(id)}
              />
            ))}

            <GradedOption
              title="Items Graded"
              description={
                x.hasItems
                  ? `TY vs LW vs LY per item, graded on ${basis}`
                  : "Nothing from this vendor in the selected days"
              }
              disabled={!x.hasItems}
              checked={x.selected.has("items_graded")}
              onToggle={x.toggleItemsGraded}
              sevs={x.itemSevs}
              onSev={x.toggleItemSev}
            />

            {/* Scope for both store-wide datasets below; it governs the pair. */}
            <VendorPick rows={rows} value={x.vendorPick} onChange={x.setVendorPick} />

            {/* The only datasets not scoped to the open vendor. Free: the
                search already holds every vendor's rows. */}
            <GradedOption
              title="Items Graded — All Vendors"
              description={
                x.hasAllItems
                  ? `Every item across all ${rows.length} vendors, tagged with its vendor, graded on ${basis}`
                  : "Nothing sold in the selected days"
              }
              disabled={!x.hasAllItems}
              checked={x.selected.has("all_vendors")}
              onToggle={x.toggleAllVendors}
              sevs={x.allSevs}
              onSev={x.toggleAllSev}
              divided
            />

            {/* The same item set with every column but the UPC dropped: a list
                to feed another page, with its own severities. */}
            <GradedOption
              title="UPC List"
              description={
                x.hasAllItems
                  ? "Just the UPCs from every vendor, one per row, ready to load into another page."
                  : "Nothing sold in the selected days"
              }
              disabled={!x.hasAllItems}
              checked={x.selected.has("upc_list")}
              onToggle={x.toggleUpcList}
              sevs={x.upcSevs}
              onSev={x.toggleUpcSev}
              divided
            />
          </div>
          <ExportFooter
            onCancel={onClose}
            onDownload={x.handlePresetDownload}
            disabled={x.selected.size === 0}
            className="mt-2"
          />
        </>
      )}

      {x.mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <SourcePicker source={x.source} onSource={x.switchSource} vendorName={vendorName} />

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Date
                </p>
                {days}
              </div>

              <GroupByPicker groupBy={x.groupBy} onToggle={x.toggleGroupBy} />
              <MetricsPicker
                metrics={x.metrics}
                onToggle={x.toggleMetric}
                onFn={x.setMetricFn}
              />
            </div>

            <CustomPreview columns={x.columns} aggRows={x.aggRows} />
          </div>
          <ExportFooter
            onCancel={onClose}
            onDownload={x.handleCustomDownload}
            disabled={!x.columns.length || !x.aggRows.length}
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default VendorExportModal;
