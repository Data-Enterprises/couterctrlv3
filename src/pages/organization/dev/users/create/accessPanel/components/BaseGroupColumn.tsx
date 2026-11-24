// Interfaces
import type { AccessPicks, SelectableStore } from "../../../interfaces";
import type { CompanyBaseGroup, Store } from "../../../../../../../interfaces";

// Components
import TextFilter from "../../../../../../../components-dev/filters/TextFilter";
import GrantModeChip from "../../components/GrantModeChip";
import Checkbox from "../../../../../../../components-dev/Checkbox";

interface BaseGroupColumnProps {
  activeCompany: number | null;
  companyName: (id: number) => string;
  groupSearch: string;
  setGroupSearch: (value: string) => void;
  expandedGroups: Set<number>;
  filteredGroups: CompanyBaseGroup[];
  groupsInActiveCompany: CompanyBaseGroup[];
  heldSet: Set<number>;
  mode: AccessPicks["mode"];
  selectedStores: SelectableStore[];
  groupStores: Record<number, Store[]>;
  mayChange: (id: number) => boolean;
  toggleGroupPick: (id: number) => void;
  toggleGroupExpand: (group: CompanyBaseGroup) => void;
}

/** The base groups column: the active company's groups with a search, each
 *  with its pick box and store count; clicking one opens its stores beside it. */
const BaseGroupColumn = ({
  activeCompany,
  companyName,
  groupSearch,
  setGroupSearch,
  filteredGroups,
  expandedGroups,
  groupsInActiveCompany,
  heldSet,
  mode,
  selectedStores,
  groupStores,
  mayChange,
  toggleGroupPick,
  toggleGroupExpand,
}: BaseGroupColumnProps) => {
  return (
    <div
      className="flex flex-col border-r border-line_hair flex-shrink-0"
      style={{ width: 288 }}
    >
      <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
        <span className="text-[9px] cc-caps-strong block mb-1.5">
          Base groups {activeCompany ? `in ${companyName(activeCompany)}` : ""}
        </span>
        <TextFilter
          value={groupSearch}
          onChange={setGroupSearch}
          placeholder="Search base groups…"
        />
      </div>
      <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
        {filteredGroups.map((group) => {
          const isOpen = expandedGroups.has(group.id);
          const held = heldSet.has(group.id);
          const inGroup = selectedStores.filter(
            (s) => s.base_group === group.id,
          ).length;
          const total = groupStores[group.id]?.length;
          return (
            <div
              key={group.id}
              className={`w-full pl-2.5 pr-3 py-1.5 transition-colors ${
                isOpen ? "bg-brand_navy/5" : "hover:bg-fill_soft"
              }`}
              style={
                isOpen
                  ? {
                      boxShadow: "inset 2px 0 0 rgb(var(--color-brand-navy))",
                    }
                  : undefined
              }
            >
              <div className="flex items-start gap-2">
                <Checkbox
                  checked={held}
                  disabled={!mayChange(group.id)}
                  onChange={() => toggleGroupPick(group.id)}
                  ariaLabel={`Give ${group.name} to this person`}
                  className="mt-1"
                />
                <button
                  onClick={() => toggleGroupExpand(group)}
                  className="flex-1 min-w-0 text-left"
                >
                  <div className="text-[12.5px] font-semibold text-content truncate">
                    {group.name}
                  </div>
                  <div className="text-[10.5px] text-content/95">
                    {total === undefined
                      ? "Loading…"
                      : held && mode === "all"
                        ? `all ${total} stores, and new ones`
                        : inGroup > 0
                          ? `${inGroup} of ${total} picked`
                          : `${total} stores`}
                    {!mayChange(group.id) && " · not yours to change"}
                  </div>
                </button>
              </div>

              {/* Only once the group is held. The chip reports the
                              person's access type; it is not a control. */}
              {held && (
                <div className="flex items-center gap-1 mt-1.5 ml-6">
                  <GrantModeChip mode={mode} />
                </div>
              )}
            </div>
          );
        })}
        {activeCompany && filteredGroups.length === 0 && (
          <div className="flex items-center justify-center py-6 text-[11px] text-content text-center px-3">
            {groupsInActiveCompany.length === 0
              ? "No base groups for this company"
              : "No base groups match"}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseGroupColumn;
