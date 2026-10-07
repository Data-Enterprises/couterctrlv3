import { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  PlusIcon,
  LockClosedIcon,
  LockOpenIcon,
} from "@heroicons/react/20/solid";
import { useAdminPageCtx } from "./hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getUserStores } from "../../../api/user";
import {
  createNewStore,
  deactivateStore,
  reactivateStore,
  setNewStoreName,
} from "../../../api/admin";
import type { JsonError, Store } from "../../../interfaces";
import TextFilter from "../../../components-dev/filters/TextFilter";
import SelectFilter from "../../../components-dev/filters/SelectFilter";
import IconButton from "../../../components-dev/IconButton";
import ConfirmModal from "../../../components-dev/ConfirmModal";
import StoreFormModal, { type StoreForm } from "./StoreFormModal";
import {
  closedOn,
  statusOf,
  statusReported,
  type StatusFilter,
} from "./storeStatus";

/**
 * The store records, as a grid.
 *
 * Built the way CompanyGrid is, because it is the same job one tab over:
 * a filtered list, icon actions on each row, and one modal that both creates
 * and edits. Two grids in one page that behave differently is a thing to
 * learn twice.
 *
 * Owner and up — the whole dev Admin page is behind ADMIN_MIN_LEVEL, so there
 * is no second gate here.
 *
 * Renaming used to be its own tab, which meant finding the same store twice
 * to rename it and then retire it. It is the pencil now.
 *
 * Stores are fetched into local state rather than read from `state.user`'s
 * assigned/unassigned lists: those back the signed-in user's own nav and
 * permissions, and a page that creates and retires records should not be
 * editing the list its own chrome is drawn from.
 */

const COLS = "grid-cols-[13%_33%_26%_14%_14%]";

/** Shown only while the endpoint is not reporting status — see `statusOf`. */
const UNKNOWN_NOTE =
  "This list is not reporting which stores are already closed, so every row offers both actions. Both are safe to repeat.";

const StoreRecords = () => {
  const toast = useToast();
  const context = useAdminPageCtx();

  const [stores, setStores] = useState<Store[] | null>(null);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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
        setStores([
          ...validOnly(j.assigned_stores ?? []),
          // Below level 9 the unassigned half is other operators' stores.
          ...(context.canSeeAllStores ? validOnly(j.unassigned_stores ?? []) : []),
        ]);
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  useEffect(fetchStores, []);

  const statusKnown = useMemo(() => statusReported(stores ?? []), [stores]);

  const filtered = useMemo(() => {
    if (!stores) return [];
    const q = search.trim().toLowerCase();
    return stores.filter((s) => {
      const byCompany = companyFilter ? s.company === Number(companyFilter) : true;
      const bySearch = q
        ? s.store_name.toLowerCase().includes(q) ||
          s.store_number.toLowerCase().includes(q)
        : true;
      // A row whose status is unknown is never filtered OUT by a status
      // choice — hiding rows on a question the data cannot answer would
      // quietly shorten the list for no reason the reader can see.
      const st = statusOf(s);
      const byStatus =
        statusFilter === "all" || st === "unknown" || st === statusFilter;
      return byCompany && bySearch && byStatus;
    });
  }, [stores, search, companyFilter, statusFilter]);

  const handleCreate = (form: StoreForm) => {
    setSaving(true);
    createNewStore(
      context.url,
      context.token,
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
    setNewStoreName(context.url, context.token, editing.storeid, form.store_name)
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

  const changeStatus = (store: Store, next: "deactivate" | "reactivate") => {
    const call = next === "deactivate" ? deactivateStore : reactivateStore;
    call(context.url, context.token, store.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error !== 0) {
          toast.error(j.msg || "The store could not be updated");
          return;
        }
        toast.success(
          `${store.store_name} ${next === "deactivate" ? "closed" : "re-opened"}`,
        );
        setDeactivating(null);
        // The row's status and its one lock both change with this, so the
        // list is re-read rather than patched locally.
        fetchStores();
      })
      .catch((err: JsonError) => toast.error(err.message));
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
          onChange={setCompanyFilter}
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
            onChange={(v) => setStatusFilter((v || "all") as StatusFilter)}
            placeholder="Open and closed"
            className="w-[150px] flex-shrink-0"
          />
        )}
        <TextFilter
          value={search}
          onChange={setSearch}
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
          className={`grid ${COLS} px-3 py-2 bg-gray-50 text-[9px] font-bold uppercase tracking-wide text-content flex-shrink-0`}
        >
          <div>Number</div>
          <div>Name</div>
          <div>Company</div>
          <div>{statusKnown ? "Status" : ""}</div>
          <div></div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto thin-scrollbar divide-y divide-brand_navy/15">
          {filtered.map((s) => (
            <div
              key={`${s.storeid}__${s.store_number}`}
              className={`grid ${COLS} px-3 py-2 text-[12px] items-center text-content even:bg-row_stripe hover:bg-gray-50`}
            >
              <div className="truncate tabular-nums">{s.store_number}</div>
              {/* The name usually carries the number too — "043 - PLF ATHENS
                  TN" — which is how it reads everywhere else in the app, so
                  it is left as it is rather than stripped. */}
              <div className="truncate">{s.store_name}</div>
              <div className="truncate">{s.company_name}</div>

              {/* A pill either way once the status is reported, from one
                  family so the two read as a pair. Nothing at all while it
                  is unknown — a blank cell says "not reported", and an
                  "Active" pill on a store nobody has asked about would be a
                  claim rather than a reading. */}
              <div className="truncate">
                {statusOf(s) === "closed" && (
                  <span
                    className="inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded bg-severity_watch_bg text-severity_watch_text"
                    title={`Closed ${closedOn(s.deactivated_at as string)}`}
                  >
                    Closed
                  </span>
                )}
                {statusOf(s) === "open" && (
                  <span className="inline-block text-[11px] font-semibold px-1.5 py-0.5 rounded bg-severity_healthy_bg text-severity_healthy_text">
                    Active
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-1">
                <IconButton
                  icon={PencilIcon}
                  title={`Rename ${s.store_name}`}
                  onClick={() => setEditing(s)}
                />
                {/* One lock once the status is readable: closed rows offer
                    the way back, open rows the way out. Both only while the
                    endpoint is not saying which. */}
                {statusOf(s) !== "open" && (
                  <IconButton
                    icon={LockOpenIcon}
                    title={`Re-open ${s.store_name}`}
                    onClick={() => changeStatus(s, "reactivate")}
                  />
                )}
                {statusOf(s) !== "closed" && (
                  <IconButton
                    icon={LockClosedIcon}
                    title={`Close ${s.store_name}`}
                    variant="danger"
                    onClick={() => setDeactivating(s)}
                  />
                )}
              </div>
            </div>
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
          message="The record stays and nothing is lost — it is marked closed from today. Re-opening it is one click on the same row."
          confirmLabel="Close store"
          onConfirm={() => changeStatus(deactivating, "deactivate")}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
};

export default StoreRecords;
