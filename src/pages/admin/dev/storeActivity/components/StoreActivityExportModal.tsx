// Hooks
import { useState } from "react";

// Utils
import { buildStoreActivityCsv, downloadCsv } from "../utils";

// Interfaces
import type { StoreWithActivity } from "../../../../../interfaces";
import type { ExportDataset } from "../interfaces";

// Components
import ResizableModalShell from "../../../../../components-dev/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";

interface StoreActivityExportModalProps {
  onClose: () => void;
  companyName: string;
  stores: StoreWithActivity[];
}

/** The Export CSV pop-up for Store Activity: tick the datasets to include for the company, then download. */
const StoreActivityExportModal = ({
  onClose,
  companyName,
  stores,
}: StoreActivityExportModalProps) => {
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => new Set());

  const missingStores = stores.filter((s) => s.inactive_or_missing_days > 0);

  const handleDownload = () => {
    const sections: string[] = [];
    if (selected.has("all"))
      sections.push(
        buildStoreActivityCsv(stores, `All Stores — ${companyName}`),
      );
    if (selected.has("missing"))
      sections.push(
        buildStoreActivityCsv(missingStores, `Missing Only — ${companyName}`),
      );
    if (!sections.length) return;
    const safeName = companyName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_store_activity.csv`);
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:admin-stores"
      defaultWidth={560}
      defaultHeight={560}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
        <div>
          <p className="cc-navy-title text-[13px]">
            Export CSV
          </p>
          <p className="text-custom-white text-[10px] mt-0.5">{companyName}</p>
        </div>
        <div />
        <button
          onClick={onClose}
          className="cc-navy-link justify-self-end"
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
            className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
          />
          <div>
            <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
              All stores
            </p>
            <p className="text-[12px] text-content mt-0.5">
              {stores.length} stores for {companyName}
            </p>
          </div>
        </label>

        <label
          className={`flex items-start gap-3 ${missingStores.length ? "cursor-pointer" : "opacity-40 cursor-not-allowed"} group`}
        >
          <input
            type="checkbox"
            checked={selected.has("missing")}
            disabled={!missingStores.length}
            onChange={() =>
              setSelected((p) => {
                const n = new Set(p);
                n.has("missing") ? n.delete("missing") : n.add("missing");
                return n;
              })
            }
            className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
          />
          <div>
            <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
              Missing only
            </p>
            <p className="text-[12px] text-content mt-0.5">
              {missingStores.length
                ? `${missingStores.length} stores with 1+ missing days`
                : "No stores currently missing days"}
            </p>
          </div>
        </label>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-line_hair mt-2">
        <button
          onClick={onClose}
          className="text-[12px] text-content transition-colors"
        >
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

export default StoreActivityExportModal;
