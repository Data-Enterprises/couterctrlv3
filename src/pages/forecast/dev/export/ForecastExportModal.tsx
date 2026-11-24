// Hooks
import { useForecastCtx } from "../hooks";
import { useForecastExport } from "./hooks";

// Utils
import { COLS, CUSTOM_CHECKBOX, CUSTOM_RADIO, SECTION_LABEL } from "./utils";
import { getStoreName } from "../../../../utils";

// Components
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import ExportModalHeader from "../../../../components-dev/modals/ExportModalHeader";
import ExportFooter from "../../../../components-dev/modals/ExportFooter";
import TierScope from "./components/TierScope";
import PresetChoices from "./components/PresetChoices";
import CustomPreview from "./components/CustomPreview";

interface ForecastExportModalProps {
  onClose: () => void;
}

/**
 * Forecast export, with the other export modals' shell and Presets/Custom
 * split. Presets are multi-select: each ticked one downloads as its own file.
 */
const ForecastExportModal = ({ onClose }: ForecastExportModalProps) => {
  const { storeids, search, assignedStores } = useForecastCtx();
  const x = useForecastExport(onClose);

  const scopeLabel = storeids.includes(",")
    ? `${storeids.split(",").length} stores`
    : getStoreName(assignedStores, Number(storeids));

  const tierScope = (
    <TierScope
      tiers={x.tiers}
      counts={x.tierCountsFor}
      onToggle={x.toggleTier}
    />
  );

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:forecast:v2"
      defaultWidth={1140}
      defaultHeight={760}
    >
      <ExportModalHeader
        subtitle={`${scopeLabel} · 90 days ending ${search.singleDate}`}
        mode={x.mode}
        onMode={x.setMode}
        onClose={onClose}
      />

      {/* ── PRESETS ── */}
      {x.mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3 overflow-y-auto thin-scrollbar">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>

            {/* Contribution scope, above the datasets because it changes
                what each contains; cleared means all tiers. */}
            {tierScope}

            <PresetChoices
              datasets={x.presetDatasets}
              selected={x.selected}
              onToggle={x.togglePreset}
            />

            <p className="text-[10px] text-content leading-relaxed">
              Prices, ad days and notes export as they stand on screen, not as
              they first loaded. Ticking more than one downloads a file each.
            </p>
          </div>

          <ExportFooter
            spaced
            disabled={x.selected.size === 0}
            onCancel={onClose}
            onDownload={x.handlePresetDownload}
          />
        </>
      )}

      {/* ── CUSTOM ── */}
      {x.mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-line_hair min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <div>
                <p className={SECTION_LABEL}>Rows</p>
                <div className="flex flex-col gap-1.5">
                  {(["selected", "all"] as const).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={x.customScope === s}
                        onChange={() => x.setCustomScope(s)}
                        className={CUSTOM_RADIO}
                      />
                      <span className="text-[12px] text-content">
                        {s === "selected"
                          ? `Selected (${x.selectedRows.length})`
                          : `All items (${x.allCount})`}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-content mt-2 leading-relaxed">
                  Selected follows the ticks in the item panel.
                </p>
              </div>

              <div>
                <p className={SECTION_LABEL}>Tiers</p>
                {tierScope}
              </div>

              <div>
                <p className={SECTION_LABEL}>Columns</p>
                <div className="flex flex-col gap-1.5">
                  {COLS.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={x.cols.has(c.key)}
                        onChange={() => x.toggleCol(c.key)}
                        className={CUSTOM_CHECKBOX}
                      />
                      <span className="text-[12px] text-content">
                        {c.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <CustomPreview columns={x.activeCols} rows={x.customRows} />
          </div>

          <ExportFooter
            disabled={!x.activeCols.length || !x.customRows.length}
            onCancel={onClose}
            onDownload={x.handleCustomDownload}
          />
        </>
      )}
    </ResizableModalShell>
  );
};

export default ForecastExportModal;
