import { useEffect, useRef, useState } from "react";
import { PlusIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import type { CompanyBaseGroup, JsonError, Store } from "../../../../interfaces";
import { getCompanies } from "../../../../api/company";
import { getBaseGroups, getAllStoresInBaseGroup, createBaseGroup } from "../../../../api/baseGroups";
import { assignBaseGroupToUser } from "../../../../api/team";
import {
  setCompanies,
  setRefresh,
  addAuthorizedBaseGroup,
} from "../../../../features/organizationSlice";
import TextFilter from "../../../../components/filters/TextFilter";
import SelectFilter from "../../../../components/filters/SelectFilter";
import BaseGroupDetail from "./BaseGroupDetail";
import type { StoreSplit } from "../types";

const NewGroupModal = ({
  companies,
  groupsByCompany,
  busy,
  onCompanySelect,
  onCreate,
  onClose,
}: {
  companies: { id: number; name: string }[];
  groupsByCompany: Record<number, CompanyBaseGroup[]>;
  busy: boolean;
  onCompanySelect: (companyId: number) => void;
  onCreate: (name: string, companyId: number) => void;
  onClose: () => void;
}) => {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");

  // A company's groups are only in state once it has been fetched, so
  // `undefined` means the request kicked off by onCompanySelect is still in
  // flight — that is the difference between "loading" and "no groups yet",
  // and showing an empty list for the former would read as "nothing is taken".
  const existing = companyId ? groupsByCompany[Number(companyId)] : [];
  const loading = companyId !== "" && existing === undefined;
  const names = existing ?? [];

  // Compared lowercased and trimmed, which is stricter than create_base_group's
  // own `where name=:name` check. Deliberate: these names are reused verbatim
  // as each user's store group name by assignments/share_bg_with_users, so two
  // groups differing only by case or padding would collide there.
  const matches = (a: string, b: string) =>
    a.trim().toLowerCase() === b.trim().toLowerCase();
  const taken = names.some((g) => matches(g.name, name));
  const canCreate =
    name.trim() !== "" && companyId !== "" && !loading && !taken && !busy;

  const handleCompanyChange = (value: string) => {
    setCompanyId(value);
    if (value) onCompanySelect(Number(value));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div className="bg-custom-white rounded-xl p-5 w-[300px] shadow-2xl">
        <div className="text-[14px] font-medium text-content mb-3">
          New base group
        </div>
        <div className="mb-2.5">
          <label className="text-[11px] text-content/85 block mb-1">
            Company
          </label>
          <SelectFilter
            options={companies.map((c) => ({
              label: c.name,
              value: String(c.id),
            }))}
            value={companyId}
            onChange={handleCompanyChange}
            placeholder="Choose a company"
            className="w-full"
          />
        </div>
        <div className="mb-2.5">
          <label className="text-[11px] text-content/85 block mb-1">
            Group name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Northeast"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
          {taken && (
            <div className="text-[11px] text-red-600 mt-1">
              That name is already used in this company
            </div>
          )}
        </div>

        {companyId !== "" && (
          <div className="mb-4">
            <div className="text-[11px] text-content/85 mb-1">
              {loading
                ? "Loading existing groups…"
                : `${names.length} existing group${names.length === 1 ? "" : "s"}`}
            </div>
            {!loading && names.length > 0 && (
              <div className="max-h-[7rem] overflow-y-auto thin-scrollbar border border-gray-100 rounded-md">
                {names.map((g) => (
                  <div
                    key={g.id}
                    className={`px-2 py-1 text-[11px] border-b border-gray-100 last:border-b-0 truncate ${
                      matches(g.name, name)
                        ? "bg-red-50 text-red-700 font-medium"
                        : "text-content"
                    }`}
                  >
                    {g.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={busy}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(name, Number(companyId))}
            disabled={!canCreate}
            className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {busy ? "Creating…" : "Create"}
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
  const [creating, setCreating] = useState(false);

  // DCR support staff need visibility across every client company, so (and
  // only so) they can fetch the full company directory. isDcrUser is derived
  // from ctx.companies — the login endpoint's own, already-scoped list — so
  // checking it never itself leaks anything; it just decides whether the
  // broader fetch below fires at all. Everyone else's companies come
  // straight from ctx.companies, with no separate all-companies request —
  // getBaseGroups/getAllStoresInBaseGroup take a bare companyId with no
  // server-side ownership check, so handing a non-DCR client ids for
  // companies they aren't assigned to would let them pull another company's
  // base groups/stores just by id.
  const isDcrUser = ctx.companies.some(
    (c) => c.company === 5 && c.name === "DCR",
  );

  // Which base groups this admin may open. DCR support staff administer client
  // groups they were never assigned to, so they keep access to all of them;
  // everyone else sees only the groups they hold. This is an affordance guard
  // that keeps admins out of groups they shouldn't be editing — not an access
  // boundary, since the endpoints behind it are unscoped.
  const isAuthorized = (groupId: number) =>
    isDcrUser || ctx.authorizedBaseGroupIds.includes(groupId);

  useEffect(() => {
    if (!isDcrUser || !ctx.companiesRefresh) return;
    getCompanies(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) ctx.dispatch(setCompanies(j.companies));
      })
      .catch((err: JsonError) => toast.error(err.message));
    ctx.dispatch(setRefresh(false));
  }, [isDcrUser, ctx.companiesRefresh]);

  const visibleCompanies = isDcrUser
    ? ctx.companyRecords
    : ctx.companies.map((c) => ({ id: c.company, name: c.name }));

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
        // get_base_groups raises "no groups returned" for a company that has
        // none, so an error is recorded as an empty list rather than left
        // undefined. Otherwise such a company never resolves, and the create
        // modal reads that as "still loading" forever with nothing to check a
        // new name against.
        setCompanyGroups((prev) => ({
          ...prev,
          [companyId]: j.error === 0 ? j.groups : [],
        }));
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => fetchingGroups.current.delete(companyId));
  };

  // A store record can come back with a null store_name — filter those out
  // before they reach BaseGroupDetail's search (AssignPanel), same fix as
  // StoresDirectory.tsx/NewStoreName.tsx.
  const validOnly = (list: Store[]) => list.filter((s) => s.store_name != null);

  const fetchStores = (groupId: number) => {
    getAllStoresInBaseGroup(ctx.url, ctx.token, groupId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setGroupStores((prev) => ({
            ...prev,
            [groupId]: {
              assigned: validOnly(j.assigned_stores),
              unassigned: validOnly(j.unassigned_stores),
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
    if (!isAuthorized(group.id)) return;
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
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Base group name is required");
      return;
    }
    if (!companyId) {
      toast.error("Choose a company");
      return;
    }
    const existing = companyGroups[companyId];
    if (
      existing?.some(
        (g) => g.name.trim().toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("A base group with that name already exists");
      return;
    }
    // Sent trimmed on purpose: the name is reused verbatim as each user's
    // store group name by assignments/share_bg_with_users, which matches it
    // exactly — a stray space would create a store group nothing can find.
    setCreating(true);
    createBaseGroup(ctx.url, ctx.token, trimmed, companyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          setCreating(false);
          toast.error(j.msg || "Could not create base group");
          return;
        }
        fetchGroups(companyId);
        setExpandedCompanies((prev) => new Set(prev).add(companyId));

        // create_base_group returns the row it just inserted, and base_groups
        // is exactly (id, name, company) — the same shape as CompanyBaseGroup
        // — so the new group is selected straight from the create response
        // rather than waiting on the refetch above.
        const created: CompanyBaseGroup | undefined = j.record?.[0];
        if (!created) {
          setCreating(false);
          setShowNewGroupModal(false);
          toast.success("Base group created");
          return;
        }

        // The creator is assigned to their own group straight away: an
        // unauthorized group can't be opened, so without this the admin would
        // be locked out of the group they just made.
        assignBaseGroupToUser(ctx.url, ctx.token, ctx.userid, [created.id])
          .then((assignResp) => {
            setCreating(false);
            setShowNewGroupModal(false);
            if (assignResp.data.error === 0) {
              ctx.dispatch(addAuthorizedBaseGroup(created.id));
              setSelectedGroup(created);
              fetchStores(created.id);
              toast.success("Base group created");
            } else {
              toast.warn(
                "Base group created, but could not be assigned to you: " +
                  (assignResp.data.msg || "unknown error"),
              );
            }
          })
          .catch((err: JsonError) => {
            setCreating(false);
            setShowNewGroupModal(false);
            toast.warn(
              "Base group created, but could not be assigned to you: " +
                err.message,
            );
          });
      })
      .catch((err: JsonError) => {
        setCreating(false);
        toast.error(err.message);
      });
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
    <div className="flex-1 flex min-h-0 w-full">
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

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 thin-scrollbar">
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
                      // Unauthorized groups stay visible rather than hidden:
                      // their names are still reserved, so hiding them would
                      // turn create_base_group's duplicate-name rejection into
                      // an error pointing at nothing.
                      if (!isAuthorized(g.id)) {
                        return (
                          <div
                            key={g.id}
                            title="You are not assigned to this base group"
                            className="w-full flex items-center gap-1.5 pl-6 pr-3 py-2 bg-gray-50 text-content/75 cursor-not-allowed"
                          >
                            <span className="text-[12px] font-medium flex-1 truncate">
                              {g.name}
                            </span>
                            <span className="text-[10px] italic flex-shrink-0">
                              Unauthorized
                            </span>
                          </div>
                        );
                      }
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

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {!selectedGroup || !isAuthorized(selectedGroup.id) ? (
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
          groupsByCompany={companyGroups}
          busy={creating}
          onCompanySelect={(companyId) => {
            if (!companyGroups[companyId]) fetchGroups(companyId);
          }}
          onCreate={handleCreateGroup}
          onClose={() => setShowNewGroupModal(false)}
        />
      )}
    </div>
  );
};

export default BaseGroups;
