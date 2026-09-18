import type { ItemRow } from "../../../features/itemPerfSlice";
import { calculateCogs } from "../../../utils/cogs";
import {
  dayOf,
  lyDateFor,
  netOf,
  type DayMatch,
} from "../../../utils/perfPairs";

export {
  isPartialMatch,
  matchWeek,
  noLyHistory,
  type DayMatch,
} from "../../../utils/perfPairs";
import { normalizeProductCode } from "../../../utils/productCode";
import type {
  ItemDimension,
  MarginSort,
} from "../../../features/itemPerfSlice";

/**
 * Cost of goods for one row.
 *
 * Never the row's own `margin` field — that figure is wrong on the endpoint.
 * calculateCogs handles the two cases that break naive arithmetic: weighted
 * items, where `weight` is the priced unit and `qty` is only the scan count,
 * and vendors reporting a per-unit cost with `case_size` of 0.
 */
const cogsOf = (r: ItemRow) =>
  calculateCogs(r.net_cost, r.cost, r.case_size, r.qty, r.weight);

/** Units sold. Weighted items price by weight, so a pound of bananas is one
 *  scan and several units — reporting `qty` for those would undercount. */
const unitsOf = (r: ItemRow) => (r.weight > 0 ? r.weight : r.qty);

/**
 * A row with its money already worked out.
 *
 * calculateCogs is not free, and a store week is thousands of rows across two
 * periods. Computing it inside every grouping meant every view switch, day
 * tap and keystroke re-derived the same figures — which is exactly what made
 * switching views feel slow. Priced once per fetch, everything downstream is
 * addition.
 */
export interface PricedRow extends ItemRow {
  _net: number;
  _cogs: number;
  _units: number;
  _day: string;
}

export const priceRows = (rows: ItemRow[]): PricedRow[] =>
  rows.map((r) => ({
    ...r,
    // The interface says these are strings; the endpoint disagrees on some
    // rows and sends numbers, which is fatal twice over — `.toLowerCase()`
    // throws on a search, and a numeric vendor id never `===` the string key
    // held in state, so the drill silently finds nothing. Normalised here
    // because every builder downstream reads a PricedRow, so this is the one
    // place it can be got right.
    product_code: normalizeProductCode(r.product_code),
    vendor_id: String(r.vendor_id ?? ""),
    product_description: String(r.product_description ?? ""),
    _net: netOf(r),
    _cogs: cogsOf(r),
    _units: unitsOf(r),
    _day: dayOf(r),
  }));

/** Gross margin percent. Null rather than 0 when nothing sold: no margin is
 *  not the same as a margin of zero, and a page of 0.00% would read as a
 *  catastrophe rather than an empty window. */
const gpmOf = (sales: number, cogs: number) =>
  sales > 0 ? ((sales - cogs) / sales) * 100 : null;

/** Which field this page groups on. A row only carries the column its own
 *  endpoint grouped by, so the others read undefined and key to "". */
const keyOf = (r: ItemRow, d: ItemDimension) => {
  if (d === "vendor") return String(r.vendor_id ?? "");
  if (d === "category") return String(r.category ?? "");
  return String(r.sub_department ?? "");
};

/**
 * The vendor, as a person would say it.
 *
 * Vendor 0 is not a vendor numbered zero — it is the store's own "nothing
 * assigned", and it lands on plenty of real items (Managers Special, WIC
 * produce). Printing "0" makes it look like data went missing.
 */
const vendorLabel = (r: ItemRow) => {
  const id = String(r.vendor_id ?? "");
  if (!id || id === "0") return "No Vendor";
  // Id is unique and always present; the name is the readable half and is
  // blank on the odd row.
  return r.vendor_name || `Vendor ${id}`;
};

const labelOf = (r: ItemRow, d: ItemDimension) => {
  if (d === "vendor") return vendorLabel(r);
  if (d === "category") return r.category_description ?? "Uncategorised";
  return r.sub_department_description ?? "";
};

/** These pages are single-store, so the day is the only shared scope. */
const onDay = (rows: PricedRow[], day: string | null) =>
  day ? rows.filter((r) => r._day === day) : rows;

export interface MarginTotals {
  /** This year, every day in scope — the headline figures. */
  sales: number;
  /** This year over only the days last year matched — what the TY/LY bars
   *  compare. Equal to `sales` inside a day or on a complete week. */
  salesForLy: number;
  /** Last year, and everything below suffixed Ly, on matched dates only. */
  salesLy: number;
  /** Days this year has, and how many matched last year. Null inside a day,
   *  or when no matching was given. */
  days: number | null;
  lyDays: number | null;
  cogs: number;
  cogsLy: number;
  profit: number;
  profitLy: number;
  gpm: number | null;
  gpmLy: number | null;
  units: number;
  itemCount: number;
  tax: number;
}

const totalsOf = (
  ty: PricedRow[],
  ly: PricedRow[],
  match: DayMatch | undefined,
): MarginTotals => {
  const sales = ty.reduce((a, r) => a + r._net, 0);
  const cogs = ty.reduce((a, r) => a + r._cogs, 0);
  const salesLy = ly.reduce((a, r) => a + r._net, 0);
  const cogsLy = ly.reduce((a, r) => a + r._cogs, 0);
  const salesForLy = match
    ? ty.reduce((a, r) => (match.tyDates.has(r._day) ? a + r._net : a), 0)
    : sales;

  return {
    sales,
    salesForLy,
    salesLy,
    days: match ? match.days : null,
    lyDays: match ? match.lyDays : null,
    cogs,
    cogsLy,
    profit: sales - cogs,
    profitLy: salesLy - cogsLy,
    gpm: gpmOf(sales, cogs),
    gpmLy: gpmOf(salesLy, cogsLy),
    units: ty.reduce((a, r) => a + r._units, 0),
    itemCount: new Set(ty.map((r) => r.product_code)).size,
    tax: ty.reduce((a, r) => a + r.total_tax, 0),
  };
};

/**
 * Narrow rows to whatever the screen has open: the selected day, the drilled
 * department or vendor, and the selected item.
 *
 * `groupKey` is never applied to the group list itself — the caller passes
 * null there — because filtering the department list by the department you
 * just tapped would collapse it to one row.
 */
export const scopeItems = (
  rows: PricedRow[],
  dimension: ItemDimension,
  day: string | null,
  groupKey: string | null,
  itemCode: string | null,
) => {
  let out = onDay(rows, day);
  if (groupKey) out = out.filter((r) => keyOf(r, dimension) === groupKey);
  if (itemCode) out = out.filter((r) => r.product_code === itemCode);
  return out;
};

/**
 * Last year's rows a whole-week comparison may use: the matched dates, and
 * nothing else. Around a moving holiday the LY fetch spans more than seven
 * days (see DayMatch), so the rows in between must never be summed.
 */
const lyForWeek = (rows: PricedRow[], match: DayMatch | undefined) =>
  match ? rows.filter((r) => match.lyDates.has(r._day)) : rows;

export const buildMarginTotals = (
  itemsTy: PricedRow[],
  itemsLy: PricedRow[],
  dimension: ItemDimension,
  day: string | null,
  groupKey: string | null,
  itemCode: string | null,
  /** The store week's matching (matchWeek over the store's rows). Ignored
   *  inside a single day, which names its one LY date. */
  match?: DayMatch,
): MarginTotals => {
  const m = day ? undefined : match;
  return totalsOf(
    scopeItems(itemsTy, dimension, day, groupKey, itemCode),
    // Last year is matched day for day, so a Saturday never lands against a
    // Friday. A fixed 365-day shift gets the weekday wrong five years in seven.
    lyForWeek(
      scopeItems(
        itemsLy,
        dimension,
        day ? lyDateFor(day) : null,
        groupKey,
        itemCode,
      ),
      m,
    ),
    m,
  );
};

/** One row in any of the three lists. Sales drive the bars, the same figure
 *  the card's bars show; the percentage sits beside the name because it
 *  answers a different question. */
export interface MarginRow {
  key: string;
  label: string;
  sub: string;
  sales: number;
  /** This year over the days last year matched — the side the change and the
   *  bars compare. Equal to `sales` inside a day or on a complete week. */
  salesForLy: number;
  salesLy: number;
  profit: number;
  profitLy: number;
  gpm: number | null;
}

const rowsBy = (
  ty: PricedRow[],
  ly: PricedRow[],
  keyFn: (r: PricedRow) => string,
  labelFn: (r: PricedRow) => string,
  subFn: (r: PricedRow) => string,
  /** TY dates that matched last year; every TY row counts when absent. */
  tyDates?: Set<string>,
): MarginRow[] => {
  type Acc = {
    label: string;
    sub: string;
    s: number;
    sFor: number;
    c: number;
    sLy: number;
    cLy: number;
  };
  const acc = new Map<string, Acc>();

  const add = (rows: PricedRow[], side: "ty" | "ly") =>
    rows.forEach((r) => {
      const k = keyFn(r);
      const a = acc.get(k) ?? {
        label: labelFn(r),
        sub: subFn(r),
        s: 0,
        sFor: 0,
        c: 0,
        sLy: 0,
        cLy: 0,
      };
      if (side === "ty") {
        a.s += r._net;
        a.c += r._cogs;
        if (!tyDates || tyDates.has(r._day)) a.sFor += r._net;
      } else {
        a.sLy += r._net;
        a.cLy += r._cogs;
      }
      acc.set(k, a);
    });

  // Both periods fill the accumulator independently. Iterating this year and
  // looking last year up — what buildItemRows in utils/itemMargins does — drops
  // anything that sold last year and nothing this year, which on a screen built
  // around a year-over-year comparison fails silently.
  add(ty, "ty");
  add(ly, "ly");

  return (
    [...acc.entries()]
      .map(([key, a]) => ({
        key,
        label: a.label,
        sub: a.sub,
        sales: a.s,
        salesForLy: a.sFor,
        salesLy: a.sLy,
        profit: a.s - a.c,
        profitLy: a.sLy - a.cLy,
        gpm: gpmOf(a.s, a.c),
      }))
      // Biggest sales first, matching the bars. Size is a fact about the row;
      // ordering by how far it fell would be grading by another name.
      .sort((x, y) => y.sales - x.sales)
  );
};

const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

/** The page's own list: departments, or vendors. */
export const buildGroupRows = (
  itemsTy: PricedRow[],
  itemsLy: PricedRow[],
  dimension: ItemDimension,
  day: string | null,
  /** The store week's matching; see buildMarginTotals. */
  match?: DayMatch,
) => {
  const m = day ? undefined : match;
  return rowsBy(
    onDay(itemsTy, day),
    lyForWeek(onDay(itemsLy, day ? lyDateFor(day) : null), m),
    (r) => keyOf(r, dimension),
    (r) => labelOf(r, dimension),
    () => "",
    m?.tyDates,
    // Profit, not sales: the TY bar already prints this row's sales.
  ).map((r) => ({ ...r, sub: `${money(r.profit)} gross profit` }));
};

/** Items — inside a drilled group, or matching a search across the store. */
export const buildItemRows = (
  itemsTy: PricedRow[],
  itemsLy: PricedRow[],
  dimension: ItemDimension,
  day: string | null,
  groupKey: string | null,
  query: string,
  /** The store week's matching; see buildMarginTotals. */
  weekMatch?: DayMatch,
) => {
  const q = query.trim().toLowerCase();
  const match = (r: PricedRow) =>
    !q ||
    r.product_code.toLowerCase().includes(q) ||
    r.product_description.toLowerCase().includes(q);
  const m = day ? undefined : weekMatch;

  return rowsBy(
    scopeItems(itemsTy, dimension, day, groupKey, null).filter(match),
    lyForWeek(
      scopeItems(
        itemsLy,
        dimension,
        day ? lyDateFor(day) : null,
        groupKey,
        null,
      ).filter(match),
      m,
    ),
    (r) => r.product_code,
    (r) => r.product_description,
    // The subtitle carries the dimension the page is NOT grouped by, so a row
    // always says something the list around it does not already say.
    (r) =>
      `${r.product_code} · ${
        dimension === "vendor"
          ? (r.sub_department_description ?? r.category_description ?? "")
          : vendorLabel(r)
      }`,
    m?.tyDates,
  );
};

export interface DailyRow {
  iso: string;
  label: string;
  sales: number;
  units: number;
  gpm: number | null;
  /** No row at all for that day, as opposed to a day that rang zero. Shown as
   *  a dash: the item did not sell, which is not the same as selling nothing. */
  absent: boolean;
}

/** One item's week, day by day. The window's seven dates come from the caller
 *  so a day with no sales still gets a row. */
export const buildDailyRows = (
  itemsTy: PricedRow[],
  itemCode: string | null,
  weekDates: string[],
): DailyRow[] => {
  const mine = itemCode
    ? itemsTy.filter((r) => r.product_code === itemCode)
    : [];

  return weekDates.map((iso) => {
    const rows = mine.filter((r) => r._day === iso);
    const sales = rows.reduce((a, r) => a + r._net, 0);
    const cogs = rows.reduce((a, r) => a + r._cogs, 0);
    return {
      iso,
      // Parsed at midday so the local-time read of a UTC-parsed date cannot
      // slip the label back a day.
      label: new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "numeric",
        day: "numeric",
      }),
      sales,
      units: rows.reduce((a, r) => a + r._units, 0),
      gpm: gpmOf(sales, cogs),
      absent: rows.length === 0,
    };
  });
};

/** Sales by day, for the chart — the same figure as the card's bars above it. */
export const buildMarginDays = (
  itemsTy: PricedRow[],
  itemsLy: PricedRow[],
  dimension: ItemDimension,
  groupKey: string | null,
  itemCode: string | null,
  weekDates: string[],
) =>
  weekDates.map((iso) => {
    const ty = scopeItems(itemsTy, dimension, iso, groupKey, itemCode);
    const ly = scopeItems(
      itemsLy,
      dimension,
      lyDateFor(iso),
      groupKey,
      itemCode,
    );
    return {
      iso,
      label: new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      ty: ty.reduce((a, r) => a + r._net, 0),
      ly: ly.reduce((a, r) => a + r._net, 0),
    };
  });

/** Find an item's row in whichever period has one. Items that sold last year
 *  and nothing this year are listed, so they must open too — looking in this
 *  year alone gave them a blank title and an empty card. */
export const findItem = (
  code: string | null,
  ...periods: PricedRow[][]
): PricedRow | undefined => {
  if (!code) return undefined;
  for (const rows of periods) {
    const hit = rows.find((r) => r.product_code === code);
    if (hit) return hit;
  }
  return undefined;
};

/** Sales this year against last, as a percentage, over the matched days —
 *  what the bars compare. Null when last year sold nothing to compare against. */
export const salesChangePct = (r: MarginRow): number | null =>
  r.salesLy > 0 ? ((r.salesForLy - r.salesLy) / r.salesLy) * 100 : null;

/**
 * Order a margin list. Returns a new array.
 *
 * Nulls — no margin, or no last-year sales — sort after every real value, so
 * unknown never reads as worst. Ties fall back to sales.
 *
 * `reversed` flips the comparison INSIDE each case rather than by reversing the
 * result. Reversing the array would float the null rows to the top — reading as
 * "these are the worst" when they mean "there is nothing to compare" — and
 * would invert the sales tiebreak with them, so equal rows would reshuffle on a
 * tap that should only have changed direction.
 */
export const sortMarginRows = (
  rows: MarginRow[],
  sort: MarginSort,
  reversed: boolean = false,
): MarginRow[] => {
  const flip = reversed ? -1 : 1;
  const bySales = (a: MarginRow, b: MarginRow) => b.sales - a.sales;
  const nullsLast = (
    pick: (r: MarginRow) => number | null,
    dir: number,
  ) => (a: MarginRow, b: MarginRow) => {
    const va = pick(a);
    const vb = pick(b);
    if (va === null && vb === null) return bySales(a, b);
    if (va === null) return 1;
    if (vb === null) return -1;
    return (va - vb) * dir || bySales(a, b);
  };
  const out = [...rows];
  switch (sort) {
    case "sales":
      return out.sort((a, b) => bySales(a, b) * flip);
    case "profit":
      return out.sort((a, b) => (b.profit - a.profit) * flip || bySales(a, b));
    case "gpm":
      // Lowest margin first: the thin ones are what you open this to find.
      return out.sort(nullsLast((r) => r.gpm, flip));
    case "change":
      // Biggest drop first.
      return out.sort(nullsLast(salesChangePct, flip));
    case "name":
      return out.sort(
        (a, b) =>
          a.label.localeCompare(b.label, undefined, { numeric: true }) * flip ||
          bySales(a, b),
      );
  }
};

/**
 * The order each margin column reads in on its first tap.
 *
 * Not uniformly descending: sales and profit open on the largest, GPM and
 * change open on the thinnest and the steepest fall. Both are the useful end
 * of their own column.
 */
export const MARGIN_SORT_DIR: Record<MarginSort, "asc" | "desc"> = {
  sales: "desc",
  profit: "desc",
  gpm: "asc",
  change: "asc",
  name: "asc",
};

/** Which way a margin list is actually pointing, for the arrow on its chip. */
export const marginDirOf = (
  sort: MarginSort,
  reversed: boolean,
): "asc" | "desc" =>
  reversed ? (MARGIN_SORT_DIR[sort] === "asc" ? "desc" : "asc") : MARGIN_SORT_DIR[sort];
