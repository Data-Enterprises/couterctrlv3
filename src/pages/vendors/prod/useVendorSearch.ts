import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { formatGoliathDate, getStoreName } from "../../../utils";
import {
  setRows,
  setRaw,
  setLoading,
  setLoadingMessage,
  setStore,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  setRange,
  reQuery,
} from "../../../features/vendorsSlice";
import { fetchVendorPeriods } from "./vendorsData";
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
export const useVendorSearch = () => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const context = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const user = useAppSelector((s) => s.user);
  // Narrow on purpose: re-presenting a cached search needs the rows, and this
  // hook should not re-render its caller on every filter change.
  const raw = useAppSelector((s) => s.prod.vendors.raw);

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

    try {
      // One phase now, so one message. This used to announce a second step
      // once the department list came back, because the row fetch after it ran
      // a call per department per period; the search is two paginated reads and
      // there is no longer a first step to finish.
      const { tw, lw, ly, subDeptIds } = await fetchVendorPeriods(
        { url: context.url, token: context.token, storeid: storeId },
        start,
        end,
      );

      if (subDeptIds.length === 0) {
        toast.error("No sub departments returned for that store and week.");
        return 0;
      }

      // A storeid can cover two physical stores, and `subs/subs` is
      // fetched by storeid, so both arrive added together. Establish the
      // locations from the rows and land on the first one rather than the
      // combined view -- combined is a real question somebody can ask, but
      // it is the wrong thing to show without being asked.
      const numbers = storeNumbersIn(tw);
      dispatch(setAvailableStoreNumbers(numbers));
      const landing = numbers.length > 1 ? numbers[0] : null;
      dispatch(setSelectedStoreNumber(landing));

      // Raw stays whole. Switching location re-presents what is already here
      // rather than asking the server for the same 13MB again.
      dispatch(setRaw({ tw, lw, ly }));
      const scoped = scopePeriods({ tw, lw, ly }, landing);
      const rows = buildVendorRows(
        scoped.tw,
        scoped.lw,
        scoped.ly,
        datesOf(scoped.tw),
      );
      dispatch(setRows(rows));

      if (rows.length === 0) {
        toast.error("No vendor sales returned for that store and week.");
      }
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
   * No refetch: the raw rows for every location are kept, so this is a filter
   * and a rebuild. The grading, the totals and the day strip all follow from
   * the rows, so rebuilding them is the whole of the change.
   */
  const applyLocation = (storeNumber: string | null) => {
    dispatch(setSelectedStoreNumber(storeNumber));
    const scoped = scopePeriods(raw, storeNumber);
    dispatch(
      setRows(
        buildVendorRows(scoped.tw, scoped.lw, scoped.ly, datesOf(scoped.tw)),
      ),
    );
  };

  return { runSearch, applyLocation };
};
