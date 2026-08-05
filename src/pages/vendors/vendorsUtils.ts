import type { SubDeptMargin } from "../../interfaces";
import {
  LW_OFFSET,
  LY_OFFSET,
  isoOf,
  shiftIso,
  pctChange,
  tierOfDelta,
  type Tier,
} from "../../utils/grading";

/** Sales or units — the page-wide toggle, same contract as Categories. */
export type VendorMetric = "sales" | "qty";
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
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
}

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
  lwNet: number;
  lwQty: number;
  twNetForLW: number;
  twQtyForLW: number;
  lyNet: number;
  lyQty: number;
  twNetForLY: number;
  twQtyForLY: number;
  hasLW: boolean;
  hasLY: boolean;

}

/** Net of tax, matching Sub Dept Margins and the Item Lookup fix. `net_sales`
 *  is also on the row but is coupon-adjusted as well, so it isn't the same
 *  figure the other Performance pages compare on. */
const netOf = (m: SubDeptMargin) => m.total_sales - m.total_tax;

interface Bucket {
  net: number;
  qty: number;
}
const empty = (): Bucket => ({ net: 0, qty: 0 });

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
        lwNet: l ? l.net : null,
        lwQty: l ? l.qty : null,
        lyNet: y ? y.net : null,
        lyQty: y ? y.qty : null,
      };
    });

    let twNet = 0, twQty = 0;
    let lwNet = 0, lwQty = 0, twNetForLW = 0, twQtyForLW = 0;
    let lyNet = 0, lyQty = 0, twNetForLY = 0, twQtyForLY = 0;
    let hasLW = false, hasLY = false;

    for (const d of days) {
      twNet += d.twNet;
      twQty += d.twQty;
      // A day only joins a comparison when both sides have it, and when it does
      // it joins BOTH sides.
      if (d.lwNet !== null) {
        lwNet += d.lwNet;
        lwQty += d.lwQty ?? 0;
        twNetForLW += d.twNet;
        twQtyForLW += d.twQty;
        hasLW = true;
      }
      if (d.lyNet !== null) {
        lyNet += d.lyNet;
        lyQty += d.lyQty ?? 0;
        twNetForLY += d.twNet;
        twQtyForLY += d.twQty;
        hasLY = true;
      }
    }

    rows.push({
      vendorId: id,
      vendorName: agg.name,
      noVendor: id === NO_VENDOR_ID,
      days,
      twNet, twQty,
      lwNet, lwQty, twNetForLW, twQtyForLW,
      lyNet, lyQty, twNetForLY, twQtyForLY,
      hasLW, hasLY,
    });
  }

  return rows;
};

/** The figure a vendor is graded on — last year, or last week when there is no
 *  matching week a year ago. */
export const vendorDelta = (
  row: VendorRow,
  metric: VendorMetric,
): number | null => {
  const isQty = metric === "qty";
  if (row.hasLY) {
    return pctChange(
      isQty ? row.twQtyForLY : row.twNetForLY,
      isQty ? row.lyQty : row.lyNet,
    );
  }
  if (row.hasLW) {
    return pctChange(
      isQty ? row.twQtyForLW : row.twNetForLW,
      isQty ? row.lwQty : row.lwNet,
    );
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
