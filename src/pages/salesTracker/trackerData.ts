import { getSalesTracker, getSubs } from "../../api/sales";
import { createRequestQueue } from "../../utils/requestQueue";
import type { WindowPlan } from "./trackerWeeks";
import { fetchAllPages } from "../../utils/paging";
import type { SubSale, SubSalesJsonResp } from "../../interfaces";

/**
 * Sub-department rows for one store or group over a window.
 *
 * `subs/sub_sales` pages at a fixed size in date order, and over a multi-week
 * window a single store runs well past one page. Reading page 1 alone silently
 * drops the **end** of the window — the most recent weeks, the ones anybody
 * looking at a tracker cares about most — so every read goes through
 * `fetchAllPages`.
 *
 * `consolidated: 0` is required rather than incidental: consolidating drops
 * `sale_date`, and without a date per row there is nothing to bucket into weeks
 * or days.
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

  return fetchAllPages(body, body.subs ?? [], async (page) => {
    try {
      const r = await call(page);
      const j: SubSalesJsonResp = r.data;
      return j.error === 0 ? (j.subs ?? []) : [];
    } catch {
      return [];
    }
  });
};

/**
 * EXPERIMENT, dev only. `subs/sales_tracker` against `subs/sub_sales`.
 *
 * `sub_sales` answers a whole window in two paged requests, and on a 12-week,
 * five-store group one of those pages took 38 seconds — 296kB at roughly
 * 8kB/s, so query time rather than transfer. `sales_tracker` takes an explicit
 * date list, is unpaged, and drops the store columns a grouped tracker never
 * reads.
 *
 * The split is one request per period per week — 7 dates each — rather than
 * one per week carrying both. Total server work is identical either way, since
 * cost is linear in store-days; what the split buys is a smaller unit of work
 * (so the store-day guard is nowhere near tripping), and a shape where TY and
 * LY can later be rendered independently. The measured cost of splitting was
 * 1-7%, all of it fixed per-request overhead.
 *
 * Concurrency is 4, not higher. The ALB listener is plain HTTP, so there is no
 * HTTP/2 multiplexing and the browser caps at 6 connections per origin —
 * saturating all six would stall every other call in the app behind a tracker
 * that runs for half a minute. Four leaves two for everything else, and above
 * six does nothing but queue in the browser instead.
 */
const trackerQueue = createRequestQueue({ concurrency: 4 });

/**
 * Weeks per request. Two, so a request carries fourteen dates.
 *
 * Purely a transport decision: rows come back keyed by `sale_date` and are
 * bucketed through the plan, so how the dates are grouped into requests cannot
 * change a figure. Server cost is linear in store-days and identical either
 * way — what changes is how many times the fixed per-request overhead is paid,
 * which at 52 weeks is 52 requests instead of 104.
 *
 * The ceiling is the endpoint's store-day budget, not the client. At seven
 * dates a request stays under it to about 171 stores; at fourteen, about 85.
 * Both are far beyond any real group, but the headroom halves each time this
 * doubles, so it is worth knowing which number moved if a 400 ever appears.
 *
 * TY and LY stay in separate requests regardless. Combining them would halve
 * the count again and give up the one thing the split is for — being able to
 * render this year before last year arrives.
 */
const WEEKS_PER_REQUEST = 2;

export interface TrackerScope {
  url: string;
  token: string;
  useGroups: number;
  searchValue: number;
  singleStore: number;
}

/** The message the endpoint sends when a request exceeds its store-day budget.
 *  It arrives as a 400 with a structured detail, and it tells the caller how to
 *  split — worth surfacing rather than flattening to "request failed". */
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
 * A whole window, one request per period per week.
 *
 * The LY dates come from the plan's pairs rather than from shifting the week's
 * endpoints, so a week containing a holiday asks for the days its own pairing
 * uses. Deduped because a holiday can pull two TY days onto one LY date, and
 * the endpoint would return that day once regardless.
 *
 * `startRun` is the staleness guard: a re-search abandons the previous
 * window's queued and in-flight jobs, so twenty-four requests from a search
 * the user has already replaced cannot land on top of the new one.
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
      jobs.map((job) =>
        trackerQueue
          .enqueue(job.key, () => trackerCall(scope, job.dates))
          .then((rows) => {
            done += 1;
            onProgress?.(done, jobs.length);
            return { period: job.period, rows };
          }),
      ),
    );

    // A null anywhere means this window was superseded mid-flight. Returning
    // null rather than a partial set keeps the caller from writing half a
    // window into state and presenting it as a whole one.
    if (results.some((r) => r.rows === null)) return null;

    return {
      ty: results.filter((r) => r.period === "ty").flatMap((r) => r.rows ?? []),
      ly: results.filter((r) => r.period === "ly").flatMap((r) => r.rows ?? []),
    };
  } catch (err) {
    throw new Error(trackerError(err));
  }
};
