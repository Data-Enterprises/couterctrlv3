import { useEffect, useRef, useState } from "react";
import TextFilter from "./filters/TextFilter";

interface AssignPanelItem {
  id: number;
  label: string;
  sublabel?: string;
}

interface AssignPanelProps {
  leftTitle: string;
  rightTitle: string;
  leftItems: AssignPanelItem[];
  rightItems: AssignPanelItem[];
  onAssign: (ids: number[]) => void;
  onUnassign: (ids: number[]) => void;
  // "filtered" (default) scopes Assign all/Unassign all to whatever the search
  // box currently shows — matches legacy's Stores assign flow. Companies and
  // Base Groups tabs pass "global" since legacy's assign_all/unassign_all
  // there always recomputed from the full unfiltered list, ignoring search.
  assignAllScope?: "filtered" | "global";
  // Optional: reports the right column's current selection to the parent, so a
  // caller can offer an action over the selected rows without this component
  // having to know what that action is. Base Groups uses it for Sync.
  onRightSelectionChange?: (ids: number[]) => void;
  // Change this to clear the right column's selection from outside — after an
  // action has consumed it, say. The selection lives here, so a caller can't
  // clear it by resetting whatever it mirrored the ids into.
  rightSelectionResetKey?: number;
}

// Shared staged dual-column assign/unassign control — used by the create-user
// wizard's Assignments step, the user profile's Companies/Base groups/Stores
// tabs, and a base group's Assign stores panel.
const AssignPanel = ({
  leftTitle,
  rightTitle,
  leftItems,
  rightItems,
  onAssign,
  onUnassign,
  assignAllScope = "filtered",
  onRightSelectionChange,
  rightSelectionResetKey,
}: AssignPanelProps) => {
  const [leftFilter, setLeftFilter] = useState("");
  const [rightFilter, setRightFilter] = useState("");
  const [staged, setStaged] = useState<Set<number>>(new Set());
  const [unstaged, setUnstaged] = useState<Set<number>>(new Set());

  useEffect(() => {
    onRightSelectionChange?.(Array.from(unstaged));
  }, [unstaged]);

  // Compared against the previous value rather than just firing on mount, so
  // simply rendering the panel doesn't push an empty selection back out.
  const prevResetKey = useRef(rightSelectionResetKey);
  useEffect(() => {
    if (prevResetKey.current === rightSelectionResetKey) return;
    prevResetKey.current = rightSelectionResetKey;
    setUnstaged(new Set());
  }, [rightSelectionResetKey]);

  const filteredLeft = leftItems.filter((i) =>
    i.label.toLowerCase().includes(leftFilter.toLowerCase()),
  );
  const filteredRight = rightItems.filter((i) =>
    i.label.toLowerCase().includes(rightFilter.toLowerCase()),
  );

  const toggleStaged = (id: number) => {
    setStaged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleUnstaged = (id: number) => {
    setUnstaged((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAssign = (ids: number[]) => {
    onAssign(ids);
    setStaged(new Set());
  };

  const handleUnassign = (ids: number[]) => {
    onUnassign(ids);
    setUnstaged(new Set());
  };

  return (
    <div className="flex gap-3">
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[9px] font-bold uppercase tracking-wide text-content mb-1.5">
          {leftTitle} ({leftItems.length})
        </div>
        <div className="mb-1.5">
          <TextFilter
            value={leftFilter}
            onChange={setLeftFilter}
            placeholder="Search…"
          />
        </div>
        <div className="h-[17.8rem] overflow-y-auto thin-scrollbar border border-gray-100">
          {filteredLeft.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleStaged(item.id)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-gray-100 cursor-pointer transition-colors ${
                staged.has(item.id)
                  ? "bg-[#1e2a4a] text-custom-white"
                  : "hover:bg-gray-50 text-content"
              }`}
            >
              <div className="truncate">{item.label}</div>
              {item.sublabel && (
                <div className="text-[10px] opacity-70 truncate">
                  {item.sublabel}
                </div>
              )}
            </div>
          ))}
          {filteredLeft.length === 0 && (
            <div className="flex items-center justify-center py-6 text-[11px] text-content">
              Nothing here
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleAssign(Array.from(staged))}
            disabled={staged.size === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Assign
          </button>
          <button
            onClick={() =>
              handleAssign(
                (assignAllScope === "global" ? leftItems : filteredLeft).map(
                  (i) => i.id,
                ),
              )
            }
            disabled={leftItems.length === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Assign all
          </button>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <div className="text-[9px] font-bold uppercase tracking-wide text-content mb-1.5">
          {rightTitle} ({rightItems.length})
        </div>
        <div className="mb-1.5">
          <TextFilter
            value={rightFilter}
            onChange={setRightFilter}
            placeholder="Search…"
          />
        </div>
        <div className="h-[17.8rem] overflow-y-auto thin-scrollbar border border-gray-100">
          {filteredRight.map((item) => (
            <div
              key={item.id}
              onClick={() => toggleUnstaged(item.id)}
              className={`px-2.5 py-1.5 text-[12px] border-b border-gray-100 cursor-pointer transition-colors ${
                unstaged.has(item.id)
                  ? "bg-red-600 text-custom-white"
                  : "hover:bg-gray-50 text-content"
              }`}
            >
              <div className="truncate">{item.label}</div>
              {item.sublabel && (
                <div className="text-[10px] opacity-70 truncate">
                  {item.sublabel}
                </div>
              )}
            </div>
          ))}
          {filteredRight.length === 0 && (
            <div className="flex items-center justify-center py-6 text-[11px] text-content">
              Nothing here
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => handleUnassign(Array.from(unstaged))}
            disabled={unstaged.size === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-red-600 hover:bg-red-600/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Unassign
          </button>
          <button
            onClick={() =>
              handleUnassign(
                (assignAllScope === "global" ? rightItems : filteredRight).map(
                  (i) => i.id,
                ),
              )
            }
            disabled={rightItems.length === 0}
            className="flex-1 text-[11px] font-medium py-1.5 rounded-md text-custom-white bg-red-600 hover:bg-red-600/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Unassign all
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignPanel;
