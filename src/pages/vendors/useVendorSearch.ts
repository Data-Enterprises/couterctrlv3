import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
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
      const { tw, lw, ly, subDeptIds } = await fetchVendorPeriods(
        { url: context.url, token: context.token, storeid: storeId },
        start,
        end,
        // Two steps, not a counter. Vendor lives on item rows that arrive one
        // department at a time, so any count here is departments x periods —
        // which reads as a vendor count and isn't one.
        () => dispatch(setLoadingMessage("Loading vendors…")),
      );

      if (subDeptIds.length === 0) {
        toast.error("No sub departments returned for that store and week.");
        return 0;
      }

      dispatch(setRaw({ tw, lw, ly }));
      const rows = buildVendorRows(tw, lw, ly, datesOf(tw));
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

  return { runSearch };
};
