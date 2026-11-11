// Hooks
import { useEffect, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useRefreshMyGroups, useSharedGroupsCtx } from "./hooks";

// API
import {
  createSharedGroup,
  getSharedGroups,
} from "../../../../api/sharedGroups";

// Utils
import { errorText } from "./utils";

// Interfaces
import type { RightSide } from "./interfaces";
import type { SharedGroup, SharedGroupsResp } from "../../../../interfaces";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SharedGroupDetail from "./components/SharedGroupDetail";
import { PlusIcon } from "@heroicons/react/20/solid";
import NewSharedGroup from "./components/NewSharedGroup";

/** Groups > Shared Groups, for owners and up: a searchable list of shared groups beside the new-group form or the selected group's detail. */
const SharedGroups = () => {
  const ctx = useSharedGroupsCtx();
  const toast = useToast();
  const refreshMyGroups = useRefreshMyGroups();

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
  const shown = (groups ?? []).filter(
    (g) => !q || g.name.toLowerCase().includes(q),
  );
  const selected =
    right.kind === "group"
      ? ((groups ?? []).find((g) => g.id === right.id) ?? null)
      : null;

  const handleCreate = (name: string): Promise<void> => {
    const trimmed = name.trim();
    return createSharedGroup(ctx.url, ctx.token, trimmed)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Shared group created");
          refreshMyGroups();
          // Straight to it once the list has it — an empty group opens on its
          // stores. Selecting before the list arrives would flash the empty
          // "select a group" state.
          return fetchGroups().then(() =>
            setRight({ kind: "group", id: j.id }),
          );
        } else {
          toast.error(j.msg || "Could not create the shared group");
        }
      })
      .catch((err) => toast.error(errorText(err)));
  };

  return (
    <div className="flex-1 flex min-h-0 w-full">
      <div className="w-72 border-r border-line_hair flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-line_hair flex gap-1.5">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder={
              groups
                ? `Search ${groups.length} shared group${groups.length === 1 ? "" : "s"}…`
                : "Search shared groups…"
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

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-line_hair">
          {groups === null ? (
            <div className="px-3 py-2 text-[11px] text-content/95">
              Loading…
            </div>
          ) : shown.length === 0 ? (
            <div className="px-3 py-2 text-[11px] text-content/95">
              {q ? "No matches" : "No shared groups yet — make one with +"}
            </div>
          ) : (
            shown.map((g) => {
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
                  className={`w-full flex flex-col items-start px-3 py-2 text-left transition-colors ${
                    active ? "bg-custom-white" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-[12px] font-medium text-content">
                    {g.name}
                  </span>
                  <span className="text-[10.5px] text-content/95">
                    {g.stores.length} store{g.stores.length === 1 ? "" : "s"} ·
                    shared with {g.userids.length}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {right.kind === "create" ? (
          <NewSharedGroup
            onCreate={handleCreate}
            onCancel={() => setRight({ kind: "none" })}
          />
        ) : selected ? (
          <SharedGroupDetail
            group={selected}
            onChanged={fetchGroups}
            onRenamed={() => {
              fetchGroups();
              refreshMyGroups();
            }}
            onDeleted={() => {
              fetchGroups();
              refreshMyGroups(selected.id);
              setRight({ kind: "none" });
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[12px] text-content text-center px-6">
            Select a shared group to share it or change its stores, or make a
            new one with +.
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedGroups;
