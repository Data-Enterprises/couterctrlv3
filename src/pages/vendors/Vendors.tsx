import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import { formatGoliathDate, getStoreName } from "../../utils";
import {
  setRows,
  setRaw,
  setLoading,
  setLoadingMessage,
  setStore,
  setRange,
  reQuery,
} from "../../features/vendorsSlice";
import { fetchVendorPeriods } from "./vendorsData";
import { buildVendorRows, datesOf } from "./vendorsUtils";
import VendorListPanel from "./VendorListPanel";
import VendorDetailPanel from "./VendorDetailPanel";

/**
 * Vendors — Performance.
 *
 * One store, one week, graded against last week and the same week last year.
 * Structurally the sibling of Sub Dept Margins and Categories: single-store
 * search, a graded list on the left, detail on the right, a metric toggle and a
 * threshold the user sets.
 *
 * The fetch lives here rather than in a panel, per the page pattern — panels
 * render what the container loaded and never reach for data themselves.
 */
const Vendors = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  const vend = useAppSelector((s) => s.vendors);

  const [searchOpen, setSearchOpen] = useState(false);
  const [storeId, setStoreId] = useState(search.lastStore || 0);

  const runSearch = async () => {
    if (!storeId) {
      toast.error("Pick a store first.");
      return;
    }

    // The week runs backwards from the chosen date, matching every other
    // Performance page — the picker names the end of the week, not the start.
    const end = formatGoliathDate(search.singleDate);
    const [y, m, d] = end.split("-").map(Number);
    const startDt = new Date(Date.UTC(y, m - 1, d - 6));
    const start = startDt.toISOString().slice(0, 10);

    dispatch(reQuery());
    dispatch(setLoading(true));
    dispatch(setLoadingMessage("Finding sub departments…"));
    dispatch(setRange({ start, end }));
    dispatch(
      setStore({
        storeid: storeId,
        storeName: getStoreName(user.assignedStores, storeId),
      }),
    );

    try {
      const { tw, lw, ly, subDeptIds } = await fetchVendorPeriods(
        { url: context.url, token: context.token, storeid: storeId },
        start,
        end,
        // Vendor lives on item rows, which arrive one department at a time —
        // so this is departments x three periods. Naming the work in progress
        // is the difference between a wait and a hang.
        (done, total) =>
          dispatch(setLoadingMessage(`Loading vendors… ${done} of ${total}`)),
      );

      if (subDeptIds.length === 0) {
        toast.error("No sub departments returned for that store and week.");
        return;
      }

      dispatch(setRaw({ tw, lw, ly }));
      const rows = buildVendorRows(tw, lw, ly, datesOf(tw));
      dispatch(setRows(rows));

      if (rows.length === 0) {
        toast.error("No vendor sales returned for that store and week.");
      }
    } catch {
      toast.error("Couldn't load vendors. Try again in a moment.");
    } finally {
      dispatch(setLoading(false));
      dispatch(setLoadingMessage(""));
    }
  };

  const entry = (
    <SingleStoreSearchCard
      title="Vendor Performance"
      description="Pick a store and a week. Vendors are graded against last week and the same week last year."
      buttonLabel="Load vendors"
      stores={user.assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={() => {
        setSearchOpen(false);
        runSearch();
      }}
      loading={vend.loading}
      loadingMessage={vend.loadingMessage}
      datePicker={<SingleDatePicker />}
    />
  );

  if (vend.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message={vend.loadingMessage || "Loading vendors..."} />
      </div>
    );
  }

  if (vend.rows.length === 0) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] flex items-center justify-center p-4">
        {entry}
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden">
      {/* Re-search is an overlay, never a return to the entry screen — losing
          the loaded week to change one field is the thing that pattern exists
          to prevent. */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>{entry}</div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        <VendorListPanel onSearchOpen={() => setSearchOpen(true)} />
        <VendorDetailPanel />
      </div>
    </div>
  );
};

export default Vendors;
