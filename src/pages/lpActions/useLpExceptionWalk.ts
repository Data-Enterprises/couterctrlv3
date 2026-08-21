import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getSaleTypes, getCashierTable } from "../../api/lossPrevention";
import { fetchAllPages } from "../../utils/paging";
import {
  setLpLoading,
  setLpMessage,
  setLpError,
  setLpResult,
  setLpScopeLabel,
} from "../../features/lpActionsSlice";
import { getStoreName } from "../../utils";
import type { CashierTransaction, JsonError } from "../../interfaces";
import { weekWindows, buildExceptionRows } from "./lpActionsMetrics";

/**
 * The walk behind LP Actions.
 *
 * Two stages. `cashiers/preflight` says which exception types occurred at all
 * over the whole span — the list is scope-dependent, so it can't be static.
 * Then one paged `cashier_table` request per week, passing **every** type at
 * once: each row carries its own `sale_type`, `cashier_number` and `storeid`,
 * so a single call per week covers every store-and-type combination the page
 * shows. Asking per type per week would multiply the requests by the number of
 * exception types for no extra information.
 *
 * Weeks go out together rather than in series — they don't depend on each
 * other, and a fortnight of history shouldn't cost twice the wait of one.
 */

/** Not exceptions. `Sale` is every ordinary line and swamps the chart; LP
 *  filters Tender out of its own list for the same reason. */
const NOT_EXCEPTIONS = ["Tender", "Description", "Sale"];

export const useLpExceptionWalk = () => {
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((s) => s.app);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const { type, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { groups } = useAppSelector((s) => s.group);

  const run = useCallback(
    async (endDate: string, weeks: number) => {
      // Scope comes off the shared search slice, same as every other page —
      // a group is one flag and one id away from a store.
      const isGroup = type === "Group";
      const useGroups = isGroup ? 1 : 0;
      const singleStore = isGroup ? 0 : 1;
      const searchValue = isGroup ? lastGroup : lastStore;
      const scopeLabel = isGroup
        ? (groups.find((g) => g.id === lastGroup)?.group_name ?? "Group")
        : getStoreName(assignedStores, lastStore, `Store ${lastStore}`);

      const windows = weekWindows(endDate, weeks);
      const span = {
        start: windows[0].start,
        end: windows[windows.length - 1].end,
      };

      dispatch(setLpScopeLabel(scopeLabel));
      dispatch(setLpLoading(true));
      dispatch(setLpMessage("Finding exception types…"));

      try {
        const pre = await getSaleTypes(
          url,
          token,
          span.start,
          span.end,
          useGroups,
          searchValue,
          singleStore,
        );
        if (pre.data.error !== 0) {
          dispatch(
            setLpError(pre.data.msg ?? "Could not read exception types"),
          );
          return;
        }

        const types = (pre.data.sale_types as { sale_type: string }[])
          .map((t) => t.sale_type)
          .filter((t) => !NOT_EXCEPTIONS.includes(t));

        if (types.length === 0) {
          // A real answer, not a failure: nothing was flagged in this span.
          dispatch(setLpResult({ rows: [], rawRows: [], windows, weeks }));
          return;
        }

        dispatch(
          setLpMessage(
            `Reading ${types.length} exception ${types.length === 1 ? "type" : "types"} across ${weeks} weeks…`,
          ),
        );

        const rowsByWeek = await Promise.all(
          windows.map(async (w) => {
            const first = await getCashierTable(
              url,
              token,
              w.start,
              w.end,
              useGroups,
              searchValue,
              singleStore,
              types,
              1,
            );
            if (first.data.error !== 0) return [];
            return fetchAllPages<CashierTransaction>(
              first.data,
              first.data.transactions ?? [],
              async (page) => {
                try {
                  const r = await getCashierTable(
                    url,
                    token,
                    w.start,
                    w.end,
                    useGroups,
                    searchValue,
                    singleStore,
                    types,
                    page,
                  );
                  return r.data.error === 0 ? r.data.transactions : [];
                } catch {
                  return [];
                }
              },
            );
          }),
        );

        // `cashier_table` answers with whole transactions, so rows come back
        // carrying sale types we never asked for — Sale and Tender turn up
        // even when excluded from the request, and Sale alone outnumbers every
        // real exception. Filter on the way back as well as on the way out.
        const wanted = new Set(types);
        const cleaned = rowsByWeek.map((week) =>
          week.filter((r) => wanted.has(r.sale_type)),
        );

        const rows = buildExceptionRows(windows, cleaned).map((r) => ({
          ...r,
          // Store names come from the user's own assignment, never off the
          // payload — the same rule every other page follows.
          storeName: getStoreName(assignedStores, r.storeid, r.storeName),
        }));

        dispatch(
          setLpResult({ rows, rawRows: cleaned.flat(), windows, weeks }),
        );
      } catch (err) {
        dispatch(
          setLpError((err as JsonError).message ?? "Could not load exceptions"),
        );
      }
    },
    [url, token, assignedStores, groups, type, lastStore, lastGroup, dispatch],
  );

  return run;
};
