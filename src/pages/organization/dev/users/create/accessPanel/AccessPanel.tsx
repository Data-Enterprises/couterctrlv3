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
import { reasonOf } from "../../../../../../utils/serverError";
import { filterGroupsBySearch, filterOpenGroups, toggleIn } from "./utils";

// Interfaces
import type { AccessPicks, SelectableStore } from "../../interfaces";
import type {
  BaseGroup,
  CompanyBaseGroup,
  JsonError,
  Store,
} from "../../../../../../interfaces";

// Components
import EmptyPicksNotice from "./components/EmptyPicksNotice";
import CompanyColumn from "./components/CompanyColumn";
import BaseGroupColumn from "./components/BaseGroupColumn";
import StoreColumn from "./components/StoreColumn";

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
          editorHeldGroupIds(
            j.error === 0 ? ((j.active ?? []) as BaseGroup[]) : [],
          ),
        );
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching your base groups " + err.message),
      );
  }, [scope.canSeeAllCompanies, scope.userid, ctx.url, ctx.token]);
  const mine = editorHeld ?? new Set<number>();
  /** Groups the person already holds, listed even when not the editor's. */
  const personHeld = useMemo(
    () => new Set(heldGroups.map((g) => g.id)),
    [heldGroups],
  );
  const mayChange = (id: number) =>
    mayChangeGroup(id, scope.canSeeAllCompanies, mine);

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
  const [groupSearch, setGroupSearch] = useState<string>("");

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
      .catch((err) => toast.error(reasonOf(err)));
  };

  const selectCompany = (companyId: number) => {
    setActiveCompany(companyId);
    setGroupSearch("");
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

  const groupsInActiveCompany = activeCompany
    ? wizardGroups(
        companyGroups[activeCompany] ?? [],
        scope.canSeeAllCompanies,
        mine,
        personHeld,
      )
    : [];

  const filteredGroups = filterGroupsBySearch(
    groupsInActiveCompany,
    groupSearch,
  );
  const openGroups = filterOpenGroups(groupsInActiveCompany, expandedGroups);

  /** Held groups set to pick stores with nothing picked. The server answers
   *  400 for these, so they are named on screen before the save is tried. */
  const emptyPicks = picks.baseGroups.filter(
    (id) =>
      picks.mode === "selected" &&
      !selectedStores.some((s) => s.base_group === id),
  );

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 flex border border-line_hair rounded-lg overflow-hidden">
        <CompanyColumn
          companies={companyList}
          picks={picks}
          activeCompany={activeCompany}
          selectCompany={selectCompany}
          toggleCompanyPick={toggleCompanyPick}
        />

        {/* Base groups in the active company */}
        <BaseGroupColumn
          activeCompany={activeCompany}
          companyName={companyName}
          groupSearch={groupSearch}
          setGroupSearch={setGroupSearch}
          expandedGroups={expandedGroups}
          filteredGroups={filteredGroups}
          groupsInActiveCompany={groupsInActiveCompany}
          heldSet={heldSet}
          mode={picks.mode}
          selectedStores={selectedStores}
          groupStores={groupStores}
          mayChange={mayChange}
          toggleGroupPick={toggleGroupPick}
          toggleGroupExpand={toggleGroupExpand}
        />

        <StoreColumn
          openGroups={openGroups}
          heldSet={heldSet}
          mode={picks.mode}
          selectedStores={selectedStores}
          groupStores={groupStores}
          singleStoreOnly={singleStoreOnly}
          mayChange={mayChange}
          onToggleStore={toggleStore}
          onSelectAll={handleSelectAllForGroup}
        />

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
              {held.length === 1 ? "" : "s"}, {selectedStores.length} store
              {selectedStores.length === 1 ? "" : "s"} picked
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
                const group =
                  groupsById[id] ?? heldGroups.find((g) => g.id === id);
                const mode = picks.mode;
                const count = selectedStores.filter(
                  (s) => s.base_group === id,
                ).length;
                return (
                  <span key={id}>
                    {i > 0 && "; "}
                    {companyName(group?.company ?? 0)}:{" "}
                    {group?.name ?? `#${id}`}{" "}
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
