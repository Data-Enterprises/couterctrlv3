import { ArrowLeftIcon, CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/16/solid";

interface Props {
  selectedUpcs: string[];
  upcItemsMap: Map<string, string>;
  seedDeptMap: Map<string, string>;
  rerootUpc: string | null;
  rerootDescription: string;
  onBackToSeed: () => void;
}

// Two states in one panel rather than a separate breadcrumb bar: once
// re-rooted, it collapses to a back-link plus a plain row for the current
// target, matching the same flat row shape as the Seed UPCs list below (no
// box/border/glow — this panel has no selection state of its own to
// highlight, unlike the other tabs' single-select lists that borrowed
// glow from). At the seed level it's a plain, read-only list — the
// page-level "UPC Upload" panel (UpcLeftPanel.tsx / UpcItemList.tsx)
// already owns selectedUpcs/toggleDevSelectedUpc as the one control for
// narrowing the workbook selection; this just reflects whatever's
// currently checked there rather than duplicating that checkbox UI again.
const AssociationLeftPanel = ({
  selectedUpcs,
  upcItemsMap,
  seedDeptMap,
  rerootUpc,
  rerootDescription,
  onBackToSeed,
}: Props) => {
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
          <MagnifyingGlassIcon className="w-3 h-3 text-[#1e2a4a] flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[12px] font-medium text-content truncate">{rerootDescription}</div>
            <div className="text-[10px] text-content/85 font-mono">{rerootUpc}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] flex-shrink-0 border-r border-gray-100 flex flex-col min-h-0">
      <div className="px-2.5 py-1.5 bg-gray-100 border-b border-[#1e2a4a]/15 flex-shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wide text-content">Seed UPCs</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {selectedUpcs.map((code) => (
          <div key={code} className="flex items-start gap-2 px-2.5 py-2 border-b border-gray-50">
            <CheckIcon className="w-3 h-3 text-[#1e2a4a] flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[12px] font-medium text-content truncate">{upcItemsMap.get(code) ?? code}</div>
              <div className="text-[10px] text-content/85 truncate">
                <span className="font-mono">{code}</span>
                {seedDeptMap.get(code) && <span> · {seedDeptMap.get(code)}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssociationLeftPanel;
