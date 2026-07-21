import { useEffect, useRef, useState } from "react";
import { PlusIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { CompanyBaseGroup, JsonError } from "../../../interfaces";
import { getCompanies } from "../../../api/company";
import { getBaseGroups, getAllStoresInBaseGroup, createBaseGroup } from "../../../api/baseGroups";
import { setCompanies, setRefresh } from "../../../features/organizationSlice";
import TextFilter from "../../../components/filters/TextFilter";
import SelectFilter from "../../../components/filters/SelectFilter";
import BaseGroupDetail from "./BaseGroupDetail";
import type { StoreSplit } from "../types";

const NewGroupModal = ({
  companies,
  onCreate,
  onClose,
}: {
  companies: { id: number; name: string }[];
  onCreate: (name: string, companyId: number) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[300px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          New base group
        </div>
        <div className="mb-2.5">
          <label className="text-[11px] text-content/60 block mb-1">
            Group name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northeast"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
        </div>
        <div className="mb-4">
          <label className="text-[11px] text-content/60 block mb-1">
            Company
          </label>
          <SelectFilter
            options={companies.map((c) => ({
              label: c.name,
              value: String(c.id),
            }))}
            value={companyId}
            onChange={setCompanyId}
            placeholder="Choose a company"
            className="w-full"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, Number(companyId))}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

const BaseGroups = () => {
  const ctx = useOrganizationCtx();
  const toast = useToast();

  const [expandedCompanies, setExpandedCompanies] = useState<Set<number>>(
    new Set(),
  );
  const [companyGroups, setCompanyGroups] = useState<
    Record<number, CompanyBaseGroup[]>
  >({});
  const [groupStores, setGroupStores] = useState<Record<number, StoreSplit>>(
    {},
  );
  const [selectedGroup, setSelectedGroup] = useState<CompanyBaseGroup | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  useEffect(() => {
    if (!ctx.companiesRefresh) return;
    getCompanies(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) ctx.dispatch(setCompanies(j.companies));
      })
      .catch((err: JsonError) => toast.error(err.message));
    ctx.dispatch(setRefresh(false));
  }, [ctx.companiesRefresh]);

  const isDcrUser = ctx.companies.some(
    (c) => c.company === 5 && c.name === "DCR",
  );
  const visibleCompanies = isDcrUser
    ? ctx.companyRecords
    : ctx.companyRecords.filter((c) =>
        ctx.companies.some((uc) => uc.company === c.id),
      );

  // Guards against the search-triggered "expand every company" effect below
  // firing a duplicate request for a company whose first request is still
  // in flight (e.g. clearing and re-typing a search quickly).
  const fetchingGroups = useRef<Set<number>>(new Set());

  const fetchGroups = (companyId: number) => {
    if (fetchingGroups.current.has(companyId)) return;
    fetchingGroups.current.add(companyId);
    getBaseGroups(ctx.url, ctx.token, companyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setCompanyGroups((prev) => ({ ...prev, [companyId]: j.groups }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => fetchingGroups.current.delete(companyId));
  };

  const fetchStores = (groupId: number) => {
    getAllStoresInBaseGroup(ctx.url, ctx.token, groupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setGroupStores((prev) => ({
            ...prev,
            [groupId]: {
              assigned: j.assigned_stores,
              unassigned: j.unassigned_stores,
            },
          }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const toggleCompany = (companyId: number) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
        if (!companyGroups[companyId]) fetchGroups(companyId);
      }
      return next;
    });
  };

  const selectGroup = (group: CompanyBaseGroup) => {
    setSelectedGroup(group);
    if (!groupStores[group.id]) fetchStores(group.id);
  };

  const handleGroupDeleted = () => {
    if (selectedGroup) fetchGroups(selectedGroup.company);
    setSelectedGroup(null);
  };

  const handleGroupRenamed = (newName: string) => {
    if (!selectedGroup) return;
    setSelectedGroup({ ...selectedGroup, name: newName });
    setCompanyGroups((prev) => {
      const groups = prev[selectedGroup.company];
      if (!groups) return prev;
      return {
        ...prev,
        [selectedGroup.company]: groups.map((g) =>
          g.id === selectedGroup.id ? { ...g, name: newName } : g,
        ),
      };
    });
  };

  const handleCreateGroup = (name: string, companyId: number) => {
    if (!name.trim()) {
      toast.error("Base group name is required");
      return;
    }
    if (!companyId) {
      toast.error("Choose a company");
      return;
    }
    const existing = companyGroups[companyId];
    if (
      existing?.some((g) => g.name.toLowerCase() === name.trim().toLowerCase())
    ) {
      toast.error("A base group with that name already exists");
      return;
    }
    createBaseGroup(ctx.url, ctx.token, name, companyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group created");
          setShowNewGroupModal(false);
          fetchGroups(companyId);
          setExpandedCompanies((prev) => new Set(prev).add(companyId));
        } else {
          toast.error(j.msg || "Could not create base group");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const searching = search.trim().length > 0;
  const matchedGroups = (companyId: number) => {
    const groups = companyGroups[companyId] ?? [];
    if (!searching) return groups;
    return groups.filter((g) =>
      g.name.toLowerCase().includes(search.toLowerCase()),
    );
  };

  // Search should surface matches regardless of collapse state — fetch and
  // expand every company while a search is active, restore manual state after.
  useEffect(() => {
    if (!searching) return;
    visibleCompanies.forEach((c) => {
      if (!companyGroups[c.id]) fetchGroups(c.id);
    });
  }, [searching]);

  const companyName = (id: number) =>
    visibleCompanies.find((c) => c.id === id)?.name ?? "";

  return (
    <div className="flex-1 flex min-h-0 w-[860px]">
      <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-gray-100 flex gap-1.5">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search base groups…"
            className="flex-1"
          />
          <button
            onClick={() => setShowNewGroupModal(true)}
            title="New base group"
            aria-label="New base group"
            className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[480px] p-2 space-y-1.5 thin-scrollbar">
          {visibleCompanies.length === 0 && (
            <div className="p-3 text-[11px] text-content">No companies</div>
          )}
          {visibleCompanies.map((c) => {
            const groups = matchedGroups(c.id);
            if (searching && groups.length === 0) return null;
            const isOpen = searching || expandedCompanies.has(c.id);
            const total = companyGroups[c.id]?.length;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-gray-100 overflow-hidden"
              >
                <button
                  onClick={() => toggleCompany(c.id)}
                  className="w-full flex items-center gap-2 bg-[#1e2a4a]/5 hover:bg-[#1e2a4a]/10 pl-3 pr-3 py-2 transition-colors"
                >
                  <ChevronRightIcon
                    className="w-3 h-3 text-[#1e2a4a]/60 flex-shrink-0 transition-transform"
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                  <span className="text-[12px] font-semibold text-[#1e2a4a] flex-1 text-left truncate">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-[#1e2a4a]/55 flex-shrink-0">
                    {total !== undefined ? `${total} groups` : ""}
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-gray-100">
                    {groups.map((g) => {
                      const isSel = selectedGroup?.id === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => selectGroup(g)}
                          style={
                            isSel
                              ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                              : undefined
                          }
                          className={`w-full flex flex-col items-start pl-6 pr-3 py-2 text-left transition-colors ${
                            isSel ? "bg-custom-white" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-[12px] font-medium text-content">
                            {g.name}
                          </span>
                          {/* <span className="text-[10.5px] text-content/50">
                            {groupStores[g.id]
                              ? `${groupStores[g.id].assigned.length} stores`
                              : ""}
                          </span> */}
                        </button>
                      );
                    })}
                    {groups.length === 0 && (
                      <div className="pl-6 py-1.5 text-[11px] text-content/60">
                        No base groups
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4 min-h-[520px] max-h-[520px]">
        {!selectedGroup ? (
          <div className="flex items-center justify-center h-full text-[12px] text-content">
            Select a base group
          </div>
        ) : (
          <BaseGroupDetail
            group={selectedGroup}
            companyName={companyName(selectedGroup.company)}
            stores={groupStores[selectedGroup.id]}
            onRefetchStores={() => fetchStores(selectedGroup.id)}
            onDeleted={handleGroupDeleted}
            onRenamed={handleGroupRenamed}
          />
        )}
      </div>

      {showNewGroupModal && (
        <NewGroupModal
          companies={visibleCompanies}
          onCreate={handleCreateGroup}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}
    </div>
  );
};

export default BaseGroups;
