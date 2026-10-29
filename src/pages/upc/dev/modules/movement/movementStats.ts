import type { SubDeptMargin } from "../../../../../interfaces";
import type { MovementRow } from "../../../../../features/dev/devUpcDevSlice";

/**
 * Movement: how much of an item each store moved, week by week.
 *
 * Units, or pounds for a weighed item, per store per week ending. It answers
 * the request a store user sends support ("movement for these stores, for this
 * UPC, for weeks ending 9/19 … 10/24, one total per store per week"), which no
 * other UPC List tab can, because every other UPC endpoint adds the stores
 * together.
 *
 * Read from `subs/item_actions`, one call per store per week -- it scopes to
 * one store and has no list form. That endpoint already
 * returns rows per store and day with the refund sign applied and weight in
 * pounds, so a week's total is a sum and nothing here re-derives a sales rule.
 * Asking week by week, rather than once for the whole window, means each row's
 * week is the week it was asked for: nothing parses a sale date to decide which
 * week it falls in.
 */

/** Weeks the tab can show. A quarter: enough for "the last six weeks" with
 *  room either side, and each week is one more call. */
export const MOVEMENT_MAX_WEEKS = 13;

export interface MovementWeek {
  /** yyyy-mm-dd, inclusive. */
  start: string;
  end: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The search's MM/DD/YYYY (or M/D/YYYY) as yyyy-mm-dd. */
export const isoFromMdy = (mdy: string): string => {
  const [m, d, y] = mdy.split("/").map(Number);
  return `${y}-${pad(m)}-${pad(d)}`;
};

const shift = (iso: string, days: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

/** How many weeks the tab opens on.
 *
 *  Six rather than the search's own range. The tab answers which way an item
 *  is heading, and the search is usually a single week -- following it opened
 *  the grid on one column, which is a number, not a direction. Six weeks is a
 *  month and a half to read a trend from, and the Weeks control moves it
 *  anywhere from 1 to the cap. */
export const MOVEMENT_DEFAULT_WEEKS = 6;

/**
 * The weeks, oldest first, each ending on the same weekday as `endIso`.
 *
 * The search's end date IS the last week ending. Pick a Saturday and the weeks
 * run Sunday to Saturday, which is how Houchens counts them. No company
 * setting is needed, because the user's own date says which day weeks end on.
 */
export const movementWeeks = (endIso: string, weeks: number): MovementWeek[] =>
  Array.from({ length: weeks }, (_, i) => {
    const end = shift(endIso, -7 * (weeks - 1 - i));
    return { start: shift(end, -6), end };
  });

/** One week's `item_actions` rows as one row per store per item. The endpoint
 *  splits an item's day by price type and sale type; those all add up here. */
export const sumWeek = (rows: SubDeptMargin[], weekEnding: string): MovementRow[] => {
  const byKey = new Map<string, MovementRow>();
  for (const r of rows) {
    const code = String(r.product_code);
    const key = `${r.storeid}|${code}`;
    const hit = byKey.get(key);
    if (hit) {
      hit.qty += Number(r.qty) || 0;
      hit.weight += Number(r.weight) || 0;
    } else {
      byKey.set(key, {
        storeid: r.storeid,
        store_number: String(r.store_number ?? ""),
        store_name: r.store_name ?? "",
        product_code: code,
        description: r.product_description ?? "",
        week_ending: weekEnding,
        qty: Number(r.qty) || 0,
        weight: Number(r.weight) || 0,
      });
    }
  }
  return [...byKey.values()];
};

/** Weighed if any of its lines carried weight. Its movement is then pounds:
 *  a count of weighings says nothing about how much meat left the case. */
export const isWeighed = (rows: MovementRow[], code: string) =>
  rows.some((r) => r.product_code === code && r.weight !== 0);

export const movementOf = (r: MovementRow, weighed: boolean) =>
  weighed ? r.weight : r.qty;

export const fmtMovement = (n: number, weighed: boolean) =>
  weighed
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : Math.round(n).toLocaleString("en-US");

export interface MovementStore {
  storeid: number;
  store_number: string;
  store_name: string;
}

/**
 * Every store in the search, plus any that turned up in the rows.
 *
 * A store that sold none of the item still gets its row of blanks: "store 452
 * moved nothing" is part of the answer, and leaving it out reads as "you forgot
 * store 452". Ordered by store number, numerically where it is one.
 */
export const movementStores = (
  scopeIds: number[],
  known: MovementStore[],
  rows: MovementRow[],
): MovementStore[] => {
  const byId = new Map<number, MovementStore>();
  for (const id of scopeIds) {
    const k = known.find((s) => s.storeid === id);
    byId.set(id, k ?? { storeid: id, store_number: String(id), store_name: "" });
  }
  for (const r of rows) {
    const have = byId.get(r.storeid);
    if (!have || (!have.store_name && r.store_name)) {
      byId.set(r.storeid, {
        storeid: r.storeid,
        store_number: r.store_number || have?.store_number || String(r.storeid),
        store_name: r.store_name || have?.store_name || "",
      });
    }
  }
  return [...byId.values()].sort((a, b) => {
    const na = Number(a.store_number);
    const nb = Number(b.store_number);
    if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
    return a.store_number.localeCompare(b.store_number);
  });
};

export interface MovementGrid {
  weighed: boolean;
  weekEndings: string[];
  rows: { store: MovementStore; cells: (number | null)[]; total: number }[];
  weekTotals: number[];
  total: number;
}

/** One item as stores down, weeks across. A cell with no sale is null, not 0:
 *  the grid shows it blank, and a refund-only week can still be a real -1. */
export const movementGrid = (
  rows: MovementRow[],
  code: string,
  stores: MovementStore[],
  weekEndings: string[],
): MovementGrid => {
  const weighed = isWeighed(rows, code);
  const cell = new Map<string, number>();
  for (const r of rows) {
    if (r.product_code !== code) continue;
    const key = `${r.storeid}|${r.week_ending}`;
    cell.set(key, (cell.get(key) ?? 0) + movementOf(r, weighed));
  }
  const weekTotals = weekEndings.map(() => 0);
  const gridRows = stores.map((store) => {
    const cells = weekEndings.map((w, i) => {
      const v = cell.get(`${store.storeid}|${w}`);
      if (v !== undefined) weekTotals[i] += v;
      return v ?? null;
    });
    return { store, cells, total: cells.reduce<number>((a, v) => a + (v ?? 0), 0) };
  });
  return {
    weighed,
    weekEndings,
    rows: gridRows,
    weekTotals,
    total: weekTotals.reduce((a, v) => a + v, 0),
  };
};

/** An item's movement across every store and week, for the left list. */
export const movementTotal = (rows: MovementRow[], code: string) => {
  const weighed = isWeighed(rows, code);
  return rows
    .filter((r) => r.product_code === code)
    .reduce((a, r) => a + movementOf(r, weighed), 0);
};

/** "10/24": a week ending as a column header reads it. */
export const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
};

/** "Sat": which weekday the weeks end on. */
export const weekdayOf = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
    new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  ];
};

/**
 * The grid as a CSV: one row per item per store, a column per week ending.
 *
 * The shape the request asked for, so the file is the answer rather than
 * something to pivot. Every store in the search appears for every item, blanks
 * and all, for the same reason the grid shows them.
 */
export const movementCsv = (
  rows: MovementRow[],
  codes: string[],
  descriptions: Map<string, string>,
  stores: MovementStore[],
  weekEndings: string[],
): { headers: string[]; lines: string[][] } => {
  const headers = [
    "UPC",
    "Description",
    "Store #",
    "Store",
    "Unit",
    ...weekEndings.map((w) => `Week ending ${shortDate(w)}/${w.slice(0, 4)}`),
    "Total",
  ];
  const lines: string[][] = [];
  for (const code of codes) {
    const grid = movementGrid(rows, code, stores, weekEndings);
    const raw = (n: number) => (grid.weighed ? n.toFixed(2) : String(Math.round(n)));
    for (const r of grid.rows) {
      lines.push([
        code,
        descriptions.get(code) ?? "",
        r.store.store_number,
        r.store.store_name,
        grid.weighed ? "lbs" : "units",
        ...r.cells.map((v) => (v === null ? "" : raw(v))),
        raw(r.total),
      ]);
    }
  }
  return { headers, lines };
};

/** A rate as the strip shows it: pounds to two places, units to one. */
export const fmtRate = (n: number, weighed: boolean) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: weighed ? 2 : 1,
    maximumFractionDigits: weighed ? 2 : 1,
  });

/**
 * How much a store that carries the item moves in a week: the item's total
 * over (stores that moved any of it × weeks).
 *
 * Divided by the stores that sold it, not every store searched. A store that
 * doesn't carry the item would otherwise drag the rate down and hide how
 * fast it sells where it is on the shelf; how many stores that is gets its own
 * tile. Null when no store moved any.
 */
export const perStorePerWeek = (
  grid: MovementGrid,
): { value: number; stores: number } | null => {
  const stores = grid.rows.filter((r) => r.cells.some((v) => v !== null && v !== 0)).length;
  if (stores === 0 || grid.weekEndings.length === 0) return null;
  return { value: grid.total / (stores * grid.weekEndings.length), stores };
};

/**
 * The most recent week against the average of the weeks before it.
 *
 * The weeks before it, not every week: counting the latest week in its own
 * average pulls the comparison toward zero, and the question is whether this
 * week is running ahead of or behind what came before. `pct` is null when
 * the earlier weeks moved nothing, so there is no rate to compare against.
 * Null altogether with fewer than two weeks.
 */
export const latestVsPrior = (
  grid: MovementGrid,
): { latest: number; priorAvg: number; pct: number | null } | null => {
  const totals = grid.weekTotals;
  if (totals.length < 2) return null;
  const latest = totals[totals.length - 1];
  const prior = totals.slice(0, -1);
  const priorAvg = prior.reduce((a, v) => a + v, 0) / prior.length;
  return { latest, priorAvg, pct: priorAvg === 0 ? null : ((latest - priorAvg) / priorAvg) * 100 };
};
