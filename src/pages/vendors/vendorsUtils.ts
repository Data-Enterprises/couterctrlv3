import type { SubDeptMargin } from "../../interfaces";
import { calculateCogs } from "../subDepts";
import {
  LW_OFFSET,
  LY_OFFSET,
  isoOf,
  shiftIso,
  pctChange,
  tierOfDelta,
  type Tier,
} from "../../utils/grading";

/** Margin or sales — the page-wide toggle, the same contract Sub Dept Margins
 *  uses. Vendors reads the same `subs/subs` rows, just grouped by vendor rather
 *  than by department, so margin is available on exactly the same basis. */
export type VendorMetric = "margin" | "sales";
export type VendorTier = Tier;

/** One TW day for one vendor, with its aligned comparisons.
 *
 *  Null on the LW/LY side means that day is absent from the prior period —
 *  which is not the same as zero, and is what the day-matching below keys off. */
export interface VendorDay {
  /** Always the *this week* date. LW and LY are aligned onto it. */
  date: string;
  twNet: number;
  twQty: number;
  twCogs: number;
  lwNet: number | null;
  lwQty: number | null;
  lwCogs: number | null;
  lyNet: number | null;
  lyQty: number | null;
  lyCogs: number | null;
}

/** Margin percentage from a net/COGS pair. Zero net means there is nothing to
 *  take a margin on — 0 rather than a divide-by-zero, matching Sub Dept
 *  Margins. */
export const marginPct = (net: number, cogs: number) =>
  net > 0 ? ((net - cogs) / net) * 100 : 0;

/** Rows with no supplier — coupon (CPN) lines and anything else the POS books
 *  without a vendor — collect here rather than being dropped.
 *
 *  Dropping them would be tidier per row and wrong in aggregate: the vendor
 *  totals would no longer add up to the store's net sales, and a large coupon
 *  bucket is worth seeing anyway. Same call Categories makes with
 *  Uncategorized. */
export const NO_VENDOR_ID = "__none__";
export const NO_VENDOR_LABEL = "No vendor";

export interface VendorRow {
  /** Zero-padded string from the POS, or NO_VENDOR_ID. The stable key — names
   *  get re-keyed, ids don't. */
  vendorId: string;
  vendorName: string;
  /** True for the NO_VENDOR_ID bucket, so the panel can label it rather than
   *  presenting it as a supplier. */
  noVendor: boolean;
  days: VendorDay[];

  /** Day-matched: each comparison totals only the days present on both sides,
   *  and carries its own TW subtotal so the two are like for like. Summing a
   *  full TW against a partial LY is the error these fields exist to prevent. */
  twNet: number;
  twQty: number;
  twCogs: number;
  lwNet: number;
  lwQty: number;
  lwCogs: number;
  twNetForLW: number;
  twQtyForLW: number;
  twCogsForLW: number;
  lyNet: number;
  lyQty: number;
  lyCogs: number;
  twNetForLY: number;
  twQtyForLY: number;
  twCogsForLY: number;
  hasLW: boolean;
  hasLY: boolean;

  /** Margin points, computed from the DAY-MATCHED subtotals so a partial week
   *  isn't compared against a full one. Positive means margin improved. */
  tyMarginPct: number;
  lwMarginPct: number;
  lyMarginPct: number;
  lwPtsDelta: number;
  lyPtsDelta: number;
}

/** Net of tax, matching Sub Dept Margins and the Item Lookup fix. `net_sales`
 *  is also on the row but is coupon-adjusted as well, so it isn't the same
 *  figure the other Performance pages compare on. */
const netOf = (m: SubDeptMargin) => m.total_sales - m.total_tax;

interface Bucket {
  net: number;
  qty: number;
  cogs: number;
}
const empty = (): Bucket => ({ net: 0, qty: 0, cogs: 0 });

/** vendorId -> date -> totals, plus the vendor's display name and reach. */
interface VendorAgg {
  name: string;
  byDate: Map<string, Bucket>;
}

/** The endpoint types both vendor fields as strings and then sends the number 0
 *  on coupon lines, so anything reading them has to coerce before it trims —
 *  `(0).trim()` is a TypeError, and TypeScript can't warn about it because the
 *  interface says otherwise. */
const asText = (v: unknown) => (v === null || v === undefined ? "" : String(v)).trim();

/** Empty, or all zeros — `0`, `"0"`, `"00000"`. A real id like `"00050"` is
 *  numerically 50, so it never lands here. */
const isNoVendor = (id: string) => id === "" || /^0+$/.test(id);

const collect = (rows: SubDeptMargin[]) => {
  const map = new Map<string, VendorAgg>();
  for (const m of rows) {
    const rawId = asText(m.vendor_id);
    const id = isNoVendor(rawId) ? NO_VENDOR_ID : rawId;
    let v = map.get(id);
    if (!v) {
      const name = asText(m.vendor_name);
      v = {
        name:
          id === NO_VENDOR_ID
            ? NO_VENDOR_LABEL
            : name && !isNoVendor(name)
              ? name
              : rawId,
        byDate: new Map(),
      };
      map.set(id, v);
    }
    const d = isoOf(m.sale_date);
    const b = v.byDate.get(d) ?? empty();
    b.net += netOf(m);
    b.qty += m.qty;
    // The canonical helper — net_cost before cost, weight before qty. Costing a
    // promoted item at list, or a scale item by scan count, is what it exists
    // to prevent; see the note on calculateCogs.
    b.cogs += calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    v.byDate.set(d, b);
  }
  return map;
};

/**
 * Fold three periods of item rows into one graded row per vendor.
 *
 * `twDates` is the spine: every comparison is aligned onto a this-week date by
 * whole-week offset, so a Monday always meets a Monday. A vendor that sold
 * nothing on a given TW day still gets a day entry, because the shape of the
 * week is part of what the panel shows.
 */
export const buildVendorRows = (
  tw: SubDeptMargin[],
  lw: SubDeptMargin[],
  ly: SubDeptMargin[],
  twDates: string[],
): VendorRow[] => {
  const twMap = collect(tw);
  const lwMap = collect(lw);
  const lyMap = collect(ly);

  const rows: VendorRow[] = [];

  for (const [id, agg] of twMap) {
    const lwAgg = lwMap.get(id);
    const lyAgg = lyMap.get(id);

    const days: VendorDay[] = twDates.map((date) => {
      const t = agg.byDate.get(date) ?? empty();
      const l = lwAgg?.byDate.get(shiftIso(date, LW_OFFSET));
      const y = lyAgg?.byDate.get(shiftIso(date, LY_OFFSET));
      return {
        date,
        twNet: t.net,
        twQty: t.qty,
        twCogs: t.cogs,
        lwNet: l ? l.net : null,
        lwQty: l ? l.qty : null,
        lwCogs: l ? l.cogs : null,
        lyNet: y ? y.net : null,
        lyQty: y ? y.qty : null,
        lyCogs: y ? y.cogs : null,
      };
    });

    let twNet = 0, twQty = 0, twCogs = 0;
    let lwNet = 0, lwQty = 0, lwCogs = 0;
    let twNetForLW = 0, twQtyForLW = 0, twCogsForLW = 0;
    let lyNet = 0, lyQty = 0, lyCogs = 0;
    let twNetForLY = 0, twQtyForLY = 0, twCogsForLY = 0;
    let hasLW = false, hasLY = false;

    for (const d of days) {
      twNet += d.twNet;
      twQty += d.twQty;
      twCogs += d.twCogs;
      // A day only joins a comparison when both sides have it, and when it does
      // it joins BOTH sides.
      if (d.lwNet !== null) {
        lwNet += d.lwNet;
        lwQty += d.lwQty ?? 0;
        lwCogs += d.lwCogs ?? 0;
        twNetForLW += d.twNet;
        twQtyForLW += d.twQty;
        twCogsForLW += d.twCogs;
        hasLW = true;
      }
      if (d.lyNet !== null) {
        lyNet += d.lyNet;
        lyQty += d.lyQty ?? 0;
        lyCogs += d.lyCogs ?? 0;
        twNetForLY += d.twNet;
        twQtyForLY += d.twQty;
        twCogsForLY += d.twCogs;
        hasLY = true;
      }
    }

    rows.push({
      vendorId: id,
      vendorName: agg.name,
      noVendor: id === NO_VENDOR_ID,
      days,
      twNet, twQty, twCogs,
      lwNet, lwQty, lwCogs, twNetForLW, twQtyForLW, twCogsForLW,
      lyNet, lyQty, lyCogs, twNetForLY, twQtyForLY, twCogsForLY,
      hasLW, hasLY,
      tyMarginPct: marginPct(twNet, twCogs),
      lwMarginPct: marginPct(lwNet, lwCogs),
      lyMarginPct: marginPct(lyNet, lyCogs),
      // Both sides of a points delta come from the SAME matched days, so a
      // week still in progress isn't measured against a full prior one.
      lwPtsDelta: marginPct(twNetForLW, twCogsForLW) - marginPct(lwNet, lwCogs),
      lyPtsDelta: marginPct(twNetForLY, twCogsForLY) - marginPct(lyNet, lyCogs),
    });
  }

  return rows;
};

/**
 * The figure a vendor is graded on — last year, or last week when there is no
 * matching week a year ago.
 *
 * Margin returns POINTS, sales returns PERCENT. They aren't interchangeable and
 * the caller has to format accordingly, which is the same contract
 * getGradeDelta has on Sub Dept Margins.
 */
export const vendorDelta = (
  row: VendorRow,
  metric: VendorMetric,
): number | null => {
  const isMargin = metric === "margin";
  if (row.hasLY) {
    return isMargin ? row.lyPtsDelta : pctChange(row.twNetForLY, row.lyNet);
  }
  if (row.hasLW) {
    return isMargin ? row.lwPtsDelta : pctChange(row.twNetForLW, row.lwNet);
  }
  return null;
};

export const getVendorTier = (
  row: VendorRow,
  threshold: number,
  metric: VendorMetric,
): VendorTier => tierOfDelta(vendorDelta(row, metric), threshold);

/** Rows for one vendor, for the right panel's Items and Sub departments tabs.
 *  Must bucket exactly as `collect` does, or the No-vendor row would open to an
 *  empty panel. */
export const rowsForVendor = (rows: SubDeptMargin[], vendorId: string) =>
  rows.filter((m) => {
    const raw = asText(m.vendor_id);
    return (isNoVendor(raw) ? NO_VENDOR_ID : raw) === vendorId;
  });

/** Every TW date in the search, sorted — the spine day-matching aligns onto. */
export const datesOf = (rows: SubDeptMargin[]): string[] =>
  [...new Set(rows.map((m) => isoOf(m.sale_date)))].sort();
