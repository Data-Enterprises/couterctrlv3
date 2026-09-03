import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getSaleTypes, getCashierTable } from "../../api/lossPrevention";
import { fetchAllPages } from "../../utils/paging";
import { createRequestQueue } from "../../utils/requestQueue";
import {
  clearLpResult,
  setLpLoading,
  setLpMessage,
  setLpError,
  setLpResult,
  setLpScopeLabel,
} from "../../features/lpActionsSlice";
import { getStoreName } from "../../utils";
import type {
  CashierRollupRow,
  CashierTransaction,
  JsonError,
} from "../../interfaces";
import {
  weekWindows,
  buildExceptionRows,
  buildExceptionRowsFromRollup,
} from "./lpActionsMetrics";
import { isGroupSearch } from "../../features/searchSlice";

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
 * Weeks do not depend on each other, so they are not run in series — but they
 * are not all fired at once either. Every request here goes through a pooled
 * queue.
 *
 * The unpooled version fired one page-1 per week simultaneously and then, for
 * each, every remaining page simultaneously. On a twenty-store four-week search
 * that is dozens of concurrent multi-hundred-kilobyte queries arriving in a
 * single burst — the same total work as the pooled version, but delivered as a
 * spike, and a spike is what takes the container down rather than the volume.
 *
 * Four at a time is the browser's own per-origin ceiling anyway, so the pool
 * costs no wall-clock against a healthy backend; what it removes is the moment
 * where thirty queries are open at once.
 */

/** Not exceptions. `Sale` is every ordinary line and swamps the chart; LP
 *  filters Tender out of its own list for the same reason. */
const NOT_EXCEPTIONS = ["Tender", "Description", "Sale"];

/**
 * Module-scoped so the ceiling is per tab, not per hook instance — two mounted
 * copies sharing one pool is the point.
 *
 * `startRun` on each search abandons the previous one, so re-running with a new
 * date or week count cannot leave the old search's pages still arriving on top
 * of the new one's.
 */
const walkQueue = createRequestQueue({ concurrency: 4 });

interface Scope {
  url: string;
  token: string;
  useGroups: number;
  searchValue: number;
  singleStore: number;
}

/**
 * The whole span, every type, as per-cashier-per-week counts.
 *
 * Paged like anything else — the rollup has its own, much larger, page ceiling
 * server-side, but a group wide enough to exceed it still has to page rather
 * than silently return its first N stores.
 */
const fetchRollup = async (
  { url, token, useGroups, searchValue, singleStore }: Scope,
  span: { start: string; end: string },
  types: string[],
): Promise<CashierRollupRow[]> => {
  const read = (page: number) =>
    walkQueue.enqueue(`rollup:${page}`, () =>
      getCashierTable(
        url,
        token,
        span.start,
        span.end,
        useGroups,
        searchValue,
        singleStore,
        types,
        page,
        "",
        "cashier",
      ),
    );

  const first = await read(1);
  if (!first || first.data.error !== 0) return [];

  return fetchAllPages<CashierRollupRow>(
    first.data,
    first.data.transactions ?? [],
    async (page) => {
      try {
        const r = await read(page);
        return r && r.data.error === 0 ? r.data.transactions : [];
      } catch {
        return [];
      }
    },
  );
};

export const useLpExceptionWalk = () => {
  const dispatch = useAppDispatch();
  const { url, token, apiEnv } = useAppSelector((s) => s.app);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const { type, lastStore, lastGroup } = useAppSelector((s) => s.search);
  const { groups } = useAppSelector((s) => s.group);

  const run = useCallback(
    async (
      endDate: string,
      weeks: number,
      fresh: boolean,
    ): Promise<boolean> => {
      // Scope comes off the shared search slice, same as every other page —
      // a group is one flag and one id away from a store.
      const isGroup = isGroupSearch(type);
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

      /**
       * The graded week. Preflight asks only about this one.
       *
       * The page answers "what happened this week, and is it unusual" — the
       * earlier weeks exist to be a baseline, never to contribute exception
       * types of their own. A type that did not occur this week has
       * `latest = 0`, which is below MIN_LATEST, so `gradeChange` can only ever
       * return "steady" for it: it would occupy a row that cannot be acted on.
       * Someone wanting that week moves the date rather than reading it out of
       * the corner of this one.
       *
       * It is also the cheapest change available here. `preflight` is a
       * `select distinct sale_type` over the whole store/date range, so a
       * quarter of the range is roughly a quarter of the scan — and the types
       * it drops are types `cashier_table` then never has to group.
       */
      const latest = windows[windows.length - 1];

      dispatch(setLpScopeLabel(scopeLabel));
      // Abandons the previous search's queued and in-flight pages. Without
      // it, changing the date or week count leaves the old walk running
      // alongside the new one — exactly the pile-up the pool exists to stop.
      walkQueue.startRun();
      // A new scope drops the old result now, not when the new one arrives.
      // Add-week keeps it: it is the same search widening, and clearing would
      // blank the page the reader is still looking at.
      if (fresh) dispatch(clearLpResult());
      dispatch(setLpLoading(true));
      dispatch(setLpMessage("Finding exception types…"));

      try {
        const pre = await getSaleTypes(
          url,
          token,
          latest.start,
          latest.end,
          useGroups,
          searchValue,
          singleStore,
        );
        if (pre.data.error !== 0) {
          dispatch(
            setLpError(pre.data.msg ?? "Could not read exception types"),
          );
          return false;
        }

        const types = (pre.data.sale_types as { sale_type: string }[])
          .map((t) => t.sale_type)
          .filter((t) => !NOT_EXCEPTIONS.includes(t));

        if (types.length === 0) {
          // A real answer, not a failure: nothing was flagged this week.
          dispatch(
            setLpResult({
              rows: [],
              rawRows: [],
              windows,
              weeks,
              rollup: false,
              fresh,
            }),
          );
          return true;
        }

        dispatch(
          setLpMessage(
            `Reading ${types.length} exception ${types.length === 1 ? "type" : "types"} across ${weeks} weeks…`,
          ),
        );

        // The rollup replaces the whole walk below with one request.
        //
        // Every week and every type in a single call, because `saleTypes` is an
        // array and the server buckets the weeks itself. Measured against the
        // group this page falls over on: 4 windows x ~97 pages of product-grain
        // rows becomes one or two pages of a few thousand rollup rows.
        //
        // Dev only. The overview is all it can serve — the drill reads
        // `rawRows`, which a rollup does not carry — so the case file is closed
        // off in this mode rather than silently rendering empty. See
        // `rollupMode` on the slice.
        if (apiEnv === "dev") {
          const rollup = await fetchRollup(
            { url, token, useGroups, searchValue, singleStore },
            span,
            types,
          );
          // The same second filter the walk below applies, and for the same
          // reason: `cashier_table` selects whole BASKETS containing an
          // exception and then returns every row in them, so `Sale` and
          // `Tender` come back grouped as their own sale types however the
          // request was worded. The rollup inherits that — it groups the same
          // rows — so without this the page grows a "Sale" and a "Tender" line
          // that prod does not have.
          const wantedTypes = new Set(types);
          const rows = buildExceptionRowsFromRollup(
            windows,
            rollup.filter((r) => wantedTypes.has(r.sale_type)),
          ).map((r) => ({
            ...r,
            storeName: getStoreName(assignedStores, r.storeid, r.storeName),
          }));
          dispatch(
            setLpResult({
              rows,
              rawRows: [],
              windows,
              weeks,
              rollup: true,
              fresh,
            }),
          );
          return true;
        }

        // Every request in the walk goes through the pool, page 1 included, so
        // the four weeks' opening calls queue behind each other rather than
        // landing together.
        const readPage = (w: { start: string; end: string }, page: number) =>
          walkQueue.enqueue(`${w.start}:${page}`, () =>
            getCashierTable(
              url,
              token,
              w.start,
              w.end,
              useGroups,
              searchValue,
              singleStore,
              types,
              page,
            ),
          );

        const rowsByWeek = await Promise.all(
          windows.map(async (w) => {
            const first = await readPage(w, 1);
            // Null means a later search abandoned this one — not a failure,
            // and nothing downstream should run for it.
            if (!first || first.data.error !== 0) return [];
            return fetchAllPages<CashierTransaction>(
              first.data,
              first.data.transactions ?? [],
              async (page) => {
                try {
                  const r = await readPage(w, page);
                  return r && r.data.error === 0 ? r.data.transactions : [];
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
          setLpResult({
            rows,
            rawRows: cleaned.flat(),
            windows,
            weeks,
            rollup: false,
            fresh,
          }),
        );
        return true;
      } catch (err) {
        dispatch(
          setLpError((err as JsonError).message ?? "Could not load exceptions"),
        );
        return false;
      }
    },
    [
      url,
      token,
      apiEnv,
      assignedStores,
      groups,
      type,
      lastStore,
      lastGroup,
      dispatch,
    ],
  );

  return run;
};
