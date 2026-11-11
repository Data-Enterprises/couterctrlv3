// Hooks
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useBaseGroupCompanies, useBaseGroupsCtx } from "../hooks";

// API
import { getAllUsers } from "../../../../api/user";
import {
  assignBaseGroupToUser,
  getBaseGroupsAssignedToUser,
} from "../../../../api/team";
import {
  getBaseGroups,
  getAllStoresInBaseGroup,
  createBaseGroup,
} from "../../../../api/baseGroups";

// Utils
import {
  companiesWithHeldGroups,
  heldGroupIds,
  visibleCompanyList,
  visibleGroups,
} from "../utils";

// Interfaces
import type { StoreSplit } from "./interfaces";
import type {
  BaseGroup,
  CompanyBaseGroup,
  JsonError,
  Store,
  User,
} from "../../../../interfaces";

// Components
import { PlusIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import BaseGroupDetail from "./components/BaseGroupDetail";
import NewGroupModal from "./components/NewGroupModal";

/**
 * User Management > Base Groups (owner level and up): create, rename and delete base groups, and assign
 * stores and users to them. Access only — see `useBaseGroupsCtx`.
 */
const BaseGroups = () => {
  const ctx = useBaseGroupsCtx();
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
  const [users, setUsers] = useState<User[]>([]);
  /** Which base groups the signed-in person holds. Empty and unused for
   *  anyone who sees everything — see the fetch below. */
  const [myGroups, setMyGroups] = useState<BaseGroup[]>([]);

  const allCompanies = useBaseGroupCompanies();

  /**
   * The groups the viewer holds: holding a company is not enough to administer
   * every group in it. Not fetched for someone who sees everything.
   */
  const loadMyGroups = useCallback(() => {
    if (ctx.canSeeAllCompanies) return;
    getBaseGroupsAssignedToUser(ctx.url, ctx.token, ctx.userid)
      .then((resp) => {
        const j = resp.data;
        // The held half. `inactive` is every other group in their companies.
        setMyGroups(j.error === 0 ? ((j.active ?? []) as BaseGroup[]) : []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching your base groups " + err.message),
      );
  }, [ctx.canSeeAllCompanies, ctx.url, ctx.token, ctx.userid]);
  useEffect(loadMyGroups, [loadMyGroups]);

  /** A create is running: the modal's Create waits for it. */
  const [creating, setCreating] = useState(false);
  /**
   * A group just created by someone who doesn't see everything: the list shows
   * only held groups, so say where it went and offer to hold it.
   */
  const [created, setCreated] = useState<{
    id: number;
    name: string;
    company: number;
  } | null>(null);
  const [claiming, setClaiming] = useState(false);

  /** Hold the group just created, By group, so it is listed and fillable. */
  const claimCreated = () => {
    if (!created || claiming) return;
    setClaiming(true);
    assignBaseGroupToUser(ctx.url, ctx.token, ctx.userid, [created.id], "all")
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Could not assign it to you");
          return;
        }
        toast.success(`${created.name} is yours to fill`);
        setCreated(null);
        loadMyGroups();
        fetchGroups(created.company);
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setClaiming(false));
  };

  const held = useMemo(() => heldGroupIds(myGroups), [myGroups]);
  const heldCompanies = useMemo(
    () => companiesWithHeldGroups(myGroups),
    [myGroups],
  );

  /** A company whose every group belongs to somebody else is a row that opens
   *  onto nothing, so it is not listed. */
  const visibleCompanies = useMemo(
    () => visibleCompanyList(allCompanies, ctx.canSeeAllCompanies, heldCompanies),
    [allCompanies, ctx.canSeeAllCompanies, heldCompanies],
  );

  // The Users sub-tab picks from these. Fetched here rather than borrowed from
  // User Management, so the tab works on a session that never opened it.
  useEffect(() => {
    getAllUsers(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setUsers(j.users ?? []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching users " + err.message),
      );
  }, [ctx.url, ctx.token]);

  // Stops the search's "expand every company" effect asking again for a
  // company whose first request is still in flight.
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

  // A store record can come back with a null store_name — filter those out
  // before they reach BaseGroupDetail's search (AssignPanel).
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
    if (creating) return;
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
    // The server refuses a name the company already has ("Group already
    // exists"), so a company whose groups aren't loaded here is still checked.
    setCreating(true);
    createBaseGroup(ctx.url, ctx.token, name, companyId)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Base group created");
          setShowNewGroupModal(false);
          fetchGroups(companyId);
          setExpandedCompanies((prev) => new Set(prev).add(companyId));
          if (!ctx.canSeeAllCompanies && typeof j.id === "number") {
            setCreated({ id: j.id, name: name.trim(), company: companyId });
          }
        } else {
          toast.error(j.msg || "Could not create base group");
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setCreating(false));
  };

  const searching = search.trim().length > 0;
  const matchedGroups = (companyId: number) => {
    const groups = visibleGroups(
      companyGroups[companyId] ?? [],
      ctx.canSeeAllCompanies,
      held,
    );
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
      <div data-help="base-groups" className="w-72 border-r border-line_hair flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-line_hair flex gap-1.5">
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
            className="w-7 h-7 flex-shrink-0 rounded-md border border-line_strong border-dashed text-blue-700 flex items-center justify-center hover:bg-fill_soft"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {created && (
          <div
            role="status"
            className="m-2 mb-0 px-2.5 py-2 rounded-lg bg-filter_active border border-filter_active_border text-[11.5px] text-content leading-snug flex-shrink-0"
          >
            <span className="font-semibold">{created.name}</span> was created.
            You don’t hold it yet, so it isn’t listed for you and you can’t
            fill it. Hold it to fill it:
            <div className="flex items-center gap-2 mt-1.5">
              <button
                onClick={claimCreated}
                disabled={claiming}
                className="text-[11.5px] font-medium px-2.5 py-1 rounded-md bg-brand_navy text-custom-white hover:bg-brand_navy_hover disabled:opacity-50"
              >
                {claiming ? "Assigning…" : "Assign it to me"}
              </button>
              <button
                onClick={() => setCreated(null)}
                className="text-[11.5px] font-medium text-content/95 hover:underline"
              >
                Not now
              </button>
            </div>
          </div>
        )}

        <div className="cc-scroll p-2 space-y-1.5">
          {visibleCompanies.length === 0 && (
            <div className="p-3 text-[11px] text-content">No companies</div>
          )}
          {visibleCompanies.map((c) => {
            const groups = matchedGroups(c.id);
            if (searching && groups.length === 0) return null;
            const isOpen = searching || expandedCompanies.has(c.id);
            // Counts what the reader can actually open, not what the company
            // holds — "12 groups" above two rows is a list that looks broken.
            const total = companyGroups[c.id]
              ? visibleGroups(companyGroups[c.id], ctx.canSeeAllCompanies, held)
                  .length
              : undefined;
            return (
              <div
                key={c.id}
                className="rounded-lg border border-line_hair overflow-hidden"
              >
                <button
                  onClick={() => toggleCompany(c.id)}
                  className="w-full flex items-center gap-2 bg-brand_navy/5 hover:bg-brand_navy/10 pl-3 pr-3 py-2 transition-colors"
                >
                  <ChevronRightIcon
                    className="w-3 h-3 text-brand_navy/95 flex-shrink-0 transition-transform"
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                  />
                  <span className="text-[12px] font-semibold text-brand_navy flex-1 text-left truncate">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-brand_navy/95 flex-shrink-0">
                    {total !== undefined ? `${total} groups` : ""}
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-line_hair">
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
                            isSel ? "bg-custom-white" : "hover:bg-fill_soft"
                          }`}
                        >
                          <span className="text-[12px] font-medium text-content">
                            {g.name}
                          </span>
                        </button>
                      );
                    })}
                    {groups.length === 0 && (
                      <div className="pl-6 py-1.5 text-[11px] text-content/95">
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
        {!selectedGroup ? (
          <div className="flex items-center justify-center h-full text-[12px] text-content">
            Select a base group
          </div>
        ) : (
          <BaseGroupDetail
            group={selectedGroup}
            companyName={companyName(selectedGroup.company)}
            stores={groupStores[selectedGroup.id]}
            users={users}
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
          busy={creating}
        />
      )}
    </div>
  );
};

export default BaseGroups;
