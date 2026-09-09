import axios from "axios";

/**
 * Suggested order weight for scale (by-the-pound) departments.
 *
 * Dev API only for now — the endpoint lives behind `suggested/` on the dev
 * backend and is not deployed to prod, which is why the page is gated to
 * programmers under Coming Soon. Nothing here reads `apiEnv`; the caller passes
 * whichever `url` the session is pointed at, exactly like every other module,
 * so this needs no change on the day it ships to prod.
 *
 * Both calls hit the same route, and the pair of fields that picks the shape is
 * easy to get wrong: `singleStore` says whose data, `groupBy` says at what
 * grain. Item grain is single-store only — the endpoint refuses a group with
 * "a group is thousands of item rows nobody orders from" — so a group request
 * must ask for `groupBy: "store"` or it is rejected, not silently rolled up.
 *
 * That is why these are two functions rather than one with flags: each sets
 * both fields together, so a caller cannot pair a group with an item grain.
 */

export interface SuggestedParams {
  useGroups: number;
  searchValue: number;
  singleStore: number;
  /** yyyy-mm-dd. The day the order is placed; every window derives from it. */
  asOf: string;
  /** The grain of the response. Omitted for item grain, which is the default
   *  and the only one a single-store call accepts. */
  groupBy?: "store";
  leadDays: number;
  coverDays: number;
  lookbackWeeks: number;
  subDepartments?: number[];
  /** Actual pounds per date alongside the weekday averages. Store grain only —
   *  the series is keyed on store x sub-department at both grains, so at item
   *  grain every row in a department carries the same copy. */
  includeDaily?: boolean;
  /** The figures behind `shrink_multiplier`: lifetime sold, received, damaged
   *  and marked-down weight. */
  includeDiagnostics?: boolean;
  /** Items that are dead, stopped or declining, under their own `not_selling`
   *  key. Single store only — on a group this returns the set for every store
   *  at once, which is not a list anybody works from. */
  includeNotSelling?: boolean;
  page?: number;
  pageSize?: number;
}


/**
 * Normalises `dow_rates` into the object the rest of the page indexes.
 *
 * The endpoint sends an object, so this is a passthrough on the happy path.
 * It stays for the two cases either side of that. `dow_rates` briefly shipped
 * as a JSON *string*, which reads like an object right up until something
 * indexes it — `rates["3"]` on a string is the character at position 3, which
 * is how the day strip came to render `"` and `:` as pound values. And a
 * profile that is malformed or carries a non-number now lands here as
 * `undefined`, which callers already treat as "no profile" and suppress. Both
 * failures are silent at the type level: `DowRates` is a `Record`, so nothing
 * downstream can tell a real profile from a string or a NaN. A wrong pound
 * figure stated confidently is worse than no strip at all, so this is the one
 * place that decides.
 */
const parseDowRates = (raw: unknown): Record<string, number> | undefined => {
  if (raw == null) return undefined;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return undefined;
    }
  }
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return undefined;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const n = typeof v === "string" ? Number(v) : v;
    if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
    out[k] = n;
  }
  return Object.keys(out).length ? out : undefined;
};

const post = async (url: string, token: string, params: SuggestedParams) => {
  const resp = await axios({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    url: url + "suggested/order_weight",
    data: {
      useGroups: params.useGroups,
      searchValue: params.searchValue,
      singleStore: params.singleStore,
      asOf: params.asOf,
      ...(params.groupBy ? { groupBy: params.groupBy } : {}),
      leadDays: params.leadDays,
      coverDays: params.coverDays,
      lookbackWeeks: params.lookbackWeeks,
      ...(params.subDepartments?.length
        ? { subDepartments: params.subDepartments }
        : {}),
      ...(params.includeDaily ? { includeDaily: true } : {}),
      ...(params.includeDiagnostics ? { includeDiagnostics: true } : {}),
      ...(params.includeNotSelling ? { includeNotSelling: true } : {}),
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 500,
    },
  });

  const items = resp.data?.items;
  if (Array.isArray(items)) {
    resp.data.items = items.map((r: Record<string, unknown>) => ({
      ...r,
      dow_rates: parseDowRates(r.dow_rates),
    }));
  }
  return resp;
};

/**
 * The rollup: one row per store x sub department across a group.
 *
 * Feeds the left tree. Deliberately fetched on its own rather than derived from
 * the item call — item rows across twenty stores are tens of thousands of rows
 * nobody acts on, which is the same reason the item call refuses a group.
 *
 * `groupBy` is set here rather than left to the caller: a group request has
 * exactly one sensible grain, so there is nothing for a caller to decide and
 * plenty to get wrong. Sending it explicitly also survives the backend
 * defaulting it later — this keeps working either way.
 *
 * The larger default page: one row per store x department across a big group
 * runs past 500 well before the sheet does, and a truncated rollup silently
 * loses whole stores from the tree.
 */
export const getSuggestedGroup = async (
  url: string,
  token: string,
  params: Omit<SuggestedParams, "singleStore" | "useGroups" | "groupBy"> & {
    useGroups: number;
  },
) =>
  post(url, token, {
    ...params,
    singleStore: 0,
    groupBy: "store",
    // The actual-pounds-per-day series, asked for HERE and only here. It is
    // keyed on store x sub-department, which is exactly this call's grain — the
    // item call would return the same series stamped onto every item row. It
    // costs one extra query and roughly 5x this response's size, which is the
    // difference between a ~30 KB tree and a ~150 KB one; the alternative is a
    // second round trip every time a buyer opens a department.
    includeDaily: true,
    pageSize: params.pageSize ?? 1500,
  });

/**
 * The sheet: one row per item for a single store.
 *
 * `pageSize` defaults high because this is an order sheet — a buyer scrolls it,
 * they do not page through it, and a store's scale departments run to a few
 * hundred items. Paged responses still carry `total_pages`, so a store that
 * ever exceeds it can be walked with `fetchAllPages`.
 */
export const getSuggestedItems = async (
  url: string,
  token: string,
  storeid: number,
  params: Omit<
    SuggestedParams,
    "singleStore" | "useGroups" | "searchValue" | "groupBy"
  >,
) =>
  post(url, token, {
    ...params,
    useGroups: 0,
    singleStore: 1,
    searchValue: storeid,
    // Against the endpoint's own default, deliberately. It calls these an
    // audit trail for "why is this item 1.31?" — a pgAdmin question. That was
    // true when the only diagnostics were lifetime damage and two fields that
    // are structurally zero until EDI. `lifetime_markdown` is different: it is
    // recorded waste in pounds, which is the manager's question, not the
    // auditor's. The other four ride along for five numbers a row.
    includeDiagnostics: true,
    // Asked for HERE and only here. The endpoint refuses it at store grain with
    // a 400 — across a group it is thousands of rows spanning every store, and
    // the descriptions on those rows are filled from the main result, which
    // only carries product codes at item grain.
    includeNotSelling: true,
  });
