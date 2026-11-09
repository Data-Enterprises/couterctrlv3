// Utils
import { formatCurrency2 } from "../../../../../../utils";

// Interfaces
import type { AssociationItem } from "../../../../../../features/dev/devUpcDevSlice";

// Components
import { ArrowLeftIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";

interface AssociationLeftPanelProps {
  selectedUpcs: string[];
  upcItemsMap: Map<string, string>;
  seedItemsMap: Map<string, AssociationItem>;
  rerootUpc: string | null;
  rerootDescription: string;
  onBackToSeed: () => void;
}

// Two states in one panel: re-rooted, a back-link plus the current target;
// at seed level, a read-only list mirroring what's checked in the page's UPC
// panel (which owns the selection).
const AssociationLeftPanel = ({
  selectedUpcs,
  upcItemsMap,
  seedItemsMap,
  rerootUpc,
  rerootDescription,
  onBackToSeed,
}: AssociationLeftPanelProps) => {
  if (rerootUpc) {
    return (
      <div className="w-[340px] flex-shrink-0 border-r border-gray-100 overflow-y-auto thin-scrollbar">
        <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100">
          <span className="text-[10px] font-bold uppercase tracking-wide text-content">Exploring</span>
        </div>
        <button
          onClick={onBackToSeed}
          className="w-full flex items-center gap-1.5 px-2.5 py-2 border-b border-gray-50 text-[11px] text-content/85 hover:bg-gray-50"
        >
          <ArrowLeftIcon className="w-3 h-3 flex-shrink-0" />
          Back to Seed UPCs ({selectedUpcs.length})
        </button>
        <div className="flex items-start gap-2 px-2.5 py-2 border-b border-gray-50">
          <MagnifyingGlassIcon className="w-3 h-3 text-brand_navy flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-content truncate">{rerootDescription}</div>
            <div className="text-[11px] text-content/85 font-medium">{rerootUpc}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] flex-shrink-0 border-r border-gray-100 flex flex-col min-h-0">
      <div className="px-2.5 py-1.5 bg-gray-100 border-b border-brand_navy/15 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wide text-content">Seed UPCs</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {selectedUpcs.map((code) => {
          const seedItem = seedItemsMap.get(code);
          return (
            <div key={code} className="flex items-start gap-2 px-2.5 py-2 border-b border-gray-50">
              <CheckIcon className="w-3 h-3 text-brand_navy flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-content truncate">
                    {upcItemsMap.get(code) ?? code}
                  </span>
                  <span className="text-[12px] font-semibold text-content tabular-nums flex-shrink-0">
                    {seedItem ? formatCurrency2(seedItem.revenue) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5 font-medium">
                  <span className="text-[11px] text-content/85 truncate">{code}</span>
                  <span className="text-[11px] text-content/85 flex-shrink-0 truncate">
                    {seedItem?.sub_department_description ?? ""}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssociationLeftPanel;
