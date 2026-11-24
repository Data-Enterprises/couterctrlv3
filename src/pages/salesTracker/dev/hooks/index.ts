// Hooks
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import { setStartDate, isGroupSearch } from "../../../../features/searchSlice";
import {
  setHasSearched,
  setLoading,
  setScopeLabel,
  setRows,
  appendRows,
  setAddingWeek,
  MAX_WEEKS,
  MIN_WEEKS,
  reQueryTracker,
} from "../../../../features/dev/devSalesTrackerSlice";

// Utils
import { formatGoliathDate, getStoreName } from "../../../../utils";
import { fetchLySubSales, fetchTrackerWindow } from "../utils/trackerData";
import { buildWindowPlan, isoToDisplay, shiftDays } from "../utils";

// Interfaces
import type { TrackerBasis } from "../interfaces";

/** What Sales Tracker reads from Redux: the session, the search, the user's
 *  stores and groups, and the tracker's own slice. */
export const useSalesTrackerCtx = () => {
  const { url, token } = useAppSelector((s) => s.app);
  const search = useAppSelector((s) => s.search);
  const { startDate, endDate } = search;
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const { groups } = useAppSelector((s) => s.group);
  const tracker = useAppSelector((s) => s.dev.salesTracker);
  return {
    ...tracker,
    url,
    token,
    search,
    startDate,
    endDate,
    assignedStores,
    groups,
  };
};

/**
 * The tracker's reads: the full search (with a last-week fallback when last
 * year is empty), one more week on the front of the window (only the gap is
 * fetched), and one week off it (no fetch).
 */
export const useTrackerFetch = (
  plan: ReturnType<typeof buildWindowPlan>,
  setSearchModalOpen: (open: boolean) => void,
  setFetchFailed: (failed: boolean) => void,
  setProgress: (progress: string) => void,
) => {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const {
    url,
    token,
    search,
    assignedStores,
    groups,
    basis,
    loadedFrom,
    addingWeek,
  } = useSalesTrackerCtx();

  /** The search scope, shared by the full search and the add-a-week fetch so
   *  they agree on the store. */
  const isGroup = isGroupSearch(search.type);
  const useGroups = isGroup ? 1 : 0;
  const searchValue = isGroup ? search.lastGroup : search.lastStore;
  const scope = { url, token, useGroups, searchValue };

  /**
   * One more week, on the front of the window: the start date moves back seven
   * days and only the gap is fetched (`loadedFrom` says how far back rows
   * reach). The date moves only once the rows are in, so totals never read low
   * mid-fetch.
   */
  const addWeek = async () => {
    if (plan.weeks.length >= MAX_WEEKS || addingWeek) return;

    const newStart = shiftDays(plan.tyStart, -7);

    // Already in hand — dropped earlier and now coming back.
    if (loadedFrom && newStart >= loadedFrom) {
      dispatch(setStartDate(isoToDisplay(newStart)));
      return;
    }

    // The gap alone, with its own LY range from the plan (every day shifted,
    // extremes taken), so a holiday week asks for the days it pairs with.
    const gap = buildWindowPlan(
      newStart,
      shiftDays(loadedFrom ?? plan.tyStart, -1),
      basis,
    );

    dispatch(setAddingWeek(true));
    try {
      const res = await fetchTrackerWindow(scope, gap);
      if (!res) return;
      dispatch(appendRows({ ty: res.ty, ly: res.ly, from: newStart }));
      dispatch(setStartDate(isoToDisplay(newStart)));
    } catch {
      toast.error("Could not load that week.");
    } finally {
      dispatch(setAddingWeek(false));
    }
  };

  /** One week off the front. No fetch, and the rows stay — narrowing the
   *  window is all that happened, so adding it back is instant. */
  const dropWeek = () => {
    if (plan.weeks.length <= MIN_WEEKS) return;
    dispatch(setStartDate(isoToDisplay(shiftDays(plan.tyStart, 7))));
  };

  const fetchTracker = async () => {
    if (!searchValue) {
      toast.warn("Pick a store or group first");
      return;
    }

    dispatch(
      setScopeLabel(
        isGroup
          ? (groups.find((g) => g.id === search.lastGroup)?.group_name ??
              "Group")
          : getStoreName(
              assignedStores,
              search.lastStore,
              `Store ${search.lastStore}`,
            ),
      ),
    );
    dispatch(setLoading(true));
    dispatch(setHasSearched(true));
    dispatch(reQueryTracker());
    setSearchModalOpen(false);
    setFetchFailed(false);

    try {
      // One request per period per four weeks, four at a time. A superseded
      // search resolves to null rather than to a partial window.
      const res = await fetchTrackerWindow(scope, plan, (done, total) =>
        setProgress(done < total ? `${done} of ${total} loaded` : ""),
      );
      setProgress("");
      if (!res) return;
      const tyRows = res.ty;
      let lyRows = res.ly;

      /*
       * No last year, so read the window against last week, asked for only
       * when the first answer is empty. One basis for the whole window, never a
       * mix. If last week is empty too, the basis stays LY.
       */
      let used: TrackerBasis = "LY";
      if (tyRows.length > 0 && lyRows.length === 0) {
        const lwPlan = buildWindowPlan(
          formatGoliathDate(search.startDate),
          formatGoliathDate(search.endDate),
          "LW",
        );
        const lwRows = await fetchLySubSales(
          scope,
          lwPlan.lyStart,
          lwPlan.lyEnd,
        );
        if (lwRows.length > 0) {
          lyRows = lwRows;
          used = "LW";
        }
      }

      if (tyRows.length === 0) setFetchFailed(true);
      dispatch(
        setRows({ ty: tyRows, ly: lyRows, from: plan.tyStart, basis: used }),
      );
    } catch (err) {
      setFetchFailed(true);
      setProgress("");
      toast.error(
        err instanceof Error ? err.message : "Could not load the tracker",
      );
      dispatch(setRows({ ty: [], ly: [], from: plan.tyStart, basis: "LY" }));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { addWeek, dropWeek, fetchTracker };
};
