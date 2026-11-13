// Hooks
import { useCategoryExport } from "./hooks";

// Interfaces
import type { CategoryExportProps } from "./interfaces";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "./components/ExportModalHeader";
import DayScopePicker from "./components/DayScopePicker";
import PresetOption from "./components/PresetOption";
import GradedItemsOption from "./components/GradedItemsOption";
import ExportFooter from "./components/ExportFooter";
import SourcePicker from "./components/SourcePicker";
import GroupByPicker from "./components/GroupByPicker";
import MetricsPicker from "./components/MetricsPicker";
import CustomPreview from "./components/CustomPreview";

/**
 * CSV export for Categories.
 *
 * Same shell and the same Presets/Custom split as the other seven export
 * modals. What differs is scope: the category list covers every category, while
 * items and hours only ever cover the open one, because that is all the
 * endpoints return per selection. The preset labels say so rather than leaving
 * someone to discover it in the file.
 */
const CategoryExportModal = (props: CategoryExportProps) => {
  const { onClose, storeName, categoryName, weekDates, itemThreshold } = props;
  const x = useCategoryExport(props);

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:categories:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <ExportModalHeader
        categoryName={categoryName}
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
            <div className="flex flex-wrap items-center gap-1.5">
              <DayScopePicker
                weekDates={weekDates}
                exportDays={x.exportDays}
                onAll={() => x.setExportDays(new Set())}
                onToggle={x.toggleDay}
              />
              <span className="text-[10px] text-content w-full">{x.scopeNote}</span>
            </div>

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

            {/* Graded items: the severity chips are the filter, same as Sub
                Dept Margins. */}
            <GradedItemsOption
              hasItems={x.hasItems}
              checked={x.selected.has("items_graded")}
              onToggle={x.toggleGradedItems}
              itemSevs={x.itemSevs}
              onSev={x.toggleItemSev}
              basis={`${x.gradingMetric === "qty" ? "qty" : "sales"} at ${itemThreshold}%`}
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
          <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <SourcePicker
                source={x.source}
                onSource={x.switchSource}
                categoryName={categoryName}
              />

              {/* Same scope control as Presets: one selection, both modes. */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Date
                </p>
                <div className="flex flex-wrap gap-1">
                  <DayScopePicker
                    weekDates={weekDates}
                    exportDays={x.exportDays}
                    onAll={() => x.setExportDays(new Set())}
                    onToggle={x.toggleDay}
                  />
                </div>
              </div>

              <GroupByPicker groupBy={x.groupBy} onToggle={x.toggleGroupBy} />
              <MetricsPicker
                metrics={x.metrics}
                onToggle={x.toggleMetric}
                onFn={x.setMetricFn}
              />
            </div>

            <CustomPreview columns={x.columns} aggRows={x.aggRows} hasItems={x.hasItems} />
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

export default CategoryExportModal;
