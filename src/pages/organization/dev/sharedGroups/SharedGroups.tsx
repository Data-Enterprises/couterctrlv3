import { useEffect, useState } from "react";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  createSharedGroup,
  getSharedGroupCompanyStores,
  getSharedGroups,
} from "../../../../api/sharedGroups";
import type {
  SharedGroup,
  SharedGroupCompanyStoresResp,
  SharedGroupStore,
  SharedGroupsResp,
} from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import AssignPanel from "../../../../components-dev/AssignPanel";
import SharedGroupDetail from "./SharedGroupDetail";
import { errorText, storeLabel, useSharedGroupsCtx } from "./hooks";

type RightSide = { kind: "none" } | { kind: "create" } | { kind: "group"; id: number };

/** Groups bucketed under their company, in the order the router sent them
 *  (company, then name). */
const byCompany = (groups: SharedGroup[]) => {
  const out: { company: number; name: string; groups: SharedGroup[] }[] = [];
  for (const g of groups) {
    let b = out.find((x) => x.company === g.company);
    if (!b) {
      b = { company: g.company, name: g.company_name ?? `Company ${g.company}`, groups: [] };
      out.push(b);
    }
    b.groups.push(g);
  }
  return out;
};

/** Company, name and at least one store — the router needs all three. */
const NewSharedGroup = ({
  onCreate,
  onCancel,
}: {
  onCreate: (company: number, name: string, storeids: number[]) => void;
  onCancel: () => void;
}) => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const [companyId, setCompanyId] = useState(
    ctx.companies.length === 1 ? String(ctx.companies[0].id) : "",
  );
  const [name, setName] = useState("");
  const [available, setAvailable] = useState<SharedGroupStore[] | null>(null);
  const [chosen, setChosen] = useState<SharedGroupStore[]>([]);
  const company = Number(companyId);

  // A group lives in one company, so a new company starts the store list over.
  useEffect(() => {
    setAvailable(null);
    setChosen([]);
    if (!company) return;
    getSharedGroupCompanyStores(ctx.url, ctx.token, company)
      .then((resp) => {
        const j: SharedGroupCompanyStoresResp = resp.data;
        if (j.error === 0) setAvailable(j.stores);
        else toast.error(j.msg || "Could not load your stores");
      })
      .catch((err) => toast.error(errorText(err)));
  }, [company]);

  const chosenIds = new Set(chosen.map((s) => s.storeid));
  const byId = new Map((available ?? []).map((s) => [s.storeid, s]));

  return (
    <div>
      <div className="text-[16px] font-medium text-content mb-1">New shared group</div>
      <p className="text-[11px] text-content/60 mb-3 max-w-[70ch]">
        Like a user group you can hand to other people in the same company. Pick its stores
        from the ones you're assigned to, create it, then share it.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3 max-w-[560px]">
        <div>
          <label className="text-[11px] text-content/60 block mb-1">Company</label>
          <SelectFilter
            options={ctx.companies.map((c) => ({ label: c.name, value: String(c.id) }))}
            value={companyId}
            onChange={setCompanyId}
            placeholder="Choose a company"
            className="w-full"
          />
        </div>
        <div>
          <label className="text-[11px] text-content/60 block mb-1">Group name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. C-Store QSR"
            className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
          />
        </div>
      </div>

      {!company ? (
        <div className="text-[12px] text-content/60 py-6 text-center">
          Choose a company to pick its stores.
        </div>
      ) : available === null ? (
        <div className="text-[11.5px] text-content/60">Loading your stores…</div>
      ) : (
        <AssignPanel
          leftTitle="Your stores"
          rightTitle="In the group"
          verbs={{ assign: "Add", unassign: "Remove" }}
          leftItems={available
            .filter((s) => !chosenIds.has(s.storeid))
            .map((s) => ({ id: s.storeid, label: storeLabel(s) }))}
          rightItems={chosen.map((s) => ({ id: s.storeid, label: storeLabel(s) }))}
          onAssign={(ids) =>
            setChosen((prev) => [
              ...prev,
              ...ids.map((id) => byId.get(id)).filter((s): s is SharedGroupStore => !!s),
            ])
          }
          onUnassign={(ids) =>
            setChosen((prev) => prev.filter((s) => !ids.includes(s.storeid)))
          }
        />
      )}

      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
        >
          Cancel
        </button>
        <button
          onClick={() => onCreate(company, name, chosen.map((s) => s.storeid))}
          disabled={!company || !name.trim() || chosen.length === 0}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-50"
        >
          Create shared group
        </button>
      </div>
    </div>
  );
};

/**
 * User Management > Shared Groups — owners and up.
 *
 * Every shared group in the owner's companies, one list under company
 * headings: any owner in a company can manage its groups. Create (company,
 * name, stores), then share and unshare. Whoever a group is shared with —
 * and its creator — sees it in their User Groups tab, read-only.
 */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();

  const [groups, setGroups] = useState<SharedGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [right, setRight] = useState<RightSide>({ kind: "none" });

  const fetchGroups = () => {
    getSharedGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j: SharedGroupsResp = resp.data;
        if (j.error === 0) setGroups(j.shared_groups);
        else toast.error(j.msg || "Could not load shared groups");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    fetchGroups();
  }, [ctx.url, ctx.token]);

  const q = search.trim().toLowerCase();
  const shown = byCompany(
    (groups ?? []).filter((g) => !q || g.name.toLowerCase().includes(q)),
  );
  const selected =
    right.kind === "group" ? (groups ?? []).find((g) => g.id === right.id) ?? null : null;

  const toggleCompany = (company: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(company)) next.delete(company);
      else next.add(company);
      return next;
    });

  const handleCreate = (company: number, name: string, storeids: number[]) => {
    const trimmed = name.trim();
    if (
      (groups ?? []).some(
        (g) => g.company === company && g.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("This company already has a shared group with that name");
      return;
    }
    createSharedGroup(ctx.url, ctx.token, company, trimmed, storeids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          fetchGroups();
          setCollapsed((prev) => {
            const next = new Set(prev);
            next.delete(company);
            return next;
          });
          // Straight to it, on who it's shared with — the next step.
          setRight({ kind: "group", id: j.id });
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
            onClick={() => setRight({ kind: "create" })}
            title="New shared group"
            aria-label="New shared group"
            className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {groups === null ? (
            <div className="px-3 py-2 text-[11px] text-content/60">Loading…</div>
          ) : shown.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-content/60">
              {q ? "No matches" : "No shared groups yet — make one with +"}
            </div>
          ) : (
            shown.map((b) => {
              const isOpen = q.length > 0 || !collapsed.has(b.company);
              return (
                <div key={b.company} className="border-b border-gray-100">
                  <button
                    onClick={() => toggleCompany(b.company)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center gap-2 px-3 py-2 bg-[#1e2a4a]/5 hover:bg-[#1e2a4a]/10 transition-colors"
                  >
                    <ChevronRightIcon
                      className="w-3 h-3 text-[#1e2a4a]/60 flex-shrink-0 transition-transform"
                      style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    />
                    <span className="text-[12px] font-semibold text-[#1e2a4a] flex-1 text-left truncate">
                      {b.name}
                    </span>
                    <span className="text-[11px] text-[#1e2a4a]/55">{b.groups.length}</span>
                  </button>
                  {isOpen && (
                    <div className="divide-y divide-gray-100">
                      {b.groups.map((g) => {
                        const active = right.kind === "group" && right.id === g.id;
                        return (
                          <button
                            key={g.id}
                            onClick={() => setRight({ kind: "group", id: g.id })}
                            style={
                              active
                                ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                                : undefined
                            }
                            className={`w-full flex flex-col items-start pl-6 pr-3 py-2 text-left transition-colors ${
                              active ? "bg-custom-white" : "hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-[12px] font-medium text-content">{g.name}</span>
                            <span className="text-[10.5px] text-content/55">
                              {g.stores.length} store{g.stores.length === 1 ? "" : "s"} ·
                              shared with {g.userids.length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {right.kind === "create" ? (
          <NewSharedGroup onCreate={handleCreate} onCancel={() => setRight({ kind: "none" })} />
        ) : selected ? (
          <SharedGroupDetail
            group={selected}
            onChanged={fetchGroups}
            onDeleted={() => {
              fetchGroups();
              setRight({ kind: "none" });
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content text-center px-6">
            Select a shared group to share it or change its stores, or make a new one with +.
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGroups;
