// API
import { getSalesTracker, getSubs } from "../../../../api/sales";

// Utils
import { createRequestQueue } from "../../../../utils/requestQueue";
import { fetchAllPages } from "../../../../utils/paging";
import { countedRows } from "../../../../utils/hashSubs";

// Interfaces
import type { TrackerScope, WindowPlan } from "../interfaces";
import type { SubSale, SubSalesJsonResp } from "../../../../interfaces";

/**
 * Sub-department rows for one store or group over a window. Every read is
 * paged (`fetchAllPages`): page 1 alone drops the most recent weeks.
 * `consolidated: 0` is required: consolidating drops `sale_date`.
 */
export const fetchSubSales = async (
  url: string,
  token: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  start: string,
  end: string,
): Promise<SubSale[]> => {
  const call = (page: number) =>
    getSubs(
      url,
      token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      0,
      0,
      page,
    );

  const first = await call(1);
  const body: SubSalesJsonResp = first.data;
  if (body.error !== 0)
    throw new Error(body.msg ?? "Failed to load sub departments");

  const rows = await fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const r = await call(page);
      const j: SubSalesJsonResp = r.data;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });

  /**
   * Fuel, lottery and cash accounts (hash sub depts) come out here, at the
   * fetch, so totals match the Sales header (`sales/weekly` leaves them out).
   */
  return countedRows(rows);
};

/**
 * The last-year leg, allowed to come back with nothing: a new store gets
 * `error: 1`, and throwing would lose this year's rows too. Missing LY shows
 * as dashes. A genuine LY failure is swallowed as well, on purpose.
 */
export const fetchLySubSales = (
  url: string,
  token: string,
  useGroups: number,
  searchValue: number,
  singleStore: number,
  start: string,
  end: string,
): Promise<SubSale[]> =>
  fetchSubSales(
    url,
    token,
    useGroups,
    searchValue,
    singleStore,
    start,
    end,
  ).catch(() => []);

/**
 * EXPERIMENT, dev only: `subs/sales_tracker` (explicit dates, unpaged, no store
 * columns) instead of `subs/sub_sales`, whose pages took up to 38s. One request
 * per period per batch of weeks. Concurrency 4: the ALB is plain HTTP (no
 * HTTP/2), the browser allows 6 connections per origin, and 4 leaves 2 for the
 * rest of the app.
 */
const trackerQueue = createRequestQueue({ concurrency: 4 });

/**
 * Weeks per request: two (fourteen dates). Transport only: rows are bucketed
 * by `sale_date`, so grouping can't change a figure. The ceiling is the
 * endpoint's store-day budget (~85 stores at fourteen dates). TY and LY stay
 * separate, so this year can render first.
 */
const WEEKS_PER_REQUEST = 2;

/** The endpoint's message when a request exceeds its store-day budget (a 400
 *  with structured detail saying how to split), surfaced as is. */
const trackerError = (err: unknown): string => {
  const detail = (
    err as { response?: { data?: { detail?: unknown; msg?: string } } }
  )?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "msg" in detail)
    return String((detail as { msg: unknown }).msg);
  return err instanceof Error ? err.message : "Could not load the tracker";
};

const trackerCall = async (
  scope: TrackerScope,
  dates: string[],
): Promise<SubSale[]> => {
  const resp = await getSalesTracker(
    scope.url,
    scope.token,
    dates,
    scope.useGroups,
    scope.searchValue,
    scope.singleStore,
  );
  const body = resp.data;
  if (body.error !== 0) throw new Error(body.msg ?? "Failed to load tracker");
  return body.subs ?? [];
};

/**
 * A whole window, one request per period per batch of weeks. LY dates come
 * from the plan's pairs (holiday-safe), deduped. `startRun` abandons a
 * replaced search's queued and in-flight jobs.
 */
export const fetchTrackerWindow = async (
  scope: TrackerScope,
  plan: WindowPlan,
  onProgress?: (done: number, total: number) => void,
): Promise<{ ty: SubSale[]; ly: SubSale[] } | null> => {
  trackerQueue.startRun();

  const batches: (typeof plan.weeks)[] = [];
  for (let i = 0; i < plan.weeks.length; i += WEEKS_PER_REQUEST) {
    batches.push(plan.weeks.slice(i, i + WEEKS_PER_REQUEST));
  }

  const jobs = batches.flatMap((batch) => {
    const first = batch[0].index;
    const inBatch = new Set(batch.map((w) => w.index));
    const tyDates = batch.flatMap((w) => w.dates);
    // Deduped and sorted: a holiday can pull two TY days onto one LY date, and
    // batching weeks together makes that likelier at the seam between them.
    const lyDates = [
      ...new Set(
        plan.pairs.filter((p) => inBatch.has(p.weekIndex)).map((p) => p.lyDate),
      ),
    ].sort();
    return [
      { period: "ty" as const, key: `ty-${first}`, dates: tyDates },
      { period: "ly" as const, key: `ly-${first}`, dates: lyDates },
    ];
  });

  let done = 0;
  onProgress?.(0, jobs.length);

  try {
    const results = await Promise.all(
      jobs.map((job) => {
        const call = trackerQueue.enqueue(job.key, () =>
          trackerCall(scope, job.dates),
        );
        // An empty last-year batch is a store with no last year; a this-year
        // failure still fails.
        const leg =
          job.period === "ly"
            ? call.catch((): SubSale[] => [])
            : call;
        return leg.then((rows) => {
          done += 1;
          onProgress?.(done, jobs.length);
          return { period: job.period, rows };
        });
      }),
    );

    // Any null means the window was superseded; null, not a partial set, so
    // half a window is never written.
    if (results.some((r) => r.rows === null)) return null;

    return {
      ty: results.filter((r) => r.period === "ty").flatMap((r) => r.rows ?? []),
      ly: results.filter((r) => r.period === "ly").flatMap((r) => r.rows ?? []),
    };
  } catch (err) {
    throw new Error(trackerError(err));
  }
};
