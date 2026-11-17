// Utils
import { treeMoney } from "../utils";

// Interfaces
import type { TreeGroup } from "../interfaces";

// Components
import { ChevronRightIcon, ChevronDownIcon } from "@heroicons/react/20/solid";

interface GroupRowProps {
  group: TreeGroup;
  isOpen: boolean;
  onToggle: () => void;
}

/** One department or vendor in the tree: its name, item count and sales. */
const GroupRow = ({ group, isOpen, onToggle }: GroupRowProps) => (
  <button
    onClick={onToggle}
    className={`w-full flex items-center gap-1.5 px-3 py-2 text-left transition-colors ${
      isOpen ? "bg-fill_soft" : "hover:bg-fill_soft"
    }`}
  >
    {isOpen ? (
      <ChevronDownIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
    ) : (
      <ChevronRightIcon className="w-3.5 h-3.5 text-content/95 flex-shrink-0" />
    )}
    <span
      className={`flex-1 min-w-0 truncate text-[13px] ${isOpen ? "font-semibold text-content" : "text-content"}`}
    >
      {group.label}
    </span>
    {group.itemCount !== null && (
      <span className="text-[11px] text-content/95 tabular-nums flex-shrink-0">
        {group.itemCount}
      </span>
    )}
    <span className="text-[11px] text-content/95 tabular-nums flex-shrink-0">
      {treeMoney(group.sales)}
    </span>
  </button>
);

export default GroupRow;
