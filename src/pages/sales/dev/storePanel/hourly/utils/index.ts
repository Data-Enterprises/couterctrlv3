// Utils
import { addDays, sameWeekDayLastYear } from "../../../../../../utils";
import {
  gradeBasis,
  gradeOnBasis,
  basisPct,
  severityRank,
  matchDatedRows,
  type Coverage,
  type GradeBasis,
} from "../../../utils/ledgerUtils";

// Interfaces
import type { GradingMetric } from "../../../../../../features/dev/devSalesLedgerSlice";
import type { HourlySale } from "../../../../../../interfaces";
import type { Severity } from "../../../components/LedgerRow";
import type {
  HourCta,
  HourRow,
  HourSortColumn,
  HourSortState,
  WeekHourDay,
} from "../interfaces";

const ampm = (h: number) =>
  h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;

export const formatHourRange = (h: number) =>
  `${ampm(h)} – ${ampm(h + 1 <= 23 ? h + 1 : 0)}`;

/**
 * Grade on last year only when it covers every day, else last week when that
 * does, else not at all. Coverage belongs to the list — every hour shares the
 * store's dates — not the row. See matchDatedRows.
 */
export const hourBasis = (r: HourRow, coverage: Coverage): GradeBasis =>
  gradeBasis({ hasLY: r.hasLY, hasLW: r.hasLW, ...coverage });

export const hourSeverity = (
  r: HourRow,
  coverage: Coverage,
  threshold: number,
  metric: GradingMetric,
): Severity | null => {
  const basis = hourBasis(r, coverage);
  return metric === "qty"
    ? gradeOnBasis(basis, r.vsLWQtyPct, r.vsLYQtyPct, threshold)
    : gradeOnBasis(basis, r.vsLWPct, r.vsLYPct, threshold);
};

export const getCta = (
  row: HourRow,
  coverage: Coverage,
  threshold: number,
  metric: GradingMetric,
): HourCta => {
  const basis = hourBasis(row, coverage);
  const sev = hourSeverity(row, coverage, threshold, metric);
  const lwPct = metric === "qty" ? row.vsLWQtyPct : row.vsLWPct;
  const lyPct = metric === "qty" ? row.vsLYQtyPct : row.vsLYPct;

  if (basis === null) {
    return {
      severity: null,
      text: `Not graded. Neither last week (${coverage.lwDayCount} of ${coverage.dayCount} days) nor last year (${coverage.lyDayCount} of ${coverage.dayCount} days) covers the whole week, so there's no full-week comparison to grade on.`,
    };
  }

  const onLY = basis === "LY";
  const primaryPeriod = basis;
  const primaryPct = onLY ? lyPct : lwPct;
  const pctStr = `${Math.abs(primaryPct).toFixed(2)}%`;
  const avgBasket = row.trans > 0 ? row.tw / row.trans : 0;
  const refTrans = onLY ? row.lyTrans : row.lwTrans;
  const refBasket = onLY
    ? row.lyTrans > 0
      ? row.ly / row.lyTrans
      : 0
    : row.lwTrans > 0
      ? row.lw / row.lwTrans
      : 0;
  const partialLyNote =
    !onLY && row.hasLY
      ? ` Last year covers only ${coverage.lyDayCount} of ${coverage.dayCount} days, so it isn't used to grade.`
      : "";
  const bothFull = onLY && row.hasLW;

  if (sev === "critical") {
    const transDrop =
      refTrans > 0 ? ((row.trans - refTrans) / refTrans) * 100 : null;
    const basketDiff =
      refBasket > 0 ? ((avgBasket - refBasket) / refBasket) * 100 : null;
    const isTrafficLoss = transDrop !== null && transDrop < -5;
    const isSpendDrop = basketDiff !== null && basketDiff < -3;
    if (isTrafficLoss && !isSpendDrop)
      return {
        severity: "critical",
        text: `Down ${pctStr} vs ${primaryPeriod} — traffic loss is the driver. Transactions down ${Math.abs(transDrop!).toFixed(2)}% while basket is holding. Check staffing and flow.${partialLyNote}`,
      };
    if (isSpendDrop && !isTrafficLoss)
      return {
        severity: "critical",
        text: `Down ${pctStr} vs ${primaryPeriod} — spend compression is the driver. Traffic held but avg basket dropped. Look at mix shift or promoted item performance.${partialLyNote}`,
      };
    return {
      severity: "critical",
      text: `Down ${pctStr} vs ${primaryPeriod} — exceeds the ${threshold}% threshold. Both traffic and spend show pressure. Investigate staffing, promotions, and item availability.${partialLyNote}`,
    };
  }
  if (sev === "watch") {
    const secondaryNote = bothFull
      ? lwPct >= 0
        ? ` Recovering vs LW — may be stabilizing.`
        : ` LW also soft — monitor before escalating.`
      : "";
    return {
      severity: "watch",
      text: `Down ${pctStr} vs ${primaryPeriod} — within the watch band.${secondaryNote}${partialLyNote}`,
    };
  }
  const secondaryHealthNote = bothFull
    ? lwPct < 0
      ? ` LW is softer — watch for a developing trend.`
      : ` LW also positive.`
    : "";
  return {
    severity: "healthy",
    text: `At or above ${primaryPeriod}.${secondaryHealthNote}${partialLyNote} Traffic and spend contributing positively.`,
  };
};

/**
 * The store's hours for the week, graded and sorted worst first, with the day
 * coverage they were graded on.
 */
export const buildHourRows = (
  hourlySales: HourlySale[],
  hourlySalesLastWeek: HourlySale[],
  hourlySalesLastYear: HourlySale[],
  threshold: number,
  gradingMetric: GradingMetric,
): { rows: HourRow[]; coverage: Coverage } => {
  const isQty = gradingMetric === "qty";
  const buildMap = (src: HourlySale[]) =>
    src.reduce(
      (
        acc: Record<number, { net: number; trans: number; qty: number }>,
        h,
      ) => {
        if (!acc[h.hour]) acc[h.hour] = { net: 0, trans: 0, qty: 0 };
        acc[h.hour].net += h.total_sales - h.total_tax;
        acc[h.hour].trans += h.transactions;
        acc[h.hour].qty += h.qty;
        return acc;
      },
      {},
    );

  const twMap = buildMap(hourlySales);
  const lwMap = buildMap(hourlySalesLastWeek);
  const lyMap = buildMap(hourlySalesLastYear);

  // Same day-matching the sub-dept list and the KPI header do. The LW/LY
  // arrays are filtered upstream to the days that matched; `hourlySales` is
  // the whole TW week. Comparing a seven-day 4 PM against a three-day 4 PM
  // is not a busy hour, it is two different questions.
  const matched = matchDatedRows(
    hourlySales,
    hourlySalesLastWeek,
    hourlySalesLastYear,
  );
  const twForLW = buildMap(matched.twForLW);
  const twForLY = buildMap(matched.twForLY);
  const coverage = matched.coverage;

  const allHours = Array.from(
    new Set(
      [
        ...Object.keys(twMap),
        ...Object.keys(lwMap),
        ...Object.keys(lyMap),
      ].map(Number),
    ),
  ).sort((a, b) => a - b);

  const sorted = allHours
    .map((h) => {
      const tw = twMap[h]?.net ?? 0;
      const lw = lwMap[h]?.net ?? 0;
      const ly = lyMap[h]?.net ?? 0;
      const qty = twMap[h]?.qty ?? 0;
      const lwQty = lwMap[h]?.qty ?? 0;
      const lyQty = lyMap[h]?.qty ?? 0;
      return {
        hour: h,
        tw,
        lw,
        ly,
        trans: twMap[h]?.trans ?? 0,
        lwTrans: lwMap[h]?.trans ?? 0,
        lyTrans: lyMap[h]?.trans ?? 0,
        qty,
        lwQty,
        lyQty,
        hasLW: lw > 0,
        hasLY: ly > 0,
        vsLWPct: lw ? (((twForLW[h]?.net ?? 0) - lw) / lw) * 100 : 0,
        vsLYPct: ly ? (((twForLY[h]?.net ?? 0) - ly) / ly) * 100 : 0,
        vsLWQtyPct: lwQty
          ? (((twForLW[h]?.qty ?? 0) - lwQty) / lwQty) * 100
          : 0,
        vsLYQtyPct: lyQty
          ? (((twForLY[h]?.qty ?? 0) - lyQty) / lyQty) * 100
          : 0,
      };
    })
    .sort((a, b) => {
      const rankDiff =
        severityRank(hourSeverity(a, coverage, threshold, gradingMetric)) -
        severityRank(hourSeverity(b, coverage, threshold, gradingMetric));
      if (rankDiff !== 0) return rankDiff;
      const ap = isQty
        ? basisPct(hourBasis(a, coverage), a.vsLWQtyPct, a.vsLYQtyPct)
        : basisPct(hourBasis(a, coverage), a.vsLWPct, a.vsLYPct);
      const bp = isQty
        ? basisPct(hourBasis(b, coverage), b.vsLWQtyPct, b.vsLYQtyPct)
        : basisPct(hourBasis(b, coverage), b.vsLWPct, b.vsLYPct);
      return ap === null || bp === null ? a.hour - b.hour : ap - bp;
    });
  return { rows: sorted, coverage };
};

/**
 * One point per day of the full week for one hour (TY, LW, LY), from the
 * unfiltered raw hourly rows: the chart ignores a single-day pick.
 */
export const buildWeekHourDays = (
  selectedHour: number,
  rawHourly: HourlySale[],
  rawLWHourly: HourlySale[],
  rawLYHourly: HourlySale[],
): WeekHourDay[] => {
  const tyDates = Array.from(
    new Set(rawHourly.map((h) => h.sale_date.split("T")[0])),
  ).sort();

  const sumFor = (src: HourlySale[], dateStr: string) =>
    src
      .filter(
        (h) =>
          h.hour === selectedHour && h.sale_date.split("T")[0] === dateStr,
      )
      .reduce((acc, h) => acc + (h.total_sales - h.total_tax), 0);

  return tyDates.map((tyDate) => {
    const lwDate = addDays(tyDate, -7).toISOString().split("T")[0];
    const lyDate = sameWeekDayLastYear(tyDate).date;
    const label = new Date(tyDate + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
    });
    return {
      label,
      tw: sumFor(rawHourly, tyDate),
      lw: sumFor(rawLWHourly, lwDate),
      ly: sumFor(rawLYHourly, lyDate),
    };
  });
};

export const nextHourSort = (
  prev: HourSortState,
  column: HourSortColumn,
): HourSortState => {
  if (prev?.column !== column) return { column, direction: "desc" };
  if (prev.direction === "desc") return { column, direction: "asc" };
  return null;
};

const hourSortValue = (row: HourRow, column: HourSortColumn, isQty: boolean) =>
  column === "ty"
    ? isQty
      ? row.qty
      : row.tw
    : column === "vsLW"
      ? isQty
        ? row.vsLWQtyPct
        : row.vsLWPct
      : isQty
        ? row.vsLYQtyPct
        : row.vsLYPct;

export const sortHourRows = (rows: HourRow[], sort: HourSortState, isQty: boolean) =>
  sort
    ? [...rows].sort((a, b) => {
        const diff =
          hourSortValue(a, sort.column, isQty) - hourSortValue(b, sort.column, isQty);
        return sort.direction === "desc" ? -diff : diff;
      })
    : rows;

/** Change against a reference, in percent. */
export const pctChange = (value: number, ref: number) => ((value - ref) / ref) * 100;
