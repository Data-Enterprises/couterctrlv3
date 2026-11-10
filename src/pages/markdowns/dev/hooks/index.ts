// Hooks
import { useMemo, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useDevApi } from "../../../../hooks/useDevApi";
import { useToast } from "../../../../components/toasts/hooks/useToast";

// Redux
import {
  clearMarkdownFilters,
  setLoading,
  setMarkdowns,
  setNotice,
  setProgress,
} from "../../../../features/dev/devMarkdownsSlice";
import { isGroupSearch } from "../../../../features/searchSlice";

// API
import { getMarkdowns } from "../../../../api/markdowns";

// Utils
import { formatGoliathDate } from "../../../../utils";
import { filterRows, sortRows } from "../utils";

// Interfaces
import type {
  MarkdownItem,
  MarkdownResponse,
} from "../../../../interfaces/markdowns";

/**
 * Everything the Markdowns page reads, in one place: the slice, the search it
 * runs on, and the dev API it calls (Coming Soon pages only call dev).
 */
export const useMarkdownsCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useDevApi();
  const {
    type,
    startDate,
    endDate,
    lastStore,
    lastGroup,
    selectedStore,
    selectedGroup,
  } = useAppSelector((state) => state.search);
  const markdowns = useAppSelector((state) => state.dev.markdowns);

  return {
    dispatch,
    url,
    token,
    type,
    startDate,
    endDate,
    lastStore,
    lastGroup,
    /** The store or group searched, as the panel headers name it. */
    scopeLabel: isGroupSearch(type)
      ? (selectedGroup?.group_name ?? "Group")
      : (selectedStore?.store_name ?? "Store"),
    ...markdowns, // markdowns, loading, progress, notice, filters, sort
  };
};

/** The rows the grid and the export show: filtered, then sorted. */
export const useVisibleMarkdowns = () => {
  const { markdowns, filters, sort } = useMarkdownsCtx();
  return useMemo(
    () => sortRows(filterRows(markdowns, filters), sort),
    [markdowns, filters, sort],
  );
};

/**
 * Loads every markdown for the current search: page 1, then the rest one at a
 * time, so "page 2 of 4" is true and no burst of 3 MB pages lands at once.
 */
export const useLoadMarkdowns = () => {
  const ctx = useMarkdownsCtx();
  const toast = useToast();
  // A newer search makes an older one's late pages stale.
  const run = useRef(0);

  return async () => {
    const thisRun = ++run.current;
    const useGroups = isGroupSearch(ctx.type) ? 1 : 0;
    const searchValue = useGroups ? ctx.lastGroup : ctx.lastStore;
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    ctx.dispatch(setMarkdowns([]));
    // The last search's picks may not exist in this one's rows, as in Orders.
    ctx.dispatch(clearMarkdownFilters());
    ctx.dispatch(setNotice(null));
    ctx.dispatch(setLoading(true));

    try {
      const first: MarkdownResponse = (
        await getMarkdowns(
          ctx.url,
          ctx.token,
          start,
          end,
          searchValue,
          useGroups,
          1,
        )
      ).data;
      if (thisRun !== run.current) return;
      if (first.error !== 0) {
        toast.warn(first.msg);
        return;
      }
      if (first.total_records === 0) {
        ctx.dispatch(setNotice("No markdowns came back for this search."));
        return;
      }

      let rows: MarkdownItem[] = first.markdowns;
      ctx.dispatch(setMarkdowns(rows));
      ctx.dispatch(setProgress({ page: 1, total: first.total_pages }));

      for (let page = 2; page <= first.total_pages; page++) {
        const next: MarkdownResponse = (
          await getMarkdowns(
            ctx.url,
            ctx.token,
            start,
            end,
            searchValue,
            useGroups,
            page,
          )
        ).data;
        if (thisRun !== run.current) return;
        rows = [...rows, ...next.markdowns];
        ctx.dispatch(setMarkdowns(rows));
        ctx.dispatch(setProgress({ page, total: first.total_pages }));
      }
    } catch (err) {
      // The backend answers "No stores found" and the like with a 4xx, which
      // axios throws: show its message rather than the HTTP one.
      const e = err as {
        response?: { data?: { msg?: string } };
        message: string;
      };
      toast.error(e.response?.data?.msg ?? e.message);
    } finally {
      if (thisRun === run.current) {
        ctx.dispatch(setProgress(null));
        ctx.dispatch(setLoading(false));
      }
    }
  };
};
