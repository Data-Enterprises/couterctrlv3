import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getBaseGroups, getAllStoresInBaseGroup } from "../../../../api/baseGroups";
import type { CompanyBaseGroup, JsonError, Store } from "../../../../interfaces";
import type { SelectableStore } from "../../types";
import TextFilter from "../../../../components/filters/TextFilter";
import SelectFilter from "../../../../components/filters/SelectFilter";

interface StepAssignmentsProps {
  selectedStores: SelectableStore[];
  onChange: (stores: SelectableStore[]) => void;
  companyGroups: Record<number, CompanyBaseGroup[]>;
  onCompanyGroupsChange: (
    updater: (
      prev: Record<number, CompanyBaseGroup[]>,
    ) => Record<number, CompanyBaseGroup[]>,
  ) => void;
  onContinue: () => void;
}

// Three-column drill-down: companies -> base groups in the active company
// (with live selected/total counts) -> stores for every group the admin has
// expanded. Replaces the old single-column accordion, but keeps its one
// genuinely useful trait — several groups can stay expanded and stacked at
// once in the third column — just scoped to one company's groups instead of
// spanning the whole page, so companies/groups no longer scroll out of view
// while picking stores. companyGroups stays lifted to CreateUserWizard so
// Review can resolve base group names too.
const StepAssignments = ({
  selectedStores,
  onChange,
  companyGroups,
  onCompanyGroupsChange,
  onContinue,
}: StepAssignmentsProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  const [activeCompany, setActiveCompany] = useState<number | null>(null);
  // Which groups are selected for viewing — drives the middle column's
  // highlight and which groups get a section in the stores column at all.
  // Clicking a group in the middle column toggles this.
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    new Set(),
  );
  // Purely which selected groups' store checklists are visually collapsed
  // within the stores column — independent of expandedGroups above. Clicking
  // a section's own header in the stores column toggles this (a real
  // accordion: the header always stays, only its body hides), and never
  // touches whether the group is selected at all.
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set(),
  );
  const [groupStores, setGroupStores] = useState<Record<number, Store[]>>({});
  const [groupSearch, setGroupSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  // Controlled value for the "Jump to selected" dropdown in the stores
  // column — always resets to "" right after a pick (see handleJumpToGroup).
  // It's a scroll-to shortcut among already-selected groups, not a display
  // filter, so it never competes with expandedGroups or collapsedSections.
  const [storeGroupFilter, setStoreGroupFilter] = useState("");

  useEffect(() => {
    if (ctx.companies.length > 0 && activeCompany === null) {
      selectCompany(ctx.companies[0].company);
    }
  }, [ctx.companies]);

  const groupsById = useMemo(() => {
    const map: Record<number, CompanyBaseGroup> = {};
    Object.values(companyGroups)
      .flat()
      .forEach((g) => {
        map[g.id] = g;
      });
    return map;
  }, [companyGroups]);

  const companyName = (id: number) =>
    ctx.companies.find((c) => c.company === id)?.name ?? "";

  const fetchGroupsForCompany = (companyId: number) => {
    getBaseGroups(ctx.url, ctx.token, companyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          onCompanyGroupsChange((prev) => ({ ...prev, [companyId]: j.groups }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const selectCompany = (companyId: number) => {
    setActiveCompany(companyId);
    setGroupSearch("");
    setStoreGroupFilter("");
    if (!companyGroups[companyId]) fetchGroupsForCompany(companyId);
  };

  // A store record can come back with a null store_name — filter those out
  // before they reach the search below, same fix as StoresDirectory.tsx.
  const validOnly = (list: Store[]) => list.filter((s) => s.store_name != null);

  const fetchStoresForGroup = (groupId: number): Promise<Store[]> => {
    if (groupStores[groupId]) return Promise.resolve(groupStores[groupId]);
    return getAllStoresInBaseGroup(ctx.url, ctx.token, groupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const valid = validOnly(j.assigned_stores);
          setGroupStores((prev) => ({ ...prev, [groupId]: valid }));
          return valid;
        }
        return [];
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        return [];
      });
  };

  // Eagerly fetch every group's store roster once its company becomes
  // active, so the base-groups column can show real "X of Y" counts before
  // any group is expanded — the old accordion only fetched a group's stores
  // on first expand, but this layout needs totals up front to be useful.
  useEffect(() => {
    if (!activeCompany) return;
    const groups = companyGroups[activeCompany];
    if (!groups) return;
    groups.forEach((g) => {
      if (!groupStores[g.id]) fetchStoresForGroup(g.id);
    });
  }, [activeCompany, companyGroups]);

  const toggleGroupExpand = (group: CompanyBaseGroup) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(group.id) ? next.delete(group.id) : next.add(group.id);
      return next;
    });
  };

  // Accordion toggle for a section's body within the stores column — the
  // header (and the group's selected state) stays put either way.
  const toggleSectionCollapse = (groupId: number) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      next.has(groupId) ? next.delete(groupId) : next.add(groupId);
      return next;
    });
  };

  const toggleStore = (store: Store, group: CompanyBaseGroup) => {
    const found = selectedStores.find(
      (s) => s.storeid === store.storeid && s.base_group === group.id,
    );
    if (found) {
      onChange(
        selectedStores.filter(
          (s) => !(s.storeid === store.storeid && s.base_group === group.id),
        ),
      );
    } else {
      onChange([...selectedStores, { ...store, base_group: group.id }]);
    }
  };

  const handleSelectAllForGroup = async (group: CompanyBaseGroup) => {
    const stores = await fetchStoresForGroup(group.id);
    const inGroup = selectedStores.filter((s) => s.base_group === group.id);
    const allSelected = stores.length > 0 && inGroup.length === stores.length;
    if (allSelected) {
      onChange(selectedStores.filter((s) => s.base_group !== group.id));
    } else {
      const toAdd = stores
        .filter((s) => !inGroup.some((sel) => sel.storeid === s.storeid))
        .map((s) => ({ ...s, base_group: group.id }));
      onChange([...selectedStores.filter((s) => s.base_group !== group.id), ...inGroup, ...toAdd]);
    }
  };

  // Per-company badge — how many selected stores belong to each company, so
  // switching away from one doesn't hide that it already has picks.
  const companyCounts = useMemo(() => {
    const map: Record<number, number> = {};
    selectedStores.forEach((s) => {
      map[s.company] = (map[s.company] ?? 0) + 1;
    });
    return map;
  }, [selectedStores]);

  const rollup = useMemo(() => {
    const byGroup = new Map<number, SelectableStore[]>();
    selectedStores.forEach((s) => {
      const list = byGroup.get(s.base_group) ?? [];
      list.push(s);
      byGroup.set(s.base_group, list);
    });
    return Array.from(byGroup.entries()).map(([groupId, stores]) => ({
      groupId,
      count: stores.length,
      total: groupStores[groupId]?.length ?? stores.length,
      groupName: groupsById[groupId]?.name ?? "",
      companyId: groupsById[groupId]?.company,
    }));
  }, [selectedStores, groupStores, groupsById]);

  const canContinue = selectedStores.length > 0;

  const groupsInActiveCompany = activeCompany ? (companyGroups[activeCompany] ?? []) : [];
  const filteredGroups = groupsInActiveCompany.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()),
  );
  const openGroups = groupsInActiveCompany.filter((g) => expandedGroups.has(g.id));

  // Scoped to openGroups only — this is a jump-to-section shortcut for
  // groups you've already expanded (useful once several are stacked), not a
  // way to expand a new one. It's a one-shot action, not a display filter:
  // it scrolls then immediately resets to the placeholder. expandedGroups
  // stays the single source of truth for what column 3 shows, so collapsing
  // a group (click it again in the middle column) always works.
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
    <div className="w-full flex flex-col">
      <div className="flex border border-gray-100 rounded-lg overflow-hidden h-[440px]">
        {/* Companies */}
        <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: 220 }}>
          <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wide text-content">
              Companies
            </span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
            {ctx.companies.map((c) => {
              const isActive = activeCompany === c.company;
              const count = companyCounts[c.company] ?? 0;
              return (
                <button
                  key={c.id}
                  onClick={() => selectCompany(c.company)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-[12px] transition-colors ${
                    isActive ? "bg-[#1e2a4a] text-custom-white" : "hover:bg-gray-50 text-content"
                  }`}
                >
                  <span className="truncate">{c.name}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                        isActive ? "bg-custom-white/20 text-custom-white" : "bg-[#1e2a4a]/10 text-[#1e2a4a]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Base groups in the active company */}
        <div className="flex flex-col border-r border-gray-100 flex-shrink-0" style={{ width: 260 }}>
          <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wide text-content block mb-1.5">
              Base groups {activeCompany ? `in ${companyName(activeCompany)}` : ""}
            </span>
            <TextFilter
              value={groupSearch}
              onChange={setGroupSearch}
              placeholder="Search base groups…"
            />
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
            {filteredGroups.map((group) => {
              const isOpen = expandedGroups.has(group.id);
              const inGroup = selectedStores.filter((s) => s.base_group === group.id).length;
              const total = groupStores[group.id]?.length;
              return (
                <button
                  key={group.id}
                  onClick={() => toggleGroupExpand(group)}
                  className={`w-full flex items-start justify-between gap-2 px-3 py-2 text-left transition-colors ${
                    isOpen ? "bg-[#1e2a4a]/5" : "hover:bg-gray-50"
                  }`}
                  style={isOpen ? { boxShadow: "inset 2px 0 0 #1e2a4a" } : undefined}
                >
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-medium text-content truncate">{group.name}</div>
                    <div className="text-[10.5px] text-content/60">
                      {total === undefined
                        ? "Loading…"
                        : inGroup > 0
                          ? `${inGroup} of ${total} selected`
                          : `${total} stores`}
                    </div>
                  </div>
                </button>
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

        {/* Stores for every expanded group */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0 flex items-center gap-2">
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
              placeholder="Jump to selected…"
              className="w-[150px] flex-shrink-0"
            />
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
            {openGroups.length === 0 && (
              <div className="flex items-center justify-center h-full text-[11px] text-content/60 p-6 text-center">
                Select a base group to see its stores
              </div>
            )}
            {openGroups.map((group) => {
              const inGroup = selectedStores.filter((s) => s.base_group === group.id);
              const total = groupStores[group.id]?.length;
              const isCollapsed = collapsedSections.has(group.id);
              const stores = (groupStores[group.id] ?? []).filter((s) =>
                s.store_name.toLowerCase().includes(storeSearch.toLowerCase()),
              );
              return (
                <div key={group.id} id={`assignments-group-${group.id}`}>
                  <button
                    onClick={() => toggleSectionCollapse(group.id)}
                    className="sticky top-0 z-10 w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 text-left hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10px] text-content/50 flex-shrink-0 transition-transform ${isCollapsed ? "" : "rotate-90"}`}
                      >
                        ▶
                      </span>
                      <span className="text-[11px] font-semibold text-content truncate">
                        {group.name} — {inGroup.length}
                        {total !== undefined ? ` of ${total}` : ""}
                      </span>
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAllForGroup(group);
                      }}
                      className="text-[10.5px] text-blue-700 font-medium flex-shrink-0"
                    >
                      Select all
                    </span>
                  </button>
                  {!isCollapsed && (
                  <div className="px-2 divide-y divide-[#1e2a4a]/15">
                    {stores.map((s) => {
                      const isSelected = inGroup.some((sel) => sel.storeid === s.storeid);
                      return (
                        <label
                          key={s.storeid}
                          className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-content cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStore(s, group)}
                          />
                          {s.store_name}
                        </label>
                      );
                    })}
                    {groupStores[group.id] === undefined && (
                      <div className="py-3 text-[11px] text-content/60 text-center">Loading…</div>
                    )}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2.5 mt-4 mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-semibold text-content">
            Selected — {selectedStores.length} stores
          </span>
          <button onClick={() => onChange([])} className="text-[10.5px] text-blue-700 font-medium">
            Clear all
          </button>
        </div>
        {rollup.length === 0 ? (
          <div className="text-[11.5px] text-content/50">Nothing selected yet</div>
        ) : (
          <div className="text-[11.5px] text-content/85 leading-relaxed max-h-[60px] overflow-y-auto thin-scrollbar">
            {rollup.map((r, i) => (
              <span key={r.groupId}>
                {i > 0 && "; "}
                {companyName(r.companyId ?? 0)}: {r.groupName} ({r.count})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onContinue}
          disabled={!canContinue}
          className={`text-[12px] font-medium px-4 py-1.5 rounded-md text-custom-white ${canContinue ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85" : "bg-gray-300 cursor-not-allowed"}`}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepAssignments;
