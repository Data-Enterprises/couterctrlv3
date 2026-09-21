import { useEffect, useRef, useState } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  createSharedGroup,
  getSharedGroups,
  getSharedGroupTemplates,
} from "../../../../api/sharedGroups";
import type {
  SharedGroup,
  SharedGroupsResp,
  SharedGroupTemplate,
  SharedGroupTemplatesResp,
} from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import SharedGroupDetail from "./SharedGroupDetail";
import CreateSharedGroupPanel from "./CreateSharedGroupPanel";
import { errorText, useSharedGroupsCtx } from "./hooks";

type RightSide =
  | { kind: "none" }
  | { kind: "create"; template: SharedGroupTemplate | null }
  | { kind: "group"; id: number };

/**
 * Admin > Shared Groups, on the shared_groups router.
 *
 * One company at a time. Down the left: the company's base groups, offered as
 * templates to start a shared group from, then the shared groups it already
 * has. The right side is either the form for a new one or the selected group,
 * opening on who it's shared with.
 *
 * A base group grants access to stores; a shared group is a search filter
 * handed to other users and never grants or revokes anything. Starting from a
 * base group copies its name and stores — nothing links the two afterwards.
 */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();

  const [companyId, setCompanyId] = useState(
    ctx.companies[0] ? String(ctx.companies[0].id) : "",
  );
  const company = Number(companyId);
  // The company on screen now — a response for one the reader has left is dropped.
  const currentCompany = useRef(company);
  currentCompany.current = company;
  const [templates, setTemplates] = useState<SharedGroupTemplate[] | null>(null);
  const [groups, setGroups] = useState<SharedGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const [right, setRight] = useState<RightSide>({ kind: "none" });

  // Admin's company list can arrive after this tab mounts.
  useEffect(() => {
    if (!companyId && ctx.companies[0]) setCompanyId(String(ctx.companies[0].id));
  }, [ctx.companies.length]);

  const fetchGroups = () => {
    if (!company) return;
    const forCompany = company;
    getSharedGroups(ctx.url, ctx.token, forCompany)
      .then((resp) => {
        const j: SharedGroupsResp = resp.data;
        if (forCompany !== currentCompany.current) return;
        if (j.error === 0) setGroups(j.shared_groups);
        else toast.error(j.msg || "Could not load shared groups");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    setTemplates(null);
    setGroups(null);
    setRight({ kind: "none" });
    setSearch("");
    if (!company) return;
    fetchGroups();
    const forCompany = company;
    getSharedGroupTemplates(ctx.url, ctx.token, company)
      .then((resp) => {
        const j: SharedGroupTemplatesResp = resp.data;
        if (forCompany !== currentCompany.current) return;
        if (j.error === 0) setTemplates(j.templates);
        else toast.error(j.msg || "Could not load base groups");
      })
      .catch((err) => toast.error(errorText(err)));
  }, [company]);

  const companyName = ctx.companies.find((c) => c.id === company)?.name ?? "";
  const q = search.trim().toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);
  const shownTemplates = (templates ?? []).filter((t) => match(t.name));
  const shownGroups = (groups ?? []).filter((g) => match(g.name));
  const selectedGroup =
    right.kind === "group" ? (groups ?? []).find((g) => g.id === right.id) ?? null : null;

  const handleCreate = (name: string, storeids: number[]) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Group name is required");
      return;
    }
    if ((groups ?? []).some((g) => g.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("A shared group with that name already exists");
      return;
    }
    createSharedGroup(ctx.url, ctx.token, company, trimmed, storeids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          fetchGroups();
          // Straight to who it's shared with — the next thing to do with it.
          setRight({ kind: "group", id: j.id });
        } else {
          toast.error(j.msg || "Could not create the shared group");
        }
      })
      .catch((err) => toast.error(errorText(err)));
  };

  const rowClass = (active: boolean) =>
    `w-full flex flex-col items-start px-3 py-2 text-left transition-colors ${
      active ? "bg-custom-white" : "hover:bg-gray-50"
    }`;
  const activeStyle = { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" };
  const sectionHead = "px-3 pt-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-wide text-content/60";

  return (
    <div className="flex-1 flex min-h-0 w-full">
      <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-gray-100 flex flex-col gap-1.5">
          <SelectFilter
            options={ctx.companies.map((c) => ({ label: c.name, value: String(c.id) }))}
            value={companyId}
            onChange={setCompanyId}
            placeholder="Choose a company"
            className="w-full"
          />
          <div className="flex gap-1.5">
            <TextFilter
              value={search}
              onChange={setSearch}
              placeholder="Search groups…"
              className="flex-1"
            />
            <button
              onClick={() => setRight({ kind: "create", template: null })}
              disabled={!company}
              title="New shared group"
              aria-label="New shared group"
              className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <div className={sectionHead}>Base group templates</div>
          <div className="divide-y divide-gray-100">
            {templates === null ? (
              <div className="px-3 py-1.5 text-[11px] text-content/60">
                {company ? "Loading…" : "Choose a company"}
              </div>
            ) : shownTemplates.length === 0 ? (
              <div className="px-3 py-1.5 text-[11px] text-content/60">No base groups</div>
            ) : (
              shownTemplates.map((t) => {
                const active = right.kind === "create" && right.template?.id === t.id;
                return (
                  <button
                    key={`t${t.id}`}
                    onClick={() => setRight({ kind: "create", template: t })}
                    style={active ? activeStyle : undefined}
                    className={rowClass(active)}
                    title="Start a shared group from this base group"
                  >
                    <span className="text-[12px] font-medium text-content">{t.name}</span>
                    <span className="text-[10.5px] text-content/55">
                      {t.stores.length} store{t.stores.length === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          <div className={`${sectionHead} border-t border-gray-100 mt-1`}>
            Shared groups
          </div>
          <div className="divide-y divide-gray-100">
            {groups === null ? (
              <div className="px-3 py-1.5 text-[11px] text-content/60">
                {company ? "Loading…" : ""}
              </div>
            ) : shownGroups.length === 0 ? (
              <div className="px-3 py-1.5 text-[11px] text-content/60">
                No shared groups yet
              </div>
            ) : (
              shownGroups.map((g) => {
                const active = right.kind === "group" && right.id === g.id;
                return (
                  <button
                    key={`g${g.id}`}
                    onClick={() => setRight({ kind: "group", id: g.id })}
                    style={active ? activeStyle : undefined}
                    className={rowClass(active)}
                  >
                    <span className="text-[12px] font-medium text-content">{g.name}</span>
                    <span className="text-[10.5px] text-content/55">
                      {g.stores.length} store{g.stores.length === 1 ? "" : "s"} · shared
                      with {g.userids.length}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {right.kind === "create" ? (
          <CreateSharedGroupPanel
            company={company}
            companyName={companyName}
            template={right.template}
            onCreate={handleCreate}
            onCancel={() => setRight({ kind: "none" })}
          />
        ) : selectedGroup ? (
          <SharedGroupDetail
            group={selectedGroup}
            companyName={companyName}
            onChanged={fetchGroups}
            onDeleted={() => {
              fetchGroups();
              setRight({ kind: "none" });
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content text-center px-6">
            Pick a base group template to start a shared group, or select a
            shared group to see who it's shared with.
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGroups;
