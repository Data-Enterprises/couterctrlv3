import { onlyStoreNumber, storeNumbersIn } from "../../../utils/storeIdentity";
import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate, getStoreName } from "../../../utils";
import {
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  setRaw,
  setSelectedCategory,
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
} from "../../../features/categoriesSlice";
import {
  fetchAllPeriods,
  fetchCatItemPeriods,
  fetchHourlyPeriods,
} from "./categoriesData";
import { buildCategoryRows, scopePeriods } from "./categoriesUtils";

/**
 * Every fetch the Categories page makes, in one place: the week search, the
 * on-selection item load, and the on-demand hourly load.
 *
 * Lifted out of `Categories.tsx` when mobile arrived. **Call this once per
 * mounted page** — it installs the item-loading effect, so a second caller
 * would fire every item fetch twice. The desktop container calls it and hands
 * the two functions to whichever layout renders.
 */
/** One location's rows across all three periods, for the per-category drill
 *  loads. They are fetched by storeid, so a co-located pair arrives as both
 *  stores; the list beside them is showing one. */
const scopeStoreNumber = <T extends { store_number: string }>(
  rows: { tw: T[]; lw: T[]; ly: T[] },
  storeNumber: string | null,
) =>
  storeNumber === null
    ? rows
    : {
        tw: onlyStoreNumber(rows.tw, storeNumber),
        lw: onlyStoreNumber(rows.lw, storeNumber),
        ly: onlyStoreNumber(rows.ly, storeNumber),
      };

export const useCategoryData = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  const cats = useAppSelector((s) => s.prod.categories);

  /** Resolves to the row count, so a caller can tell "found nothing" from
   *  "never ran" without reading state back on the next render. */
  const runSearch = async (storeId: number): Promise<number> => {
    if (!storeId) {
      toast.error("Pick a store first.");
      return 0;
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

      // A storeid can cover two physical stores and cat_sales is fetched by
      // storeid, so both arrive added together. Establish the locations from
      // the rows and land on the first rather than the combined view --
      // combined is a real question somebody can ask, but it is the wrong
      // thing to show without being asked.
      const numbers = storeNumbersIn(tw);
      dispatch(setAvailableStoreNumbers(numbers));
      const landing = numbers.length > 1 ? numbers[0] : null;
      dispatch(setSelectedStoreNumber(landing));

      // Raw stays whole, so switching location is a rebuild rather than
      // another ten pages per period.
      dispatch(setRaw({ raw: { tw, lw, ly }, twDates }));
      const scoped = scopePeriods({ tw, lw, ly }, landing);
      const rows = buildCategoryRows(scoped.tw, scoped.lw, scoped.ly, twDates);
      dispatch(setRows(rows));

      if (rows.length === 0) {
        toast.error("No category sales returned for that store and week.");
      }
      return rows.length;
    } catch {
      toast.error("Couldn't load categories. Try again in a moment.");
      return 0;
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
      // Fetched by storeid like everything else here, so a co-located pair
      // comes back as both stores. Narrow it to the location the list is
      // showing, or the hours contradict the row that was clicked.
      dispatch(
        setHourly(
          scopeStoreNumber(rows, cats.selectedStoreNumber),
        ),
      );
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
        // Same narrowing as the hourly load: one location, the one on screen.
        if (!cancelled)
          dispatch(setItems(scopeStoreNumber(rows, cats.selectedStoreNumber)));
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

  /**
   * Re-present the search already in the store as one location, or combined.
   *
   * The open category closes with it. Its items and hourly rows were fetched
   * by storeid for the previous location and `setSelectedCategory` clears
   * both, so closing it is what stops the right-hand panel describing a
   * different store from the list beside it.
   */
  const applyLocation = (storeNumber: string | null) => {
    dispatch(setSelectedStoreNumber(storeNumber));
    dispatch(setSelectedCategory(null));
    const scoped = scopePeriods(cats.raw, storeNumber);
    dispatch(
      setRows(buildCategoryRows(scoped.tw, scoped.lw, scoped.ly, cats.twDates)),
    );
  };

  return { runSearch, loadHourly, applyLocation };
};
