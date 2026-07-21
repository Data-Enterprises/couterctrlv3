import { useEffect, useState, useRef, useMemo, Fragment } from "react";
import {
  MagnifyingGlassIcon,
  MinusCircleIcon,
} from "@heroicons/react/16/solid";
import {
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useSubMarginCtx } from "../../hooks";
import { useSubMarginActions } from "../../hooks/useSubMarginActions";
import { calculateCogs, getLYDate } from "../..";
import { formatCurrency2, addDays } from "../../../../utils";
import type { SubDeptMargin } from "../../../../interfaces";
import type { GradingMetric } from "../../../../features/subMarginSlice";
import ThresholdFilter from "../../../../components/filters/ThresholdFilter";
import type { ThresholdValue } from "../../../../components/filters/ThresholdFilter";
import SelectFilter from "../../../../components/filters/SelectFilter";
import UpcContextMenu from "../../../../components/UpcContextMenu";
import SharedSeverityBadge from "../../../../components/SeverityBadge";
import { chipClass, CTA_SEVERITY_CLASSES } from "../../../../utils/severity";

type Severity = "critical" | "watch" | "healthy" | "ungraded";
type SevFilter = "all" | Severity;
// Default grouping when no severity chip is active — Ungraded always sinks
// to the bottom regardless of which View preset is sorting within groups.
const SEV_RANK: Record<Severity, number> = {
  critical: 0,
  watch: 1,
  healthy: 2,
  ungraded: 3,
};
// Graded-only subset (no "ungraded") — what CTA_SEVERITY_CLASSES and the
// insight banner actually key off of, since an insight never fires ungraded.
type GradedSeverity = "critical" | "watch" | "healthy";

interface ItemMarginRow {
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
  // Share of the whole sub dept's sales for that same period — null for
  // LW/LY when the item had no sales that period, same "no data" convention
  // as tyMarginPct/lwMarginPct above.
  tyContributionPct: number;
  lwContributionPct: number | null;
  lyContributionPct: number | null;
  // Whether the item had any sales at all in LW/LY — drives the "—" vs.
  // graded-pill treatment for every vs-LW/vs-LY figure below.
  hasLW: boolean;
  hasLY: boolean;
  // "Primary" % change vs LY, falling back to LW when there's no LY data —
  // same preference order as getItemSeverity's margin trend. Used for the
  // single-line trend badge in the item report's KPI strip.
  salesTrendPct: number | null;
  qtyTrendPct: number | null;
  marginTrendPct: number | null;
  // Separate (not "primary") vs LW / vs LY % change per metric — the left
  // list shows both independently, same as the sub dept rows in dev Sales.
  lwSalesPct: number | null;
  lySalesPct: number | null;
  lwQtyPct: number | null;
  lyQtyPct: number | null;
  lwCogsPct: number | null;
  lyCogsPct: number | null;
  // Raw LW/LY figures (native units, not a % change) — the left list's vs
  // LW/vs LY columns display these directly per the selected View, coloring
  // still comes from the *Pct fields above so grading stays threshold-based.
  lwGrossSales: number | null;
  lyGrossSales: number | null;
  lwQty: number | null;
  lyQty: number | null;
  lwCogs: number | null;
  lyCogs: number | null;
}

// Only the metrics a View preset can rank by — these are the only sortCol
// values reachable now that the flat multi-column table is gone.
type SortCol = "contribution" | "salesTrend" | "qty" | "cogs" | "marginTrend" | "marginPct";
type RowMetricKey = "contribution" | "sales" | "qty" | "cogs" | "margin";

interface ViewPreset {
  label: string;
  col: SortCol;
  dir: "desc" | "asc";
}

const VIEW_PRESETS: ViewPreset[] = [
  { label: "Margin Decliners", col: "marginTrend", dir: "asc" },
  { label: "Margin Gainers", col: "marginTrend", dir: "desc" },
  { label: "Lowest Margin", col: "marginPct", dir: "asc" },
  { label: "Top Contribution", col: "contribution", dir: "desc" },
  { label: "Sales Gainers", col: "salesTrend", dir: "desc" },
  { label: "Sales Decliners", col: "salesTrend", dir: "asc" },
  { label: "Highest Volume", col: "qty", dir: "desc" },
  { label: "Highest COGS", col: "cogs", dir: "desc" },
];

const presetKey = (col: SortCol, dir: "desc" | "asc") => `${col}_${dir}`;
const VIEW_OPTIONS = VIEW_PRESETS.map((p) => ({
  label: p.label,
  value: presetKey(p.col, p.dir),
}));

// "ungraded" has no shared SeverityBadge equivalent — small local adapter.
const SeverityBadge = ({ severity }: { severity: Severity }) =>
  severity === "ungraded" ? (
    <div className="w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 bg-gray-100">
      <MinusCircleIcon className="w-3 h-3 text-gray-400" />
    </div>
  ) : (
    <SharedSeverityBadge severity={severity} />
  );

// Grades on whichever metric is selected in the left panel's Margin/Sales
// toggle (gradingMetric), same as getTier does for sub dept rows — so
// switching that toggle re-grades the item list too, not just sub depts.
const getItemSeverity = (
  row: ItemMarginRow,
  threshold: number,
  gradingMetric: GradingMetric,
): Severity => {
  const raw =
    gradingMetric === "sales"
      ? row.salesTrendPct
      : row.lyMarginPct !== null
        ? row.tyMarginPct - row.lyMarginPct
        : row.lwMarginPct !== null
          ? row.tyMarginPct - row.lwMarginPct
          : null;
  if (raw === null) return "ungraded";
  const delta = Math.round(raw * 10) / 10;
  if (delta < -threshold) return "critical";
  if (delta < 0) return "watch";
  return "healthy";
};

interface ColFilterProps {
  label: string;
  active: boolean;
  align?: "left" | "right";
  onApply: () => void;
  onClear?: () => void;
  children: React.ReactNode;
}

const ColFilter = ({
  label,
  active,
  align = "left",
  onApply,
  onClear,
  children,
}: ColFilterProps) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-1 min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide transition-colors select-none flex-shrink-0 ${
          active ? "text-[#1e2a4a]" : "text-content"
        }`}
      >
        {label}
        {active && (
          <span className="w-1 h-1 rounded-full bg-[#1e2a4a] flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="fixed inset-0 z-[199]" onClick={() => setOpen(false)} />
      )}
      {open && (
        <div
          className="bg-custom-white"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            zIndex: 200,
            border: "1px solid rgba(30,42,74,0.12)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
            padding: "10px 10px 8px",
            minWidth: 168,
          }}
        >
          {children}
          <div className="flex gap-1.5 mt-2">
            <button
              onClick={() => {
                onApply();
                setOpen(false);
              }}
              className="flex-1 flex items-center justify-center gap-1 rounded py-1 text-[10px] font-medium text-custom-white"
              style={{ background: "#1e2a4a" }}
            >
              <MagnifyingGlassIcon className="w-3 h-3" /> Apply
            </button>
            {onClear && (
              <button
                onClick={() => {
                  onClear();
                  setOpen(false);
                }}
                className="px-2 rounded py-1 text-[10px] text-content border border-gray-200 hover:text-content transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const colInputStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 11,
  border: "1px solid rgba(30,42,74,0.15)",
  borderRadius: 4,
  padding: "4px 7px",
  outline: "none",
  color: "var(--color-text-primary)",
  background: "rgba(30,42,74,0.03)",
};

const aggregateByUpc = (margins: SubDeptMargin[]) => {
  const map = new Map<
    string,
    {
      grossSales: number;
      tax: number;
      qty: number;
      cogs: number;
      costFees: number;
      desc: string;
      caseSize: number;
      netCost: number;
      cost: number;
    }
  >();
  for (const m of margins) {
    const cogs = calculateCogs(
      m.net_cost,
      m.cost,
      m.case_size,
      m.qty,
      m.weight,
    );
    const ex = map.get(m.product_code);
    if (!ex) {
      map.set(m.product_code, {
        grossSales: m.total_sales,
        tax: m.total_tax,
        qty: m.qty,
        cogs,
        costFees: m.cost_fees,
        desc: m.product_description,
        caseSize: m.case_size,
        netCost: m.net_cost,
        cost: m.cost,
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

const buildRows = (
  tyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
): ItemMarginRow[] => {
  const tyMap = aggregateByUpc(tyMargins);
  const lwMap = aggregateByUpc(lwMargins);
  const lyMap = aggregateByUpc(lyMargins);

  // Sub dept-wide totals for the same three periods — each item's
  // contribution % is its share of this, not of its own row.
  const tyTotal = tyMargins.reduce((s, m) => s + m.total_sales, 0);
  const lwTotal = lwMargins.reduce((s, m) => s + m.total_sales, 0);
  const lyTotal = lyMargins.reduce((s, m) => s + m.total_sales, 0);

  const rows: ItemMarginRow[] = [];
  for (const [upc, ty] of tyMap) {
    if (!upc || upc === "0") continue;

    const netSales = ty.grossSales - ty.tax;
    const tyMarginPct =
      netSales > 0 ? ((netSales - ty.cogs) / netSales) * 100 : 0;

    const lw = lwMap.get(upc);
    const lwNet = lw ? lw.grossSales - lw.tax : 0;
    const lwMarginPct =
      lw && lwNet > 0 ? ((lwNet - lw.cogs) / lwNet) * 100 : null;

    const ly = lyMap.get(upc);
    const lyNet = ly ? ly.grossSales - ly.tax : 0;
    const lyMarginPct =
      ly && lyNet > 0 ? ((lyNet - ly.cogs) / lyNet) * 100 : null;

    const salesTrendPct =
      ly && ly.grossSales > 0
        ? ((ty.grossSales - ly.grossSales) / ly.grossSales) * 100
        : lw && lw.grossSales > 0
          ? ((ty.grossSales - lw.grossSales) / lw.grossSales) * 100
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
      tyContributionPct: tyTotal > 0 ? (ty.grossSales / tyTotal) * 100 : 0,
      lwContributionPct:
        lw && lwTotal > 0 ? (lw.grossSales / lwTotal) * 100 : null,
      lyContributionPct:
        ly && lyTotal > 0 ? (ly.grossSales / lyTotal) * 100 : null,
      hasLW: !!lw,
      hasLY: !!ly,
      salesTrendPct,
      qtyTrendPct,
      marginTrendPct,
      lwSalesPct:
        lw && lw.grossSales > 0
          ? ((ty.grossSales - lw.grossSales) / lw.grossSales) * 100
          : null,
      lySalesPct:
        ly && ly.grossSales > 0
          ? ((ty.grossSales - ly.grossSales) / ly.grossSales) * 100
          : null,
      lwQtyPct: lw && lw.qty > 0 ? ((ty.qty - lw.qty) / lw.qty) * 100 : null,
      lyQtyPct: ly && ly.qty > 0 ? ((ty.qty - ly.qty) / ly.qty) * 100 : null,
      lwCogsPct:
        lw && lw.cogs > 0 ? ((ty.cogs - lw.cogs) / lw.cogs) * 100 : null,
      lyCogsPct:
        ly && ly.cogs > 0 ? ((ty.cogs - ly.cogs) / ly.cogs) * 100 : null,
      lwGrossSales: lw ? lw.grossSales : null,
      lyGrossSales: ly ? ly.grossSales : null,
      lwQty: lw ? lw.qty : null,
      lyQty: ly ? ly.qty : null,
      lwCogs: lw ? lw.cogs : null,
      lyCogs: ly ? ly.cogs : null,
    });
  }

  return rows;
};

const WEEKDAY_ORDER = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayOfWeekValue {
  ty: number | null;
  lw: number | null;
  ly: number | null;
}

interface ItemDetail {
  // Dominant (highest-qty) unit price this period, TY vs LW vs LY — lets the
  // insight below tell a price-point shift apart from a pure volume swing,
  // against whichever period (LY preferred, LW fallback) is the basis.
  tyDominantPrice: number | null;
  lwDominantPrice: number | null;
  lyDominantPrice: number | null;
  dayOfWeek: Record<string, DayOfWeekValue>;
}

const weekdayOf = (m: SubDeptMargin): string =>
  new Date(`${m.sale_date.split("T")[0]}T12:00:00`).toLocaleDateString(
    "en-US",
    { weekday: "short" },
  );

const weekdayTotals = (itemRows: SubDeptMargin[]): Map<string, number> => {
  const byWeekday = new Map<string, number>();
  for (const m of itemRows) {
    const wd = weekdayOf(m);
    byWeekday.set(wd, (byWeekday.get(wd) ?? 0) + (m.total_sales - m.total_tax));
  }
  return byWeekday;
};

const dominantPrice = (itemRows: SubDeptMargin[]): number | null => {
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

// Always scoped to the full week's margins for this UPC in each period,
// regardless of any single-day selection elsewhere in the panel — a
// day-of-week chart with only one day in it isn't useful.
const buildItemDetail = (
  productCode: string,
  tyMargins: SubDeptMargin[],
  lwMargins: SubDeptMargin[],
  lyMargins: SubDeptMargin[],
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
      ty: tyByWeekday.has(wd) ? tyByWeekday.get(wd)! : null,
      lw: lwByWeekday.has(wd) ? lwByWeekday.get(wd)! : null,
      ly: lyByWeekday.has(wd) ? lyByWeekday.get(wd)! : null,
    };
  }

  return {
    tyDominantPrice: dominantPrice(tyRows),
    lwDominantPrice: dominantPrice(lwRows),
    lyDominantPrice: dominantPrice(lyRows),
    dayOfWeek,
  };
};

// A day's "primary" trend — prefers LY, falls back to LW when there's no LY
// figure for that weekday, same preference order as ItemMarginRow's
// salesTrendPct/qtyTrendPct (and dev Sales/LP's trend badges generally).
const dayTrend = (val: DayOfWeekValue): number | null => {
  if (val.ty === null) return null;
  if (val.ly !== null && val.ly > 0) return ((val.ty - val.ly) / val.ly) * 100;
  if (val.lw !== null && val.lw > 0) return ((val.ty - val.lw) / val.lw) * 100;
  return null;
};

const bestWorstDay = (
  dayOfWeek: Record<string, DayOfWeekValue>,
): { best: string | null; worst: string | null } => {
  let best: string | null = null;
  let worst: string | null = null;
  let bestPct = -Infinity;
  let worstPct = Infinity;
  for (const wd of WEEKDAY_ORDER) {
    const pct = dayTrend(dayOfWeek[wd]);
    if (pct === null) continue;
    if (pct > bestPct) {
      bestPct = pct;
      best = wd;
    }
    if (pct < worstPct) {
      worstPct = pct;
      worst = wd;
    }
  }
  return { best, worst };
};

// A metric's change counts as "flat" (muted, not colored) below this
// magnitude — mirrors the reference mock's flat-vs-colored delta treatment.
const FLAT_PTS_EPSILON = 0.15;
const FLAT_PCT_EPSILON = 5;

// Synthesizes why margin moved — a price point shift, a volume change, both,
// or neither — for the top of the item report. Prefers LY as the comparison
// basis, falling back to LW when there's no LY figure. Severity is graded on
// whichever metric the left panel's Margin/Sales toggle selects — same basis
// and delta as getItemSeverity — so the banner's severity always matches the
// item's dot/grade everywhere else in the panel, in either mode.
const buildInsight = (
  item: ItemMarginRow,
  detail: ItemDetail,
  threshold: number,
  gradingMetric: GradingMetric,
): { headline: string; detail: string; sev: GradedSeverity } | null => {
  const hasLY = item.lyMarginPct !== null;
  const basisMarginPct = hasLY ? item.lyMarginPct : item.lwMarginPct;
  if (basisMarginPct === null) return null;
  const basisLabel = hasLY ? "LY" : "LW";
  const marginDelta = Math.round((item.tyMarginPct - basisMarginPct) * 10) / 10;
  const salesDelta =
    item.salesTrendPct !== null
      ? Math.round(item.salesTrendPct * 10) / 10
      : null;
  const gradedDelta = gradingMetric === "sales" ? salesDelta : marginDelta;
  if (gradedDelta === null) return null;
  const metricLabel = gradingMetric === "sales" ? "Sales" : "Margin";
  const flatEpsilon =
    gradingMetric === "sales" ? FLAT_PCT_EPSILON : FLAT_PTS_EPSILON;

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
    gradedDelta < -threshold
      ? "critical"
      : gradedDelta < 0
        ? "watch"
        : "healthy";

  const headline = (() => {
    if (sev === "critical") {
      if (priceChanged && cogsChanged)
        return `${metricLabel} in freefall — price and cost both moved`;
      if (priceChanged)
        return `${metricLabel} in freefall — price cut is the driver`;
      if (volumeChanged) return `${metricLabel} in freefall — volume collapsed`;
      return `${metricLabel} in freefall — cost spiked`;
    }
    if (sev === "watch") {
      if (volumeChanged && !priceChanged)
        return `${metricLabel} slipping — volume down`;
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

  const deltaLabel =
    gradingMetric === "sales"
      ? `${gradedDelta >= 0 ? "+" : ""}${gradedDelta.toFixed(2)}%`
      : `${gradedDelta >= 0 ? "+" : ""}${gradedDelta.toFixed(2)} pts`;

  return {
    headline,
    detail: `${deltaLabel} vs ${basisLabel}. ${middleClause}. ${action}.`,
    sev,
  };
};

interface Props {
  tyMargins: SubDeptMargin[];
  lwMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
}

const byDate = (src: SubDeptMargin[], dateStr: string) =>
  src.filter((m) => m.sale_date.split("T")[0] === dateStr);

const SEV_PILL_CLASSES: Record<Severity, string> = {
  critical: "bg-severity_critical_bg text-severity_critical_text",
  watch: "bg-severity_watch_bg text-severity_watch_text",
  healthy: "bg-severity_healthy_bg text-severity_healthy_text",
  ungraded: "bg-gray-100 text-gray-500",
};

// One graded cell in the report-card table — a metric's change vs one
// period, rendered as a Crit/Watch/OK pill same as the item's overall
// severity, so the table reads like a set of subject grades.
const GradeCell = ({
  pct,
  threshold,
  isPts,
}: {
  pct: number | null;
  threshold: number;
  isPts: boolean;
}) => {
  if (pct === null)
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
        —
      </span>
    );
  const sev: GradedSeverity =
    pct < -threshold ? "critical" : pct < 0 ? "watch" : "healthy";
  return (
    <span
      className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${SEV_PILL_CLASSES[sev]}`}
    >
      {isPts
        ? `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}pt`
        : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`}
    </span>
  );
};

const MarginPerfItemsTable = ({ tyMargins, lwMargins, lyMargins }: Props) => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const ctx = useSubMarginCtx();
  // Same Margin/Sales toggle the left panel grades sub depts against —
  // read directly from the dev slice, matching how MarginPerfLeftPanel and
  // MarginPerfRightPanel already read it (this tab is dev-only).
  const gradingMetric = useAppSelector((s) => s.subMargin.gradingMetric);

  // The left list's TY/LW/LY figures always reflect the Margin/Sales toggle
  // in the left panel (gradingMetric) — the View dropdown only controls sort
  // order (see displayData below) and must never change what's displayed.
  const activeMetric: RowMetricKey =
    gradingMetric === "margin" ? "margin" : "sales";

  const [sortCol, setSortCol] = useState<SortCol>("marginTrend");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("asc");
  // Clicking a TY/LW/LY column header sorts directly by that figure (same
  // interaction as the store list in dev Sales — click cycles desc → asc →
  // off) and takes priority over the View dropdown's preset sort while set.
  const [colSort, setColSort] = useState<{
    col: "ty" | "lw" | "ly";
    dir: "desc" | "asc";
  } | null>(null);
  const handleColSortClick = (col: "ty" | "lw" | "ly") => {
    setColSort((prev) => {
      if (prev?.col !== col) return { col, dir: "desc" };
      if (prev.dir === "desc") return { col, dir: "asc" };
      return null;
    });
  };
  const getColSortValue = (item: ItemMarginRow, col: "ty" | "lw" | "ly") => {
    if (activeMetric === "margin") {
      return col === "ty"
        ? item.tyMarginPct
        : col === "lw"
          ? (item.lwMarginPct ?? -999)
          : (item.lyMarginPct ?? -999);
    }
    return col === "ty"
      ? item.grossSales
      : col === "lw"
        ? (item.lwGrossSales ?? -999)
        : (item.lyGrossSales ?? -999);
  };
  const [draftDesc, setDraftDesc] = useState("");
  const [appliedDesc, setAppliedDesc] = useState("");
  const [draftUpc, setDraftUpc] = useState("");
  const [appliedUpc, setAppliedUpc] = useState("");

  const [thresholdValue, setThresholdValue] = useState<ThresholdValue | null>({
    op: "gt",
    amount: 9,
  });
  const [sevFilter, setSevFilter] = useState<SevFilter>("all");
  const [insightOpen, setInsightOpen] = useState(false);
  const [threshOpen, setThreshOpen] = useState(false);
  const threshBtnRef = useRef<HTMLButtonElement>(null);
  const threshPopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!threshOpen) return;
    const close = (e: MouseEvent) => {
      if (
        threshBtnRef.current &&
        !threshBtnRef.current.contains(e.target as Node) &&
        threshPopRef.current &&
        !threshPopRef.current.contains(e.target as Node)
      )
        setThreshOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [threshOpen]);

  // When a single day is selected in the day sidebar, scope all three
  // periods down to that day — TY to the day itself, LW/LY to that same
  // day's mapped date (holiday- and leap-year-aware for LY via getLYDate).
  const dayFilteredMargins = useMemo(() => {
    if (!ctx.selectedWeekDay)
      return { ty: tyMargins, lw: lwMargins, ly: lyMargins };
    const tyDate = ctx.selectedWeekDay;
    const lwDate = addDays(tyDate, -7).toISOString().split("T")[0];
    const lyDate = getLYDate(tyDate);
    return {
      ty: byDate(tyMargins, tyDate),
      lw: byDate(lwMargins, lwDate),
      ly: byDate(lyMargins, lyDate),
    };
  }, [ctx.selectedWeekDay, tyMargins, lwMargins, lyMargins]);

  const rawRows = useMemo(
    () =>
      buildRows(
        dayFilteredMargins.ty,
        dayFilteredMargins.lw,
        dayFilteredMargins.ly,
      ),
    [dayFilteredMargins],
  );

  useEffect(() => {
    dispatch(
      actions.setItemGridData(
        rawRows.map((r) => ({
          sub_department_description: "",
          product_code: r.productCode,
          product_description: r.description,
          cogs: r.cogs,
          cost_fees: r.costFees,
          total_sales: r.grossSales,
          net_sales: r.netSales,
          total_tax: r.tax,
          qty: r.qty,
          margin: r.tyMarginPct,
        })),
      ),
    );
  }, [rawRows]);

  // Grading should never move items around on its own when the threshold
  // input is cleared — keep grading against the last valid amount so
  // severity/sort stays exactly where it was until a new number is typed.
  const thresholdRef = useRef<number>(thresholdValue?.amount ?? 9);
  if (thresholdValue?.amount != null)
    thresholdRef.current = thresholdValue.amount;
  const thresholdAmt = thresholdRef.current;

  const sevCounts = useMemo(() => {
    const counts: Record<Severity, number> = {
      critical: 0,
      watch: 0,
      healthy: 0,
      ungraded: 0,
    };
    for (const row of rawRows)
      counts[getItemSeverity(row, thresholdAmt, gradingMetric)]++;
    return counts;
  }, [rawRows, thresholdAmt, gradingMetric]);

  // Independent of the active severity chip / search filters, so the context
  // menu's "copy critical/watch/healthy" options always mean the same thing.
  const severityUpcs = useMemo(() => {
    const buckets = {
      critical: [] as string[],
      watch: [] as string[],
      healthy: [] as string[],
    };
    for (const row of rawRows) {
      const sev = getItemSeverity(row, thresholdAmt, gradingMetric);
      if (sev === "critical" || sev === "watch" || sev === "healthy")
        buckets[sev].push(row.productCode);
    }
    return buckets;
  }, [rawRows, thresholdAmt, gradingMetric]);

  const allUpcs = useMemo(() => rawRows.map((r) => r.productCode), [rawRows]);

  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    upc: string;
  } | null>(null);
  const [selectedUpc, setSelectedUpc] = useState<string | null>(null);
  const selectedItem = selectedUpc
    ? (rawRows.find((r) => r.productCode === selectedUpc) ?? null)
    : null;

  const selectedDetail = useMemo(
    () =>
      selectedUpc
        ? buildItemDetail(selectedUpc, tyMargins, lwMargins, lyMargins)
        : null,
    [selectedUpc, tyMargins, lwMargins, lyMargins],
  );
  const bestWorst = useMemo(
    () =>
      selectedDetail
        ? bestWorstDay(selectedDetail.dayOfWeek)
        : { best: null, worst: null },
    [selectedDetail],
  );
  const selectedInsight = useMemo(
    () =>
      selectedItem && selectedDetail
        ? buildInsight(
            selectedItem,
            selectedDetail,
            thresholdAmt,
            gradingMetric,
          )
        : null,
    [selectedItem, selectedDetail, thresholdAmt, gradingMetric],
  );

  const displayData = useMemo(() => {
    let data = [...rawRows];
    if (appliedDesc)
      data = data.filter((d) =>
        d.description.toLowerCase().includes(appliedDesc.toLowerCase()),
      );
    if (appliedUpc)
      data = data.filter((d) => d.productCode.includes(appliedUpc));

    if (sevFilter !== "all") {
      data = data.filter(
        (d) => getItemSeverity(d, thresholdAmt, gradingMetric) === sevFilter,
      );
    }

    data.sort((a, b) => {
      if (colSort) {
        const av = getColSortValue(a, colSort.col);
        const bv = getColSortValue(b, colSort.col);
        return colSort.dir === "asc" ? av - bv : bv - av;
      }
      if (sevFilter === "all") {
        const ra = SEV_RANK[getItemSeverity(a, thresholdAmt, gradingMetric)];
        const rb = SEV_RANK[getItemSeverity(b, thresholdAmt, gradingMetric)];
        if (ra !== rb) return ra - rb;
      }
      let av: number, bv: number;
      switch (sortCol) {
        case "contribution":
          av = a.tyContributionPct;
          bv = b.tyContributionPct;
          break;
        case "salesTrend":
          av = a.salesTrendPct ?? -999;
          bv = b.salesTrendPct ?? -999;
          break;
        case "marginTrend":
          av = a.marginTrendPct ?? -999;
          bv = b.marginTrendPct ?? -999;
          break;
        case "marginPct":
          av = a.tyMarginPct;
          bv = b.tyMarginPct;
          break;
        case "qty":
          av = a.qty;
          bv = b.qty;
          break;
        case "cogs":
          av = a.cogs;
          bv = b.cogs;
          break;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });

    return data;
  }, [
    rawRows,
    sortCol,
    sortDir,
    colSort,
    activeMetric,
    appliedDesc,
    appliedUpc,
    sevFilter,
    thresholdAmt,
    gradingMetric,
  ]);

  const openCtxMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY, upc });
  };

  const ptsDelta = (ty: number, ref: number | null) => {
    if (ref === null) return null;
    return Math.round((ty - ref) * 10) / 10;
  };

  // Returns the metric's own raw LW/LY figure for display (never a delta —
  // showing "$18.61" as a delta reads as if that were the actual LY value,
  // which is exactly the confusion this replaced), plus a separate %-based
  // color figure for grading — COGS is graded inverted (a cost increase is
  // bad) even though its raw figure displays the same as sales/contribution.
  const getRowMetric = (item: ItemMarginRow, key: RowMetricKey) => {
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
          tyDisplay: formatCurrency2(item.grossSales),
          lwColorPct: item.lwSalesPct,
          lyColorPct: item.lySalesPct,
          lwDisplay:
            item.lwGrossSales !== null
              ? formatCurrency2(item.lwGrossSales)
              : null,
          lyDisplay:
            item.lyGrossSales !== null
              ? formatCurrency2(item.lyGrossSales)
              : null,
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
            item.lwMarginPct !== null
              ? `${item.lwMarginPct.toFixed(2)}%`
              : null,
          lyDisplay:
            item.lyMarginPct !== null
              ? `${item.lyMarginPct.toFixed(2)}%`
              : null,
        };
    }
  };

  // Item report row order — the graded metric (Margin or Sales, matching
  // gradingMetric) leads, since that's the figure the item's severity comes
  // from; Contribution/the other metric/Qty follow in a fixed order. Reuses
  // getRowMetric so the raw LW/LY figures shown here (not just the delta
  // pill) stay identical to what the left list would show for that metric.
  const REPORT_ROW_LABELS: Record<
    "margin" | "contribution" | "sales" | "qty",
    string
  > = {
    margin: "Margin",
    contribution: "Contribution",
    sales: "Sales",
    qty: "Qty",
  };
  const reportRows = !selectedItem
    ? []
    : (gradingMetric === "margin"
        ? (["margin", "contribution", "sales", "qty"] as const)
        : (["sales", "contribution", "margin", "qty"] as const)
      ).map((key) => {
        const m = getRowMetric(selectedItem, key);
        return {
          key,
          label: REPORT_ROW_LABELS[key],
          ty: m.tyDisplay,
          lw: m.lwColorPct,
          ly: m.lyColorPct,
          lwDisplay: m.lwDisplay,
          lyDisplay: m.lyDisplay,
          isPts: key === "margin" || key === "contribution",
        };
      });

  return (
    <>
      <div
        className="flex-1 min-h-0 flex"
        onContextMenu={(e) => openCtxMenu(e, "")}
      >
        {/* ── Left: item list ── */}
        <div
          className="flex flex-col border-r border-gray-100 min-w-0"
          style={{ width: "50%", flexShrink: 0 }}
        >
          {/* Severity chips + threshold + view */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() =>
                setSevFilter((f) => (f === "critical" ? "all" : "critical"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_critical_bg text-severity_critical_text transition-shadow ${
                sevFilter === "critical"
                  ? "ring-2 ring-severity_critical_text/40 shadow-sm"
                  : ""
              }`}
            >
              Crit ({sevCounts.critical})
            </button>
            <button
              onClick={() =>
                setSevFilter((f) => (f === "watch" ? "all" : "watch"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_watch_bg text-severity_watch_text transition-shadow ${
                sevFilter === "watch"
                  ? "ring-2 ring-severity_watch_text/40 shadow-sm"
                  : ""
              }`}
            >
              Watch ({sevCounts.watch})
            </button>
            <button
              onClick={() =>
                setSevFilter((f) => (f === "healthy" ? "all" : "healthy"))
              }
              className={`text-[10px] font-semibold px-2 py-1 rounded-full bg-severity_healthy_bg text-severity_healthy_text transition-shadow ${
                sevFilter === "healthy"
                  ? "ring-2 ring-severity_healthy_text/40 shadow-sm"
                  : ""
              }`}
            >
              OK ({sevCounts.healthy})
            </button>

            <div className="relative flex-shrink-0">
              <button
                ref={threshBtnRef}
                onClick={() => setThreshOpen((v) => !v)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
              >
                Thresh
              </button>
              {threshOpen && (
                <div
                  ref={threshPopRef}
                  className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20"
                >
                  <ThresholdFilter
                    value={thresholdValue}
                    onChange={setThresholdValue}
                    showOp={false}
                    showClear={false}
                    suffix={gradingMetric === "sales" ? "%" : "pts"}
                    inputWidth={46}
                  />
                </div>
              )}
            </div>

            <SelectFilter
              options={VIEW_OPTIONS}
              value={presetKey(sortCol, sortDir)}
              onChange={(v) => {
                const preset = VIEW_PRESETS.find(
                  (p) => presetKey(p.col, p.dir) === v,
                );
                if (preset) {
                  setSortCol(preset.col);
                  setSortDir(preset.dir);
                  setColSort(null);
                }
              }}
              placeholder="View"
              className="w-32"
            />
          </div>

          {/* List header — Item / active metric / vs LW / vs LY, same anatomy
            as the sub dept rows in dev Sales. Right padding is 4px wider
            than the rows' — matches the reserved scrollbar-gutter below so
            columns still line up whether or not the list is scrollable. */}
          <div className="flex items-center gap-2.5 pl-3 pr-4 py-1.5 border-b border-gray-100 flex-shrink-0">
            <span className="w-2.5 flex-shrink-0" />
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-content/80 flex-1 flex items-center gap-2 min-w-0">
              Item
              <ColFilter
                label="UPC"
                active={!!appliedUpc}
                onApply={() => setAppliedUpc(draftUpc)}
                onClear={() => {
                  setAppliedUpc("");
                  setDraftUpc("");
                }}
              >
                <input
                  autoFocus
                  style={colInputStyle}
                  placeholder="Search UPC…"
                  value={draftUpc}
                  onChange={(e) => setDraftUpc(e.target.value)}
                />
              </ColFilter>
              <ColFilter
                label="Desc"
                active={!!appliedDesc}
                onApply={() => setAppliedDesc(draftDesc)}
                onClear={() => {
                  setAppliedDesc("");
                  setDraftDesc("");
                }}
              >
                <input
                  autoFocus
                  style={colInputStyle}
                  placeholder="Search description…"
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                />
              </ColFilter>
            </span>
            <div className="flex items-center gap-[10px]">
              <button
                onClick={() => handleColSortClick("ty")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 76 }}
              >
                TY
                {colSort?.col === "ty" &&
                  (colSort.dir === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleColSortClick("lw")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 68 }}
              >
                LW
                {colSort?.col === "lw" &&
                  (colSort.dir === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
              <button
                onClick={() => handleColSortClick("ly")}
                className="flex items-center justify-center gap-0.5 text-[11.5px] font-semibold uppercase tracking-wide text-content/80 hover:text-content flex-shrink-0"
                style={{ width: 68 }}
              >
                LY
                {colSort?.col === "ly" &&
                  (colSort.dir === "desc" ? (
                    <ChevronDownIcon className="w-3 h-3" />
                  ) : (
                    <ChevronUpIcon className="w-3 h-3" />
                  ))}
              </button>
            </div>
          </div>

          {/* Rows */}
          <div
            className="flex-1 overflow-y-auto thin-scrollbar"
            style={{ scrollbarGutter: "stable" }}
          >
            {displayData.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-[11px] text-content">
                {rawRows.length > 0 ? "No items match filters" : "No item data"}
              </div>
            ) : (
              displayData.map((item) => {
                const sev = getItemSeverity(item, thresholdAmt, gradingMetric);
                const isSel = selectedUpc === item.productCode;
                const metric = getRowMetric(item, activeMetric);
                return (
                  <button
                    key={item.productCode}
                    onClick={() =>
                      setSelectedUpc(isSel ? null : item.productCode)
                    }
                    onContextMenu={(e) => {
                      e.stopPropagation();
                      openCtxMenu(e, item.productCode);
                    }}
                    className={`w-full flex items-center gap-2.5 p-3 text-left transition-colors border-l-2 border-b border-b-[#1e2a4a]/15 ${
                      isSel
                        ? "bg-row_selected border-row_selected_border"
                        : "border-transparent hover:bg-gray-50"
                    }`}
                  >
                    <SeverityBadge severity={sev} />
                    <div className="flex flex-col justify-center min-w-0 flex-1">
                      <div className="text-[13px] font-medium text-content truncate">
                        {item.description}
                      </div>
                      <div className="text-[10px] text-content tabular-nums truncate">
                        {item.productCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-[10px]">
                      <span
                        className={`text-[13px] font-semibold px-1.5 py-1 rounded text-center flex-shrink-0 whitespace-nowrap ${SEV_PILL_CLASSES[sev]}`}
                        style={{ width: 76 }}
                      >
                        {metric.tyDisplay}
                      </span>
                      <span
                        className="text-[12px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
                        style={{ width: 68 }}
                      >
                        {metric.lwDisplay ?? "—"}
                      </span>
                      <span
                        className="text-[12px] font-semibold text-content text-center flex-shrink-0 whitespace-nowrap"
                        style={{ width: 68 }}
                      >
                        {metric.lyDisplay ?? "—"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: item report ── */}
        <div
          className="flex-1 min-w-0 overflow-y-auto thin-scrollbar"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-[12px] text-content">
              Select an item to see its report
            </div>
          ) : (
            <>
              {/* Header row: item name — doubles as the CTA insight toggle,
                same styling/behavior as the sub dept CTA strip in dev Sales.
                Severity reflects selectedInsight, which follows the day
                selection below; name/UPC always identify the full item. */}
              {selectedInsight ? (
                <div
                  className={`relative border-b ${CTA_SEVERITY_CLASSES[selectedInsight.sev].border}`}
                >
                  <button
                    onClick={() => setInsightOpen((v) => !v)}
                    className={`w-full flex items-center gap-1.5 px-4 py-2 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].bg} ${CTA_SEVERITY_CLASSES[selectedInsight.sev].hoverBg} transition-colors`}
                  >
                    {selectedInsight.sev === "critical" && (
                      <ExclamationTriangleIcon
                        className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
                      />
                    )}
                    {selectedInsight.sev === "watch" && (
                      <ExclamationCircleIcon
                        className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
                      />
                    )}
                    {selectedInsight.sev === "healthy" && (
                      <CheckCircleIcon
                        className={`w-3.5 h-3.5 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text} flex-shrink-0`}
                      />
                    )}
                    <span
                      className={`text-[13px] font-semibold truncate ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                    >
                      {selectedItem.description}
                      <span className="ml-2 font-normal text-[11px] tabular-nums">
                        {selectedItem.productCode}
                      </span>
                    </span>
                    <span className="flex-1" />
                    {insightOpen ? (
                      <ChevronUpIcon
                        className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      />
                    ) : (
                      <ChevronDownIcon
                        className={`w-3 h-3 flex-shrink-0 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      />
                    )}
                  </button>
                  {insightOpen && (
                    <div
                      className={`absolute top-full left-0 right-0 z-20 px-4 py-2.5 border-b shadow-lg ${CTA_SEVERITY_CLASSES[selectedInsight.sev].bg} ${CTA_SEVERITY_CLASSES[selectedInsight.sev].border}`}
                    >
                      <div
                        className={`text-[12.5px] font-medium mb-1 ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      >
                        {selectedInsight.headline}
                      </div>
                      <div
                        className={`text-[11px] leading-relaxed ${CTA_SEVERITY_CLASSES[selectedInsight.sev].text}`}
                      >
                        {selectedInsight.detail}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                  <span className="text-[14px] font-medium text-content truncate">
                    {selectedItem.description}
                  </span>
                  <span className="text-[11px] text-content tabular-nums flex-shrink-0">
                    {selectedItem.productCode}
                  </span>
                </div>
              )}

              <div className="px-4 py-2.5 border-b border-gray-100">
                <div className="grid gap-2 items-center grid-cols-[5%_30%_30%_30%]">
                  <span />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-content text-right">
                    This year
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-content text-right">
                    vs LW
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-content text-right">
                    vs LY
                  </span>

                  {reportRows.map((row) => (
                    <Fragment key={row.key}>
                      <span className="text-[12px] font-semibold text-content py-1 border-t border-gray-100">
                        {row.label}
                      </span>
                      <span className="text-[12px] font-medium text-content text-right py-1 border-t border-gray-100">
                        {row.ty}
                      </span>
                      <div className="flex items-center justify-end gap-1 py-1 border-t border-gray-100">
                        <span className="text-[12px] text-content font-medium whitespace-nowrap">
                          {row.lwDisplay ?? "—"}
                        </span>
                        <GradeCell
                          pct={row.lw}
                          threshold={thresholdAmt}
                          isPts={row.isPts}
                        />
                      </div>
                      <div className="flex items-center justify-end gap-1 py-1 border-t border-gray-100">
                        <span className="text-[12px] text-content font-medium whitespace-nowrap">
                          {row.lyDisplay ?? "—"}
                        </span>
                        <GradeCell
                          pct={row.ly}
                          threshold={thresholdAmt}
                          isPts={row.isPts}
                        />
                      </div>
                    </Fragment>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                  <span
                    className={`text-[12px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      selectedItem.tyMarginPct > 0
                        ? "bg-severity_healthy_bg text-severity_healthy_text"
                        : selectedItem.tyMarginPct < 0
                          ? "bg-severity_critical_bg text-severity_critical_text"
                          : "bg-severity_watch_bg text-severity_watch_text"
                    }`}
                  >
                    {selectedItem.tyMarginPct > 0
                      ? "Still profitable"
                      : selectedItem.tyMarginPct < 0
                        ? "Losing money"
                        : "Break-even"}
                  </span>
                  <span className="text-[12.5px] text-content">
                    {selectedItem.tyMarginPct.toFixed(2)}% margin
                    {(ptsDelta(
                      selectedItem.tyMarginPct,
                      selectedItem.lwMarginPct,
                    ) ?? 0) < 0 ||
                    (ptsDelta(
                      selectedItem.tyMarginPct,
                      selectedItem.lyMarginPct,
                    ) ?? 0) < 0
                      ? ", trending down"
                      : ""}
                  </span>
                </div>
              </div>

              {selectedDetail && (
                <div className="px-4 py-2.5">
                  <div className="text-[9px] font-semibold uppercase tracking-wide text-content mb-1.5">
                    Day trend
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {WEEKDAY_ORDER.map((wd) => {
                      const val = selectedDetail.dayOfWeek[wd];
                      if (val.ty === null) {
                        return (
                          <div
                            key={wd}
                            className="text-center rounded-md px-2 py-1.5 border bg-gray-50 border-gray-200"
                          >
                            <div className="text-[10px] text-content mb-1">
                              {wd}
                            </div>
                            <div className="text-[13px] text-content">—</div>
                          </div>
                        );
                      }
                      const pct = dayTrend(val);
                      const isBest = wd === bestWorst.best;
                      const isWorst =
                        wd === bestWorst.worst &&
                        bestWorst.worst !== bestWorst.best;
                      const flat =
                        pct !== null && Math.abs(pct) < FLAT_PCT_EPSILON;
                      return (
                        <div
                          key={wd}
                          className={`text-center rounded-md px-2 py-2 border ${
                            isBest
                              ? "bg-severity_healthy_bg border-severity_healthy_text/40"
                              : isWorst
                                ? "bg-severity_critical_bg border-severity_critical_text/40"
                                : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="text-[10px] text-content mb-1">
                            {wd}
                          </div>
                          <div className="text-[13px] font-semibold text-content">
                            {formatCurrency2(val.ty)}
                          </div>
                          <div
                            className="text-[10.5px] font-medium text-content mt-0.5"
                            style={
                              pct !== null && !flat
                                ? { color: pct >= 0 ? "#16a34a" : "#ef4444" }
                                : undefined
                            }
                          >
                            {pct === null
                              ? "—"
                              : flat
                                ? "flat"
                                : `${pct >= 0 ? "+" : ""}${pct.toFixed(0)}%`}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(bestWorst.best ||
                    (bestWorst.worst &&
                      bestWorst.worst !== bestWorst.best)) && (
                    <div className="flex gap-4 mt-2 text-[10.5px] text-content">
                      {bestWorst.best && (
                        <span>Best day — {bestWorst.best}</span>
                      )}
                      {bestWorst.worst &&
                        bestWorst.worst !== bestWorst.best && (
                          <span>Worst day — {bestWorst.worst}</span>
                        )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {ctxMenu && (
        <UpcContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          upc={ctxMenu.upc}
          allUpcs={allUpcs}
          severityUpcs={severityUpcs}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </>
  );
};

export default MarginPerfItemsTable;
