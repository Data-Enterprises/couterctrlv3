import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import SingleDatePicker from "../../components/datePickers/SingleDatePicker";
import { formatGoliathDate, getStoreName } from "../../utils";
import {
  setRows,
  setLoading,
  setLoadingMessage,
  setStore,
  setRange,
  setHourly,
  setLoadingHourly,
  setItems,
  setLoadingItems,
  reQuery,
} from "../../features/categoriesSlice";
import {
  fetchAllPeriods,
  fetchHourlyPeriods,
  fetchCatItemPeriods,
} from "./categoriesData";
import { buildCategoryRows } from "./categoriesUtils";
import CategoryListPanel from "./CategoryListPanel";
import CategoryDetailPanel from "./CategoryDetailPanel";

/**
 * Categories — Performance.
 *
 * One store, one week, graded against last week and the same week last year.
 * Structurally the sibling of Sub Dept Margins: single-store search, a graded
 * list on the left, detail on the right, a metric toggle and a threshold the
 * user sets.
 *
 * The fetch lives here rather than in a panel, per the page pattern — panels
 * render what the container loaded and never reach for data themselves.
 */
const Categories = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  const cats = useAppSelector((s) => s.categories);

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
    dispatch(setLoadingMessage("Loading categories…"));
    dispatch(setRange({ start, end }));
    dispatch(
      setStore({
        storeid: storeId,
        storeName: getStoreName(user.assignedStores, storeId),
      }),
    );

    try {
      const { tw, lw, ly, twDates } = await fetchAllPeriods(
        { url: context.url, token: context.token, storeid: storeId },
        start,
        end,
      );

      const rows = buildCategoryRows(tw, lw, ly, twDates);
      dispatch(setRows(rows));

      if (rows.length === 0) {
        toast.error("No category sales returned for that store and week.");
      }
    } catch {
      toast.error("Couldn't load categories. Try again in a moment.");
    } finally {
      dispatch(setLoading(false));
      dispatch(setLoadingMessage(""));
    }
  };

  /** Hourly for the open category. Deliberately on demand: displayHourly
   *  returns ~10 pages per period, so loading it with the page would be thirty
   *  requests to fill a tab most visits never open. */
  const loadHourly = async () => {
    if (!cats.selectedCategory && cats.selectedCategory !== 0) return;
    dispatch(setLoadingHourly(true));
    try {
      const rows = await fetchHourlyPeriods(
        { url: context.url, token: context.token, storeid: cats.storeid },
        cats.twStart,
        cats.twEnd,
        cats.selectedCategory,
      );
      dispatch(setHourly(rows));
    } catch {
      toast.error("Couldn't load the hourly breakdown.");
    } finally {
      dispatch(setLoadingHourly(false));
    }
  };

  /** Item rows for the open category — all three periods, since every figure in
   *  the item report is graded against last week and last year.
   *
   *  Unlike the hourly drill-down this runs on selection rather than behind a
   *  tab: it's one page per period, and the items *are* the report. */
  useEffect(() => {
    const category = cats.selectedCategory;
    if (category === null || !cats.twStart || !cats.twEnd) return;

    // Clicking down the list faster than the network responds would otherwise
    // let an earlier, slower period land after a later one and render under the
    // wrong category.
    let cancelled = false;
    dispatch(setLoadingItems(true));

    (async () => {
      try {
        const rows = await fetchCatItemPeriods(
          { url: context.url, token: context.token, storeid: cats.storeid },
          cats.twStart,
          cats.twEnd,
          category,
        );
        if (!cancelled) dispatch(setItems(rows));
      } catch {
        if (!cancelled) toast.error("Couldn't load items for that category.");
      } finally {
        if (!cancelled) dispatch(setLoadingItems(false));
      }
    })();

    return () => {
      cancelled = true;
    };
    // toast is deliberately absent: useToast returns a fresh object per render,
    // so listing it would refetch every render.
  }, [
    dispatch,
    cats.selectedCategory,
    cats.twStart,
    cats.twEnd,
    cats.storeid,
    context.url,
    context.token,
  ]);

  const entry = (
    <SingleStoreSearchCard
      title="Category Performance"
      description="Pick a store and a week. Categories are graded against last week and the same week last year."
      buttonLabel="Load categories"
      stores={user.assignedStores}
      selectedStoreId={storeId}
      onStoreSelect={setStoreId}
      onSearch={() => {
        setSearchOpen(false);
        runSearch();
      }}
      loading={cats.loading}
      loadingMessage={cats.loadingMessage}
      datePicker={<SingleDatePicker />}
    />
  );

  if (cats.loading) {
    return (
      <div className="w-full select-none min-h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message={cats.loadingMessage || "Loading categories..."} />
      </div>
    );
  }

  if (cats.rows.length === 0) {
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
        <CategoryListPanel onSearchOpen={() => setSearchOpen(true)} />
        <CategoryDetailPanel onLoadHourly={loadHourly} />
      </div>
    </div>
  );
};

export default Categories;
