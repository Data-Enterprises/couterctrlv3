import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { createSharedGroup, getSharedGroups } from "../../../../api/sharedGroups";
import type { SharedGroup, SharedGroupsResp } from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SharedGroupDetail from "./SharedGroupDetail";
import { errorText, nameProblem, useSharedGroupsCtx } from "./hooks";

type RightSide = { kind: "none" } | { kind: "create" } | { kind: "group"; id: number };

/** Just a name — like making a user group. Stores come next, on the group. */
const NewSharedGroup = ({
  onCreate,
  onCancel,
}: {
  onCreate: (name: string) => Promise<void>;
  onCancel: () => void;
}) => {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  // Only complain about a name once there's something typed.
  const problem = name.trim() ? nameProblem(name) : null;
  const submit = () => {
    if (creating || nameProblem(name)) return;
    setCreating(true);
    Promise.resolve(onCreate(name)).finally(() => setCreating(false));
  };
  return (
    <div className="max-w-[420px]">
      <div className="text-[16px] font-medium text-content mb-1">New shared group</div>
      <p className="text-[11px] text-content/60 mb-3">
        A user group you can share. Name it, pick its stores from the ones you're assigned
        to, then share it.
      </p>
      <label className="text-[11px] text-content/60 block mb-1">Group name</label>
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        maxLength={100}
        placeholder="e.g. C-Store QSR"
        className="basic-input w-full bg-custom-white py-1.5 px-2 text-[12px]"
      />
      <div className={`text-[11px] mt-1 min-h-[16px] ${problem ? "text-red-700" : "text-content/50"}`}>
        {problem ?? "Letters, numbers, spaces, _ and -."}
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button
          onClick={onCancel}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md border border-gray-200 text-content"
        >
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!!nameProblem(name) || creating}
          className="text-[12px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-50"
        >
          Create
        </button>
      </div>
    </div>
  );
};

/**
 * User Management > Shared Groups — owners and up.
 *
 * A shared group is a user group you can share: a flat list of the ones you
 * created, sorted by name. Create with a name, pick stores from the ones
 * you're assigned to, then share and unshare. Only you can change or delete
 * yours; whoever you share with sees it in their User Groups tab, read-only.
 */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();

  const [groups, setGroups] = useState<SharedGroup[] | null>(null);
  const [search, setSearch] = useState("");
  const [right, setRight] = useState<RightSide>({ kind: "none" });

  const fetchGroups = (): Promise<void> =>
    getSharedGroups(ctx.url, ctx.token)
      .then((resp) => {
        const j: SharedGroupsResp = resp.data;
        if (j.error === 0) setGroups(j.shared_groups);
        else toast.error(j.msg || "Could not load shared groups");
      })
      .catch((err) => toast.error(errorText(err)));

  useEffect(() => {
    fetchGroups();
  }, [ctx.url, ctx.token]);

  const q = search.trim().toLowerCase();
  const shown = (groups ?? []).filter((g) => !q || g.name.toLowerCase().includes(q));
  const selected =
    right.kind === "group" ? (groups ?? []).find((g) => g.id === right.id) ?? null : null;

  const handleCreate = (name: string): Promise<void> => {
    const trimmed = name.trim();
    return createSharedGroup(ctx.url, ctx.token, trimmed)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          // Straight to it once the list has it — an empty group opens on its
          // stores. Selecting before the list arrives would flash the empty
          // "select a group" state.
          return fetchGroups().then(() => setRight({ kind: "group", id: j.id }));
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
            placeholder={
              groups ? `Search ${groups.length} shared group${groups.length === 1 ? "" : "s"}…` : "Search shared groups…"
            }
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

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-gray-100">
          {groups === null ? (
            <div className="px-3 py-2 text-[11px] text-content/60">Loading…</div>
          ) : shown.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-content/60">
              {q ? "No matches" : "No shared groups yet — make one with +"}
            </div>
          ) : (
            shown.map((g) => {
              const active = right.kind === "group" && right.id === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => setRight({ kind: "group", id: g.id })}
                  style={active ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
                  className={`w-full flex flex-col items-start px-3 py-2 text-left transition-colors ${
                    active ? "bg-custom-white" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[12px] font-medium text-content">{g.name}</span>
                  <span className="text-[10.5px] text-content/55">
                    {g.stores.length} store{g.stores.length === 1 ? "" : "s"} · shared with{" "}
                    {g.userids.length}
                  </span>
                </button>
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
