import { useState } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { StoreWithActivity } from "../../../interfaces";

interface StoreActivityExportModalProps {
  onClose: () => void;
  companyName: string;
  stores: StoreWithActivity[];
}

type ExportDataset = "all" | "missing";

const escCsv = (val: string | number | null | undefined) => {
  const s = String(val ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

const rowsToCsv = (
  headers: string[],
  rows: (string | number | null)[][],
): string => {
  const lines = [headers.map(escCsv).join(",")];
  for (const row of rows) lines.push(row.map(escCsv).join(","));
  return lines.join("\n");
};

const buildStoreActivityCsv = (stores: StoreWithActivity[], label: string) => {
  const headers = [
    "Store ID",
    "Store Name",
    "Total Days",
    "Active Days",
    "Days Missing",
  ];
  const rows = stores.map((s) => [
    s.storeid,
    s.store_name,
    s.total_days_in_range,
    s.active_days,
    s.inactive_or_missing_days,
  ]);
  return `${label}\n${rowsToCsv(headers, rows)}`;
};

const downloadCsv = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

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
            <p className="text-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-white text-[10px] mt-0.5">{companyName}</p>
          </div>
          <div />
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors justify-self-end"
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
              className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
            />
            <div>
              <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
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

        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
          <button
            onClick={onClose}
            className="text-[12px] text-content transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoreActivityExportModal;
