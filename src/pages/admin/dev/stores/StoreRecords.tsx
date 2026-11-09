// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useAdminPageCtx } from "../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  setStoreCompanyFilter,
  setStoreRecords,
  setStoreSearch,
  setStoreStatusFilter,
} from "../../../../features/dev/devAdminPageSlice";

// API
import { getUserStores } from "../../../../api/user";
import {
  createNewStore,
  deactivateStore,
  reactivateStore,
  setNewStoreName,
} from "../../../../api/admin";

// Utils
import {
  statusOf,
  statusReported,
  withClosedMark,
  withoutClosedMark,
} from "../utils";
import { UNKNOWN_NOTE } from "./utils";

// Interfaces
import type { JsonError, Store } from "../../../../interfaces";
import type { StatusFilter } from "../../../../features/dev/devAdminPageSlice";
import type { StoreForm } from "./interfaces";

// Components
import { PlusIcon } from "@heroicons/react/20/solid";
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import StoreFormModal from "./components/StoreFormModal";
import StoreRow from "./components/StoreRow";

/** The Store Records tab: every store with company and open or closed filters and a search, plus Add, Rename
 *  and Close or Re-open (closing asks for confirmation). */
const StoreRecords = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const dispatch = useAppDispatch();
  const {
    storeRecords: stores,
    storeSearch: search,
    storeCompanyFilter: companyFilter,
    storeStatusFilter: statusFilter,
  } = context;
  // Pop-ups and the save in flight: nothing to keep once the tab is left.
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [deactivating, setDeactivating] = useState<Store | null>(null);
  const [saving, setSaving] = useState(false);

  /** The backend can return a null store_name or store_number despite the
   *  type claiming string, and the search below throws on a null
   *  `toLowerCase`. */
  const validOnly = (list: Store[]) =>
    list.filter((s) => s.store_number !== null && s.store_name !== null);

  const fetchStores = () => {
    getUserStores(context.url, context.token, context.userid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "Error fetching stores");
          return;
        }
        dispatch(
          setStoreRecords([
            ...validOnly(j.assigned_stores ?? []),
            // Below level 9 the unassigned half is other operators' stores.
            ...(context.canSeeAllStores
              ? validOnly(j.unassigned_stores ?? [])
              : []),
          ]),
        );
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  useEffect(fetchStores, []);

  const statusKnown = useMemo(
    () => statusReported(stores ?? []),
    [stores],
  );

  const filtered = useMemo(() => {
    if (!stores) return [];
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      const byCompany = companyFilter
        ? s.company === Number(companyFilter)
        : true;
      const bySearch = q
        ? s.store_name.toLowerCase().includes(q) ||
          s.store_number.toLowerCase().includes(q)
        : true;
      // A row whose status is unknown is never filtered OUT by a status
      // choice — hiding rows on a question the data cannot answer would
      // quietly shorten the list for no reason the reader can see.
      const st = statusOf(s);
      const byStatus =
        statusFilter === "all" ||
        st === "unknown" ||
        st === statusFilter;
      return byCompany && bySearch && byStatus;
    });
  }, [
    stores,
    search,
    companyFilter,
    statusFilter,
  ]);

  const handleCreate = (form: StoreForm) => {
    setSaving(true);
    createNewStore(
      context.url,
      context.token,
      form.storeid,
      form.store_number,
      form.store_name,
      form.company,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be created");
          return;
        }
        toast.success(`${form.store_name} created`);
        setCreating(false);
        fetchStores();
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setSaving(false));
  };

  const handleRename = (form: StoreForm) => {
    if (!editing) return;
    setSaving(true);
    setNewStoreName(
      context.url,
      context.token,
      editing.storeid,
      form.store_name,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be renamed");
          return;
        }
        toast.success(`Renamed to ${form.store_name}`);
        setEditing(null);
        fetchStores();
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => setSaving(false));
  };

  // Close or re-open a store, and move the CLOSED marker in its name with it.
  const changeStatus = (store: Store, next: "deactivate" | "reactivate") => {
    const call = next === "deactivate" ? deactivateStore : reactivateStore;
    const verb = next === "deactivate" ? "closed" : "re-opened";
    const wanted =
      next === "deactivate"
        ? withClosedMark(store.store_name)
        : withoutClosedMark(store.store_name);

    call(context.url, context.token, store.storeid)
      .then(async (resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be updated");
          return;
        }
        setDeactivating(null);

        if (wanted === store.store_name) {
          toast.success(`${store.store_name} ${verb}`);
          return;
        }

        try {
          const r = await setNewStoreName(
            context.url,
            context.token,
            store.storeid,
            wanted,
          );
          if (r.data.error !== 0)
            throw new Error(r.data.msg ?? "rename failed");
          toast.success(`${wanted} ${verb}`);
        } catch {
          toast.warn(
            `${store.store_name} ${verb}, but the name could not be updated to "${wanted}". Rename it with the pencil.`,
          );
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => fetchStores());
  };

  const companyOptions = context.companies.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-full">
      <div className="flex items-center gap-2 mb-3">
        <SelectFilter
          options={companyOptions}
          value={companyFilter}
          onChange={(v) => dispatch(setStoreCompanyFilter(v))}
          placeholder="All companies"
          className="w-[190px] flex-shrink-0"
        />
        {statusKnown && (
          <SelectFilter
            options={[
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
            value={statusFilter === "all" ? "" : statusFilter}
            onChange={(v) =>
              dispatch(setStoreStatusFilter((v || "all") as StatusFilter))
            }
            placeholder="Open and closed"
            className="w-[150px] flex-shrink-0"
          />
        )}
        <TextFilter
          value={search}
          onChange={(v) => dispatch(setStoreSearch(v))}
          placeholder="Search stores…"
          className="flex-1"
        />
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1 text-[11.5px] font-medium px-3 py-1.5 rounded-md text-custom-white bg-brand_navy hover:bg-brand_navy/85 flex-shrink-0"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          New store
        </button>
      </div>

      <div className="border border-gray-100 rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <div
          className={`grid grid-cols-[13%_33%_26%_14%_14%] px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0`}
        >
          <div>Number</div>
          <div>Name</div>
          <div>Company</div>
          <div>{statusKnown ? "Status" : ""}</div>
          <div></div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
          {filtered.map((s) => (
            <StoreRow
              key={`${s.storeid}__${s.store_number}`}
              s={s}
              setEditing={setEditing}
              setDeactivating={setDeactivating}
              changeStatus={changeStatus}
            />
          ))}

          {stores !== null && filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No stores found
            </div>
          )}
          {stores === null && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              Loading stores…
            </div>
          )}
        </div>
      </div>

      {!statusKnown && stores !== null && (
        <p className="text-[12px] text-content/85 mt-2 leading-snug max-w-[760px]">
          {UNKNOWN_NOTE}
        </p>
      )}

      {(creating || editing) && (
        <StoreFormModal
          initial={editing}
          companies={companyOptions}
          existingNumbers={(stores ?? []).map((s) =>
            s.store_number.toLowerCase(),
          )}
          existingIds={(stores ?? []).map((s) => s.storeid)}
          saving={saving}
          onSave={editing ? handleRename : handleCreate}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {deactivating && (
        <ConfirmModal
          title={`Close ${deactivating.store_name}?`}
          message={`The record stays and nothing is lost — it is marked closed from today and renamed to "${withClosedMark(deactivating.store_name)}". Re-opening it is one click on the same row.`}
          confirmLabel="Close store"
          onConfirm={() => changeStatus(deactivating!, "deactivate")}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
};

export default StoreRecords;
