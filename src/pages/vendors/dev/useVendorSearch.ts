import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate, getStoreName } from "../../../utils";
import {
  setRows,
  setRaw,
  setRollup,
  setItemsLoading,
  setItemsError,
  setLoading,
  setLoadingMessage,
  setStore,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  setRange,
  reQuery,
} from "../../../features/dev/devVendorsSlice";
import { fetchVendorPeriods, fetchVendorRollup } from "./vendorsData";
import { buildVendorRows, datesOf, scopePeriods } from "./vendorsUtils";
import { storeNumbersIn } from "../../../utils/storeIdentity";

/**
 * The Vendors search, shared by the desktop container and the mobile
 * orchestrator.
 *
 * Lifted out of `Vendors.tsx` when mobile arrived rather than copied into it —
 * the sequence here is load-bearing (the week runs backwards from the picked
 * date, the store name is resolved from `assignedStores`, `reQuery` clears the
 * previous selection before anything new lands) and two copies would drift.
 *
 * Still the container's fetch by the page pattern: this hook is called from a
 * container, never from a panel.
 */
/** The latest search. Item rows that land after a newer search started are
 *  dropped rather than stored under the wrong store or week. Module-level
 *  because desktop and mobile each hold their own copy of the hook. */
let searchSeq = 0;

export const useVendorSearch = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  // Narrow on purpose: re-presenting a cached search needs the totals, and
  // this hook should not re-render its caller on every filter change.
  const rollup = useAppSelector((s) => s.dev.vendors.rollup);

  /** Resolves once the rows are in the store. Returns the row count so a
   *  caller can tell "found nothing" from "never ran" without reading state
   *  back out on the next render. */
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
    dispatch(setLoadingMessage("Finding vendors…"));
    dispatch(setRange({ start, end }));
    dispatch(
      setStore({
        storeid: storeId,
        storeName: getStoreName(user.assignedStores, storeId),
      }),
    );

    const seq = ++searchSeq;
    const scope = { url: context.url, token: context.token, storeid: storeId };

    try {
      /**
       * Two steps, and only the first is waited on.
       *
       * The list comes from `subs/rollup`: the same item rows summed by vendor
       * per location per day on the server, ~40 KB. It is everything the list,
       * the grades, the KPIs and the day strip read, so the page is usable as
       * soon as it lands.
       *
       * The item rows follow behind it, whole, the way the page has always
       * read them (`subs/subs`, ~13 MB for a store-week). The Items table, the
       * critical-items report and the export need them, and every field the
       * endpoint returns stays in hand for whatever the page grows into. The
       * detail panel says they are loading until they land.
       */
      const totals = await fetchVendorRollup(scope, start, end);
      if (seq !== searchSeq) return 0;

      if (totals.tw.length === 0) {
        toast.error("No vendor sales returned for that store and week.");
        return 0;
      }

      // A storeid can cover two physical stores, and both endpoints are
      // fetched by storeid, so both arrive. Establish the locations from the
      // rows and land on the first one rather than the combined view --
      // combined is a real question somebody can ask, but it is the wrong
      // thing to show without being asked.
      const numbers = storeNumbersIn(totals.tw);
      dispatch(setAvailableStoreNumbers(numbers));
      const landing = numbers.length > 1 ? numbers[0] : null;
      dispatch(setSelectedStoreNumber(landing));

      // Kept whole. Switching location re-presents what is already here
      // rather than asking the server again.
      dispatch(setRollup(totals));
      const scoped = scopePeriods(totals, landing);
      const rows = buildVendorRows(
        scoped.tw,
        scoped.lw,
        scoped.ly,
        datesOf(scoped.tw),
      );
      dispatch(setRows(rows));

      dispatch(setItemsLoading(true));
      fetchVendorPeriods(scope, start, end)
        .then(({ tw, lw, ly }) => {
          if (seq !== searchSeq) return;
          dispatch(setRaw({ tw, lw, ly }));
          dispatch(setItemsLoading(false));
        })
        .catch(() => {
          if (seq !== searchSeq) return;
          dispatch(
            setItemsError("Couldn't load the item rows. Search again to retry."),
          );
        });

      return rows.length;
    } catch {
      toast.error("Couldn't load vendors. Try again in a moment.");
      return 0;
    } finally {
      dispatch(setLoading(false));
      dispatch(setLoadingMessage(""));
    }
  };

  /**
   * Re-present the search already in the store as one location, or combined.
   *
   * No refetch: the totals and the item rows for every location are kept, so
   * this is a filter and a rebuild. The list rebuilds from the totals; the
   * detail panel scopes the item rows itself.
   */
  const applyLocation = (storeNumber: string | null) => {
    dispatch(setSelectedStoreNumber(storeNumber));
    const scoped = scopePeriods(rollup, storeNumber);
    dispatch(
      setRows(
        buildVendorRows(scoped.tw, scoped.lw, scoped.ly, datesOf(scoped.tw)),
      ),
    );
  };

  return { runSearch, applyLocation };
};
