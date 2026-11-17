// Hooks
import { useMemo } from "react";
import { useAdminPageCtx } from "../hooks";
import { useStoreEdits } from "./hooks";

// Redux
import {
  setStoreCompanyFilter,
  setStoreSearch,
  setStoreStatusFilter,
} from "../../../../features/dev/devAdminPageSlice";

// Utils
import {
  hasNoCompany,
  statusOf,
  statusReported,
  withClosedMark,
} from "../utils";
import { UNKNOWN_NOTE } from "./utils";

// Components
import ConfirmModal from "../../../../components-dev/ConfirmModal";
import StoreToolbar from "./components/StoreToolbar";
import StoreTableHead from "./components/StoreTableHead";
import StoreRow from "./components/StoreRow";
import StoreFormModal from "./components/StoreFormModal";

/** The Store Records tab: every store with company and open or closed filters and a search, plus Add, Rename
 *  and Close or Re-open (closing asks for confirmation). */
const StoreRecords = () => {
  const context = useAdminPageCtx();
  const { dispatch } = context;
  const {
    storeRecords: stores,
    storeSearch: search,
    storeCompanyFilter: companyFilter,
    storeStatusFilter: statusFilter,
  } = context;
  const {
    creating,
    setCreating,
    editing,
    setEditing,
    deactivating,
    setDeactivating,
    saving,
    handleCreate,
    handleRename,
    changeStatus,
  } = useStoreEdits(context);

  const statusKnown = useMemo(() => statusReported(stores ?? []), [stores]);

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
        statusFilter === "all" || st === "unknown" || st === statusFilter;
      return byCompany && bySearch && byStatus;
    });
  }, [stores, search, companyFilter, statusFilter]);

  const companyOptions = context.companies.map((c) => ({
    value: String(c.id),
    label: c.name,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4 w-full">
      <StoreToolbar
        companyOptions={companyOptions}
        companyFilter={companyFilter}
        onCompany={(v) => dispatch(setStoreCompanyFilter(v))}
        statusKnown={statusKnown}
        statusFilter={statusFilter}
        onStatus={(v) => dispatch(setStoreStatusFilter(v))}
        search={search}
        onSearch={(v) => dispatch(setStoreSearch(v))}
        canCreate={context.canSeeAllStores}
        onNew={() => setCreating(true)}
      />

      <div className="border border-line_hair rounded-lg overflow-hidden flex-1 min-h-0 flex flex-col">
        <StoreTableHead statusKnown={statusKnown} />

        <div className="cc-scroll divide-y divide-brand_navy/15">
          {filtered.map((s) => (
            <StoreRow
              key={`${s.storeid}__${s.store_number}`}
              store={s}
              canChangeStatus={context.canSeeAllStores}
              canRename={context.canSeeAllStores || !hasNoCompany(s)}
              onRename={() => setEditing(s)}
              onClose={() => setDeactivating(s)}
              onReopen={() => changeStatus(s, "reactivate")}
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
        <p className="text-[12px] text-content/95 mt-2 leading-snug max-w-[760px]">
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
          onConfirm={() => changeStatus(deactivating, "deactivate")}
          onCancel={() => setDeactivating(null)}
        />
      )}
    </div>
  );
};

export default StoreRecords;
