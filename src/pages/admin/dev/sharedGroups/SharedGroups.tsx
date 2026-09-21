import { useEffect, useRef, useState } from "react";
import { PlusIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { createSharedGroup, getSharedGroups } from "../../../../api/sharedGroups";
import type { SharedGroup, SharedGroupsResp } from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SharedGroupDetail from "./SharedGroupDetail";
import NewSharedGroupModal from "./NewSharedGroupModal";
import { errorText, useSharedGroupsCtx } from "./hooks";

/**
 * Admin > Shared Groups, on the shared_groups router.
 *
 * Laid out like Base Groups — companies down the left, a group's detail on the
 * right — because the two are managed side by side. They are different
 * things: a base group grants access to stores; a shared group is a search
 * filter handed to other users, and never grants or revokes anything.
 */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();

  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [companyGroups, setCompanyGroups] = useState<Record<number, SharedGroup[]>>({});
  const [selected, setSelected] = useState<{ id: number; company: number } | null>(null);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const fetching = useRef<Set<number>>(new Set());

  const fetchGroups = (company: number) => {
    if (fetching.current.has(company)) return;
    fetching.current.add(company);
    getSharedGroups(ctx.url, ctx.token, company)
      .then((resp) => {
        const j: SharedGroupsResp = resp.data;
        if (j.error === 0) {
          setCompanyGroups((prev) => ({ ...prev, [company]: j.shared_groups }));
        } else {
          toast.error(j.msg || "Could not load shared groups");
        }
      })
      .catch((err) => toast.error(errorText(err)))
      .finally(() => fetching.current.delete(company));
  };

  const toggleCompany = (company: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(company)) next.delete(company);
      else {
        next.add(company);
        if (!companyGroups[company]) fetchGroups(company);
      }
      return next;
    });
  };

  const searching = search.trim().length > 0;
  const matched = (company: number) => {
    const groups = companyGroups[company] ?? [];
    return searching
      ? groups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
      : groups;
  };

  // A search surfaces matches whatever is collapsed, so every company's
  // groups are fetched while one is active.
  useEffect(() => {
    if (!searching) return;
    ctx.companies.forEach((c) => {
      if (!companyGroups[c.id]) fetchGroups(c.id);
    });
  }, [searching]);

  // The detail reads the group from the list, so a re-fetch after any change
  // (stores, sharing, rename) is all it takes to show the new state.
  const selectedGroup = selected
    ? (companyGroups[selected.company] ?? []).find((g) => g.id === selected.id) ?? null
    : null;

  const companyName = (id: number) =>
    ctx.companies.find((c) => c.id === id)?.name ?? "";

  const handleCreate = (name: string, company: number, storeids: number[]) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Group name is required");
      return;
    }
    if (
      (companyGroups[company] ?? []).some(
        (g) => g.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("A shared group with that name already exists");
      return;
    }
    createSharedGroup(ctx.url, ctx.token, company, trimmed, storeids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          setShowNew(false);
          fetchGroups(company);
          setExpanded((prev) => new Set(prev).add(company));
          setSelected({ id: j.id, company });
        } else {
          toast.error(j.msg || "Could not create the shared group");
        }
      })
      .catch((err) => toast.error(errorText(err)));
  };

  return (
    <div className="flex-1 flex min-h-0 w-full">
      <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-gray-100 flex gap-1.5">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search shared groups…"
            className="flex-1"
          />
          <button
            onClick={() => setShowNew(true)}
            title="New shared group"
            aria-label="New shared group"
            className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5 thin-scrollbar">
          {ctx.companies.length === 0 && (
            <div className="p-3 text-[11px] text-content">No companies</div>
          )}
          {ctx.companies.map((c) => {
            const groups = matched(c.id);
            if (searching && groups.length === 0) return null;
            const isOpen = searching || expanded.has(c.id);
            const total = companyGroups[c.id]?.length;
            return (
              <div key={c.id} className="rounded-lg border border-gray-100 overflow-hidden">
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
                    {total !== undefined ? `${total} shared` : ""}
                  </span>
                </button>
                {isOpen && (
                  <div className="divide-y divide-gray-100">
                    {groups.map((g) => {
                      const isSel = selected?.id === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelected({ id: g.id, company: c.id })}
                          style={
                            isSel
                              ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                              : undefined
                          }
                          className={`w-full flex flex-col items-start pl-6 pr-3 py-2 text-left transition-colors ${
                            isSel ? "bg-custom-white" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-[12px] font-medium text-content">{g.name}</span>
                          <span className="text-[10.5px] text-content/55">
                            {g.stores.length} store{g.stores.length === 1 ? "" : "s"} · shared
                            with {g.userids.length}
                          </span>
                        </button>
                      );
                    })}
                    {groups.length === 0 && (
                      <div className="pl-6 py-1.5 text-[11px] text-content/60">
                        {companyGroups[c.id] ? "No shared groups" : "Loading…"}
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
            Select a shared group
          </div>
        ) : (
          <SharedGroupDetail
            group={selectedGroup}
            companyName={companyName(selectedGroup.company)}
            onChanged={() => fetchGroups(selectedGroup.company)}
            onDeleted={() => {
              fetchGroups(selectedGroup.company);
              setSelected(null);
            }}
          />
        )}
      </div>

      {showNew && (
        <NewSharedGroupModal
          companies={ctx.companies}
          onCreate={handleCreate}
          onClose={() => setShowNew(false)}
        />
      )}
    </div>
  );
};

export default SharedGroups;
