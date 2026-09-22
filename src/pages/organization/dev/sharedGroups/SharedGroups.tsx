import { useEffect, useState, type ReactNode } from "react";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { createSharedGroup, getSharedGroups } from "../../../../api/sharedGroups";
import { getGroups } from "../../../../api/groups";
import type { Group } from "../../../../features/groupSlice";
import type { JsonError, SharedGroup, SharedGroupsResp } from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SharedGroupDetail from "./SharedGroupDetail";
import SharedWithMeDetail from "./SharedWithMeDetail";
import { errorText, useSharedGroupsCtx } from "./hooks";

type RightSide =
  | { kind: "none" }
  | { kind: "create" }
  | { kind: "mine"; id: number }
  | { kind: "withMe"; id: number };

/** A collapsible block on the left. Defined out here, not inside
 *  SharedGroups, so its children aren't remounted on every render. */
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

const Empty = ({ text }: { text: string }) => (
  <div className="px-3 py-2 text-[11px] text-content/60">{text}</div>
);

const NewSharedGroup = ({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string) => void;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  return (
    <div className="max-w-[420px]">
      <div className="text-[16px] font-medium text-content mb-1">New shared group</div>
      <p className="text-[11px] text-content/60 mb-3">
        Like a user group you can hand to other people. Name it, then pick its stores
        and who to share it with.
      </p>
      <label className="text-[11px] text-content/60 block mb-1">Group name</label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onCreate(name)}
        placeholder="e.g. C-Store QSR"
        className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
      />
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
        >
          Cancel
        </button>
        <button
          onClick={() => onCreate(name)}
          disabled={!name.trim()}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
};

/**
 * User Management > Shared Groups.
 *
 * Shared groups work like user groups, except their owner can hand them to
 * other people. Everyone sees what's been shared with them, read-only and cut
 * down to the stores they're assigned to. Owners and up (7) also get "My
 * shared groups": create, rename, pick stores, share and delete, on the
 * shared_groups router.
 */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();

  const [mine, setMine] = useState<SharedGroup[] | null>(null);
  const [withMe, setWithMe] = useState<Group[] | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState({ mine: true, withMe: true });
  const [right, setRight] = useState<RightSide>({ kind: "none" });

  const fetchMine = () => {
    if (!ctx.canManage) return;
    getSharedGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j: SharedGroupsResp = resp.data;
        if (j.error === 0) setMine(j.shared_groups);
        else toast.error(j.msg || "Could not load your shared groups");
      })
      .catch((err) => toast.error(errorText(err)));
  };

  useEffect(() => {
    fetchMine();
    // Groups shared with this user come back from the ordinary groups list,
    // owned by someone else.
    getGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          setWithMe((j.groups as Group[]).filter((g) => g.userid !== ctx.userid));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, [ctx.url, ctx.token, ctx.canManage]);

  const q = search.trim().toLowerCase();
  const match = (name: string) => !q || name.toLowerCase().includes(q);
  const shownMine = (mine ?? []).filter((g) => match(g.name));
  const shownWithMe = (withMe ?? []).filter((g) => match(g.group_name));

  const selectedMine =
    right.kind === "mine" ? (mine ?? []).find((g) => g.id === right.id) ?? null : null;
  const selectedWithMe =
    right.kind === "withMe" ? (withMe ?? []).find((g) => g.id === right.id) ?? null : null;

  const handleCreate = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Group name is required");
      return;
    }
    createSharedGroup(ctx.url, ctx.token, trimmed)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          fetchMine();
          setOpen((o) => ({ ...o, mine: true }));
          // Straight to it — it opens on its stores, the next thing to do.
          setRight({ kind: "mine", id: j.id });
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
          {ctx.canManage && (
            <button
              onClick={() => setRight({ kind: "create" })}
              title="New shared group"
              aria-label="New shared group"
              className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
          {ctx.canManage && (
            <Section
              title="My shared groups"
              count={mine ? mine.length : null}
              open={open.mine}
              onToggle={() => setOpen((o) => ({ ...o, mine: !o.mine }))}
            >
              {mine === null ? (
                <Empty text="Loading…" />
              ) : shownMine.length === 0 ? (
                <Empty text={q ? "No matches" : "You haven't made any yet"} />
              ) : (
                <div className="divide-y divide-gray-100">
                  {shownMine.map((g) => {
                    const active = right.kind === "mine" && right.id === g.id;
                    return (
                      <button
                        key={`m${g.id}`}
                        onClick={() => setRight({ kind: "mine", id: g.id })}
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
                  })}
                </div>
              )}
            </Section>
          )}

          <Section
            title="Shared with me"
            count={withMe ? withMe.length : null}
            open={open.withMe}
            onToggle={() => setOpen((o) => ({ ...o, withMe: !o.withMe }))}
          >
            {withMe === null ? (
              <Empty text="Loading…" />
            ) : shownWithMe.length === 0 ? (
              <Empty text={q ? "No matches" : "Nothing has been shared with you"} />
            ) : (
              <div className="divide-y divide-gray-100">
                {shownWithMe.map((g) => {
                  const active = right.kind === "withMe" && right.id === g.id;
                  return (
                    <button
                      key={`w${g.id}`}
                      onClick={() => setRight({ kind: "withMe", id: g.id })}
                      style={active ? activeStyle : undefined}
                      className={rowClass(active)}
                    >
                      <span className="text-[12px] font-medium text-content">
                        {g.group_name}
                      </span>
                      <span className="text-[10.5px] text-content/55">Read-only</span>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {right.kind === "create" && ctx.canManage ? (
          <NewSharedGroup onCreate={handleCreate} onCancel={() => setRight({ kind: "none" })} />
        ) : selectedMine ? (
          <SharedGroupDetail
            group={selectedMine}
            onChanged={fetchMine}
            onDeleted={() => {
              fetchMine();
              setRight({ kind: "none" });
            }}
          />
        ) : selectedWithMe ? (
          <SharedWithMeDetail group={selectedWithMe} />
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content text-center px-6">
            {ctx.canManage
              ? "Select a shared group, or make a new one with +."
              : "Select a group to see which of its stores you can use."}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGroups;
