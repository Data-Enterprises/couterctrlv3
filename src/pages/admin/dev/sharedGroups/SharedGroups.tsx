import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import {
  createSharedGroup,
  getSharedGroups,
  getSharedGroupStores,
  getSharedGroupTemplates,
} from "../../../../api/sharedGroups";
import type {
  SharedGroup,
  SharedGroupsResp,
  SharedGroupStore,
  SharedGroupStoresResp,
  SharedGroupTemplate,
  SharedGroupTemplatesResp,
} from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SharedGroupDetail from "./SharedGroupDetail";
import CreateSharedGroupPanel from "./CreateSharedGroupPanel";
import { errorText, useSharedGroupsCtx } from "./hooks";

type RightSide =
  | { kind: "none" }
  | { kind: "create"; template: SharedGroupTemplate | null }
  | { kind: "group"; id: number };

/** Items bucketed under their company's name, in the order the router sent
 *  them (it sorts by company, then name). */
const byCompany = <T extends { company: number; company_name: string | null }>(items: T[]) => {
  const out: { company: number; name: string; items: T[] }[] = [];
  for (const it of items) {
    let bucket = out.find((b) => b.company === it.company);
    if (!bucket) {
      bucket = { company: it.company, name: it.company_name ?? `Company ${it.company}`, items: [] };
      out.push(bucket);
    }
    bucket.items.push(it);
  }
  return out;
};

/** A collapsible block on the left: templates or shared groups. Defined out
 *  here, not inside SharedGroups, so its children aren't remounted on every
 *  render. */
const Section = ({
  title,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  count: number | null;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) => (
  <div className="border-b border-gray-100">
    <button
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center gap-2 px-3 py-2 bg-[#1e2a4a]/5 hover:bg-[#1e2a4a]/10 transition-colors"
    >
      <ChevronRightIcon
        className="w-3 h-3 text-[#1e2a4a]/60 flex-shrink-0 transition-transform"
        style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
      />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-[#1e2a4a] flex-1 text-left">
        {title}
      </span>
      <span className="text-[11px] text-[#1e2a4a]/55">{count ?? ""}</span>
    </button>
    {open && children}
  </div>
);

const CompanyHeading = ({ name }: { name: string }) => (
  <div className="px-3 pt-2 pb-1 text-[10.5px] font-semibold text-content/55 truncate">
    {name}
  </div>
);

const Empty = ({ text }: { text: string }) => (
  <div className="px-3 py-2 text-[11px] text-content/60">{text}</div>
);

/**
 * Admin > Shared Groups, on the shared_groups router.
 *
 * Every company Admin scopes this user to, loaded at once. Down the left, two
 * collapsible sections: base groups offered as templates to start a shared
 * group from, and the shared groups that already exist — each under its
 * company's name, since a name like "East" can repeat across companies. The
 * right side is either the form for a new group or the selected one, opening
 * on who it's shared with.
 *
 * A base group grants access to stores; a shared group is a search filter
 * handed to other users and never grants or revokes anything. Starting from a
 * base group copies its name and stores — nothing links the two afterwards.
 */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const companyIds = ctx.companies.map((c) => c.id);
  const companyKey = companyIds.join(",");

  const [templates, setTemplates] = useState<SharedGroupTemplate[] | null>(null);
  const [groups, setGroups] = useState<SharedGroup[] | null>(null);
  const [stores, setStores] = useState<SharedGroupStore[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({ templates: true, groups: true });
  const [right, setRight] = useState<RightSide>({ kind: "none" });

  // The company set on screen now — a response for an earlier one is dropped
  // (Admin's company list can arrive after this tab mounts).
  const currentKey = useRef(companyKey);
  currentKey.current = companyKey;

  const fetchGroups = () => {
    if (!companyIds.length) return;
    const forKey = companyKey;
    getSharedGroups(ctx.url, ctx.token, companyIds)
      .then((resp) => {
        if (forKey !== currentKey.current) return;
        const j: SharedGroupsResp = resp.data;
        if (j.error === 0) setGroups(j.shared_groups);
        else toast.error(j.msg || "Could not load shared groups");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    setTemplates(null);
    setGroups(null);
    setStores([]);
    if (!companyIds.length) return;
    const forKey = companyKey;
    fetchGroups();
    getSharedGroupTemplates(ctx.url, ctx.token, companyIds)
      .then((resp) => {
        if (forKey !== currentKey.current) return;
        const j: SharedGroupTemplatesResp = resp.data;
        if (j.error === 0) setTemplates(j.templates);
        else toast.error(j.msg || "Could not load base groups");
      })
      .catch((err) => toast.error(errorText(err)));
    getSharedGroupStores(ctx.url, ctx.token, companyIds)
      .then((resp) => {
        if (forKey !== currentKey.current) return;
        const j: SharedGroupStoresResp = resp.data;
        if (j.error === 0) setStores(j.stores);
        else toast.error(j.msg || "Could not load stores");
      })
      .catch((err) => toast.error(errorText(err)));
  }, [companyKey]);

  const q = search.trim().toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);
  const shownTemplates = byCompany((templates ?? []).filter((t) => match(t.name)));
  const shownGroups = byCompany((groups ?? []).filter((g) => match(g.name)));
  const selectedGroup =
    right.kind === "group" ? (groups ?? []).find((g) => g.id === right.id) ?? null : null;

  const handleCreate = (company: number, name: string, storeids: number[]) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Group name is required");
      return;
    }
    if (
      (groups ?? []).some(
        (g) => g.company === company && g.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("That company already has a shared group with that name");
      return;
    }
    createSharedGroup(ctx.url, ctx.token, company, trimmed, storeids)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          fetchGroups();
          setOpen((o) => ({ ...o, groups: true }));
          // Straight to who it's shared with — the next thing to do with it.
          setRight({ kind: "group", id: j.id });
        } else {
          toast.error(j.msg || "Could not create the shared group");
        }
      })
      .catch((err) => toast.error(errorText(err)));
  };

  const rowClass = (active: boolean) =>
    `w-full flex flex-col items-start pl-6 pr-3 py-2 text-left transition-colors ${
      active ? "bg-custom-white" : "hover:bg-gray-50"
    }`;
  const activeStyle = { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" };

  return (
    <div className="flex-1 flex min-h-0 w-full">
      <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-gray-100 flex gap-1.5">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search groups…"
            className="flex-1"
          />
          <button
            onClick={() => setRight({ kind: "create", template: null })}
            disabled={!companyIds.length}
            title="New shared group"
            aria-label="New shared group"
            className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40"
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          <Section
            title="Base group templates"
            count={templates ? templates.length : null}
            open={open.templates}
            onToggle={() => setOpen((o) => ({ ...o, templates: !o.templates }))}
          >
            {templates === null ? (
              <Empty text={companyIds.length ? "Loading…" : "No companies"} />
            ) : shownTemplates.length === 0 ? (
              <Empty text={q ? "No matches" : "No base groups"} />
            ) : (
              shownTemplates.map((b) => (
                <div key={`tc${b.company}`}>
                  <CompanyHeading name={b.name} />
                  <div className="divide-y divide-gray-100">
                    {b.items.map((t) => {
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
                    })}
                  </div>
                </div>
              ))
            )}
          </Section>

          <Section
            title="Shared groups"
            count={groups ? groups.length : null}
            open={open.groups}
            onToggle={() => setOpen((o) => ({ ...o, groups: !o.groups }))}
          >
            {groups === null ? (
              <Empty text={companyIds.length ? "Loading…" : ""} />
            ) : shownGroups.length === 0 ? (
              <Empty text={q ? "No matches" : "No shared groups yet"} />
            ) : (
              shownGroups.map((b) => (
                <div key={`gc${b.company}`}>
                  <CompanyHeading name={b.name} />
                  <div className="divide-y divide-gray-100">
                    {b.items.map((g) => {
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
                            {g.stores.length} store{g.stores.length === 1 ? "" : "s"} ·
                            shared with {g.userids.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </Section>
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {right.kind === "create" ? (
          <CreateSharedGroupPanel
            companies={ctx.companies}
            allStores={stores}
            template={right.template}
            onCreate={handleCreate}
            onCancel={() => setRight({ kind: "none" })}
          />
        ) : selectedGroup ? (
          <SharedGroupDetail
            group={selectedGroup}
            allStores={stores}
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
