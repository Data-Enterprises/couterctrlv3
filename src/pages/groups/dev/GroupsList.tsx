import { PlusIcon } from "@heroicons/react/20/solid";
import type { Group } from "../../../features/groupSlice";
import TextFilter from "../../../components/filters/TextFilter";

interface GroupsListProps {
  groups: Group[];
  totalCount: number;
  selectedId: number;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (group: Group) => void;
  onOpenCreate: () => void;
}

// Flat master list — mirrors Organization's BaseGroups.tsx left column shape
// (search + "+ New" + scrollable select list) rather than the old per-action
// GroupPicker sidebar that got duplicated across 4 separate tabs.
const GroupsList = ({
  groups,
  totalCount,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onOpenCreate,
}: GroupsListProps) => {
  return (
    <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col bg-gray-50">
      <div className="p-2.5 border-b border-gray-100 flex gap-1.5">
        <TextFilter
          value={search}
          onChange={onSearchChange}
          placeholder="Search groups…"
          className="flex-1"
        />
        <button
          onClick={onOpenCreate}
          title="New group"
          aria-label="New group"
          className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[480px] thin-scrollbar">
        {groups.length === 0 && (
          <div className="p-4 text-[11px] text-content text-center">
            {totalCount === 0 ? "No groups yet" : "No groups match"}
          </div>
        )}
        {groups.map((g) => {
          const isSel = selectedId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              style={
                isSel
                  ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                  : undefined
              }
              className={`w-full text-left px-3 py-2.5 border-b border-gray-100 text-[12px] font-medium transition-colors ${
                isSel ? "bg-custom-white text-content" : "hover:bg-gray-50 text-content"
              }`}
            >
              {g.group_name}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsList;
