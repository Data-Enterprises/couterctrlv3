// Hooks
import { useEffect, useMemo } from "react";
import { useAdminPageCtx } from "../hooks";
import { useAppDispatch } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// API
import { getUserStores } from "../../../../api/user";
import {
  createNewStore,
  deactivateStore,
  reactivateStore,
  setNewStoreName,
} from "../../../../api/admin";

// Interfaces
import type { JsonError, Store } from "../../../../interfaces";
import type { StatusFilter } from "../interfaces";

// Components
import TextFilter from "../../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../../components-dev/filters/SelectFilter";
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import StoreFormModal, { type StoreForm } from "./components/StoreFormModal";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  statusOf,
  statusReported,
  withClosedMark,
  withoutClosedMark,
} from "../utils";
import StoreRow from "./components/StoreRow";
import {
  setCompanyFilter,
  setCreating,
  setDeactivating,
  setEditing,
  setSaving,
  setSearch,
  setStatusFilter,
  setStores,
} from "@/features/dev/devAdminPageSlice";

/** Shown only while the endpoint is not reporting status — see `statusOf`. */
const UNKNOWN_NOTE =
  "This list is not reporting which stores are already closed, so every row offers both actions. Both are safe to repeat.";

const StoreRecords = () => {
  const toast = useToast();
  const context = useAdminPageCtx();
  const dispatch = useAppDispatch();

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
          setStores([
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
    () => statusReported(context.stores ?? []),
    [context.stores],
  );

  const filtered = useMemo(() => {
    if (!context.stores) return [];
    const q = context.search.trim().toLowerCase();
    return context.stores.filter((s) => {
      const byCompany = context.companyFilter
        ? s.company === Number(context.companyFilter)
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
        context.statusFilter === "all" ||
        st === "unknown" ||
        st === context.statusFilter;
      return byCompany && bySearch && byStatus;
    });
  }, [
    context.stores,
    context.search,
    context.companyFilter,
    context.statusFilter,
  ]);

  const handleCreate = (form: StoreForm) => {
    dispatch(setSaving(true));
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
        dispatch(setCreating(false));
        fetchStores();
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setSaving(false)));
  };

  const handleRename = (form: StoreForm) => {
    if (!context.editing) return;
    dispatch(setSaving(true));
    setNewStoreName(
      context.url,
      context.token,
      context.editing.storeid,
      form.store_name,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be renamed");
          return;
        }
        toast.success(`Renamed to ${form.store_name}`);
        dispatch(setEditing(null));
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
        dispatch(setDeactivating(null));

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
          value={context.companyFilter}
          onChange={(v) => dispatch(setCompanyFilter(v))}
          placeholder="All companies"
          className="w-[190px] flex-shrink-0"
        />
        {statusKnown && (
          <SelectFilter
            options={[
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
            value={context.statusFilter === "all" ? "" : context.statusFilter}
            onChange={(v) =>
              dispatch(setStatusFilter((v || "all") as StatusFilter))
            }
            placeholder="Open and closed"
            className="w-[150px] flex-shrink-0"
          />
        )}
        <TextFilter
          value={context.search}
          onChange={(v) => dispatch(setSearch(v))}
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

          {context.stores !== null && filtered.length === 0 && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              No stores found
            </div>
          )}
          {context.stores === null && (
            <div className="flex items-center justify-center py-8 text-[12px] text-content">
              Loading stores…
            </div>
          )}
        </div>
      </div>

      {!statusKnown && context.stores !== null && (
        <p className="text-[12px] text-content/85 mt-2 leading-snug max-w-[760px]">
          {UNKNOWN_NOTE}
        </p>
      )}

      {(context.creating || context.editing) && (
        <StoreFormModal
          initial={context.editing}
          companies={companyOptions}
          existingNumbers={(context.stores ?? []).map((s) =>
            s.store_number.toLowerCase(),
          )}
          existingIds={(context.stores ?? []).map((s) => s.storeid)}
          saving={context.saving}
          onSave={context.editing ? handleRename : handleCreate}
          onClose={() => {
            dispatch(setCreating(false));
            dispatch(setEditing(null));
          }}
        />
      )}

      {context.deactivating && (
        <ConfirmModal
          title={`Close ${context.deactivating.store_name}?`}
          message={`The record stays and nothing is lost — it is marked closed from today and renamed to "${withClosedMark(context.deactivating.store_name)}". Re-opening it is one click on the same row.`}
          confirmLabel="Close store"
          onConfirm={() => changeStatus(context.deactivating!, "deactivate")}
          onCancel={() => dispatch(setDeactivating(null))}
        />
      )}
    </div>
  );
};

export default StoreRecords;
