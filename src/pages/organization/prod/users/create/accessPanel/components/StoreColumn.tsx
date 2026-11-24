// Hooks
import { useState } from "react";

// Interfaces
import type { AccessPicks, SelectableStore } from "../../../interfaces";
import type { CompanyBaseGroup, Store } from "../../../../../../../interfaces";

// Components
import TextFilter from "../../../../../../../components/filters/TextFilter";
import SelectFilter from "../../../../../../../components/filters/SelectFilter";
import ExpandedGroupStores from "./ExpandedGroupStores";

interface StoreColumnProps {
  /** The groups opened in the base groups column, each a section here. */
  openGroups: CompanyBaseGroup[];
  /** Groups held, ticked or implied by a picked store. */
  heldSet: Set<number>;
  mode: AccessPicks["mode"];
  selectedStores: SelectableStore[];
  /** Each group's roster, once fetched. */
  groupStores: Record<number, Store[]>;
  singleStoreOnly: boolean;
  /** Whether this user may give or take the group. */
  mayChange: (id: number) => boolean;
  onToggleStore: (store: Store, group: CompanyBaseGroup) => void;
  onSelectAll: (group: CompanyBaseGroup) => void;
}

/** The stores column: a store search and a jump to any open group, over one
 *  section of stores for every group opened beside it. */
const StoreColumn = ({
  openGroups,
  heldSet,
  mode,
  selectedStores,
  groupStores,
  singleStoreOnly,
  mayChange,
  onToggleStore,
  onSelectAll,
}: StoreColumnProps) => {
  const [storeSearch, setStoreSearch] = useState<string>("");
  // The "Jump to group" dropdown's value, reset to "" after each pick: a
  // scroll shortcut, not a filter.
  const [storeGroupFilter, setStoreGroupFilter] = useState<string>("");
  // Which groups' store lists are collapsed: display only, independent of
  // which groups are open and of what is held.
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set(),
  );

  const toggleSectionCollapse = (groupId: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const handleJumpToGroup = (value: string) => {
    if (!value) return;
    const groupId = Number(value);
    setCollapsedSections((prev) => {
      if (!prev.has(groupId)) return prev;
      const next = new Set(prev);
      next.delete(groupId);
      return next;
    });
    document
      .getElementById(`assignments-group-${value}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    setStoreGroupFilter("");
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0 flex items-center gap-2">
        <TextFilter
          value={storeSearch}
          onChange={setStoreSearch}
          placeholder="Search stores…"
          className="flex-1"
        />
        <SelectFilter
          options={openGroups.map((g) => ({
            value: String(g.id),
            label: g.name,
          }))}
          value={storeGroupFilter}
          onChange={handleJumpToGroup}
          placeholder="Jump to group…"
          className="w-[150px] flex-shrink-0"
        />
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
        {openGroups.length === 0 && (
          <div className="flex items-center justify-center h-full text-[11px] text-content/95 p-6 text-center">
            Pick a base group to see its stores
          </div>
        )}
        {openGroups.map((group) => (
          <ExpandedGroupStores
            key={group.id}
            group={group}
            held={heldSet.has(group.id)}
            mode={mode}
            inGroup={selectedStores.filter((s) => s.base_group === group.id)}
            roster={groupStores[group.id]}
            storeSearch={storeSearch}
            collapsed={collapsedSections.has(group.id)}
            canChange={mayChange(group.id)}
            singleStoreOnly={singleStoreOnly}
            onToggleCollapse={() => toggleSectionCollapse(group.id)}
            onToggleStore={(store) => onToggleStore(store, group)}
            onSelectAll={() => onSelectAll(group)}
          />
        ))}
      </div>
    </div>
  );
};

export default StoreColumn;
