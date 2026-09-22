import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";
import type { Group } from "../../../../features/groupSlice";
import type { JsonError } from "../../../../interfaces";
import { useGroupCtx } from "..";
import { BADGE, kindOf, type Show } from "../GroupsList";

type StoreRow = { storeid: number; store_name: string; active: number };

/**
 * The phone's view of the user's groups — the same All / Mine / Shared filter
 * and badges as the desktop list. The Update / Delete / Assign forms only
 * offer groups the user can edit; this is where every group they have,
 * shared ones included, can be looked at.
 *
 * Tapping a group opens its stores in place. They come from
 * stores_assigned_to_user_group as this user, so a group shared with them
 * lists only the stores they're assigned to.
 */
const GroupsListMobile = () => {
  const ctx = useGroupCtx();
  const toast = useToast();
  const [show, setShow] = useState<Show>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const [stores, setStores] = useState<Record<number, StoreRow[]>>({});

  const count = {
    all: ctx.groups.length,
    mine: ctx.groups.filter((g) => kindOf(g, ctx.userid) === "mine").length,
    shared: ctx.groups.filter((g) => kindOf(g, ctx.userid) !== "mine").length,
  };
  const visible = ctx.groups.filter((g) =>
    show === "all"
      ? true
      : show === "mine"
        ? kindOf(g, ctx.userid) === "mine"
        : kindOf(g, ctx.userid) !== "mine",
  );

  const toggle = (g: Group) => {
    if (openId === g.id) {
      setOpenId(null);
      return;
    }
    setOpenId(g.id);
    if (stores[g.id]) return;
    getStoresAssignedToUserGroup(ctx.url, ctx.token, ctx.userid, g.id)
      .then((resp) => {
        const j = resp.data;
        if (j.error == "0") {
          setStores((prev) => ({
            ...prev,
            [g.id]: (j.stores as StoreRow[]).filter((s) => s.active),
          }));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="bg-custom-white rounded-xl shadow-md w-full overflow-hidden">
      <div role="tablist" aria-label="Which groups" className="flex gap-1 p-2 border-b border-gray-100">
        {(["all", "mine", "shared"] as const).map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={show === id}
            onClick={() => setShow(id)}
            className={`flex-1 text-[12px] font-semibold py-1.5 rounded-md capitalize transition-colors ${
              show === id ? "bg-[#1e2a4a] text-custom-white" : "text-content active:bg-gray-100"
            }`}
          >
            {id} <span className="tabular-nums opacity-70">{count[id]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="p-4 text-[12px] text-content/70 text-center">
          {ctx.groups.length === 0
            ? "No groups yet"
            : show === "mine"
              ? "No groups of your own"
              : "No shared groups"}
        </div>
      ) : (
        <div className="divide-y divide-gray-100 max-h-[65vh] overflow-y-auto">
          {visible.map((g) => {
            const kind = kindOf(g, ctx.userid);
            const isOpen = openId === g.id;
            const list = stores[g.id];
            return (
              <div key={g.id}>
                <button
                  onClick={() => toggle(g)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center gap-2 px-3 py-3 text-left text-[13px] font-medium text-content active:bg-gray-50"
                >
                  {isOpen ? (
                    <ChevronDownIcon className="w-4 h-4 text-content/50 flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-content/50 flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{g.group_name}</span>
                  {kind !== "mine" && (
                    <span
                      className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full flex-shrink-0 ${BADGE[kind].cls}`}
                    >
                      {BADGE[kind].label}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 pl-9">
                    {kind === "sharedWithYou" && (
                      <div className="text-[11px] text-content/60 mb-1.5">
                        Shared with you. Only its stores you're assigned to are shown.
                      </div>
                    )}
                    {!list ? (
                      <div className="text-[12px] text-content/60">Loading stores…</div>
                    ) : list.length === 0 ? (
                      <div className="text-[12px] text-content/60">No stores</div>
                    ) : (
                      <ul className="text-[12px] text-content space-y-1">
                        {list.map((s) => (
                          <li key={s.storeid} className="truncate">
                            {s.store_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GroupsListMobile;
