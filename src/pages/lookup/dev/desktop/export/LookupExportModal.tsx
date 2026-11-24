// Hooks
import { useLookupExport } from "./hooks";

// Interfaces
import type { DayBucket } from "../../interfaces";
import type { ModalMode } from "../interfaces";
import type { QueueItem } from "../../../../../features/dev/devItemLookupSlice";

// Components
import { XMarkIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import PresetsPane from "./components/PresetsPane";
import CustomConfig from "./components/CustomConfig";
import PreviewPane from "./components/PreviewPane";

interface LookupExportModalProps {
  queue: QueueItem[];
  selectedDescription: string;
  /** The timeline on screen — Sale, or whichever type is selected. */
  buckets: DayBucket[];
  selectedSaleType: string;
  /** Current item sells by weight — the daily Weight column is filled. */
  weighed: boolean;
  onClose: () => void;
}

/** The Item lookup CSV export pop-up. Presets offers the batch summary, the current item's daily breakdown and the
 *  by-sale-type rows; Custom picks a source and its columns with a live preview. */
const LookupExportModal = ({
  queue,
  selectedDescription,
  buckets,
  selectedSaleType,
  weighed,
  onClose,
}: LookupExportModalProps) => {
  const ex = useLookupExport({
    queue,
    selectedDescription,
    buckets,
    selectedSaleType,
    weighed,
    onClose,
  });

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:item-lookup:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <div className="cc-phone-header">
        <p className="cc-navy-title text-[13px]">Export CSV</p>
        <div className="cc-segment-navy">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => ex.setMode(m)}
              className={`cc-chip-btn text-[11px] ${
                ex.mode === m
                  ? "bg-custom-white text-brand_navy"
                  : "text-custom-white/95 hover:text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="cc-navy-link justify-self-end">
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {ex.mode === "presets" ? (
        <PresetsPane
          options={ex.presetOptions}
          available={ex.available}
          preset={ex.preset}
          onPreset={ex.setPreset}
          canDownload={ex.canDownload}
          onDownload={ex.handleDownload}
        />
      ) : (
        <div className="grid" style={{ gridTemplateColumns: "200px 1fr" }}>
          <CustomConfig
            source={ex.source}
            onSource={ex.setSource}
            available={ex.available}
            picked={ex.chosenCols[ex.source]}
            onToggleCol={(key) => ex.toggleCol(ex.source, key)}
          />
          <PreviewPane
            columns={ex.custom.cols}
            rows={ex.custom.rows}
            canDownload={ex.canDownload}
            onCancel={onClose}
            onDownload={ex.handleDownload}
          />
        </div>
      )}
    </ResizableModalShell>
  );
};

export default LookupExportModal;
