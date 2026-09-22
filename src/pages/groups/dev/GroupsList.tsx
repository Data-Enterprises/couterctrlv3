import { useState } from "react";
import { PlusIcon } from "@heroicons/react/20/solid";
import type { Group } from "../../../features/groupSlice";
import TextFilter from "../../../components-dev/filters/TextFilter";

interface GroupsListProps {
  /** The signed-in user — tells "shared by you" from "shared with you". */
  userid: number;
  groups: Group[];
  totalCount: number;
  selectedId: number;
  search: string;
  onSearchChange: (v: string) => void;
  onSelect: (group: Group) => void;
  onOpenCreate: () => void;
}

type Show = "all" | "mine" | "shared";

/** Who a group belongs to, from where the user stands. */
const kindOf = (g: Group, userid: number): "mine" | "sharedByYou" | "sharedWithYou" =>
  g.userid !== userid ? "sharedWithYou" : g.is_shared ? "sharedByYou" : "mine";

const BADGE = {
  sharedByYou: { label: "Shared by you", cls: "bg-blue-50 text-blue-700" },
  sharedWithYou: { label: "Shared with you", cls: "bg-emerald-50 text-emerald-700" },
} as const;

// Flat master list — mirrors Organization's BaseGroups.tsx left column shape
// (search + "+ New" + scrollable select list) rather than the old per-action
// GroupPicker sidebar that got duplicated across 4 separate tabs.
//
// All / Mine / Shared narrows it: Mine is the user's own groups; Shared is the
// shared groups they created (managed on Shared Groups) plus the ones others
// shared with them (read-only), each badged to say which.
const GroupsList = ({
  userid,
  groups,
  totalCount,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onOpenCreate,
}: GroupsListProps) => {
  const [show, setShow] = useState<Show>("all");
  const count = {
    all: groups.length,
    mine: groups.filter((g) => kindOf(g, userid) === "mine").length,
    shared: groups.filter((g) => kindOf(g, userid) !== "mine").length,
  };
  const visible = groups.filter((g) =>
    show === "all" ? true : show === "mine" ? kindOf(g, userid) === "mine" : kindOf(g, userid) !== "mine",
  );
  const empty =
    totalCount === 0
      ? "No groups yet"
      : groups.length === 0
        ? "No groups match"
        : show === "mine"
          ? "No groups of your own match"
          : "No shared groups match";

  return (
    <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col min-h-0 bg-gray-50">
      <div className="p-2.5 border-b border-gray-100 flex gap-1.5">
        <TextFilter
          value={search}
          onChange={onSearchChange}
          placeholder="Search groups…"
          className="flex-1"
        />
        <button
          onClick={onOpenCreate}
          title="New group"
          aria-label="New group"
          className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Which groups"
        className="flex gap-1 px-2.5 py-2 border-b border-gray-100"
      >
        {(["all", "mine", "shared"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={show === id}
            onClick={() => setShow(id)}
            className={`flex-1 text-[11px] font-semibold py-1 rounded-md capitalize transition-colors ${
              show === id
                ? "bg-[#1e2a4a] text-custom-white"
                : "text-content hover:bg-gray-100"
            }`}
          >
            {id} <span className="tabular-nums opacity-70">{count[id]}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar">
        {visible.length === 0 && (
          <div className="p-4 text-[11px] text-content text-center">{empty}</div>
        )}
        {visible.map((g) => {
          const kind = kindOf(g, userid);
          const isSel = selectedId === g.id;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g)}
              style={
                isSel
                  ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                  : undefined
              }
              className={`w-full flex items-center gap-1.5 text-left px-3 py-2.5 border-b border-gray-100 text-[12px] font-medium transition-colors ${
                isSel ? "bg-custom-white text-content" : "hover:bg-gray-50 text-content"
              }`}
            >
              <span className="flex-1 truncate">{g.group_name}</span>
              {/* Shared groups stay selectable — they just can't be edited,
                  which GroupDetail spells out once one is open. */}
              {kind !== "mine" && (
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 ${BADGE[kind].cls}`}
                >
                  {BADGE[kind].label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GroupsList;
