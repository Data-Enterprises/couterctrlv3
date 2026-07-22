import { ArrowLeftIcon } from "@heroicons/react/16/solid";

interface Props {
  upcs: string[];
  selectedUpcs: string[];
  upcItemsMap: Map<string, string>;
  rerootUpc: string | null;
  rerootDescription: string;
  onToggleUpc: (code: string) => void;
  onBackToSeed: () => void;
}

// Two states in one panel rather than a separate breadcrumb bar: at the
// seed level this is a multi-select checklist (the seed set feeds one
// shared query, unlike the other tabs' single-select item lists); once
// re-rooted, it collapses to a back-link plus a single card for the
// current target, using the same selection glow every other tab's
// single-selected-row uses.
const AssociationLeftPanel = ({
  upcs,
  selectedUpcs,
  upcItemsMap,
  rerootUpc,
  rerootDescription,
  onToggleUpc,
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
          Back to Seed UPCs ({upcs.length})
        </button>
        <div className="px-2.5 py-2">
          <div
            className="rounded px-2.5 py-2 bg-custom-white"
            style={{ boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }}
          >
            <div className="text-[12px] font-medium text-content truncate">{rerootDescription}</div>
            <div className="text-[10px] text-content/85 font-mono mt-0.5">{rerootUpc}</div>
          </div>
        </div>
        <div className="px-2.5 py-2 text-[10px] text-content/85">
          Selecting a companion from the results re-roots here and fetches its own associations. Going back to Seed
          UPCs is instant — that data's already cached.
        </div>
      </div>
    );
  }

  // selectedUpcs is expected to always be fully materialized (never empty)
  // by the time this renders — AssociationTab seeds it with the full upc
  // list on mount if it's empty, so a plain membership check is enough and
  // unchecking one item can't be misread as "only this one is selected".
  const isSelected = (code: string) => selectedUpcs.includes(code);

  return (
    <div className="w-[340px] flex-shrink-0 border-r border-gray-100 overflow-y-auto thin-scrollbar">
      <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100">
        <span className="text-[10px] font-bold uppercase tracking-wide text-content">Seed UPCs</span>
      </div>
      {upcs.map((code) => {
        const selected = isSelected(code);
        return (
          <button
            key={code}
            onClick={() => onToggleUpc(code)}
            className={`w-full flex items-start gap-2 px-2.5 py-2 border-b border-gray-50 text-left transition-colors ${
              selected ? "bg-custom-white" : "hover:bg-gray-50"
            }`}
            style={selected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
          >
            <div
              className={`w-3 h-3 rounded flex-shrink-0 mt-0.5 ${
                selected ? "bg-[#1e2a4a]" : "border border-gray-300"
              }`}
            />
            <div className="min-w-0">
              <div className={`text-[12px] text-content truncate ${selected ? "font-semibold" : ""}`}>
                {upcItemsMap.get(code) ?? code}
              </div>
              <div className="text-[10px] text-content/85 font-mono">{code}</div>
            </div>
          </button>
        );
      })}
      <div className="px-2.5 py-2 text-[10px] text-content/85">
        Uncheck to remove an item from the seed set — the panel refetches with whatever's checked.
      </div>
    </div>
  );
};

export default AssociationLeftPanel;
