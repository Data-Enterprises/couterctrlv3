import { calculateCogs } from "../pages/subDepts";
import { formatCurrency2 } from ".";

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
        cogs,
        costFees: m.cost_fees,
        desc: m.product_description,
      });
    } else {
      ex.grossSales += m.total_sales;
      ex.tax += m.total_tax;
      ex.qty += m.qty;
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
}

/** A weekday across the three periods. `null` means the item did not sell that
 *  weekday in that period, which is not the same as zero. */
export interface DayOfWeekValue {
  ty: DayPeriodValue | null;
  lw: DayPeriodValue | null;
  ly: DayPeriodValue | null;
}

export interface ItemDetail {
  // Dominant (highest-qty) unit price this period, TY vs LW vs LY — lets the
  // insight tell a price-point shift apart from a pure volume swing.
  tyDominantPrice: number | null;
  lwDominantPrice: number | null;
  lyDominantPrice: number | null;
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
    const cur = byWeekday.get(wd) ?? { sales: 0, qty: 0 };
    cur.sales += m.total_sales - m.total_tax;
    // Raw scan count, the same field buildItemRows totals — so a day's units
    // add up to the item's own Qty rather than quietly disagreeing with it.
    cur.qty += m.qty;
    byWeekday.set(wd, cur);
  }
  return byWeekday;
};

const dominantPrice = (itemRows: MarginSourceRow[]): number | null => {
  const byPrice = new Map<number, number>();
  for (const m of itemRows) {
    if (m.qty <= 0) continue;
    const unitPrice = Math.round((m.total_sales / m.qty) * 100) / 100;
    byPrice.set(unitPrice, (byPrice.get(unitPrice) ?? 0) + m.qty);
  }
  let best: number | null = null;
  let bestQty = -Infinity;
  for (const [price, qty] of byPrice) {
    if (qty > bestQty) {
      bestQty = qty;
      best = price;
    }
  }
  return best;
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
    tyDominantPrice: dominantPrice(tyRows),
    lwDominantPrice: dominantPrice(lwRows),
    lyDominantPrice: dominantPrice(lyRows),
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
  detail: ItemDetail,
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

  const basisPrice = hasLY ? detail.lyDominantPrice : detail.lwDominantPrice;
  const priceDeltaAmt =
    detail.tyDominantPrice !== null && basisPrice !== null
      ? Math.round((detail.tyDominantPrice - basisPrice) * 100) / 100
      : null;
  const priceChanged = priceDeltaAmt !== null && Math.abs(priceDeltaAmt) > 0.01;
  const qtyChangePct = hasLY ? item.lyQtyPct : item.lwQtyPct;
  const volumeChanged =
    qtyChangePct !== null && Math.abs(qtyChangePct) >= FLAT_PCT_EPSILON;
  const cogsChangePct = hasLY ? item.lyCogsPct : item.lwCogsPct;
  const cogsChanged =
    cogsChangePct !== null && Math.abs(cogsChangePct) >= FLAT_PCT_EPSILON;

  const sev: GradedSeverity =
    gradedDelta < -threshold ? "critical" : gradedDelta < 0 ? "watch" : "healthy";

  const headline = (() => {
    if (sev === "critical") {
      if (priceChanged && cogsChanged)
        return `${metricLabel} in freefall — price and cost both moved`;
      if (priceChanged) return `${metricLabel} in freefall — price cut is the driver`;
      if (volumeChanged) return `${metricLabel} in freefall — volume collapsed`;
      return `${metricLabel} in freefall — cost spiked`;
    }
    if (sev === "watch") {
      if (volumeChanged && !priceChanged) return `${metricLabel} slipping — volume down`;
      if (priceChanged) return `${metricLabel} slipping — price shifted`;
      return `${metricLabel} slipping — check cost`;
    }
    if (Math.abs(gradedDelta) < flatEpsilon)
      return `${metricLabel} held — investigate cost`;
    return gradedDelta > 0
      ? `${metricLabel} improving`
      : `${metricLabel} holding steady`;
  })();

  const middleClause = (() => {
    if (priceChanged && cogsChanged) {
      return `Price ${priceDeltaAmt! < 0 ? "dropped" : "rose"} ${formatCurrency2(Math.abs(priceDeltaAmt!))} while COGS ${
        cogsChangePct! >= 0 ? "rose" : "fell"
      } ${Math.abs(cogsChangePct!).toFixed(0)}%`;
    }
    if (priceChanged) {
      return `Price ${priceDeltaAmt! < 0 ? "dropped" : "rose"} ${formatCurrency2(Math.abs(priceDeltaAmt!))}${
        volumeChanged
          ? ` with qty ${qtyChangePct! < 0 ? "down" : "up"} ${Math.abs(qtyChangePct!).toFixed(0)}%`
          : " with qty holding steady"
      }`;
    }
    if (volumeChanged) {
      return `Qty ${qtyChangePct! < 0 ? "dropped" : "rose"} ${Math.abs(qtyChangePct!).toFixed(0)}% with price held flat`;
    }
    if (cogsChanged) {
      return `Cost ${cogsChangePct! >= 0 ? "rose" : "fell"} ${Math.abs(cogsChangePct!).toFixed(0)}% with price and volume flat`;
    }
    return "No price or volume change";
  })();

  const action =
    sev === "critical"
      ? "Immediate review needed"
      : priceChanged
        ? "Check pricing strategy"
        : volumeChanged
          ? "Check placement and promo status"
          : cogsChanged
            ? "Check vendor cost changes"
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
    case "qty":
      return {
        tyDisplay: String(item.qty),
        lwColorPct: item.lwQtyPct,
        lyColorPct: item.lyQtyPct,
        lwDisplay: item.lwQty !== null ? String(item.lwQty) : null,
        lyDisplay: item.lyQty !== null ? String(item.lyQty) : null,
      };
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
