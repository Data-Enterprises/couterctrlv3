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

// Co-located-store helpers live in utils/storeIdentity — Sub Dept Margins needs
// the identical behaviour, and the two pages have to agree on these stores.
// Re-exported so the many Sales call sites keep their existing import.
export {
  scopeToStoreNumber,
  applyStoreNumberToName,
} from "../../../utils/storeIdentity";

// Same arrangement for sub department identity — Sales, Sub Dept Margins,
// Orders and Coupons all have to bucket departments the same way.
import { subDeptKeyOf, type SubDeptKeyMode } from "../../../utils/subDeptIdentity";
export {
  subDeptKeyMode,
  subDeptKeyOf,
  subDeptKeyer,
  scopeToSubDept,
  type SubDeptKeyMode,
} from "../../../utils/subDeptIdentity";

// The comparison a row is graded on: last year when we have it, else last
// week. Rounded before grading — see itemSeverity in PopupSubDeptList for why.
export const ledgerGradePct = (row: {
  hasLY: boolean;
  hasLW: boolean;
  vsLYPct: number;
  vsLWPct: number;
}) =>
  Math.round((row.hasLY ? row.vsLYPct : row.hasLW ? row.vsLWPct : 0) * 10) / 10;

export const ledgerSeverity = (pct: number, threshold: number): Severity => {
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

export const sortLedgerRows = (rows: LedgerRowData[]): LedgerRowData[] =>
  [...rows].sort((a, b) => {
    const rankDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (rankDiff !== 0) return rankDiff;
    const aPct = a.hasLY ? a.vsLYPct : a.vsLWPct;
    const bPct = b.hasLY ? b.vsLYPct : b.vsLWPct;
    return aPct - bPct;
  });

// Re-grade already-built rows against a new threshold. The expensive part of
// buildLedgerRows (regrouping and day-matching every store across TW/LW/LY) is
// threshold-independent — only severity and the resulting sort order change.
// Splitting them lets the threshold move continuously without redoing the
// aggregation, which is what makes a drag-to-set control viable.
// Rows whose severity didn't change keep their exact object reference. A 1%
// nudge typically flips only a handful of stores, so memoized row components
// can skip re-rendering the rest — spreading every row unconditionally would
// hand all of them new identities and defeat that.
export const regradeLedgerRows = (
  rows: LedgerRowData[],
  threshold: number,
): LedgerRowData[] =>
  sortLedgerRows(
    rows.map((r) => {
      const severity = ledgerSeverity(ledgerGradePct(r), threshold);
      return severity === r.severity ? r : { ...r, severity };
    }),
  );

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
  /** Bucket key — the sub department id, or its description at companies that
   *  don't number their departments. See utils/subDeptIdentity. */
  key: string;
  /** Still the id, and still what the margins endpoint is queried with; it's 0
   *  for every department when the company doesn't number them. */
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

export const formatPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

export const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

export const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

// ─── Severity helpers ─────────────────────────────────────────────────────────

// Rounded before grading — the underlying totals are sums of individual
// line items, so floating-point noise can leave a value like
// -0.0000000001% even when the displayed dollars are identical, misgrading
// what should be "healthy" as "watch".
export const deptSeverity = (r: DeptRow, threshold = 9): Severity => {
  const pct = Math.round((r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0) * 10) / 10;
  if (pct < -threshold) return "critical";
  if (pct < 0) return "watch";
  return "healthy";
};

export const hourSeverity = (r: HourRow, threshold = 9): Severity => {
  const pct = Math.round((r.hasLY ? r.vsLYPct : r.hasLW ? r.vsLWPct : 0) * 10) / 10;
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
  // Some storeids come back carrying more than one store_number — genuinely
  // separate locations that were never given their own storeid (e.g. 685
  // returns both "369" and "370", with wildly different tax rates and basket
  // profiles). Keying on storeid alone merged them into one row, doubled every
  // date in the day strip, and double-counted the LW/LY baseline because each
  // duplicate TY day re-found the same LW row.
  //
  // Keying on storeid + store_number separates them. Stores with a single
  // number are unaffected — they produce exactly the same single row as before.
  const numbersByStore = tw.reduce((acc: Record<number, Set<string>>, d) => {
    (acc[d.storeid] ??= new Set()).add(d.store_number);
    return acc;
  }, {});

  const keys = [
    ...new Map(
      tw.map((d) => [`${d.storeid}__${d.store_number}`, d]),
    ).values(),
  ];

  const rows = keys
    .map((keyRow) => {
      const id = keyRow.storeid;
      const num = keyRow.store_number;
      const sameStore = (d: WeeklySale) =>
        d.storeid === id && d.store_number === num;
      const twRows = tw.filter(sameStore);
      const lwRows = lw.filter(sameStore);
      const lyRows = ly.filter(sameStore);
      const ref = twRows[0];
      // assignedStores is keyed by storeid only, so a co-located pair resolves
      // to the same name for both — the store_number is what tells them apart
      // until the store master gives 370 its own record.
      const assigned = assignedStores.find((s) => s.storeid === id);
      const storeNumbersForId = [...(numbersByStore[id] ?? [num])];
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
      const severity = ledgerSeverity(
        ledgerGradePct({ hasLY, hasLW, vsLYPct, vsLWPct }),
        threshold,
      );
      return {
        storeid: id,
        store_name: assigned?.store_name ?? ref.store_name,
        // Must be the grouping key, not assigned.store_number — that resolves
        // by storeid and would label both co-located rows with the same number.
        store_number: num,
        storeNumbersForId,
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
    });
  return sortLedgerRows(rows);
};

// ─── Aggregators ──────────────────────────────────────────────────────────────

/**
 * Sub department totals, bucketed by whichever field identifies a department in
 * this data. `mode` is passed in rather than derived per call so the TW, LW and
 * LY maps key identically — deriving it separately would let an empty or
 * differently-numbered comparison period key on the other field and match
 * nothing, quietly zeroing every vs-LY figure.
 */
export const aggSubDepts = (
  src: SubSale[],
  mode: SubDeptKeyMode,
): Record<
  string,
  {
    id: number;
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
      const key = subDeptKeyOf(s, mode);
      if (!acc[key])
        acc[key] = {
          id: Number(s.sub_department) || 0,
          desc: s.sub_department_description,
          net: 0,
          qty: 0,
          digital: 0,
          elecInstore: 0,
          elecStore: 0,
          storeCpn: 0,
        };
      acc[key].net += s.total_sales - s.total_tax;
      acc[key].qty += s.qty;
      acc[key].digital += s.digital_coupons;
      acc[key].elecInstore += s.elec_instore_coupons;
      acc[key].elecStore += s.elec_store_coupons;
      acc[key].storeCpn += s.store_coupon;
      return acc;
    },
    {} as Record<
      string,
      {
        id: number;
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
