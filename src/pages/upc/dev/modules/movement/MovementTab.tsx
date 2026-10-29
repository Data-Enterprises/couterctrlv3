import { useEffect, useMemo, useRef, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import { useToast } from "../../../../../components/toasts/hooks/useToast";
import {
  mergeDevMovement,
  setDevMovementLoading,
  setDevMovementSelected,
  setDevMovementWeeks,
  setDevUpcItems,
  type MovementRow,
} from "../../../../../features/dev/devUpcDevSlice";
import {
  getItemActions,
  ITEM_ACTIONS_MAX_CODES,
  type ItemActionsResp,
} from "../../../../../api/subMargins";
import { upcQueue } from "../../upcQueue";
import { missingFrom } from "../../coverage";
import {
  MOVEMENT_MAX_WEEKS,
  fmtMovement,
  isWeighed,
  movementStores,
  movementTotal,
  shortDate,
  sumWeek,
  weekdayOf,
} from "./movementStats";
import { useMovementWindow } from "./useMovementWindow";
import MovementGridPanel from "./MovementGridPanel";

const inBatches = <T,>(xs: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(xs.length / size) }, (_, i) => xs.slice(i * size, (i + 1) * size));

/** How long one week may take. A week of 14 stores answers in well under a
 *  second; one that hasn't answered in this long isn't going to, and the
 *  queue has one slot, so waiting on it would stall every UPC List tab. */
export const MOVEMENT_WEEK_TIMEOUT_MS = 90_000;

class WeekTimeout extends Error {}

/** Run a request with its own deadline, still honouring the queue's abort. */
const withDeadline = async <T,>(
  signal: AbortSignal,
  ms: number,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> => {
  const own = new AbortController();
  const follow = () => own.abort();
  signal.addEventListener("abort", follow, { once: true });
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    own.abort();
  }, ms);
  try {
    return await run(own.signal);
  } catch (err) {
    if (timedOut) throw new WeekTimeout();
    throw err;
  } finally {
    clearTimeout(timer);
    signal.removeEventListener("abort", follow);
  }
};

const reasonOf = (err: unknown): string => {
  if (err instanceof WeekTimeout) return "the server didn't answer";
  const e = err as { response?: { status?: number; data?: { detail?: string } } };
  const detail = e.response?.data?.detail;
  if (e.response?.status) return detail ? `${detail} (${e.response.status})` : `error ${e.response.status}`;
  return "it couldn't be reached";
};

/**
 * Movement: units, or pounds for a weighed item, per store per week ending.
 *
 * Asks `subs/item_actions` once per week for the searched UPCs, through the
 * page's queue like every other tab, and only when the tab is opened. It sends
 * the page's own resolved store list (the one every other tab sends), so a
 * group means the same stores here as on Sales Comp: active ones only. The
 * weeks end on the search's end date; how many of them is this tab's own
 * setting, so asking for thirteen weeks here never re-runs Sales Comp or Trend
 * over thirteen weeks.
 *
 * A whole window lands at once rather than week by week. Coverage is per UPC,
 * and a UPC recorded as covered after two of six weeks would never be asked
 * for the other four.
 */
const MovementTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [progress, setProgress] = useState<{ done: number; total: number; week: string } | null>(
    null,
  );
  /**
   * The last load that failed, by what it asked for. While the question is
   * unchanged the tab shows the failure and waits for Try again rather than
   * asking again by itself: loading going false re-runs the effect, and
   * without this a request that fails every time would fire again at once,
   * forever, with a toast each time.
   */
  const [failed, setFailed] = useState<{ key: string; msg: string } | null>(null);

  const { endIso, weeks, windows, weekEndings, windowKey } = useMovementWindow();
  // The window a finished load was asked for may not be the one on screen any
  // more: someone changed the weeks while it ran. Its rows are then for the
  // wrong question and are dropped.
  const liveWindow = useRef(windowKey);
  liveWindow.current = windowKey;

  const missing = missingFrom(ctx.searchedUpcs, ctx.movementCoverage);
  const missingKey = missing.join(",");
  const scopeIds = useMemo(
    () =>
      ctx.storeids
        .split(",")
        .map(Number)
        .filter((n) => Number.isFinite(n) && n > 0),
    [ctx.storeids],
  );

  const loadKey = `${windowKey}|${missingKey}|${ctx.storeids}`;

  useEffect(() => {
    if (ctx.activeTab !== "movement") return;
    if (ctx.movementLoading || !scopeIds.length || !missingKey || !windows.length) return;
    if (failed?.key === loadKey) return;

    const codes = missing;
    const asked = windowKey;
    const key = loadKey;
    const load = async () => {
      dispatch(setDevMovementLoading(true));
      const batches = inBatches(codes, ITEM_ACTIONS_MAX_CODES);
      const total = windows.length * batches.length;
      let done = 0;
      let current = windows[0].end;
      setProgress({ done, total, week: current });
      const rows: MovementRow[] = [];
      // A failed week is a failure, not a week of nothing. Coverage is left
      // alone, and the tab says which week and why, and waits to be asked.
      const fail = (msg: string) => {
        setFailed({ key, msg: `Week ending ${shortDate(current)} didn't load: ${msg}.` });
        toast.warn("Movement could not be read for these UPCs");
      };
      try {
        for (const w of windows) {
          current = w.end;
          for (const batch of batches) {
            setProgress({ done, total, week: w.end });
            const res = await upcQueue.enqueue(
              `movement:${asked}:${w.end}:${batch.join(",")}`,
              (signal) =>
                withDeadline(signal, MOVEMENT_WEEK_TIMEOUT_MS, (s) =>
                  getItemActions(
                    ctx.url, ctx.token, w.start, w.end,
                    // A store list travels as a group search: useGroups 1,
                    // singleStore 0, no group id. The rule every endpoint
                    // takes a list under (docs/backend-storeids-everywhere).
                    1, 0, 0,
                    batch, s, scopeIds,
                  ),
                ),
            );
            // Superseded by a newer search: nothing of this one belongs.
            if (!res) return;
            const body: ItemActionsResp = res.data;
            if (body.error !== 0) {
              fail(body.msg || "the server reported an error");
              return;
            }
            rows.push(...sumWeek(body.data ?? [], w.end));
            done += 1;
          }
        }
        if (liveWindow.current !== asked) return;
        dispatch(mergeDevMovement({ rows, codes }));
        const seen = new Map<string, string>();
        for (const r of rows) if (r.description) seen.set(r.product_code, r.description);
        dispatch(
          setDevUpcItems(
            [...seen].map(([product_code, description]) => ({ product_code, description })),
          ),
        );
      } catch (err) {
        fail(reasonOf(err));
      } finally {
        dispatch(setDevMovementLoading(false));
        setProgress(null);
      }
    };

    load();
    // `missing`, `windows` and `scopeIds` are read through their keys.
  }, [ctx.activeTab, missingKey, ctx.movementLoading, windowKey, ctx.storeids, failed]);

  const codes = useMemo(
    () =>
      ctx.selectedUpcs.length > 0
        ? ctx.searchedUpcs.filter((u) => ctx.selectedUpcs.includes(u))
        : ctx.searchedUpcs,
    [ctx.searchedUpcs, ctx.selectedUpcs],
  );

  const descriptions = useMemo(
    () => new Map(ctx.upcItems.map((i) => [i.product_code, i.description])),
    [ctx.upcItems],
  );

  const stores = useMemo(
    () => movementStores(scopeIds, ctx.assignedStores, ctx.movementRows),
    [scopeIds, ctx.assignedStores, ctx.movementRows],
  );

  useEffect(() => {
    const current = ctx.movementSelected;
    if (!codes.length) {
      if (current !== null) dispatch(setDevMovementSelected(null));
    } else if (!current || !codes.includes(current)) {
      dispatch(setDevMovementSelected(codes[0]));
    }
  }, [codes, ctx.movementSelected]);

  const controls = (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 flex-shrink-0 text-[13px] font-semibold text-content">
      <label className="flex items-center gap-2">
        Weeks
        <select
          value={weeks}
          onChange={(e) => dispatch(setDevMovementWeeks(Number(e.target.value)))}
          className="text-[13px] pl-2 pr-6 py-1 rounded border border-content/20 bg-custom-white"
        >
          {Array.from({ length: MOVEMENT_MAX_WEEKS }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <span className="text-content/85">
        ending {weekdayOf(endIso)} {ctx.endDate}. Weeks end on the search's end date.
      </span>
      <span className="flex-1" />
      <span className="text-content/85">Pounds for weighed items, units for the rest</span>
    </div>
  );

  if (ctx.movementLoading || progress) {
    return (
      <div className="flex flex-col h-full">
        {controls}
        <div className="flex-1 flex items-center justify-center text-[11px] text-content/85">
          {progress && progress.total > 1
            ? `Loading movement: week ending ${shortDate(progress.week)}, ${progress.done} of ${progress.total} done…`
            : "Loading movement…"}
        </div>
      </div>
    );
  }

  if (failed?.key === loadKey) {
    return (
      <div className="flex flex-col h-full">
        {controls}
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[11px] text-content/85">
          <span>{failed.msg}</span>
          <button
            type="button"
            onClick={() => setFailed(null)}
            className="text-[12px] font-semibold text-brand_navy_hover underline underline-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!codes.length) {
    return (
      <div className="flex flex-col h-full">
        {controls}
        <div className="flex-1 flex items-center justify-center text-[11px] text-content/85">
          No movement data
        </div>
      </div>
    );
  }

  const selected = ctx.movementSelected ?? codes[0];

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {controls}
      <div className="flex-1 overflow-hidden flex min-h-0">
        <div className="w-[300px] flex-shrink-0 border-r border-gray-100 overflow-y-auto thin-scrollbar">
          {codes.map((code) => {
            const weighed = isWeighed(ctx.movementRows, code);
            const total = movementTotal(ctx.movementRows, code);
            const isSelected = code === selected;
            return (
              <button
                key={code}
                onClick={() => dispatch(setDevMovementSelected(code))}
                className={`w-full text-left px-2.5 py-2 border-b border-gray-50 transition-colors ${
                  isSelected ? "bg-custom-white" : "hover:bg-gray-50"
                }`}
                style={isSelected ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-medium text-content truncate">
                    {descriptions.get(code) || code}
                  </span>
                  <span className="text-[12px] font-semibold tabular-nums text-content flex-shrink-0">
                    {fmtMovement(total, weighed)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-0.5 font-medium">
                  <span className="text-[11px] text-content/85 truncate">{code}</span>
                  <span className="text-[11px] text-content/85 flex-shrink-0">
                    {weighed ? "lbs" : "units"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <MovementGridPanel
          code={selected}
          rows={ctx.movementRows}
          stores={stores}
          weekEndings={weekEndings}
        />
      </div>
    </div>
  );
};

export default MovementTab;
