import axios from "axios";

/**
 * Every API call the current page has made, kept so a ticket can carry
 * evidence.
 *
 * Someone hits a problem on a page and files a ticket about it. What the tech
 * needs is the payloads behind what they were looking at, and asking a client
 * to reproduce it is asking them to do the diagnosis.
 *
 * The whole page, not the last call. A screen like Sales fetches its weekly
 * totals, its sub departments, its hourly split and its ledger, and the one
 * that lands last is whichever was slowest — which has nothing to do with
 * what looks wrong. Keeping one of them and calling it evidence is worse than
 * keeping none, because it reads as an answer.
 *
 * Deliberately NOT Redux. A response body is not application state — it would
 * be serialised into every devtools export, every persisted slice and every
 * state snapshot a bug report carries, which is the opposite of the point.
 */

export interface CapturedCall {
  method: string;
  /** Path only — a full URL carries the environment, and the query string is
   *  where ids and page numbers end up. */
  path: string;
  status: number;
  at: number;
  /** Already stringified, already capped. */
  body: string;
  truncated: boolean;
}

/** One of the page's own datasets, and everything the page got back for it. */
export interface CallGroup {
  key: string;
  /** What this is, in the words the page uses. */
  label: string;
  method: string;
  path: string;
  calls: CapturedCall[];
  /** Total size of the bodies, for the budget. */
  bytes: number;
}

/**
 * The datasets a page loads, by the endpoint behind them.
 *
 * This map is also the filter, and that is the point of writing it. An
 * endpoint with no name here is not one of the page's datasets — it is the
 * shell fetching the store list, the user's preferences or the nav's groups,
 * which every page asks for and none of them is ever the culprit. Leaving
 * those in was not just untidy: `stores/unassigned_stores` comes back around
 * 300 KB, a third of a ticket's whole budget, and on a Sales report it pushed
 * the page's own sub-department sales off the end for size.
 *
 * Names rather than paths because a client is the one reading them. `POST
 * /hourly/hourly` asks somebody to guess whether the thing that looks wrong
 * lives behind it; "Hourly sales" does not.
 */
const LABELS: Record<string, string> = {
  "sales/weekly": "Weekly sales",
  "sales/storedepts": "Store departments",
  "sales/topten": "Top ten items",
  "sales/export_builds": "Export builds",
  "hourly/hourly": "Hourly sales",
  "subs/sub_sales": "Sub department sales",
  "subs/subs": "Sub departments",
  "subs/sales_tracker": "Sales tracker",
  "categories/cat_sales": "Category sales",
  "categories/cats": "Categories",
  "cashiers/cashier_table": "Cashiers",
  "cashiers/transaction_ids": "Transactions",
  "cashiers/transaction_list": "Transaction list",
  "cashiers/transaction": "Transaction detail",
  "cashiers/product_lookup": "Product lookup",
  "items/itemlookup": "Item lookup",
  "items/item_association": "Item associations",
  "items/storelist": "Item store list",
  "marketing/trend_detector": "Trend detection",
  "marketing/upload_upcs": "UPC list",
  "marketing/upload_upcs_daily_sales": "UPC daily sales",
  "marketing/upload_upcs_price_optimizer": "Price optimisation",
  "marketing/price_history_from_list": "Price history",
  "orders/all_orders": "Orders",
  "orders/available_order": "Available orders",
  "receivers/": "Receivers",
  "receivers/details": "Receiver detail",
  "receivers/item_search": "Receiver item search",
  "coupons/": "Coupons",
  "suggested/order_weight": "Suggested order weight",
  "quicksight/embed_url": "Analysis",
};

/** The page's word for an endpoint, or null when it is not the page's data. */
export const labelFor = (path: string): string | null =>
  LABELS[path.replace(/^\/+/, "")] ?? null;

/**
 * Never captured.
 *
 * The first three hold or reset credentials — `/auth/token` and `/auth/login`
 * return the bearer token itself. The fourth is user creation and editing,
 * which carries whatever was typed into the form. The last is the help desk
 * itself: the report form fetches its own pickers, and a ticket about Sales
 * should not arrive carrying the ticket system's categories.
 *
 * This list is the weaker half of the protection — it only covers endpoints
 * somebody thought of. The size cap below is the half that fails safe.
 */
const NEVER = [
  /\/auth\/(token|login)/i,
  /\/forgot_password/i,
  /\/users\b/i,
  /\/tickets\b/i,
];

/** Per call. `/sales/export_preview` comes back around 520 KB. */
const CAP = 256 * 1024;

/** Across everything one ticket carries, so a report is not heavier than the
 *  screenshots beside it. Groups are dropped largest-first. */
export const BUDGET = 1024 * 1024;

/** Past this, the oldest fall off. A page that polls would otherwise grow a
 *  list forever. */
const MAX_CALLS = 60;

let calls: CapturedCall[] = [];
let armed = false;

const pathOf = (url: string | undefined) => {
  if (!url) return "";
  try {
    return new URL(url, "http://x").pathname;
  } catch {
    return url;
  }
};

/**
 * Register the interceptor. Called once, from the app's entry.
 *
 * Idempotent: a second call is a no-op rather than a second interceptor,
 * because hot reload in dev would otherwise stack them.
 */
export const armPageCalls = () => {
  if (armed) return;
  armed = true;

  const keep = (
    method: string | undefined,
    url: string | undefined,
    status: number,
    data: unknown,
  ) => {
    const path = pathOf(url);
    if (!path || NEVER.some((re) => re.test(path))) return;

    let body: string;
    try {
      body = JSON.stringify(data, null, 2);
    } catch {
      // A circular or otherwise unserialisable body is not worth a crash in
      // an interceptor that every call in the app passes through.
      return;
    }

    const truncated = body.length > CAP;
    calls.push({
      method: (method ?? "get").toUpperCase(),
      path,
      status,
      at: Date.now(),
      body: truncated ? `${body.slice(0, CAP)}\n\n[truncated]` : body,
      truncated,
    });
    if (calls.length > MAX_CALLS) calls = calls.slice(-MAX_CALLS);
  };

  axios.interceptors.response.use(
    (resp) => {
      keep(resp.config?.method, resp.config?.url, resp.status, resp.data);
      return resp;
    },
    (error) => {
      // A failed call is usually the more useful one — the house convention
      // is a 200 with `error: 1`, so a real rejection means something broke
      // below the application.
      const resp = error?.response;
      if (resp) {
        keep(error.config?.method, error.config?.url, resp.status, resp.data);
      }
      return Promise.reject(error);
    },
  );
};

export const getPageCalls = () => calls;

/** Called on every route change: what the last page fetched is not evidence
 *  about this one. */
export const clearPageCalls = () => {
  calls = [];
};

/**
 * One entry per endpoint.
 *
 * A paged fetch is not one call — `fetchAllPages` asks for page two, three
 * and four separately, so the same path arrives over and over with a slice of
 * the answer each time. Listing them one per row makes a Sales ticket look
 * like twelve problems, and attaching them as twelve files makes a tech open
 * twelve files to read one table. Grouped, they are what they always were:
 * one endpoint, several pages.
 *
 * Keyed on method and path with the query dropped, which is where the page
 * number lives.
 */
export const consolidate = (from: CapturedCall[] = calls): CallGroup[] => {
  const by = new Map<string, CallGroup>();
  for (const call of from) {
    const label = labelFor(call.path);
    if (!label) continue;
    const key = `${call.method} ${call.path}`;
    const group = by.get(key) ?? {
      key,
      label,
      method: call.method,
      path: call.path,
      calls: [],
      bytes: 0,
    };
    group.calls.push(call);
    group.bytes += call.body.length;
    by.set(key, group);
  }
  return [...by.values()];
};

/**
 * Trim to what a ticket can reasonably carry.
 *
 * Largest first, because one enormous group is what puts a report over the
 * line and dropping it keeps every small one — losing five useful endpoints
 * to keep one export preview would be the wrong way round.
 */
export const withinBudget = (groups: CallGroup[], budget = BUDGET) => {
  const kept: CallGroup[] = [];
  const dropped: CallGroup[] = [];
  let used = 0;
  for (const group of [...groups].sort((a, b) => a.bytes - b.bytes)) {
    if (used + group.bytes <= budget) {
      kept.push(group);
      used += group.bytes;
    } else {
      dropped.push(group);
    }
  }
  return { kept, dropped, used };
};

/** What one endpoint's file is called. */
export const groupFilename = (group: CallGroup) =>
  `${group.method.toLowerCase()}-${group.path
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")}.json`;

/**
 * A group as a file, ready for `fileTicket`.
 *
 * `application/json` is one of the three the endpoint takes — browsers
 * disagree about what they send for a `.json`, and one labelled `text/html`
 * is refused, so the type is set outright rather than left to the guess.
 */
export const groupAsFile = (group: CallGroup) => {
  const header = JSON.stringify(
    {
      method: group.method,
      path: group.path,
      pages: group.calls.length,
      captured_at: new Date(group.calls[0]?.at ?? Date.now()).toISOString(),
      truncated: group.calls.some((c) => c.truncated),
    },
    null,
    2,
  );

  // The bodies go in as text rather than being reparsed and restringified. A
  // capped one is no longer valid JSON — it ends mid-value — so parsing it
  // back would throw on exactly the responses most worth reading.
  const marker = (call: CapturedCall, i: number) =>
    [
      "\n\n// ---- ",
      `${group.method} ${group.path}`,
      group.calls.length > 1 ? ` · page ${i + 1} of ${group.calls.length}` : "",
      ` · ${call.status}`,
      ` · ${new Date(call.at).toISOString()}`,
      call.truncated ? " · shortened" : "",
      "\n",
    ].join("");

  const parts = group.calls.flatMap((call, i) => [marker(call, i), call.body]);

  return new File([header, ...parts], groupFilename(group), {
    type: "application/json",
  });
};

/**
 * The line under a group's tick box.
 *
 * Size, and whether anything was cut. How many requests it took to fetch is
 * ours to know — a dataset that arrived over nine pages is still one dataset,
 * and saying so only invites the question of whether nine is bad.
 */
export const groupNote = (group: CallGroup, size: (n: number) => string) =>
  [size(group.bytes), group.calls.some((c) => c.truncated) ? "shortened" : ""]
    .filter(Boolean)
    .join(" · ");
