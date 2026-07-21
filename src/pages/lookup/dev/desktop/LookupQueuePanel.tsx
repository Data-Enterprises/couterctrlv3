import { useState } from "react";
import {
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/20/solid";
import type { QueueItem } from "../../../../features/itemLookupSlice";
import InfoPopover from "../../../../components/InfoPopover";
import { LOOKUP_INFO } from "../lookupInfo";

interface LookupQueuePanelProps {
  storeName: string;
  queue: QueueItem[];
  selectedUpc: string | null;
  onSelect: (upc: string) => void;
  onOpenSearch: () => void;
}

const fmtRangeDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const LookupQueuePanel = ({
  storeName,
  queue,
  selectedUpc,
  onSelect,
  onOpenSearch,
}: LookupQueuePanelProps) => {
  const [infoOpen, setInfoOpen] = useState(false);
  const loadedCount = queue.filter(
    (q) => q.status === "loaded" || q.status === "error",
  ).length;

  // The lookup endpoint's 14-day window ends yesterday, not today (today's
  // sales aren't final yet), and it takes no date param — so this label has
  // to mirror that same offset rather than just showing "today."
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  const dateRangeLabel = `${fmtRangeDate(start)} – ${fmtRangeDate(end)}`;

  return (
    <div
      className="flex flex-col rounded-xl shadow-lg overflow-hidden bg-custom-white flex-shrink-0"
      style={{ width: "25%" }}
    >
      <div
        className="flex-shrink-0 px-3 pt-1 pb-2.5 flex flex-col gap-0"
        style={{ background: "#1e2a4a" }}
      >
        <div className="flex items-end gap-3 min-h-[24px]">
          <span className="text-[13px] font-semibold text-custom-white flex-shrink-0">
            Item lookup
          </span>
          <span className="text-custom-white text-[10px] flex-shrink-0">
            {dateRangeLabel}
          </span>
          <div className="flex-1" />
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-custom-white text-[10px] uppercase tracking-wide">
              Loaded
            </span>
            <span className="text-[13px] font-medium text-custom-white">
              {loadedCount} / {queue.length}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-white/[0.08]">
          <button
            onClick={onOpenSearch}
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/60 hover:text-custom-white hover:border-white/40 transition-colors flex-shrink-0"
            aria-label="New search"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-custom-white truncate">
            {storeName}
          </span>
          <div className="flex-1" />
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setInfoOpen((prev) => !prev)}
              title="About this view"
              className="w-[22px] h-[22px] flex items-center justify-center rounded border border-white/20 text-custom-white/50 hover:text-custom-white hover:border-white/40 transition-colors"
            >
              <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
            </button>
            {infoOpen && (
              <InfoPopover
                title={LOOKUP_INFO.title}
                purpose={LOOKUP_INFO.purpose}
                glossary={LOOKUP_INFO.glossary}
                onClose={() => setInfoOpen(false)}
              />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {queue.map((item) => {
          if (item.status === "loaded") {
            const isSelected = item.upc === selectedUpc;
            const isNegative =
              item.marginPct !== null &&
              item.marginPct !== undefined &&
              item.marginPct < 0;
            return (
              <button
                key={item.upc}
                onClick={() => onSelect(item.upc)}
                className={`w-full text-left px-3 py-2.5 border-b border-gray-100 transition-colors ${
                  isSelected ? "bg-custom-white" : "hover:bg-gray-50"
                }`}
                style={
                  isSelected
                    ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                    : undefined
                }
              >
                <span
                  className={`block text-[12px] truncate text-content ${isSelected ? "font-semibold" : "font-medium"}`}
                >
                  {item.description}
                </span>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-[11px] text-content">{item.upc}</span>
                  <span
                    className="text-[11px] font-semibold tabular-nums"
                    style={{ color: isNegative ? "#991b1b" : "#059669" }}
                  >
                    {item.marginPct !== null && item.marginPct !== undefined
                      ? `${item.marginPct.toFixed(2)}%`
                      : "-"}
                  </span>
                </div>
              </button>
            );
          }

          if (item.status === "error") {
            return (
              <div
                key={item.upc}
                className="w-full px-3 py-2.5 border-b border-gray-100"
              >
                <div className="flex items-center gap-1.5">
                  <ExclamationTriangleIcon className="w-3 h-3 text-red-600 flex-shrink-0" />
                  <span className="text-[12px] font-medium text-content">
                    {item.upc}
                  </span>
                </div>
                <div className="pl-[18px] mt-0.5">
                  <span className="text-[10.5px] text-red-600">
                    {item.errorMessage ?? "Not found at this store"}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div
              key={item.upc}
              className="w-full flex items-center gap-2 px-3 py-2.5 border-b border-gray-100"
            >
              <div
                className={`w-3 h-3 rounded-full border-2 flex-shrink-0 ${
                  item.status === "loading"
                    ? "border-gray-200 border-t-[#1e2a4a] animate-spin"
                    : "border-gray-100"
                }`}
              />
              <div>
                <div className="text-[11.5px] text-content">{item.upc}</div>
                <div className="text-[9.5px] text-gray-400">
                  {item.status === "loading" ? "Loading…" : "Queued"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LookupQueuePanel;
