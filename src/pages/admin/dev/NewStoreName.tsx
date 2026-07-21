import { useEffect, useMemo, useState } from "react";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../api/user";
import { setNewStoreName } from "../../../api/admin";
import type { JsonError, Store } from "../../../interfaces";
import Input from "../../../components/inputs/Input";
import SelectFilter from "../../../components/filters/SelectFilter";
import TextFilter from "../../../components/filters/TextFilter";

type AssignedFilter = "all" | "assigned" | "unassigned";

// Ports legacy NewStoreNameForm.tsx. Fetches into local state rather than
// reusing state.user's assignedStores/unassignedStores — those back the
// logged-in user's own nav/permissions elsewhere and shouldn't double as
// generic "all renameable stores" list state here (see StoresDirectory.tsx
// in Organization for the same fix/rationale).
const NewStoreName = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const [stores, setStores] = useState<{
    assigned: Store[];
    unassigned: Store[];
  } | null>(null);
  const [companyFilter, setCompanyFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState<AssignedFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [newName, setNewName] = useState("");

  // The backend can return stores with a null store_name/store_number
  // despite the Store type claiming string — filter those out same as
  // legacy NewStoreNameForm.tsx did, or search/rename below can throw on
  // a null .toLowerCase() call.
  const validOnly = (list: Store[]) =>
    list.filter((s) => s.store_number !== null && s.store_name !== null);

  const fetchStores = () => {
    getUserStores(context.url, context.token, context.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          setStores({
            assigned: validOnly(j.assigned_stores),
            unassigned: validOnly(j.unassigned_stores),
          });
        } else {
          toast.error(j.msg || "Error fetching stores");
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    const base =
      assignedFilter === "assigned"
        ? stores.assigned
        : assignedFilter === "unassigned"
          ? stores.unassigned
          : [...stores.assigned, ...stores.unassigned];
    return base.filter((s) => {
      const companyMatch = companyFilter
        ? s.company === Number(companyFilter)
        : true;
      const searchMatch = search.trim()
        ? s.store_name.toLowerCase().includes(search.toLowerCase())
        : true;
      return companyMatch && searchMatch;
    });
  }, [stores, assignedFilter, companyFilter, search]);

  const canSubmit =
    !!selectedStore &&
    newName.trim().length > 0 &&
    newName.trim().toLowerCase() !== selectedStore.store_name.toLowerCase();

  const handleSubmit = () => {
    if (!selectedStore) return;
    setNewStoreName(
      context.url,
      context.token,
      selectedStore.storeid,
      newName.trim(),
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          toast.success("Store name updated successfully");
          setSelectedStore(null);
          setNewName("");
          fetchStores();
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div className="flex-1 flex min-h-0 w-[820px]">
      <div className="w-[320px] border-r border-gray-100 flex-shrink-0 flex flex-col p-3">
        <SelectFilter
          options={context.companies.map((c) => ({
            value: String(c.id),
            label: c.name,
          }))}
          value={companyFilter}
          onChange={setCompanyFilter}
          placeholder="All companies"
          className="w-full mb-2"
        />
        <div className="flex rounded overflow-hidden mb-2">
          {(["all", "assigned", "unassigned"] as AssignedFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setAssignedFilter(f)}
              className={`flex-1 text-[10px] px-2 py-1 capitalize ${
                assignedFilter === f
                  ? "bg-[#1e2a4a] text-custom-white"
                  : "bg-custom-white border border-gray-200 text-content"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <TextFilter
          value={search}
          onChange={setSearch}
          placeholder={
            stores ? `Search ${filteredStores.length} stores…` : "Search stores…"
          }
          className="mb-2"
        />
        <div className="max-h-[420px] overflow-y-auto thin-scrollbar border border-gray-100 rounded-lg">
          {!stores && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              Loading…
            </div>
          )}
          {stores &&
            filteredStores.map((s) => {
              const isSel = selectedStore?.storeid === s.storeid;
              return (
                <button
                  key={s.storeid}
                  onClick={() => setSelectedStore(s)}
                  style={
                    isSel
                      ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                      : undefined
                  }
                  className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-b-0 text-[12px] transition-colors ${
                    isSel ? "bg-custom-white" : "hover:bg-gray-50 text-content"
                  }`}
                >
                  {s.store_name}
                </button>
              );
            })}
          {stores && filteredStores.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No stores found
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-5">
        <div className="text-[13px] font-semibold text-content mb-0.5">
          Rename store
        </div>
        <div className="text-[12px] text-content mb-4">
          Ensure the new store name is unique from the current name
        </div>

        <div className="space-y-3 max-w-sm">
          <Input
            label="Selected store name"
            value={selectedStore ? selectedStore.store_name : ""}
            setValue={() => {}}
            className="opacity-50 pointer-events-none py-1.5 text-[13px]"
          />
          <Input
            label="New store name"
            value={newName}
            setValue={setNewName}
            className="py-1.5 text-[13px]"
          />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full text-[12px] font-medium py-1.5 rounded-md text-custom-white ${
              canSubmit
                ? "bg-[#1e2a4a] hover:bg-[#1e2a4a]/85"
                : "bg-gray-300 cursor-not-allowed"
            }`}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewStoreName;
