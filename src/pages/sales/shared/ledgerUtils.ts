import { addDays, sameWeekDayLastYear } from "../../../utils";
import { rowsToCsv } from "../../../utils/csvExport";
import type {
  WeeklySale,
  SubSale,
  HourlySale,
  SubDeptMargin,
  Store,
} from "../../../interfaces";
import type { LedgerRowData, Severity } from "../components/LedgerRow";
import type { GradingMetric } from "../../../features/salesLedgerSlice";

export const SEVERITY_RANK = { critical: 0, watch: 1, healthy: 2 } as const;

export const BADGE_BG: Record<Severity, string> = {
  critical: "#fee2e2",
  watch: "#fef3c7",
  healthy: "#d1fae5",
};
export const BADGE_COLOR: Record<Severity, string> = {
  critical: "#ef4444",
  watch: "#f59e0b",
  healthy: "#10b981",
};
export const SECTION_BG: Record<Severity, string> = {
  critical: "bg-red-50",
  watch: "bg-amber-50",
  healthy: "bg-emerald-50",
};
export const SECTION_BORDER: Record<Severity, string> = {
  critical: "border-red-100",
  watch: "border-amber-100",
  healthy: "border-emerald-100",
};
export const SECTION_TEXT: Record<Severity, string> = {
  critical: "text-red-800",
  watch: "text-amber-800",
  healthy: "text-emerald-800",
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type DeptRow = {
  id: number;
  desc: string;
  tw: number;
  lw: number;
  ly: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWPct: number;
  vsLYPct: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  digital: number;
  lyDigital: number;
  elecInstore: number;
  lyElecInstore: number;
  elecStore: number;
  lyElecStore: number;
  storeCpn: number;
  lyStoreCpn: number;
};

export type HourRow = {
  hour: number;
  tw: number;
  lw: number;
  ly: number;
  trans: number;
  lwTrans: number;
  lyTrans: number;
  qty: number;
  lwQty: number;
  lyQty: number;
  vsLWPct: number;
  vsLYPct: number;
  hasLW: boolean;
  hasLY: boolean;
};

// ─── Formatters ───────────────────────────────────────────────────────────────

export const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

// ─── Severity helpers ─────────────────────────────────────────────────────────

export const deptSeverity = (r: DeptRow, threshold = 9): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

export const hourSeverity = (r: HourRow, threshold = 9): Severity => {
  const pct = r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

// ─── Day-matched comparison helpers ────────────────────────────────────────────
//
// The underlying sales data is fragmented — a store/week doesn't always have a
// row for every calendar day, on any of TW/LW/LY. That creates a subtler bug
// than a missing row: if a day has real TW sales but no LW/LY counterpart, its
// TW total still lands in a naive "sum everything" total, while the LW/LY side
// doesn't grow to match. Comparing that inflated TY sum against a partial
// LW/LY sum produces a misleading percentage (e.g. two real declines somehow
// averaging out to a positive "vs LW" for the week). The fix is to restrict
// the TW side of every comparison to just the days/rows that also have a
// genuine LW or LY counterpart — not all of TW vs whatever LW/LY happened to
// match.

export interface DayMatchable {
  twNet: number;
  twQty: number;
  lwNet: number | null;
  lwQty: number | null;
  lyNet: number | null;
  lyQty: number | null;
}

export interface DayMatchedTotals {
  twTotal: number;
  twQty: number;
  lwTotal: number;
  lwQty: number;
  lyTotal: number;
  lyQty: number;
  hasLW: boolean;
  hasLY: boolean;
  vsLWPct: number;
  vsLYPct: number;
  vsLYDollar: number;
}

/** Computes correctly-scoped totals/percentages from a day-matched breakdown
 * (lwNet/lyNet are `null` for a day with no matching row — not `0`, which
 * would mean a genuine zero-sales day). The TW side of each percentage is
 * restricted to just the days that have a match on that specific side. */
export const computeDayMatchedTotals = (
  days: DayMatchable[],
  gradingMetric: GradingMetric = "sales",
): DayMatchedTotals => {
  const twTotal = days.reduce((acc, d) => acc + d.twNet, 0);
  const twQty = days.reduce((acc, d) => acc + d.twQty, 0);

  const lwDays = days.filter((d) => d.lwNet !== null);
  const lwTotal = lwDays.reduce((acc, d) => acc + (d.lwNet as number), 0);
  const lwQty = lwDays.reduce((acc, d) => acc + (d.lwQty ?? 0), 0);
  const twTotalForLW = lwDays.reduce((acc, d) => acc + d.twNet, 0);
  const twQtyForLW = lwDays.reduce((acc, d) => acc + d.twQty, 0);

  const lyDays = days.filter((d) => d.lyNet !== null);
  const lyTotal = lyDays.reduce((acc, d) => acc + (d.lyNet as number), 0);
  const lyQty = lyDays.reduce((acc, d) => acc + (d.lyQty ?? 0), 0);
  const twTotalForLY = lyDays.reduce((acc, d) => acc + d.twNet, 0);
  const twQtyForLY = lyDays.reduce((acc, d) => acc + d.twQty, 0);

  const hasLW = lwTotal > 0;
  const hasLY = lyTotal > 0;

  const gradeTwLW = gradingMetric === "qty" ? twQtyForLW : twTotalForLW;
  const gradeLW = gradingMetric === "qty" ? lwQty : lwTotal;
  const gradeTwLY = gradingMetric === "qty" ? twQtyForLY : twTotalForLY;
  const gradeLY = gradingMetric === "qty" ? lyQty : lyTotal;

  return {
    twTotal,
    twQty,
    lwTotal,
    lwQty,
    lyTotal,
    lyQty,
    hasLW,
    hasLY,
    vsLWPct: hasLW ? ((gradeTwLW - gradeLW) / gradeLW) * 100 : 0,
    vsLYPct: hasLY ? ((gradeTwLY - gradeLY) / gradeLY) * 100 : 0,
    vsLYDollar: twTotalForLY - lyTotal,
  };
};

/** Given the store's real TW dates, builds twDate → lwDate / twDate → lyDate
 * lookup maps (the same per-day shift used to fetch/filter LW/LY data) —
 * shared so every aggregation level (store, dept, hour, item) matches days
 * the identical way. */
export const buildDayShiftMaps = (
  twRealDates: string[],
): { twToLwDay: Map<string, string>; twToLyDay: Map<string, string> } => {
  const twToLwDay = new Map<string, string>();
  const twToLyDay = new Map<string, string>();
  for (const d of twRealDates) {
    twToLwDay.set(d, addDays(new Date(d), -7).toISOString().split("T")[0]);
    twToLyDay.set(d, sameWeekDayLastYear(d).date);
  }
  return { twToLwDay, twToLyDay };
};

/** For each entity (dept id, hour, product code, ...), computes how much of
 * its TW total falls on days that also have a matching LW/LY row for that
 * SAME entity — a day can have store-wide LW data while a specific
 * department/hour/item still has none for that day. Used to scope each
 * entity's "vs LW"/"vs LY" percentage the same way computeDayMatchedTotals
 * does at the store level, without altering the flat, unrestricted totals
 * (net/qty/etc.) that aggSubDepts/aggHours/aggByCode already produce for
 * display. */
export const buildDayMatchedTwTotals = <T>(
  twSrc: T[],
  lwSrc: T[],
  lySrc: T[],
  keyOf: (row: T) => string | number,
  dayOf: (row: T) => string,
  netOf: (row: T) => number,
  qtyOf: (row: T) => number,
  twToLwDay: Map<string, string>,
  twToLyDay: Map<string, string>,
): Map<
  string | number,
  { twNetForLW: number; twQtyForLW: number; twNetForLY: number; twQtyForLY: number }
> => {
  const daysByEntity = (rows: T[]) => {
    const map = new Map<string | number, Set<string>>();
    for (const r of rows) {
      const key = keyOf(r);
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(dayOf(r));
    }
    return map;
  };
  const lwDaysByEntity = daysByEntity(lwSrc);
  const lyDaysByEntity = daysByEntity(lySrc);

  const twByEntityDay = new Map<string | number, Map<string, { net: number; qty: number }>>();
  for (const r of twSrc) {
    const key = keyOf(r);
    const day = dayOf(r);
    if (!twByEntityDay.has(key)) twByEntityDay.set(key, new Map());
    const dayMap = twByEntityDay.get(key)!;
    const existing = dayMap.get(day) ?? { net: 0, qty: 0 };
    existing.net += netOf(r);
    existing.qty += qtyOf(r);
    dayMap.set(day, existing);
  }

  const result = new Map<
    string | number,
    { twNetForLW: number; twQtyForLW: number; twNetForLY: number; twQtyForLY: number }
  >();
  for (const [key, dayMap] of twByEntityDay) {
    let twNetForLW = 0;
    let twQtyForLW = 0;
    let twNetForLY = 0;
    let twQtyForLY = 0;
    const lwDays = lwDaysByEntity.get(key);
    const lyDays = lyDaysByEntity.get(key);
    for (const [day, v] of dayMap) {
      const lwDay = twToLwDay.get(day);
      if (lwDay && lwDays?.has(lwDay)) {
        twNetForLW += v.net;
        twQtyForLW += v.qty;
      }
      const lyDay = twToLyDay.get(day);
      if (lyDay && lyDays?.has(lyDay)) {
        twNetForLY += v.net;
        twQtyForLY += v.qty;
      }
    }
    result.set(key, { twNetForLW, twQtyForLW, twNetForLY, twQtyForLY });
  }
  return result;
};

// ─── Data gap report ────────────────────────────────────────────────────────────
//
// All Sales endpoints (weekly, hourly, subs, submargins) are just different
// groupings over the same underlying sales rows for a store/day — so if a
// calendar day is missing from the weekly fetch, it's missing everywhere for
// that store/day, not just at the weekly level. Checked independently against
// each period's own expected calendar dates (not derived from a TW-day-keyed
// breakdown), so a day missing from TW itself — not just from LW/LY — is
// visible too, instead of silently never appearing anywhere.

export interface PeriodGap {
  label: string;
  totalDays: number;
  missingDates: string[];
}

export interface WeeklyDataGaps {
  tw: PeriodGap;
  lw: PeriodGap;
  ly: PeriodGap;
}

const enumerateDates = (start: string, end: string): string[] => {
  const dates: string[] = [];
  let cur = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  while (cur <= endDate) {
    dates.push(cur.toISOString().split("T")[0]);
    cur = addDays(cur, 1);
  }
  return dates;
};

/** For a store/week, checks each of TW/LW/LY against its own expected
 * calendar dates (TW and LW are the plain 7-day ranges; LY is each TW date
 * shifted through sameWeekDayLastYear, since holiday shifts can make that
 * span non-contiguous) and reports which dates have no weekly-sales row at
 * all. Independent per period — unlike computeDayMatchedTotals, this isn't
 * about scoping a comparison, it's about surfacing a true data hole in a
 * single period on its own. */
export const getWeeklyDataGaps = (
  storeId: number,
  twStart: string,
  twEnd: string,
  lwStart: string,
  lwEnd: string,
  twRows: WeeklySale[],
  lwRows: WeeklySale[],
  lyRows: WeeklySale[],
): WeeklyDataGaps => {
  const storeTw = twRows.filter((r) => r.storeid === storeId);
  const storeLw = lwRows.filter((r) => r.storeid === storeId);
  const storeLy = lyRows.filter((r) => r.storeid === storeId);

  const twDates = enumerateDates(twStart, twEnd);
  const lwDates = enumerateDates(lwStart, lwEnd);
  const lyDates = twDates.map((d) => sameWeekDayLastYear(d).date).sort();

  const twHave = new Set(storeTw.map((r) => r.sale_date.split("T")[0]));
  const lwHave = new Set(storeLw.map((r) => r.sale_date.split("T")[0]));
  const lyHave = new Set(storeLy.map((r) => r.sale_date.split("T")[0]));

  const missing = (dates: string[], have: Set<string>) =>
    dates.filter((d) => !have.has(d)).sort();

  return {
    tw: {
      label: "This week",
      totalDays: twDates.length,
      missingDates: missing(twDates, twHave),
    },
    lw: {
      label: "Last week",
      totalDays: lwDates.length,
      missingDates: missing(lwDates, lwHave),
    },
    ly: {
      label: "Last year",
      totalDays: lyDates.length,
      missingDates: missing(lyDates, lyHave),
    },
  };
};

export const getWeeklyGapCount = (gaps: WeeklyDataGaps): number =>
  gaps.tw.missingDates.length +
  gaps.lw.missingDates.length +
  gaps.ly.missingDates.length;

export const buildDataGapCsv = (
  storeName: string,
  storeNumber: string,
  gaps: WeeklyDataGaps,
): string => {
  const headers = ["Store", "Store #", "Period", "Missing date"];
  const rows: (string | number | null)[][] = [];
  for (const period of [gaps.tw, gaps.lw, gaps.ly]) {
    if (period.missingDates.length === 0) {
      rows.push([storeName, storeNumber, period.label, "No gaps"]);
      continue;
    }
    for (const d of period.missingDates) {
      rows.push([storeName, storeNumber, period.label, d]);
    }
  }
  return rowsToCsv(headers, rows);
};

// ─── Ledger row builder ───────────────────────────────────────────────────────

export const buildLedgerRows = (
  tw: WeeklySale[],
  lw: WeeklySale[],
  ly: WeeklySale[],
  assignedStores: Store[] = [],
  threshold: number = 9,
  gradingMetric: GradingMetric = "sales",
): LedgerRowData[] => {
  const storeIds = [...new Set(tw.map((d) => d.storeid))];
  return storeIds
    .map((id) => {
      const twRows = tw.filter((d) => d.storeid === id);
      const lwRows = lw.filter((d) => d.storeid === id);
      const lyRows = ly.filter((d) => d.storeid === id);
      const ref = twRows[0];
      const assigned = assignedStores.find((s) => s.storeid === id);
      const twQty = twRows.reduce((acc, r) => acc + r.qty, 0);

      // The LW/LY fetch ranges can end up not lining up 1:1 with the current
      // week's days (LY is intentionally widened around holidays — see
      // getDateRanges/StoreDetailPopup — and the underlying weekly-sales rows
      // are fragmented on top of that, missing some calendar days outright on
      // any of TW/LW/LY). lwNet/lyNet are null (not 0) when no matching row
      // exists, so computeDayMatchedTotals can tell "no data" apart from a
      // real $0 day and scope each comparison's TW side to only the days
      // that have a genuine LW/LY counterpart — both this row's totals and
      // the detail panel's header read the same `days` array, so they always
      // agree with each other.
      const days = twRows
        .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
        .map((r) => {
          const twDate = r.sale_date.split("T")[0];
          const lwDate = addDays(new Date(twDate), -7)
            .toISOString()
            .split("T")[0];
          const lyDate = sameWeekDayLastYear(twDate).date;
          const lwRow = lwRows.find((l) => l.sale_date.startsWith(lwDate));
          const lyRow = lyRows.find((l) => l.sale_date.startsWith(lyDate));
          return {
            sale_date: r.sale_date,
            twNet: r.total_sales - r.total_tax,
            lwNet: lwRow ? lwRow.total_sales - lwRow.total_tax : null,
            lyNet: lyRow ? lyRow.total_sales - lyRow.total_tax : null,
            lwQty: lwRow ? lwRow.qty : null,
            lyQty: lyRow ? lyRow.qty : null,
            twQty: r.qty,
          };
        });

      const {
        twTotal,
        lwTotal,
        lwQty,
        lyTotal,
        lyQty,
        hasLW,
        hasLY,
        vsLWPct,
        vsLYPct,
        vsLYDollar,
      } = computeDayMatchedTotals(days, gradingMetric);
      const severity: LedgerRowData["severity"] = (() => {
        const pct = hasLY ? vsLYPct : hasLW ? vsLWPct : 0;
        if (pct < -threshold) return "critical";
        if (pct < 0) return "watch";
        return "healthy";
      })();
      return {
        storeid: id,
        store_name: assigned?.store_name ?? ref.store_name,
        store_number: assigned?.store_number ?? ref.store_number,
        twTotal,
        lwTotal,
        lyTotal,
        twQty,
        lwQty,
        lyQty,
        vsLWPct,
        vsLYPct,
        vsLYDollar,
        hasLW,
        hasLY,
        severity,
        days,
      };
    })
    .sort((a, b) => {
      const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (rankDiff !== 0) return rankDiff;
      const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
      const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
      return aPct - bPct;
    });
};

// ─── Aggregators ──────────────────────────────────────────────────────────────

export const aggSubDepts = (
  src: SubSale[],
): Record<
  number,
  {
    desc: string;
    net: number;
    qty: number;
    digital: number;
    elecInstore: number;
    elecStore: number;
    storeCpn: number;
  }
> =>
  src.reduce(
    (acc, s) => {
      if (!acc[s.sub_department])
        acc[s.sub_department] = {
          desc: s.sub_department_description,
          net: 0,
          qty: 0,
          digital: 0,
          elecInstore: 0,
          elecStore: 0,
          storeCpn: 0,
        };
      acc[s.sub_department].net += s.total_sales - s.total_tax;
      acc[s.sub_department].qty += s.qty;
      acc[s.sub_department].digital += s.digital_coupons;
      acc[s.sub_department].elecInstore += s.elec_instore_coupons;
      acc[s.sub_department].elecStore += s.elec_store_coupons;
      acc[s.sub_department].storeCpn += s.store_coupon;
      return acc;
    },
    {} as Record<
      number,
      {
        desc: string;
        net: number;
        qty: number;
        digital: number;
        elecInstore: number;
        elecStore: number;
        storeCpn: number;
      }
    >,
  );

export const aggHours = (
  src: HourlySale[],
): Record<number, { net: number; trans: number; qty: number }> =>
  src.reduce(
    (acc, h) => {
      if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
      acc[h.hour].net += h.total_sales - h.total_tax;
      acc[h.hour].trans += h.transactions;
      acc[h.hour].qty += h.qty;
      return acc;
    },
    {} as Record<number, { net: number; trans: number; qty: number }>,
  );

export const aggByCode = (
  items: SubDeptMargin[],
): Map<string, { desc: string; net: number; qty: number; weight: number }> => {
  const map = new Map<
    string,
    { desc: string; net: number; qty: number; weight: number }
  >();
  for (const item of items) {
    const ex = map.get(item.product_code);
    if (ex) {
      ex.net += item.total_sales - item.total_tax;
      ex.qty += item.qty;
      ex.weight += item.weight;
    } else
      map.set(item.product_code, {
        desc: item.product_description,
        net: item.total_sales - item.total_tax,
        qty: item.qty,
        weight: item.weight,
      });
  }
  return map;
};
