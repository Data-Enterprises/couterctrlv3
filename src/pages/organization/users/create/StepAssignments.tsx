import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getBaseGroups, getAllStoresInBaseGroup } from "../../../../api/baseGroups";
import type { CompanyBaseGroup, JsonError, Store } from "../../../../interfaces";
import type { SelectableStore } from "../../types";
import TextFilter from "../../../../components/filters/TextFilter";

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

// Merges the old separate Access (company + base group picker) and Stores
// steps into one screen — company chips at top, base groups as an accordion
// directly below. Expanding a base group is the same API call that used to
// be gated behind picking it in Access; there's no longer a hard step
// boundary between "pick a group" and "pick its stores." companyGroups is
// lifted up to CreateUserWizard so Review can resolve base group names too.
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
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(
    new Set(),
  );
  const [groupStores, setGroupStores] = useState<Record<number, Store[]>>({});
  const [storeSearch, setStoreSearch] = useState<Record<number, string>>({});
  const [groupSearch, setGroupSearch] = useState("");

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
    if (!companyGroups[companyId]) fetchGroupsForCompany(companyId);
  };

  const fetchStoresForGroup = (groupId: number): Promise<Store[]> => {
    if (groupStores[groupId]) return Promise.resolve(groupStores[groupId]);
    return getAllStoresInBaseGroup(ctx.url, ctx.token, groupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setGroupStores((prev) => ({ ...prev, [groupId]: j.assigned_stores }));
          return j.assigned_stores as Store[];
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
      if (next.has(group.id)) {
        next.delete(group.id);
      } else {
        next.add(group.id);
        if (!groupStores[group.id]) fetchStoresForGroup(group.id);
      }
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
        .filter(
          (s) => !inGroup.some((sel) => sel.storeid === s.storeid),
        )
        .map((s) => ({ ...s, base_group: group.id }));
      onChange([...selectedStores.filter((s) => s.base_group !== group.id), ...inGroup, ...toAdd]);
    }
  };

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

  return (
    <div className="max-w-[480px]">
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5">
        Company
      </div>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ctx.companies.map((c) => (
          <button
            key={c.id}
            onClick={() => selectCompany(c.company)}
            className={`text-[11px] px-3 py-1 rounded-full ${
              activeCompany === c.company
                ? "bg-[#1e2a4a] text-custom-white"
                : "bg-custom-white border border-gray-200 text-content"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-content/60 mb-1.5">
        Base groups {activeCompany ? `in ${companyName(activeCompany)}` : ""}
      </div>
      <TextFilter
        value={groupSearch}
        onChange={setGroupSearch}
        placeholder="Search base groups…"
        className="mb-1.5"
      />
      <div className="border border-gray-100 rounded-lg overflow-y-auto max-h-[280px] mb-4">
        {(activeCompany ? companyGroups[activeCompany] : [])
          ?.filter((g) => g.name.toLowerCase().includes(groupSearch.toLowerCase()))
          .map((group) => {
          const isOpen = expandedGroups.has(group.id);
          const inGroup = selectedStores.filter(
            (s) => s.base_group === group.id,
          );
          const total = groupStores[group.id]?.length;
          const search = storeSearch[group.id] ?? "";
          const filteredStores = (groupStores[group.id] ?? []).filter((s) =>
            s.store_name.toLowerCase().includes(search.toLowerCase()),
          );
          return (
            <div key={group.id} className="border-b border-gray-100 last:border-b-0">
              <div
                onClick={() => toggleGroupExpand(group)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-50"
              >
                <span
                  className={`text-[10px] text-content/50 transition-transform inline-block ${isOpen ? "rotate-90" : ""}`}
                >
                  ▶
                </span>
                <span className="text-[12.5px] font-medium text-content flex-1">
                  {group.name}
                </span>
                <span className="text-[10.5px] text-content/50">
                  {total !== undefined
                    ? `${inGroup.length}/${total} selected`
                    : ""}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectAllForGroup(group);
                  }}
                  className="text-[10.5px] text-blue-700 font-medium flex-shrink-0"
                >
                  Select all
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-gray-100 px-3 py-2">
                  <TextFilter
                    value={search}
                    onChange={(v) =>
                      setStoreSearch((prev) => ({ ...prev, [group.id]: v }))
                    }
                    placeholder={
                      total !== undefined
                        ? `Search ${total} stores…`
                        : "Search stores…"
                    }
                    className="mb-1.5"
                  />
                  <div className="max-h-40 overflow-y-auto thin-scrollbar">
                    {filteredStores.map((s) => {
                      const isSelected = inGroup.some(
                        (sel) => sel.storeid === s.storeid,
                      );
                      return (
                        <label
                          key={s.storeid}
                          className="flex items-center gap-2 py-1 text-[12px] text-content cursor-pointer"
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
                      <div className="py-3 text-[11px] text-content/60">
                        Loading…
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {activeCompany && (companyGroups[activeCompany]?.length ?? 0) === 0 && (
          <div className="flex items-center justify-center py-6 text-[11px] text-content">
            No base groups for this company
          </div>
        )}
        {activeCompany &&
          (companyGroups[activeCompany]?.length ?? 0) > 0 &&
          companyGroups[activeCompany]?.filter((g) =>
            g.name.toLowerCase().includes(groupSearch.toLowerCase()),
          ).length === 0 && (
            <div className="flex items-center justify-center py-6 text-[11px] text-content">
              No base groups match
            </div>
          )}
      </div>

      <div className="bg-gray-50 rounded-lg px-3 py-2.5 mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[12px] font-semibold text-content">
            Selected — {selectedStores.length} stores
          </span>
          <button
            onClick={() => onChange([])}
            className="text-[10.5px] text-blue-700 font-medium"
          >
            Clear all
          </button>
        </div>
        {rollup.map((r) => (
          <div
            key={r.groupId}
            className="flex justify-between text-[11.5px] text-content/70 py-0.5"
          >
            <span>
              {r.groupName}{" "}
              <span className="text-content/40">
                · {companyName(r.companyId ?? 0)}
              </span>
            </span>
            <span>
              {r.count}/{r.total}
            </span>
          </div>
        ))}
        {rollup.length === 0 && (
          <div className="text-[11.5px] text-content/50">
            Nothing selected yet
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
