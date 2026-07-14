import { useState } from "react";
import type { Group } from "../../../features/groupSlice";
import TextFilter from "../../../components/filters/TextFilter";

interface GroupPickerProps {
  groups: Group[];
  mode: "select" | "reference";
  selectedId?: number;
  collisionName?: string;
  onSelect?: (id: number) => void;
}

const GroupPicker = ({ groups, mode, selectedId, collisionName, onSelect }: GroupPickerProps) => {
  const [filter, setFilter] = useState("");

  const collides = (name: string) =>
    !!collisionName && collisionName.trim().length > 0 && name.toLowerCase() === collisionName.trim().toLowerCase();

  const filteredGroups = groups.filter((g) => g.group_name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: "220px" }}>
      <div className="px-2 py-2 border-b border-gray-100 flex-shrink-0">
        <TextFilter value={filter} onChange={setFilter} placeholder="Search groups…" />
      </div>
      <div className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wide text-content bg-gray-50 flex-shrink-0">
        {mode === "reference" ? "Existing groups" : "Groups"}
      </div>
      <div className="max-h-72 overflow-y-auto thin-scrollbar">
        {filteredGroups.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[12px] text-content">No groups found</div>
        ) : (
          filteredGroups.map((g) => {
            const isSelected = mode === "select" && selectedId === g.id;
            const isCollision = mode === "reference" && collides(g.group_name);
            return (
              <button
                key={g.id}
                onClick={() => onSelect?.(g.id)}
                disabled={mode === "reference"}
                className={`w-full text-left px-3 py-2 border-b border-gray-100 text-[12px] transition-colors ${
                  mode === "select" ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                } ${isCollision ? "bg-red-50 text-red-800" : "text-content"}`}
                style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)", background: "white" } : undefined}
              >
                {g.group_name}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GroupPicker;
