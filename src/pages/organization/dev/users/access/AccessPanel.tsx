import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  getBaseGroups,
  getAllStoresInBaseGroup,
} from "../../../../../api/baseGroups";
import type {
  CompanyBaseGroup,
  GrantMode,
  JsonError,
  Store,
} from "../../../../../interfaces";
import type { SelectableStore } from "../../types";
import { modeOf, type AccessPicks, NO_PICKS } from "./accessSets";
import TextFilter from "../../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../../components-dev/filters/SelectFilter";
import Checkbox from "../../../../../components-dev/Checkbox";
import GrantModeChip from "./GrantModeChip";

interface AccessPanelProps {
  picks: AccessPicks;
  onPicksChange: (next: AccessPicks) => void;
  companyGroups: Record<number, CompanyBaseGroup[]>;
  onCompanyGroupsChange: (
    updater: (
      prev: Record<number, CompanyBaseGroup[]>,
    ) => Record<number, CompanyBaseGroup[]>,
  ) => void;
  /** Locks every group to picking stores, and to one store in total. The
   *  single-store role cannot hold a whole group — the server refuses it —
   *  so the control that would ask is not offered. */
  singleStoreOnly?: boolean;
  /** The mode a group takes when it is first held, from the Access type step.
   *  Per-group override still applies: the whole of East plus two stores out
   *  of HC North is the common real case. */
  defaultMode?: GrantMode;
  /**
   * Each group's full roster, lifted so a caller can count what `all` adds up
   * to — the grant itself names no stores in that mode, so the roster is the
   * only source for the number. Lifted for the same reason `companyGroups`
   * is: Review needs it and must not fetch it a second time.
   */
  groupStores: Record<number, Store[]>;
  onGroupStoresChange: (
    updater: (prev: Record<number, Store[]>) => Record<number, Store[]>,
  ) => void;
}

/**
 * Three-column drill-down: companies → base groups in the active company →
 * stores for every group the admin has expanded.
 *
 * Replaces the old single-column accordion, but keeps its one genuinely
 * useful trait — several groups can stay expanded and stacked at once in the
 * third column — scoped to one company's groups instead of spanning the whole
 * page, so companies and groups no longer scroll out of view while picking
 * stores. `companyGroups` stays lifted to the caller so Review can resolve
 * base group names too.
 *
 * ### What the middle column's mode control decides
 *
 * A held group is held one of two ways, and the difference is the whole point
 * of the screen:
 *
 * - **Auto** — the whole group, and any store added to it later. The third
 *   column becomes a read-only preview, because there is nothing to pick:
 *   the answer is "all of them, including the ones that do not exist yet".
 * - **Pick stores** — only what is ticked. The third column gets checkboxes,
 *   and a store added to the group later does *not* reach this person.
 *
 * Switching to Auto leaves any ticks in place but stops sending them, so
 * switching back does not lose the picks someone just made.
 */
const AccessPanel = ({
  picks,
  onPicksChange,
  companyGroups,
  onCompanyGroupsChange,
  singleStoreOnly = false,
  defaultMode = "selected",
  groupStores,
  onGroupStoresChange,
}: AccessPanelProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();

  /**
   * Who may be handed what. A programmer is setting up other people's
   * companies and holds none of them; everyone else may only pass on what is
   * already on their own account. The two sources name the id differently —
   * `Company.id` against `UserCompany.company` — so they are flattened here.
   */
  const companyList = ctx.isProgrammer
    ? ctx.allCompanies.map((c) => ({ id: c.id, name: c.name }))
    : ctx.companies.map((c) => ({ id: c.company, name: c.name }));

  const selectedStores = picks.stores;
  const onChange = (stores: SelectableStore[]) =>
    onPicksChange({ ...picks, stores });

  /**
   * A company or a group ticked in its own right, rather than inferred from a
   * store. Ticking East means East — not whichever group each East store
   * happens to point at — and a company with no stores yet can still be given
   * to somebody, which is the case that had no answer before.
   */
  const toggleIn = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const toggleCompanyPick = (id: number) =>
    onPicksChange({ ...picks, companies: toggleIn(picks.companies, id) });

  /** Unticking a group drops its ticked stores with it. Leaving them behind
   *  would keep the group held, since a ticked store holds its own group. */
  const toggleGroupPick = (id: number) => {
    const held = picks.baseGroups.includes(id);
    onPicksChange({
      ...picks,
      baseGroups: toggleIn(picks.baseGroups, id),
      stores: held
        ? picks.stores.filter((s) => s.base_group !== id)
        : picks.stores,
      // Newly held groups take the Access type step's answer. An existing
      // mode is left alone, so re-ticking a group restores how it was held.
      modes:
        held || picks.modes[id] !== undefined
          ? picks.modes
          : { ...picks.modes, [id]: singleStoreOnly ? "selected" : defaultMode },
    });
  };

  const setMode = (id: number, mode: GrantMode) =>
    onPicksChange({
      ...picks,
      // Holding a group is implied by choosing how to hold it.
      baseGroups: picks.baseGroups.includes(id)
        ? picks.baseGroups
        : [...picks.baseGroups, id],
      modes: { ...picks.modes, [id]: mode },
    });

  const [activeCompany, setActiveCompany] = useState<number | null>(null);
  // Which groups are selected for viewing — drives the middle column's
  // highlight and which groups get a section in the stores column at all.
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  // Purely which groups' store lists are visually collapsed within the stores
  // column — independent of expandedGroups. Clicking a section's own header
  // toggles this (a real accordion: the header stays, only its body hides),
  // and never touches whether the group is held.
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set(),
  );
  const [groupSearch, setGroupSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  // Controlled value for the "Jump to selected" dropdown — always resets to
  // "" right after a pick. It is a scroll-to shortcut among already-expanded
  // groups, not a display filter, so it never competes with expandedGroups.
  const [storeGroupFilter, setStoreGroupFilter] = useState("");

  useEffect(() => {
    if (companyList.length > 0 && activeCompany === null) {
      selectCompany(companyList[0].id);
    }
  }, [companyList.length]);

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
    companyList.find((c) => c.id === id)?.name ?? "";

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
          onGroupStoresChange((prev) => ({ ...prev, [groupId]: valid }));
          return valid;
        }
        return [];
      })
      .catch((err: JsonError) => {
        toast.error(err.message);
        return [];
      });
  };

  // Eagerly fetch every group's roster once its company becomes active, so
  // the middle column can show real "X of Y" counts before any group is
  // expanded — the old accordion only fetched on first expand, but this
  // layout needs totals up front to be useful.
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
      return;
    }
    // One store, total — not one per group. The server enforces it either way
    // and refuses the whole call, so the panel replaces rather than adds.
    if (singleStoreOnly) {
      onChange([{ ...store, base_group: group.id }]);
      return;
    }
    onChange([...selectedStores, { ...store, base_group: group.id }]);
  };

  const handleSelectAllForGroup = async (group: CompanyBaseGroup) => {
    const stores = await fetchStoresForGroup(group.id);
    const inGroup = selectedStores.filter((s) => s.base_group === group.id);
    const allSelected = stores.length > 0 && inGroup.length === stores.length;
    if (allSelected) {
      onChange(selectedStores.filter((s) => s.base_group !== group.id));
      return;
    }
    const toAdd = stores
      .filter((s) => !inGroup.some((sel) => sel.storeid === s.storeid))
      .map((s) => ({ ...s, base_group: group.id }));
    onChange([
      ...selectedStores.filter((s) => s.base_group !== group.id),
      ...inGroup,
      ...toAdd,
    ]);
  };

  // Per-company badge — how many picked stores belong to each company, so
  // switching away from one does not hide that it already has picks.
  const companyCounts = useMemo(() => {
    const map: Record<number, number> = {};
    selectedStores.forEach((s) => {
      map[s.company] = (map[s.company] ?? 0) + 1;
    });
    return map;
  }, [selectedStores]);

  const groupsInActiveCompany = activeCompany
    ? (companyGroups[activeCompany] ?? [])
    : [];
  const filteredGroups = groupsInActiveCompany.filter((g) =>
    g.name.toLowerCase().includes(groupSearch.toLowerCase()),
  );
  const openGroups = groupsInActiveCompany.filter((g) =>
    expandedGroups.has(g.id),
  );

  /** Held groups set to pick stores with nothing picked. The server answers
   *  400 for these, so they are named on screen before the save is tried. */
  const emptyPicks = picks.baseGroups.filter(
    (id) =>
      modeOf(picks, id) === "selected" &&
      !selectedStores.some((s) => s.base_group === id),
  );

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
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 flex border border-gray-100 rounded-lg overflow-hidden">
        {/* Companies */}
        <div
          className="flex flex-col border-r border-gray-100 flex-shrink-0"
          style={{ width: 220 }}
        >
          <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
            <span className="text-[9px] font-bold uppercase tracking-wide text-content">
              Companies
            </span>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
            {companyList.map((c) => {
              const isActive = activeCompany === c.id;
              const count = companyCounts[c.id] ?? 0;
              return (
                <div
                  key={c.id}
                  className={`w-full flex items-center gap-2 pl-2.5 pr-3 transition-colors ${
                    isActive
                      ? "bg-brand_navy text-custom-white"
                      : "hover:bg-gray-50 text-content"
                  }`}
                >
                  <Checkbox
                    checked={picks.companies.includes(c.id)}
                    onChange={() => toggleCompanyPick(c.id)}
                    ariaLabel={`Assign ${c.name} itself`}
                  />
                  <button
                    onClick={() => selectCompany(c.id)}
                    className="flex-1 min-w-0 flex items-center justify-between gap-2 py-2 text-left text-[12px] font-medium"
                  >
                    <span className="truncate">{c.name}</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                          isActive
                            ? "bg-custom-white/20 text-custom-white"
                            : "bg-brand_navy/10 text-brand_navy"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Base groups in the active company */}
        <div
          className="flex flex-col border-r border-gray-100 flex-shrink-0"
          style={{ width: 288 }}
        >
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
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
            {filteredGroups.map((group) => {
              const isOpen = expandedGroups.has(group.id);
              const held = picks.baseGroups.includes(group.id);
              const mode = modeOf(picks, group.id);
              const inGroup = selectedStores.filter(
                (s) => s.base_group === group.id,
              ).length;
              const total = groupStores[group.id]?.length;
              return (
                <div
                  key={group.id}
                  className={`w-full pl-2.5 pr-3 py-1.5 transition-colors ${
                    isOpen ? "bg-brand_navy/5" : "hover:bg-gray-50"
                  }`}
                  style={
                    isOpen
                      ? {
                          boxShadow:
                            "inset 2px 0 0 rgb(var(--color-brand-navy))",
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={held}
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
                      <div className="text-[10.5px] text-content/85">
                        {total === undefined
                          ? "Loading…"
                          : held && mode === "all"
                            ? `all ${total} stores, and new ones`
                            : inGroup > 0
                              ? `${inGroup} of ${total} picked`
                              : `${total} stores`}
                      </div>
                    </button>
                  </div>

                  {/* Only once the group is actually held — the question
                      "how" has no meaning before "whether". */}
                  {held && (
                    <div className="flex items-center gap-1 mt-1.5 ml-6">
                      {!singleStoreOnly && (
                        <div className="inline-flex rounded-md overflow-hidden border border-brand_line_2">
                          {(
                            [
                              ["all", "Auto"],
                              ["selected", "Pick stores"],
                            ] as [GrantMode, string][]
                          ).map(([value, label]) => (
                            <button
                              key={value}
                              onClick={() => setMode(group.id, value)}
                              className={`text-[10px] font-semibold px-2 py-0.5 transition-colors ${
                                mode === value
                                  ? "bg-brand_navy text-custom-white"
                                  : "bg-custom-white text-content hover:bg-gray-50"
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
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
              placeholder="Jump to group…"
              className="w-[150px] flex-shrink-0"
            />
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
            {openGroups.length === 0 && (
              <div className="flex items-center justify-center h-full text-[11px] text-content/85 p-6 text-center">
                Pick a base group to see its stores
              </div>
            )}
            {openGroups.map((group) => {
              const held = picks.baseGroups.includes(group.id);
              const mode = modeOf(picks, group.id);
              const preview = held && mode === "all";
              const inGroup = selectedStores.filter(
                (s) => s.base_group === group.id,
              );
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
                        className={`text-[10px] text-content/85 flex-shrink-0 transition-transform ${
                          isCollapsed ? "" : "rotate-90"
                        }`}
                      >
                        ▶
                      </span>
                      <span className="text-[11px] font-semibold text-content truncate">
                        {group.name}
                        {preview
                          ? total !== undefined
                            ? ` — all ${total}`
                            : ""
                          : ` — ${inGroup.length}${
                              total !== undefined ? ` of ${total}` : ""
                            }`}
                      </span>
                      {held && <GrantModeChip mode={mode} />}
                    </span>
                    {/* No Select all on a preview: there is nothing to select,
                        and the whole group is already the answer. */}
                    {!preview && !singleStoreOnly && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAllForGroup(group);
                        }}
                        className="text-[10.5px] text-brand_navy font-semibold flex-shrink-0 hover:underline"
                      >
                        Select all
                      </span>
                    )}
                  </button>
                  {!isCollapsed && (
                    <div className="px-2 divide-y divide-brand_navy/15">
                      {preview && (
                        <p className="text-[10.5px] text-content/85 leading-snug px-1 py-1.5">
                          Read only — this person has the whole group. Stores
                          added to it later will appear for them automatically.
                        </p>
                      )}
                      {stores.map((s) => {
                        const isSelected = inGroup.some(
                          (sel) => sel.storeid === s.storeid,
                        );
                        return preview ? (
                          <div
                            key={s.storeid}
                            className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-content/85"
                          >
                            <span className="tabular-nums font-semibold w-[42px] flex-shrink-0">
                              {s.store_number}
                            </span>
                            <span className="truncate">{s.store_name}</span>
                          </div>
                        ) : (
                          <div
                            key={s.storeid}
                            className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-content"
                          >
                            <Checkbox
                              checked={isSelected}
                              onChange={() => toggleStore(s, group)}
                              ariaLabel={`Pick ${s.store_name}`}
                            />
                            <span className="tabular-nums font-semibold w-[42px] flex-shrink-0">
                              {s.store_number}
                            </span>
                            <span className="truncate">{s.store_name}</span>
                          </div>
                        );
                      })}
                      {groupStores[group.id] === undefined && (
                        <div className="py-3 text-[11px] text-content/85 text-center">
                          Loading…
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {emptyPicks.length > 0 && (
        <div className="mt-2 px-3 py-2 rounded-lg bg-brand_danger_bg border border-brand_danger_line flex-shrink-0">
          <span className="text-[11.5px] text-content">
            <span className="font-semibold">
              {emptyPicks
                .map((id) => groupsById[id]?.name ?? `Group ${id}`)
                .join(", ")}
            </span>{" "}
            {emptyPicks.length === 1 ? "is" : "are"} set to pick stores with
            none picked. Pick at least one store, switch to Auto, or untick the
            group.
          </span>
        </div>
      )}

      <div className="bg-bkg rounded-lg px-3 py-2.5 mt-3 shadow-card-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-semibold text-content">
            {/* No company tally: a held group carries its own company now, so
                a count of ticks would read 0 beside a group that plainly has
                one. Review shows what is actually written. */}
            {picks.baseGroups.length} base group
            {picks.baseGroups.length === 1 ? "" : "s"}, {selectedStores.length}{" "}
            store{selectedStores.length === 1 ? "" : "s"} picked
          </span>
          <button
            onClick={() => onPicksChange(NO_PICKS)}
            className="text-[10.5px] text-brand_navy font-semibold hover:underline"
          >
            Clear all
          </button>
        </div>
        {picks.baseGroups.length === 0 ? (
          <div className="text-[11.5px] text-content/85">
            Nothing selected yet
          </div>
        ) : (
          <div className="text-[11.5px] text-content/85 leading-relaxed max-h-[60px] overflow-y-auto thin-scrollbar">
            {picks.baseGroups.map((id, i) => {
              const group = groupsById[id];
              const mode = modeOf(picks, id);
              const count = selectedStores.filter(
                (s) => s.base_group === id,
              ).length;
              return (
                <span key={id}>
                  {i > 0 && "; "}
                  {companyName(group?.company ?? 0)}: {group?.name ?? `#${id}`}{" "}
                  {mode === "all" ? "(all)" : `(${count})`}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccessPanel;
