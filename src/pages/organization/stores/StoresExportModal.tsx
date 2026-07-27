import { useState } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { Store } from "../../../interfaces";
import { rowsToCsv, downloadCsv } from "../../../utils/csvExport";

interface StoresExportModalProps {
  onClose: () => void;
  allStores: Store[];
  filteredStores: Store[];
}

type ExportDataset = "all" | "filtered";

const buildStoresCsv = (stores: Store[], label: string) => {
  const headers = ["Store ID", "Store #", "Store Name", "Company ID", "Company Name"];
  const rows = stores.map((s) => [
    s.storeid,
    s.store_number,
    s.store_name,
    s.company,
    s.company_name,
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-custom-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">Store directory</p>
          </div>
          <div />
          <button
            onClick={onClose}
            className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
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
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
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
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
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

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
          <button onClick={onClose} className="text-[12px] text-content transition-colors">
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoresExportModal;
