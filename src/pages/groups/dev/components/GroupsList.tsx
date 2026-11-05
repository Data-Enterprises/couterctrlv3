// Hooks
import { useState } from "react";
import { useGroupCtx } from "../hooks";

// Utils
import { BADGE, kindOf } from "../utils";

// Interfaces
import type { Group } from "../../../../features/groupSlice";
import type { Show } from "../interfaces";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";
import GroupTypeTabs from "./GroupTypeTabs";
import { PlusIcon } from "@heroicons/react/20/solid";

interface GroupsListProps {
  selectedId: number;
  onSelect: (group: Group) => void;
  onOpenCreate: () => void;
}

const GroupsList = ({
  selectedId,
  onSelect,
  onOpenCreate,
}: GroupsListProps) => {
  const ctx = useGroupCtx();
  const [search, setSearch] = useState("");
  const [show, setShow] = useState<Show>("all");

  const groups = ctx.groups.filter((g) =>
    g.group_name.toLowerCase().includes(search.toLowerCase()),
  );

  const count = {
    all: groups.length,
    mine: groups.filter((g) => kindOf(g, ctx.userid) === "mine").length,
    shared: groups.filter((g) => kindOf(g, ctx.userid) !== "mine").length,
  };
  const visible = groups.filter((g) =>
    show === "all"
      ? true
      : show === "mine"
        ? kindOf(g, ctx.userid) === "mine"
        : kindOf(g, ctx.userid) !== "mine",
  );
  const empty =
    ctx.groups.length === 0
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
          onChange={setSearch}
          placeholder="Search groups…"
          className="flex-1"
        />
        <button
          data-help="create"
          onClick={onOpenCreate}
          title="New group"
          aria-label="New group"
          className="w-7 h-7 flex-shrink-0 rounded-md border border-gray-300 border-dashed text-blue-700 flex items-center justify-center hover:bg-gray-50"
        >
          <PlusIcon className="w-4 h-4" />
        </button>
      </div>

      <GroupTypeTabs show={show} setShow={setShow} count={count} />

      <div
        data-help="group-list"
        className="flex-1 min-h-0 overflow-y-auto thin-scrollbar"
      >
        {visible.length === 0 && (
          <div className="p-4 text-[11px] text-content text-center">
            {empty}
          </div>
        )}
        {visible.map((g) => {
          const kind = kindOf(g, ctx.userid);
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
                isSel
                  ? "bg-custom-white text-content"
                  : "hover:bg-gray-50 text-content"
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
