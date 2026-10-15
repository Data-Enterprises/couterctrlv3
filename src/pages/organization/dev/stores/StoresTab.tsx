import { useCallback, useEffect, useMemo, useState } from "react";
import { useBaseGroupsCtx } from "../baseGroups/hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getAllUsers, getUserStores } from "../../../../api/user";
import type { JsonError, Store, User } from "../../../../interfaces";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import StoresExportModal from "./StoresExportModal";
import StoreUsersPanel from "./StoreUsersPanel";

interface Props {
  exportOpen: boolean;
  onCloseExport: () => void;
}

/**
 * User Management → Stores: who holds each store.
 *
 * Was a read-only directory of the stores the signed-in person could reach.
 * It is the same list, now with the panel the Companies and Base Groups tabs
 * have, because "who can see this store" is the same question those two ask
 * one level up and there was nowhere to ask it directly.
 *
 * ### What the list contains
 *
 * Programmers and DCR support get every store; everyone else gets the ones
 * they hold. That is the rule the other two tabs follow — you cannot hand out
 * access you do not have yourself — and the directory already worked that way
 * for a different reason: it was open to every level, so it deliberately
 * listed nothing beyond the viewer's own reach. Now that the tab is owner and
 * up, the people who are meant to see everything can.
 */
const StoresTab = ({ exportOpen, onCloseExport }: Props) => {
  const ctx = useBaseGroupsCtx();
  const toast = useToast();

  const [stores, setStores] = useState<Store[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  // The endpoint can return a store with a null store_name or store_number —
  // a not-yet-configured record — and the search below would throw on it.
  const validOnly = (list: Store[]) =>
    list.filter((s) => s.store_name != null && s.store_number != null);

  const loadStores = useCallback(() => {
    getUserStores(ctx.url, ctx.token, ctx.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Error fetching stores");
          return;
        }
        setStores([
          ...validOnly(j.assigned_stores ?? []),
          // The unassigned half is other operators' stores for anyone else.
          ...(ctx.canSeeAllCompanies ? validOnly(j.unassigned_stores ?? []) : []),
        ]);
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, [ctx.url, ctx.token, ctx.userid, ctx.canSeeAllCompanies]);

  useEffect(loadStores, [loadStores]);

  /**
   * Every user, for the level guard inside the panel.
   *
   * Deliberately unscoped, unlike the grid's own list. This is not what gets
   * displayed — the columns come from `store_users`, which the server scopes
   * to the store's company — it is only the source of truth for *levels*.
   * Scoping it would mean a userid the store has and this list does not, and
   * the guard fails closed, so a legitimate person would silently vanish from
   * the panel. More levels known is strictly safer here.
   */
  useEffect(() => {
    getAllUsers(ctx.url, ctx.token)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) setUsers(j.users ?? []);
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching users " + err.message),
      );
  }, [ctx.url, ctx.token]);

  const sorted = useMemo(
    () =>
      [...(stores ?? [])].sort((a, b) =>
        a.store_number.localeCompare(b.store_number, undefined, {
          numeric: true,
        }),
      ),
    [stores],
  );

  const q = search.trim().toLowerCase();
  const shown = q
    ? sorted.filter(
        (s) =>
          s.store_name.toLowerCase().includes(q) ||
          s.store_number.toLowerCase().includes(q),
      )
    : sorted;

  const store = sorted.find((s) => s.storeid === selected) ?? null;

  return (
    <div className="flex-1 flex min-h-0 w-full">
      <div className="w-72 border-r border-gray-100 flex-shrink-0 flex flex-col">
        <div className="p-2.5 border-b border-gray-100">
          <TextFilter
            value={search}
            onChange={setSearch}
            placeholder="Search stores…"
          />
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1 thin-scrollbar">
          {stores === null && (
            <div className="p-3 text-[11px] text-content">Loading stores…</div>
          )}
          {stores !== null && sorted.length === 0 && (
            <div className="p-3 text-[11px] text-content">No stores</div>
          )}
          {sorted.length > 0 && shown.length === 0 && (
            <div className="p-3 text-[11px] text-content">No stores match</div>
          )}
          {shown.map((s) => {
            const isSel = selected === s.storeid;
            return (
              <button
                key={s.storeid}
                onClick={() => setSelected(s.storeid)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  isSel
                    ? "bg-brand_navy text-custom-white"
                    : "hover:bg-gray-50 text-content"
                }`}
              >
                <span className="text-[12px] font-semibold tabular-nums flex-shrink-0 w-[44px]">
                  {s.store_number}
                </span>
                <span
                  className={`text-[12px] truncate ${
                    isSel ? "text-custom-white/85" : "text-content/85"
                  }`}
                >
                  {s.store_name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-w-0 overflow-y-auto p-4">
        {store === null ? (
          <div className="flex items-center justify-center h-full text-[12px] text-content">
            Select a store
          </div>
        ) : (
          <StoreUsersPanel key={store.storeid} store={store} users={users} />
        )}
      </div>

      {/* Both lists, so the modal can offer "all" against "what you have
          searched down to" — the same choice it offered as a directory. */}
      {exportOpen && (
        <StoresExportModal
          allStores={sorted}
          filteredStores={shown}
          onClose={onCloseExport}
        />
      )}
    </div>
  );
};

export default StoresTab;
