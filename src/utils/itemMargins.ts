import { calculateCogs } from "../pages/subDepts";
import { formatCurrency2 } from ".";
import {
  pricedUnits,
  formatPricedUnits,
  pricedUnitLabel,
} from "./pricedUnits";

/**
 * Item-level margin maths, shared by Sub Dept Margins and Categories.
 *
 * Both endpoints return the same row — `subs/subs` and `categories/cats` select
 * the same columns from the same table, differing only in whether the grouping
 * column is `sub_department` or `category`. Everything downstream of that (COGS,
 * the TY/LW/LY roll-up, severity, the insight copy) is identical, so it lives
 * here once rather than in each page.
 *
 * Deliberately pure and presentation-free: no React, no Redux, no class names
 * beyond the severity tokens. The two tables render this differently and should
 * stay free to.
 */

/** The subset of a margin row this module actually reads. Both `SubDeptMargin`
 *  and `CatItem` satisfy it structurally, so neither page needs a mapper. */
export interface MarginSourceRow {
  sale_date: string;
  product_code: string;
  product_description: string;
  total_sales: number;
  total_tax: number;
  qty: number;
  weight: number;
  cost: number;
  case_size: number;
  cost_fees: number;
  net_cost: number;
}

/** Which trend an item's severity is read off. Sub Dept Margins toggles
 *  margin/sales; Categories toggles sales/qty. Both pass their own toggle
 *  through so the page's metric control keeps meaning what it says. */
export type ItemGradingMetric = "margin" | "sales" | "qty";
export type ItemSeverity = "critical" | "watch" | "healthy" | "ungraded";
/** An insight never fires on an ungraded item, so its severity is the narrower set. */
export type GradedSeverity = "critical" | "watch" | "healthy";

/** Default grouping when no severity chip is active — Ungraded always sinks to
 *  the bottom regardless of which View preset sorts within groups. */
export const SEV_RANK: Record<ItemSeverity, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
  ungraded: 3,
};

export const SEV_PILL_CLASSES: Record<ItemSeverity, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
  ungraded: "bg-gray-100 text-gray-500",
};

export interface ItemMarginRow {
  productCode: string;
  description: string;
  grossSales: number;
  netSales: number;
  tax: number;
  qty: number;
  /** Pounds, on a scale item; 0 on a by-the-each item. Kept beside `qty`
   *  rather than replacing it — `qty` still grades and still totals, this is
   *  what gets shown. See utils/pricedUnits. */
  weight: number;
  cogs: number;
  costFees: number;
  tyMarginPct: number;
  lwMarginPct: number | null;
  lyMarginPct: number | null;
  // Share of the whole group's sales for that same period — null for LW/LY when
  // the item had no sales that period, same "no data" convention as the margin
  // fields above.
  tyContributionPct: number;
  lwContributionPct: number | null;
  lyContributionPct: number | null;
  hasLW: boolean;
  hasLY: boolean;
  // "Primary" % change vs LY, falling back to LW when there's no LY figure.
  salesTrendPct: number | null;
  qtyTrendPct: number | null;
  marginTrendPct: number | null;
  // Separate vs-LW / vs-LY change per metric — the list shows both
  // independently rather than silently choosing one.
  lwSalesPct: number | null;
  lySalesPct: number | null;
  lwQtyPct: number | null;
  lyQtyPct: number | null;
  lwCogsPct: number | null;
  lyCogsPct: number | null;
  // Raw LW/LY figures in native units. Displayed directly; colouring still
  // comes from the *Pct fields so grading stays threshold-based.
  lwGrossSales: number | null;
  lyGrossSales: number | null;
  /** Net of tax, the basis everything user-facing is shown on. Gross is kept
   *  alongside it only because the margin maths needs the tax it carries. */
  lwNetSales: number | null;
  lyNetSales: number | null;
  lwQty: number | null;
  lyQty: number | null;
  lwWeight: number | null;
  lyWeight: number | null;
  lwCogs: number | null;
  lyCogs: number | null;
}

const aggregateByUpc = (margins: MarginSourceRow[]) => {
  const map = new Map<
    string,
    {
      grossSales: number;
      tax: number;
      qty: number;
      weight: number;
      cogs: number;
      costFees: number;
      desc: string;
    }
  >();
  for (const m of margins) {
    const cogs = calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);
    const ex = map.get(m.product_code);
    if (!ex) {
      map.set(m.product_code, {
        grossSales: m.total_sales,
        tax: m.total_tax,
        qty: m.qty,
        weight: m.weight,
        cogs,
        costFees: m.cost_fees,
        desc: m.product_description,
      });
    } else {
      ex.grossSales += m.total_sales;
      ex.tax += m.total_tax;
      ex.qty += m.qty;
      ex.weight += m.weight;
      ex.cogs += cogs;
      ex.costFees += m.cost_fees;
    }
  }
  return map;
};

/** One row per UPC, with every TY/LW/LY figure the tables display.
 *
 *  Contribution is a share of the *group* total (sub dept or category), not of
 *  the item's own row — which is why the three period totals are summed here
 *  rather than derived from the per-item map. */
export const buildItemRows = (
  tyMargins: MarginSourceRow[],
  lwMargins: MarginSourceRow[],
  lyMargins: MarginSourceRow[],
): ItemMarginRow[] => {
  const tyMap = aggregateByUpc(tyMargins);
  const lwMap = aggregateByUpc(lwMargins);
  const lyMap = aggregateByUpc(lyMargins);

  const tyTotal = tyMargins.reduce((s, m) => s + m.total_sales, 0);
  const lwTotal = lwMargins.reduce((s, m) => s + m.total_sales - m.total_tax, 0);
  const lyTotal = lyMargins.reduce((s, m) => s + m.total_sales - m.total_tax, 0);

  const rows: ItemMarginRow[] = [];
  for (const [upc, ty] of tyMap) {
    if (!upc || upc === "0") continue;

    const netSales = ty.grossSales - ty.tax;
    const tyMarginPct = netSales > 0 ? ((netSales - ty.cogs) / netSales) * 100 : 0;

    const lw = lwMap.get(upc);
    const lwNet = lw ? lw.grossSales - lw.tax : 0;
    const lwMarginPct = lw && lwNet > 0 ? ((lwNet - lw.cogs) / lwNet) * 100 : null;

    const ly = lyMap.get(upc);
    const lyNet = ly ? ly.grossSales - ly.tax : 0;
    const lyMarginPct = ly && lyNet > 0 ? ((lyNet - ly.cogs) / lyNet) * 100 : null;

    const salesTrendPct =
      ly && lyNet > 0
        ? ((netSales - lyNet) / lyNet) * 100
        : lw && lwNet > 0
          ? ((netSales - lwNet) / lwNet) * 100
          : null;
    const qtyTrendPct =
      ly && ly.qty > 0
        ? ((ty.qty - ly.qty) / ly.qty) * 100
        : lw && lw.qty > 0
          ? ((ty.qty - lw.qty) / lw.qty) * 100
          : null;
    const marginTrendPct =
      lyMarginPct !== null
        ? tyMarginPct - lyMarginPct
        : lwMarginPct !== null
          ? tyMarginPct - lwMarginPct
          : null;

    rows.push({
      productCode: upc,
      description: ty.desc,
      grossSales: ty.grossSales,
      netSales,
      tax: ty.tax,
      qty: ty.qty,
      weight: ty.weight,
      cogs: ty.cogs,
      costFees: ty.costFees,
      tyMarginPct,
      lwMarginPct,
      lyMarginPct,
      tyContributionPct: tyTotal > 0 ? (netSales / tyTotal) * 100 : 0,
      lwContributionPct: lw && lwTotal > 0 ? (lwNet / lwTotal) * 100 : null,
      lyContributionPct: ly && lyTotal > 0 ? (lyNet / lyTotal) * 100 : null,
      hasLW: !!lw,
      hasLY: !!ly,
      salesTrendPct,
      qtyTrendPct,
      marginTrendPct,
      lwSalesPct:
        lw && lwNet > 0 ? ((netSales - lwNet) / lwNet) * 100 : null,
      lySalesPct:
        ly && lyNet > 0 ? ((netSales - lyNet) / lyNet) * 100 : null,
      lwQtyPct: lw && lw.qty > 0 ? ((ty.qty - lw.qty) / lw.qty) * 100 : null,
      lyQtyPct: ly && ly.qty > 0 ? ((ty.qty - ly.qty) / ly.qty) * 100 : null,
      lwCogsPct: lw && lw.cogs > 0 ? ((ty.cogs - lw.cogs) / lw.cogs) * 100 : null,
      lyCogsPct: ly && ly.cogs > 0 ? ((ty.cogs - ly.cogs) / ly.cogs) * 100 : null,
      lwGrossSales: lw ? lw.grossSales : null,
      lyGrossSales: ly ? ly.grossSales : null,
      lwNetSales: lw ? lwNet : null,
      lyNetSales: ly ? lyNet : null,
      lwQty: lw ? lw.qty : null,
      lyQty: ly ? ly.qty : null,
      lwWeight: lw ? lw.weight : null,
      lyWeight: ly ? ly.weight : null,
      lwCogs: lw ? lw.cogs : null,
      lyCogs: ly ? ly.cogs : null,
    });
  }

  return rows;
};

/**
 * The number an item's severity is read off, in whatever unit the page's toggle
 * selects — margin points against LY (falling back to LW), or percent change in
 * sales or qty. Null when the item has no counterpart period to compare
 * against, which is what makes it ungraded rather than healthy.
 *
 * Exported so an export can print the figure a severity was derived from
 * instead of recomputing it a second, subtly different way — a CSV that says
 * "Critical" without showing the delta is unarguable with.
 */
export const gradedDelta = (
  row: ItemMarginRow,
  gradingMetric: ItemGradingMetric,
): number | null =>
  gradingMetric === "sales"
    ? row.salesTrendPct
    : gradingMetric === "qty"
      ? row.qtyTrendPct
      : row.lyMarginPct !== null
        ? row.tyMarginPct - row.lyMarginPct
        : row.lwMarginPct !== null
          ? row.tyMarginPct - row.lwMarginPct
          : null;

/** Grades on whichever metric the page's Margin/Sales toggle selects, so
 *  flipping that toggle re-grades the item list and not just the parent rows. */
export const getItemSeverity = (
  row: ItemMarginRow,
  threshold: number,
  gradingMetric: ItemGradingMetric,
): ItemSeverity => {
  const raw = gradedDelta(row, gradingMetric);
  if (raw === null) return "ungraded";
  const delta = Math.round(raw * 10) / 10;
  if (delta < -threshold) return "critical";
  if (delta < 0) return "watch";
  return "healthy";
};

/* ── Per-item detail: day-of-week shape and price point ──────────────────── */

export const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** One weekday's real figures for one period. Both are actuals — the day rows
 *  show what sold, not a derived percentage. */
export interface DayPeriodValue {
  sales: number;
  qty: number;
  /** Pounds for the weekday, 0 when nothing that day was a scale item. The day
   *  rows print this instead of `qty` where it is non-zero — see
   *  utils/pricedUnits. */
  weight: number;
}

/** A weekday across the three periods. `null` means the item did not sell that
 *  weekday in that period, which is not the same as zero. */
export interface DayOfWeekValue {
  ty: DayPeriodValue | null;
  lw: DayPeriodValue | null;
  ly: DayPeriodValue | null;
}

export interface ItemDetail {
  // The dominant-price fields that used to live here are gone. They were
  // `total_sales / qty`, which on a scale item is the average value of a
  // package rather than a price — $6.52 on an item selling at $1.99/lb — and
  // they moved whenever package size did. `buildInsight` derives a retail rate
  // from net sales over priced units instead, which is correct on weighted and
  // by-the-each items alike.
  dayOfWeek: Record<string, DayOfWeekValue>;
}

const weekdayOf = (m: MarginSourceRow): string =>
  new Date(`${m.sale_date.split("T")[0]}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
  });

const weekdayTotals = (
  itemRows: MarginSourceRow[],
): Map<string, DayPeriodValue> => {
  const byWeekday = new Map<string, DayPeriodValue>();
  for (const m of itemRows) {
    const wd = weekdayOf(m);
    const cur = byWeekday.get(wd) ?? { sales: 0, qty: 0, weight: 0 };
    cur.sales += m.total_sales - m.total_tax;
    // Raw scan count, the same field buildItemRows totals — so a day's units
    // add up to the item's own Qty rather than quietly disagreeing with it.
    cur.qty += m.qty;
    cur.weight += m.weight;
    byWeekday.set(wd, cur);
  }
  return byWeekday;
};

/** Always scoped to the full week for this UPC in each period, regardless of any
 *  single-day selection elsewhere — a day-of-week chart with one day in it isn't
 *  useful. */
export const buildItemDetail = (
  productCode: string,
  tyMargins: MarginSourceRow[],
  lwMargins: MarginSourceRow[],
  lyMargins: MarginSourceRow[],
): ItemDetail => {
  const tyRows = tyMargins.filter((m) => m.product_code === productCode);
  const lwRows = lwMargins.filter((m) => m.product_code === productCode);
  const lyRows = lyMargins.filter((m) => m.product_code === productCode);

  const tyByWeekday = weekdayTotals(tyRows);
  const lwByWeekday = weekdayTotals(lwRows);
  const lyByWeekday = weekdayTotals(lyRows);

  const dayOfWeek: Record<string, DayOfWeekValue> = {};
  for (const wd of WEEKDAY_ORDER) {
    dayOfWeek[wd] = {
      ty: tyByWeekday.get(wd) ?? null,
      lw: lwByWeekday.get(wd) ?? null,
      ly: lyByWeekday.get(wd) ?? null,
    };
  }

  return {
    dayOfWeek,
  };
};

/**
 * A day's "primary" trend — prefers LY, falls back to LW, the same preference
 * order as the row-level trend fields.
 *
 * Never rendered as a number any more: the day rows show actuals, and this only
 * decides what colour the TY figure is printed in. It follows the page's metric
 * toggle so a day row can't contradict the item list above it. Margin has no
 * per-weekday equivalent, so a margin-graded page reads dollars here — the row
 * shows dollars and units, and neither of them is a margin.
 */
export const dayTrend = (
  val: DayOfWeekValue,
  metric: ItemGradingMetric = "sales",
): number | null => {
  if (val.ty === null) return null;
  const of = (v: DayPeriodValue) => (metric === "qty" ? v.qty : v.sales);
  const ty = of(val.ty);
  if (val.ly !== null && of(val.ly) > 0) return ((ty - of(val.ly)) / of(val.ly)) * 100;
  if (val.lw !== null && of(val.lw) > 0) return ((ty - of(val.lw)) / of(val.lw)) * 100;
  return null;
};

/* ── Insight ─────────────────────────────────────────────────────────────── */

/** A change below this magnitude counts as "flat" rather than a movement. */
const FLAT_PTS_EPSILON = 0.15;
const FLAT_PCT_EPSILON = 5;

/** Synthesizes why margin moved — a price point shift, a volume change, both,
 *  or neither. Prefers LY as the basis, falling back to LW. Severity is graded
 *  on whichever metric the toggle selects — same basis and delta as
 *  getItemSeverity — so the banner always agrees with the item's own dot. */
export const buildInsight = (
  item: ItemMarginRow,
  threshold: number,
  gradingMetric: ItemGradingMetric,
): { headline: string; detail: string; sev: GradedSeverity } | null => {
  const hasLY = item.lyMarginPct !== null;
  const basisMarginPct = hasLY ? item.lyMarginPct : item.lwMarginPct;
  if (basisMarginPct === null) return null;
  const basisLabel = hasLY ? "LY" : "LW";
  const marginDelta = Math.round((item.tyMarginPct - basisMarginPct) * 10) / 10;
  const salesDelta =
    item.salesTrendPct !== null ? Math.round(item.salesTrendPct * 10) / 10 : null;
  const qtyDelta =
    item.qtyTrendPct !== null ? Math.round(item.qtyTrendPct * 10) / 10 : null;
  // Margin is the only metric measured in points; sales and qty are percentages.
  const isPts = gradingMetric === "margin";
  const gradedDelta =
    gradingMetric === "sales"
      ? salesDelta
      : gradingMetric === "qty"
        ? qtyDelta
        : marginDelta;
  if (gradedDelta === null) return null;
  const metricLabel =
    gradingMetric === "sales" ? "Sales" : gradingMetric === "qty" ? "Qty" : "Margin";
  const flatEpsilon = isPts ? FLAT_PTS_EPSILON : FLAT_PCT_EPSILON;

  /**
   * Rates, not totals — the whole point of this block.
   *
   * Margin % is a pure function of two rates:
   *
   *     margin% = 1 - costRate / retailRate
   *
   * Volume cancels out of it entirely. That identity holds to the cent on
   * every row (BNLS CHICKEN THIGHS: 1 - 1.3600/1.9860 = 31.52%, which is what
   * the panel prints), and it is what lets this strip say *which lever moved*
   * instead of guessing.
   *
   * The previous version compared `dominantPrice` (total_sales / qty) against
   * total COGS, and both are volume-contaminated. On an item that went on ad it
   * announced "price and cost both moved — price dropped $4.49 while COGS rose
   * 738%", when the retail rate had halved and the cost rate had not moved at
   * all: $1.3600/lb before and after. It reported a volume fact as a cost fact,
   * on the one item where a buyer most needs to know the difference.
   */
  const tyUnits = pricedUnits(item.qty, item.weight);
  const basisUnits = hasLY
    ? item.lyQty === null
      ? null
      : pricedUnits(item.lyQty, item.lyWeight)
    : item.lwQty === null
      ? null
      : pricedUnits(item.lwQty, item.lwWeight);
  const basisNetSales = hasLY ? item.lyNetSales : item.lwNetSales;

  const rate = (total: number | null, units: number | null) =>
    total !== null && units !== null && units > 0 ? total / units : null;

  const tyRetail = rate(item.netSales, tyUnits);
  const tyCost = rate(item.cogs, tyUnits);
  const basisRetail = rate(basisNetSales, basisUnits);
  const basisCost = rate(hasLY ? item.lyCogs : item.lwCogs, basisUnits);

  /** A rate has "moved" on a relative test, not an absolute one — a penny is
   *  noise on a $50 item and a real cut on a $1.09 one. The currency guard
   *  stops a rounding artefact reading as a price change. */
  const moved = (ty: number | null, basis: number | null) =>
    ty !== null && basis !== null && basis > 0
      ? Math.abs(ty - basis) > 0.005 &&
        Math.abs((ty - basis) / basis) * 100 >= 1
      : false;

  const priceChanged = moved(tyRetail, basisRetail);
  const cogsChanged = moved(tyCost, basisCost);
  const volumePct =
    basisUnits !== null && basisUnits > 0
      ? ((tyUnits - basisUnits) / basisUnits) * 100
      : null;
  const volumeChanged =
    volumePct !== null && Math.abs(volumePct) >= FLAT_PCT_EPSILON;

  const unit = pricedUnitLabel(item.weight);
  const retailDelta =
    tyRetail !== null && basisRetail !== null ? tyRetail - basisRetail : null;
  const costDelta =
    tyCost !== null && basisCost !== null ? tyCost - basisCost : null;

  /** Retail down, cost rate flat, volume up: the signature of an ad or a
   *  markdown rather than anything wrong. Named explicitly because it is the
   *  most common false alarm on a graded list — the item grades Critical for
   *  doing exactly what it was put on ad to do. */
  const looksLikeAd =
    priceChanged &&
    !cogsChanged &&
    retailDelta !== null &&
    retailDelta < 0 &&
    volumePct !== null &&
    volumePct > 0;

  const sev: GradedSeverity =
    gradedDelta < -threshold ? "critical" : gradedDelta < 0 ? "watch" : "healthy";

  const headline = (() => {
    if (sev === "critical") {
      if (priceChanged && cogsChanged)
        return `${metricLabel} in freefall — retail and cost rate both moved`;
      if (looksLikeAd)
        return `${metricLabel} in freefall — retail cut, cost rate held`;
      if (priceChanged) return `${metricLabel} in freefall — retail price is the driver`;
      if (cogsChanged) return `${metricLabel} in freefall — cost rate moved`;
      if (volumeChanged)
        return `${metricLabel} in freefall — volume ${volumePct! < 0 ? "collapsed" : "surged"}`;
      return `${metricLabel} in freefall`;
    }
    if (sev === "watch") {
      if (looksLikeAd) return `${metricLabel} slipping — retail cut, cost rate held`;
      if (volumeChanged && !priceChanged)
        return `${metricLabel} slipping — volume ${volumePct! < 0 ? "down" : "up"}`;
      if (priceChanged) return `${metricLabel} slipping — retail shifted`;
      if (cogsChanged) return `${metricLabel} slipping — cost rate moved`;
      return `${metricLabel} slipping`;
    }
    if (Math.abs(gradedDelta) < flatEpsilon)
      return `${metricLabel} held`;
    return gradedDelta > 0
      ? `${metricLabel} improving`
      : `${metricLabel} holding steady`;
  })();

  /**
   * Scale, then the named finding, then context — the impact ordering the
   * diagnostic panels use. Every clause is a rate or a volume, and each says
   * what it is, so no figure here can be mistaken for another.
   */
  const middleClause = (() => {
    const parts: string[] = [];
    if (priceChanged && retailDelta !== null) {
      parts.push(
        `Retail ${retailDelta < 0 ? "fell" : "rose"} ${formatCurrency2(
          Math.abs(retailDelta),
        )}/${unit} (${formatCurrency2(basisRetail!)} → ${formatCurrency2(tyRetail!)})`,
      );
    }
    if (cogsChanged && costDelta !== null) {
      parts.push(
        `cost ${costDelta < 0 ? "fell" : "rose"} ${formatCurrency2(
          Math.abs(costDelta),
        )}/${unit} (${formatCurrency2(basisCost!)} → ${formatCurrency2(tyCost!)})`,
      );
    } else if (tyCost !== null) {
      // Saying the cost held is not filler — it is the half of the answer that
      // stops a rising COGS total being read as a cost problem.
      parts.push(`cost held at ${formatCurrency2(tyCost)}/${unit}`);
    }
    if (volumeChanged && volumePct !== null) {
      parts.push(
        `volume ${volumePct < 0 ? "down" : "up"} ${Math.abs(volumePct).toFixed(0)}% to ${formatPricedUnits(item.qty, item.weight)}`,
      );
    }
    if (parts.length === 0) return "No rate or volume change";
    return parts.join(", ");
  })();

  const action =
    // Nothing is wrong, so the strip should not manufacture an errand. This
    // ran ahead of the ad check deliberately: an item whose margin went *up*
    // on an ad does not need confirming.
    sev === "healthy"
      ? "No action needed"
      : looksLikeAd
        ? "Expected if this item was on ad — confirm before acting"
        : sev === "critical"
          ? "Immediate review needed"
          : cogsChanged
            ? "Check vendor cost changes"
            : priceChanged
              ? "Check pricing strategy"
              : volumeChanged
                ? "Check placement and promo status"
                : "Cost may have shifted";

  const deltaLabel = `${gradedDelta >= 0 ? "+" : ""}${gradedDelta.toFixed(2)}${
    isPts ? " pts" : "%"
  }`;

  return {
    headline,
    detail: `${deltaLabel} vs ${basisLabel}. ${middleClause}. ${action}.`,
    sev,
  };
};

/* ── Row / report formatting ─────────────────────────────────────────────── */

export type RowMetricKey = "contribution" | "sales" | "qty" | "cogs" | "margin";

const ptsDelta = (ty: number, ref: number | null) =>
  ref === null ? null : Math.round((ty - ref) * 10) / 10;

/** The metric's own raw LW/LY figure for display — never a delta, since showing
 *  "$18.61" where a delta is expected reads as if that were the LY value — plus
 *  a separate %-based figure for colouring. COGS is graded inverted (a cost
 *  increase is bad) though its raw figure displays like the rest. */
export const getRowMetric = (item: ItemMarginRow, key: RowMetricKey) => {
  switch (key) {
    case "contribution":
      return {
        tyDisplay: `${item.tyContributionPct.toFixed(2)}%`,
        lwColorPct: ptsDelta(item.tyContributionPct, item.lwContributionPct),
        lyColorPct: ptsDelta(item.tyContributionPct, item.lyContributionPct),
        lwDisplay:
          item.lwContributionPct !== null
            ? `${item.lwContributionPct.toFixed(2)}%`
            : null,
        lyDisplay:
          item.lyContributionPct !== null
            ? `${item.lyContributionPct.toFixed(2)}%`
            : null,
      };
    case "sales":
      return {
        tyDisplay: formatCurrency2(item.netSales),
        lwColorPct: item.lwSalesPct,
        lyColorPct: item.lySalesPct,
        lwDisplay:
          item.lwNetSales !== null ? formatCurrency2(item.lwNetSales) : null,
        lyDisplay:
          item.lyNetSales !== null ? formatCurrency2(item.lyNetSales) : null,
      };
    case "qty": {
      // Shown in the unit the item is priced in, so the row agrees with the
      // Cost grid and with its own COGS. The percentage has to be computed on
      // the same basis: pairing a pounds figure with a ring-count delta was
      // the inconsistency this set out to remove, and on a variable-weight
      // department the two genuinely differ — package weight moves up to 89%
      // day to day inside one item.
      //
      // Deliberately NOT `lwQtyPct`/`lyQtyPct`. Those still grade and still
      // drive the narrative on rings; only the figure on screen moves here.
      const ty = pricedUnits(item.qty, item.weight);
      const lw = item.lwQty === null ? null : pricedUnits(item.lwQty, item.lwWeight);
      const ly = item.lyQty === null ? null : pricedUnits(item.lyQty, item.lyWeight);
      const pct = (base: number | null) =>
        base !== null && base > 0 ? ((ty - base) / base) * 100 : null;
      return {
        tyDisplay: formatPricedUnits(item.qty, item.weight),
        lwColorPct: pct(lw),
        lyColorPct: pct(ly),
        lwDisplay:
          item.lwQty !== null
            ? formatPricedUnits(item.lwQty, item.lwWeight)
            : null,
        lyDisplay:
          item.lyQty !== null
            ? formatPricedUnits(item.lyQty, item.lyWeight)
            : null,
      };
    }
    case "cogs":
      return {
        tyDisplay: formatCurrency2(item.cogs),
        lwColorPct: item.lwCogsPct !== null ? -item.lwCogsPct : null,
        lyColorPct: item.lyCogsPct !== null ? -item.lyCogsPct : null,
        lwDisplay: item.lwCogs !== null ? formatCurrency2(item.lwCogs) : null,
        lyDisplay: item.lyCogs !== null ? formatCurrency2(item.lyCogs) : null,
      };
    case "margin":
      return {
        tyDisplay: `${item.tyMarginPct.toFixed(2)}%`,
        lwColorPct: ptsDelta(item.tyMarginPct, item.lwMarginPct),
        lyColorPct: ptsDelta(item.tyMarginPct, item.lyMarginPct),
        lwDisplay:
          item.lwMarginPct !== null ? `${item.lwMarginPct.toFixed(2)}%` : null,
        lyDisplay:
          item.lyMarginPct !== null ? `${item.lyMarginPct.toFixed(2)}%` : null,
      };
  }
};

/** Colour-only, no pill: the row already carries a severity dot, and repeating
 *  pills across the lead card, the supporting table and six day rows added far
 *  more colour than signal. */
export const deltaTextClass = (pct: number, threshold: number) =>
  pct < -threshold
    ? "text-severity_critical_text"
    : pct < 0
      ? "text-severity_watch_text"
      : "text-severity_healthy_text";

export const fmtDelta = (pct: number, isPts: boolean) =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(isPts ? 2 : 0)}${isPts ? "pt" : "%"}`;

/* ── Sort presets ────────────────────────────────────────────────────────── */

export type SortCol =
  | "contribution"
  | "salesTrend"
  | "qty"
  | "cogs"
  | "marginTrend"
  | "marginPct";

export interface ViewPreset {
  label: string;
  col: SortCol;
  dir: "desc" | "asc";
}

export const VIEW_PRESETS: ViewPreset[] = [
  { label: "Margin Decliners", col: "marginTrend", dir: "asc" },
  { label: "Margin Gainers", col: "marginTrend", dir: "desc" },
  { label: "Lowest Margin", col: "marginPct", dir: "asc" },
  { label: "Top Contribution", col: "contribution", dir: "desc" },
  { label: "Sales Gainers", col: "salesTrend", dir: "desc" },
  { label: "Sales Decliners", col: "salesTrend", dir: "asc" },
  { label: "Highest Volume", col: "qty", dir: "desc" },
  { label: "Highest COGS", col: "cogs", dir: "desc" },
];

export const presetKey = (col: SortCol, dir: "desc" | "asc") => `${col}_${dir}`;

export const VIEW_OPTIONS = VIEW_PRESETS.map((p) => ({
  label: p.label,
  value: presetKey(p.col, p.dir),
}));

/** The figure a given preset ranks by. Nulls sort to the bottom via -999 rather
 *  than being filtered out — an item with no baseline is still a row. */
export const sortValue = (row: ItemMarginRow, col: SortCol): number => {
  switch (col) {
    case "contribution":
      return row.tyContributionPct;
    case "salesTrend":
      return row.salesTrendPct ?? -999;
    case "marginTrend":
      return row.marginTrendPct ?? -999;
    case "marginPct":
      return row.tyMarginPct;
    case "qty":
      return row.qty;
    case "cogs":
      return row.cogs;
  }
};
