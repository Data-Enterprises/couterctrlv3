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
import PicksSummary from "./components/PicksSummary";

interface AccessPanelProps {
  picks: AccessPicks;
  onPicksChange: (next: AccessPicks) => void;
  companyGroups: Record<number, CompanyBaseGroup[]>;
  onCompanyGroupsChange: (
    updater: (
      prev: Record<number, CompanyBaseGroup[]>,
    ) => Record<number, CompanyBaseGroup[]>,
  ) => void;
  /** One store in total. The server refuses whole groups for this role, so
   *  `mode` is never `all` here. */
  singleStoreOnly?: boolean;
  /** Each group's roster, lifted so the caller can count an `all` grant and
   *  Review doesn't fetch it again. */
  groupStores: Record<number, Store[]>;
  onGroupStoresChange: (
    updater: (prev: Record<number, Store[]>) => Record<number, Store[]>,
  ) => void;
  /** An extra column in the card: Edit user's effective stores. */
  rightColumn?: ReactNode;
  /** For a caller with its own footer and Save button. */
  hideFooter?: boolean;
  /** For a caller that shows its own notice higher up. */
  hideEmptyNotice?: boolean;
  /** Edit: the groups the person holds, so the summary can name them before
   *  their company is opened. */
  heldGroups?: BaseGroup[];
}

/**
 * Who a person can reach: companies, then the active company's base groups,
 * then the stores of every group opened. `picks.mode`, from the Access type
 * step, applies to every group: By group (`all`) gives the whole group,
 * including stores added later, and the stores are read-only; By store
 * (`selected`) gives only what is ticked.
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

  /** The groups the editor holds: below level 9 (and DCR support), the only
   *  ones they may hand out. Null until read, so nothing is changeable yet. */
  const [editorHeld, setEditorHeld] = useState<Set<number> | null>(null);
  const [activeCompany, setActiveCompany] = useState<number | null>(null);
  // Groups opened in the middle column; each gets a section of stores.
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [groupSearch, setGroupSearch] = useState<string>("");

  /** A programmer may give any company, everyone else only their own. The two
   *  lists name the id differently (`id`, `company`). */
  const companyList = useMemo(
    () =>
      ctx.isProgrammer
        ? ctx.allCompanies.map((c) => ({ id: c.id, name: c.name }))
        : ctx.companies.map((c) => ({ id: c.company, name: c.name })),
    [ctx.isProgrammer, ctx.allCompanies, ctx.companies],
  );
  /** Groups the person already holds, listed even when not the editor's. */
  const personHeld = useMemo(
    () => new Set(heldGroups.map((g) => g.id)),
    [heldGroups],
  );
  const groupsById = useMemo(() => {
    const map: Record<number, CompanyBaseGroup> = {};
    Object.values(companyGroups)
      .flat()
      .forEach((g) => {
        map[g.id] = g;
      });
    return map;
  }, [companyGroups]);

  // The editor's own groups; a level 9 or DCR support editor may give any.
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

  // Opens on the first company.
  useEffect(() => {
    if (companyList.length > 0 && activeCompany === null) {
      selectCompany(companyList[0].id);
    }
  }, [companyList.length]);

  // Every roster as soon as its company opens, so the middle column can show
  // "X of Y" before a group is opened.
  useEffect(() => {
    if (!activeCompany) return;
    const groups = companyGroups[activeCompany];
    if (!groups) return;
    groups.forEach((g) => {
      if (!groupStores[g.id]) fetchStoresForGroup(g.id);
    });
  }, [activeCompany, companyGroups]);

  const mine = editorHeld ?? new Set<number>();
  const mayChange = (id: number) =>
    mayChangeGroup(id, scope.canSeeAllCompanies, mine);

  // Ticked groups plus any a ticked store implies: what Create saves.
  const held = heldGroupIds(picks);
  const heldSet = new Set(held);

  const selectedStores = picks.stores;
  const onChange = (stores: SelectableStore[]) =>
    onPicksChange({ ...picks, stores });

  const toggleCompanyPick = (id: number) =>
    onPicksChange({ ...picks, companies: toggleIn(picks.companies, id) });

  /** Unticking a group drops its stores too. Ticking one in By store ticks its
   *  whole roster, except for a single-store person, who picks one store next. */
  const toggleGroupPick = (id: number) => {
    if (!mayChange(id)) return;
    const roster =
      picks.mode === "selected" && !singleStoreOnly
        ? (groupStores[id] ?? []).map((s) => ({ ...s, base_group: id }))
        : [];
    onPicksChange(toggleGroup(picks, id, roster));
  };

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

  // Some stores come back with no name; drop them before the search sees them.
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
    // One store in total: the server refuses more, so replace rather than add.
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

  // Clears the picks, not the access type; groups that aren't the editor's
  // stay as they are.
  const clearPicks = () =>
    onPicksChange({
      ...NO_PICKS,
      mode: picks.mode,
      baseGroups: picks.baseGroups.filter((id) => !mayChange(id)),
      stores: picks.stores.filter((s) => !mayChange(s.base_group)),
    });

  /** By store groups with no store picked: the server refuses them, so they
   *  are named before the save. */
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
        <PicksSummary
          held={held}
          selectedStores={selectedStores}
          mode={picks.mode}
          groupsById={groupsById}
          heldGroups={heldGroups}
          companyName={companyName}
          onClearAll={clearPicks}
        />
      )}
    </div>
  );
};

export default AccessPanel;
