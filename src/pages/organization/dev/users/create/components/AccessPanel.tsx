// Hooks
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useToast } from "../../../../../../components/toasts/hooks/useToast";
import { useOrganizationCtx, useBaseGroupsCtx } from "../../../hooks";

// API
import {
  getBaseGroups,
  getAllStoresInBaseGroup,
} from "../../../../../../api/baseGroups";
import { getBaseGroupsAssignedToUser } from "../../../../../../api/team";

// Utils
import {
  heldGroupIds as editorHeldGroupIds,
  mayChangeGroup,
  wizardGroups,
} from "../../../utils";
import { NO_PICKS, heldGroupIds, toggleGroup } from "../../utils";

// Interfaces
import type { AccessPicks, SelectableStore } from "../../interfaces";
import type {
  BaseGroup,
  CompanyBaseGroup,
  JsonError,
  Store,
} from "../../../../../../interfaces";

// Components
import TextFilter from "../../../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../../../components-dev/filters/SelectFilter";
import Checkbox from "../../../../../../components-dev/Checkbox";
import GrantModeChip from "./GrantModeChip";
import EmptyPicksNotice from "./EmptyPicksNotice";

interface AccessPanelProps {
  picks: AccessPicks;
  onPicksChange: (next: AccessPicks) => void;
  companyGroups: Record<number, CompanyBaseGroup[]>;
  onCompanyGroupsChange: (
    updater: (
      prev: Record<number, CompanyBaseGroup[]>,
    ) => Record<number, CompanyBaseGroup[]>,
  ) => void;
  /** Locks the person to one store in total. The single-store role can't
   *  hold a whole group (the server refuses), so this never sees `all`. */
  singleStoreOnly?: boolean;
  /**
   * Each group's full roster, lifted so a caller can count what `all` adds up
   * to (that grant names no stores), and so Review doesn't fetch it again.
   */
  groupStores: Record<number, Store[]>;
  onGroupStoresChange: (
    updater: (prev: Record<number, Store[]>) => Record<number, Store[]>,
  ) => void;
  /**
   * A fourth column inside the same card: Edit user puts the effective store
   * list there, beside the picks it adds up from.
   */
  rightColumn?: ReactNode;
  /** Hide the built-in summary strip, for a caller supplying its own footer
   *  with the Save button in it. */
  hideFooter?: boolean;
  /** Hide the empty-picks notice, for a caller placing its own higher up the
   *  screen where a warning is read before the thing it warns about. */
  hideEmptyNotice?: boolean;
  /** Edit: the groups the person already holds, so the summary can name them
   *  before their company is opened ("#66 (all)" otherwise). */
  heldGroups?: BaseGroup[];
}

/**
 * Three-column drill-down: companies → base groups in the active company →
 * stores for every expanded group (several can stay open at once).
 * `companyGroups` stays lifted so Review can name groups too.
 *
 * `picks.mode` is the person's answer from the Access type step, for every
 * group here:
 *
 * - **By group** (`all`): the whole group and any store added later; the
 *   third column is a read-only preview.
 * - **By store** (`selected`): only what is ticked; a store added later does
 *   *not* reach this person.
 *
 * **There is no per-group control.** The chip says how a group is held.
 */
const AccessPanel = ({
  picks,
  onPicksChange,
  companyGroups,
  onCompanyGroupsChange,
  singleStoreOnly = false,
  groupStores,
  onGroupStoresChange,
  rightColumn,
  hideFooter = false,
  hideEmptyNotice = false,
  heldGroups = [],
}: AccessPanelProps) => {
  const toast = useToast();
  const ctx = useOrganizationCtx();
  const scope = useBaseGroupsCtx();

  /**
   * The groups the editor holds: below level 9 (and DCR support), the only ones
   * they may hand out, by the Base Groups tab's rule (the page's `utils`).
   * Null until read; until then nothing is changeable.
   */
  const [editorHeld, setEditorHeld] = useState<Set<number> | null>(null);
  useEffect(() => {
    if (scope.canSeeAllCompanies) return;
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, scope.userid)
      .then((resp) => {
        const j = resp.data;
        setEditorHeld(
          editorHeldGroupIds(j.error === 0 ? ((j.active ?? []) as BaseGroup[]) : []),
        );
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching your base groups " + err.message),
      );
  }, [scope.canSeeAllCompanies, scope.userid, ctx.url, ctx.token]);
  const mine = editorHeld ?? new Set<number>();
  /** Groups the person already holds, listed even when not the editor's. */
  const personHeld = useMemo(() => new Set(heldGroups.map((g) => g.id)), [heldGroups]);
  const mayChange = (id: number) => mayChangeGroup(id, scope.canSeeAllCompanies, mine);

  /**
   * Who may be handed what: a programmer may give any company; everyone else
   * only what is on their own account. Flattens `Company.id` and
   * `UserCompany.company`, which name the id differently.
   */
  const companyList = ctx.isProgrammer
    ? ctx.allCompanies.map((c) => ({ id: c.id, name: c.name }))
    : ctx.companies.map((c) => ({ id: c.company, name: c.name }));

  // Ticked groups plus any a ticked store implies: what Create saves.

  const held = heldGroupIds(picks);
  /** Held either way: ticked, or implied by a picked store. */
  const heldSet = new Set(held);

  const selectedStores = picks.stores;
  const onChange = (stores: SelectableStore[]) =>
    onPicksChange({ ...picks, stores });

  /**
   * A company or group ticked in its own right, not inferred from a store, so
   * ticking East means East, and a company with no stores can still be given.
   */
  const toggleIn = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const toggleCompanyPick = (id: number) =>
    onPicksChange({ ...picks, companies: toggleIn(picks.companies, id) });

  /**
   * Unticking a group drops its ticked stores too (a ticked store holds its
   * group). Ticking one while By store ticks its whole roster, as the mode
   * switch does; a single-store person gets no roster, they pick one store next.
   */
  const toggleGroupPick = (id: number) => {
    if (!mayChange(id)) return;
    const roster =
      picks.mode === "selected" && !singleStoreOnly
        ? (groupStores[id] ?? []).map((s) => ({ ...s, base_group: id }))
        : [];
    onPicksChange(toggleGroup(picks, id, roster));
  };

  const [activeCompany, setActiveCompany] = useState<number | null>(null);
  // Which groups are selected for viewing — drives the middle column's
  // highlight and which groups get a section in the stores column at all.
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  // Which groups' store lists are collapsed in the stores column: display
  // only, independent of expandedGroups and of what is held.
  const [collapsedSections, setCollapsedSections] = useState<Set<number>>(
    new Set(),
  );
  const [groupSearch, setGroupSearch] = useState("");
  const [storeSearch, setStoreSearch] = useState("");
  // The "Jump to selected" dropdown's value, reset to "" after each pick: a
  // scroll shortcut, not a filter.
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

  // Fetch every group's roster once its company is active, so the middle
  // column can show "X of Y" before any group is expanded.
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
    ? wizardGroups(
        companyGroups[activeCompany] ?? [],
        scope.canSeeAllCompanies,
        mine,
        personHeld,
      )
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
      picks.mode === "selected" &&
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
      <div className="flex-1 min-h-0 flex border border-line_hair rounded-lg overflow-hidden">
        {/* Companies */}
        <div
          className="flex flex-col border-r border-line_hair flex-shrink-0"
          style={{ width: 220 }}
        >
          <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
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
          className="flex flex-col border-r border-line_hair flex-shrink-0"
          style={{ width: 288 }}
        >
          <div className="px-3 py-2.5 border-b border-line_hair flex-shrink-0">
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
              const held = heldSet.has(group.id);
              const mode = picks.mode;
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

        {/* Stores for every expanded group */}
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
            {openGroups.map((group) => {
              const held = heldSet.has(group.id);
              const mode = picks.mode;
              // By group: no store is picked one at a time, so no checkboxes;
              // a held group shows all ticked, one opened to look a plain list.
              const preview = mode === "all";
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
                    className="sticky top-0 z-10 w-full flex items-center justify-between gap-2 px-3 py-1.5 bg-gray-50 border-b border-line_hair text-left hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`text-[10px] text-content/95 flex-shrink-0 transition-transform ${
                          isCollapsed ? "" : "rotate-90"
                        }`}
                      >
                        ▶
                      </span>
                      <span className="text-[11px] font-semibold text-content truncate">
                        {group.name}
                        {preview
                          ? total !== undefined
                            ? held
                              ? ` — all ${total}`
                              : ` — ${total} store${total === 1 ? "" : "s"}`
                            : ""
                          : ` — ${inGroup.length}${
                              total !== undefined ? ` of ${total}` : ""
                            }`}
                      </span>
                      {held && <GrantModeChip mode={mode} />}
                    </span>
                    {/* No Select all on a preview: there is nothing to select,
                        and the whole group is already the answer. */}
                    {!preview && !singleStoreOnly && mayChange(group.id) && (
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
                        <p className="text-[10.5px] text-content/95 leading-snug px-1 py-1.5">
                          {held
                            ? "Read only — this person has the whole group. Stores added to it later will appear for them automatically."
                            : "Viewing only. Tick the group to give them every store in it, or choose By store on the Access type step to pick stores one at a time."}
                        </p>
                      )}
                      {stores.map((s) => {
                        const isSelected = inGroup.some(
                          (sel) => sel.storeid === s.storeid,
                        );
                        return preview ? (
                          // Held: ticked and disabled, since every store is
                          // included. Not held: no box, nothing to tick.
                          <div
                            key={s.storeid}
                            className="flex items-center gap-2 py-1.5 px-1 text-[12px] text-content/95"
                          >
                            {held && (
                              <Checkbox
                                checked
                                disabled
                                onChange={() => undefined}
                                ariaLabel={`${s.store_name} is included automatically`}
                              />
                            )}
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
                              disabled={!mayChange(group.id)}
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
                        <div className="py-3 text-[11px] text-content/95 text-center">
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

        {rightColumn && (
          <div className="w-[300px] flex-shrink-0 border-l border-line_hair hidden xl:flex flex-col min-h-0">
            {rightColumn}
          </div>
        )}
      </div>

      {!hideEmptyNotice && (
        <div className="mt-2">
          <EmptyPicksNotice
            labels={emptyPicks.map(
              (id) => groupsById[id]?.name ?? `Group ${id}`,
            )}
          />
        </div>
      )}

      {!hideFooter && (
      <div className="bg-bkg rounded-lg px-3 py-2.5 mt-3 shadow-card-sm">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[12px] font-semibold text-content">
            {/* No company tally: a held group carries its own company. Review
                shows what is written. */}
            {held.length} base group
            {held.length === 1 ? "" : "s"}, {selectedStores.length}{" "}
            store{selectedStores.length === 1 ? "" : "s"} picked
          </span>
          <button
            // Clears the picks, not the access type. A group that isn't the
            // editor's stays as the person holds it.
            onClick={() =>
              onPicksChange({
                ...NO_PICKS,
                mode: picks.mode,
                baseGroups: picks.baseGroups.filter((id) => !mayChange(id)),
                stores: picks.stores.filter((s) => !mayChange(s.base_group)),
              })
            }
            className="text-[10.5px] text-brand_navy font-semibold hover:underline"
          >
            Clear all
          </button>
        </div>
        {held.length === 0 ? (
          <div className="text-[11.5px] text-content/95">
            Nothing selected yet
          </div>
        ) : (
          <div className="text-[11.5px] text-content/95 leading-relaxed max-h-[60px] overflow-y-auto thin-scrollbar">
            {held.map((id, i) => {
              const group = groupsById[id] ?? heldGroups.find((g) => g.id === id);
              const mode = picks.mode;
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
      )}
    </div>
  );
};

export default AccessPanel;
