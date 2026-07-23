import { useEffect, useMemo, useState } from "react";
import { useOrganizationCtx } from "../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../api/user";
import type { JsonError, Store } from "../../../interfaces";
import TextFilter from "../../../components/filters/TextFilter";

// Read-only store directory — company/base-group assignment already lives on
// the Users profile and Base Groups tabs, so this is just browse/search.
// Fetches into its own local state rather than reusing state.user's
// assignedStores/unassignedStores (those back the logged-in user's own nav/
// permissions elsewhere and shouldn't double as generic "all stores" list
// state for an admin browsing tool).
const StoresDirectory = () => {
  const ctx = useOrganizationCtx();
  const toast = useToast();
  const [stores, setStores] = useState<Store[] | null>(null);
  const [search, setSearch] = useState("");

  // The stores endpoint can return a store with a null store_name/
  // store_number (e.g. a not-yet-fully-configured store record) — filter
  // those out rather than letting them reach the search below, same fix as
  // NewStoreName.tsx/StoresTab.tsx.
  const validOnly = (list: Store[]) =>
    list.filter((s) => s.store_name != null && s.store_number != null);

  useEffect(() => {
    getUserStores(ctx.url, ctx.token, ctx.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setStores(validOnly([...j.assigned_stores, ...j.unassigned_stores]));
        } else {
          toast.error(j.msg || "Error fetching stores");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  }, []);

  const filtered = useMemo(() => {
    if (!stores) return [];
    if (!search.trim()) return stores;
    const q = search.toLowerCase();
    return stores.filter(
      (s) =>
        s.store_name.toLowerCase().includes(q) ||
        s.store_number.toLowerCase().includes(q),
    );
  }, [stores, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-[760px]">
      <TextFilter
        value={search}
        onChange={setSearch}
        placeholder={
          stores ? `Search ${stores.length} stores…` : "Search stores…"
        }
        className="mb-3"
      />

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="grid grid-cols-[14%_14%_36%_14%_22%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0">
          <div>Store ID</div>
          <div>Store #</div>
          <div>Store name</div>
          <div>Company ID</div>
          <div>Company name</div>
        </div>
        <div className="max-h-[480px] overflow-y-auto thin-scrollbar divide-y divide-[#1e2a4a]/15">
          {!stores && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              Loading…
            </div>
          )}
          {stores &&
            filtered.map((s) => (
              <div
                key={s.storeid}
                className="grid grid-cols-[14%_14%_36%_14%_22%] px-3 py-2 text-[12px] items-center border-b border-gray-100 text-content"
              >
                <div className="truncate">{s.storeid}</div>
                <div className="truncate">{s.store_number}</div>
                <div className="truncate">{s.store_name}</div>
                <div className="truncate">{s.company}</div>
                <div className="truncate">{s.company_name}</div>
              </div>
            ))}
          {stores && filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No stores found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoresDirectory;
