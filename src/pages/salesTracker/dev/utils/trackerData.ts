// API
import { getSubsDaily } from "../../../../api/sales";

// Utils
import { createRequestQueue } from "../../../../utils/requestQueue";
import { fetchAllPages } from "../../../../utils/paging";
import { countedRows } from "../../../../utils/hashSubs";
import { reasonOf } from "../../../../utils/serverError";

// Interfaces
import type { TrackerScope, WindowPlan } from "../interfaces";
import type { SubSale, SubSalesJsonResp } from "../../../../interfaces";

/**
 * Sub-department rows for one store or group over a date range: every page of
 * `subs/daily` (5,000 rows a page; a group comes back one row per store).
 */
export const fetchSubSales = async (
  scope: TrackerScope,
  start: string,
  end: string,
): Promise<SubSale[]> => {
  const call = (page: number) =>
    getSubsDaily(
      scope.url,
      scope.token,
      start,
      end,
      scope.useGroups,
      scope.searchValue,
      null,
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
   * fetch, so totals match the Sales header (`sales/daily` leaves them out).
   */
  return countedRows(rows);
};

/**
 * The last-year leg, allowed to come back with nothing: a new store gets
 * `error: 1`, and throwing would lose this year's rows too. Missing LY shows
 * as dashes. A genuine LY failure is swallowed as well, on purpose.
 */
export const fetchLySubSales = (
  scope: TrackerScope,
  start: string,
  end: string,
): Promise<SubSale[]> => fetchSubSales(scope, start, end).catch(() => []);

/**
 * Four requests at a time: the ALB is plain HTTP (no HTTP/2), the browser
 * allows 6 connections per origin, and 4 leaves 2 for the rest of the app.
 */
const trackerQueue = createRequestQueue({ concurrency: 4 });

/**
 * Weeks per request: four. Transport only: rows are bucketed by `sale_date`,
 * so grouping can't change a figure. It keeps a big group's pages arriving in
 * steps the progress line can count. TY and LY stay separate, so this year can
 * render first.
 */
const WEEKS_PER_REQUEST = 4;

const dayOf = (row: SubSale) => row.sale_date.split("T")[0];

/**
 * A whole window, one range read per period per batch of weeks. Each batch
 * keeps only its own dates: a holiday can pull two TY days onto one LY date,
 * so an LY date belongs to the first batch that pairs with it and no day is
 * counted twice where batches meet. `startRun` abandons a replaced search's
 * queued and in-flight jobs.
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

  const claimed = new Set<string>();
  const jobs = batches.flatMap((batch) => {
    const first = batch[0].index;
    const inBatch = new Set(batch.map((w) => w.index));
    const tyDates = batch.flatMap((w) => w.dates).sort();
    const lyDates = [
      ...new Set(
        plan.pairs
          .filter((p) => inBatch.has(p.weekIndex) && !claimed.has(p.lyDate))
          .map((p) => p.lyDate),
      ),
    ].sort();
    lyDates.forEach((d) => claimed.add(d));
    const ty = { period: "ty" as const, key: `ty-${first}`, dates: tyDates };
    const ly = { period: "ly" as const, key: `ly-${first}`, dates: lyDates };
    return lyDates.length ? [ty, ly] : [ty];
  });

  let done = 0;
  onProgress?.(0, jobs.length);

  try {
    const results = await Promise.all(
      jobs.map((job) => {
        const own = new Set(job.dates);
        const call = trackerQueue.enqueue(job.key, () =>
          fetchSubSales(scope, job.dates[0], job.dates[job.dates.length - 1]).then(
            (rows) => rows.filter((r) => own.has(dayOf(r))),
          ),
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
    throw new Error(reasonOf(err));
  }
};
