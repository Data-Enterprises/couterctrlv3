// Hooks
import { useState } from "react";

// Utils
import { downloadCsv } from "../../../../../utils/csvExport";
import { buildStoresCsv } from "../utils";

// Interfaces
import type { ExportDataset } from "../interfaces";
import type { Store } from "../../../../../interfaces";

// Components
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";

interface StoresExportModalProps {
  onClose: () => void;
  allStores: Store[];
  filteredStores: Store[];
}

/** The Export CSV pop-up for the store directory: tick the datasets to include (all stores or the filtered
 *  list), then download. */
const StoresExportModal = ({ onClose, allStores, filteredStores }: StoresExportModalProps) => {
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => new Set());
  const isFiltered = filteredStores.length !== allStores.length;

  const handleDownload = () => {
    const sections: string[] = [];
    if (selected.has("all")) sections.push(buildStoresCsv(allStores, "All Stores"));
    if (selected.has("filtered"))
      sections.push(buildStoresCsv(filteredStores, "Filtered Results"));
    if (!sections.length) return;
    downloadCsv(sections.join("\n\n"), "stores_directory.csv");
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:org-stores"
      defaultWidth={560}
      defaultHeight={560}
    >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">Store directory</p>
          </div>
          <div />
          <button
            onClick={onClose}
            className="text-custom-white/95 hover:text-custom-white transition-colors justify-self-end"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-4 pb-2 space-y-3">
          <p className="text-[11px] text-content uppercase tracking-wide font-medium">
            Select data to include
          </p>

          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={selected.has("all")}
              onChange={() =>
                setSelected((p) => {
                  const n = new Set(p);
                  n.has("all") ? n.delete("all") : n.add("all");
                  return n;
                })
              }
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
                All stores
              </p>
              <p className="text-[12px] text-content mt-0.5">{allStores.length} stores</p>
            </div>
          </label>

          <label
            className={`flex items-start gap-3 ${isFiltered ? "cursor-pointer" : "opacity-40 cursor-not-allowed"} group`}
          >
            <input
              type="checkbox"
              checked={selected.has("filtered")}
              disabled={!isFiltered}
              onChange={() =>
                setSelected((p) => {
                  const n = new Set(p);
                  n.has("filtered") ? n.delete("filtered") : n.add("filtered");
                  return n;
                })
              }
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
                Current filter results
              </p>
              <p className="text-[12px] text-content mt-0.5">
                {isFiltered
                  ? `${filteredStores.length} stores match the current search`
                  : "No search currently applied"}
              </p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-line_hair mt-2">
          <button onClick={onClose} className="text-[12px] text-content transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
    </ResizableModalShell>
  );
};

export default StoresExportModal;
