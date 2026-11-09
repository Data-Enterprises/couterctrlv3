// Hooks
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useBaseGroupsCtx } from "../hooks";

// API
import { getAllUsers, getUserStores } from "../../../../api/user";

// Interfaces
import type { JsonError, Store, User } from "../../../../interfaces";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";
import StoresExportModal from "./components/StoresExportModal";
import StoreUsersPanel from "./components/StoreUsersPanel";

interface StoresTabProps {
  exportOpen: boolean;
  onCloseExport: () => void;
}

/**
 * User Management → Stores: who holds each store, with the same panel as
 * Companies and Base Groups.
 *
 * Programmers and DCR support get every store; everyone else the ones they
 * hold, since you can't hand out access you don't have.
 */
const StoresTab = ({ exportOpen, onCloseExport }: StoresTabProps) => {
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
   * Every user, unscoped, as the level guard's source of truth only (the
   * columns come from `store_users`). The guard fails closed, so a scoped list
   * would hide legitimate people.
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
