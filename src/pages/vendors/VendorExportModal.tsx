import { useMemo, useState } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import ResizableModalShell from "../../components/modals/ResizableModalShell";
import { fmtNum, rowsToCsv, downloadCsv, aggregateRows } from "../../utils/csvExport";
import type { AggFn, AggRow } from "../../utils/csvExport";
import { calculateCogs } from "../subDepts";
import {
  buildItemRows,
  getItemSeverity,
  type ItemSeverity,
  type ItemGradingMetric,
  type ItemMarginRow,
} from "../../utils/itemMargins";
import {
  LW_OFFSET,
  LY_OFFSET,
  isoOf,
  shiftIso,
  pctChange,
  tierOfDelta,
} from "../../utils/grading";
import { fmtDayLabel } from "../../utils/dateLabels";
import type { SubDeptMargin } from "../../interfaces";
import type { VendorMetric, VendorRow } from "./vendorsUtils";
import { getVendorTier, marginPct, rowsForVendor } from "./vendorsUtils";

/**
 * CSV export for Vendors.
 *
 * Same shell and the same Presets/Custom split as the other export modals.
 * Scope differs by preset: the vendor list covers every vendor, while items and
 * departments cover the open one — which is all the panel has loaded per
 * selection.
 */

type ExportPreset =
  | "vendors"
  | "items"
  | "items_graded"
  | "all_vendors"
  | "upc_list";
type ModalMode = "presets" | "custom";
type CustomSource = "tw" | "lw" | "ly";
type GradedSev = "critical" | "watch" | "healthy";

interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

interface Props {
  onClose: () => void;
  storeName: string;
  vendorName: string;
  dateRange: string;
  /** Every vendor — the left panel's list. */
  rows: VendorRow[];
  /** Item rows for the open vendor only. */
  vendorRaw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  /** Item rows for every vendor — the search already holds them, which is what
   *  makes the all-vendors preset free. */
  allRaw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] };
  metric: VendorMetric;
  threshold: number;
  itemThreshold: number;
  weekDates: string[];
  selectedDay: string | null;
}

const netSales = (m: SubDeptMargin) => m.total_sales - m.total_tax;
const itemCogs = (m: SubDeptMargin) =>
  calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

const SEV_LABEL: Record<ItemSeverity, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
  ungraded: "Ungraded",
};

const TIER_LABEL: Record<string, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
  ungraded: "Ungraded",
};

/* ── preset builders ─────────────────────────────────────────────────────── */

/** Every vendor, graded, with both baselines. Uses the day-matched TW subtotals
 *  rather than the raw week total — comparing a full week against a partial one
 *  is the error those fields exist to prevent, and an export is exactly where it
 *  would go unnoticed. */
const buildVendorsCsv = (
  rows: VendorRow[],
  metric: VendorMetric,
  threshold: number,
  days: Set<string>,
) => {
  const isMargin = metric === "margin";
  const headers = [
    "Vendor ID",
    "Vendor",
    "Grade",
    isMargin ? "TY Margin %" : "TY Net Sales",
    isMargin ? "LW Margin %" : "LW Net Sales",
    // Points, not percent — a 2-point margin move is not a 2% move, and
    // labelling it "%" in a spreadsheet is how that gets misread downstream.
    isMargin ? "vs LW pts" : "vs LW %",
    isMargin ? "LY Margin %" : "LY Net Sales",
    isMargin ? "vs LY pts" : "vs LY %",
  ];
  const wholeWeek = days.size === 0;
  const out: (string | number)[][] = [];

  type Pair = { net: number; cogs: number };
  const value = (p: Pair) => (isMargin ? marginPct(p.net, p.cogs) : p.net);
  const delta = (twP: Pair, base: Pair) =>
    isMargin
      ? marginPct(twP.net, twP.cogs) - marginPct(base.net, base.cogs)
      : pctChange(twP.net, base.net);

  for (const r of rows) {
    let tw: Pair, lw: Pair | null, ly: Pair | null;
    let twForLW: Pair, twForLY: Pair;

    if (wholeWeek) {
      tw = { net: r.twNet, cogs: r.twCogs };
      lw = r.hasLW ? { net: r.lwNet, cogs: r.lwCogs } : null;
      ly = r.hasLY ? { net: r.lyNet, cogs: r.lyCogs } : null;
      twForLW = { net: r.twNetForLW, cogs: r.twCogsForLW };
      twForLY = { net: r.twNetForLY, cogs: r.twCogsForLY };
    } else {
      const sel = r.days.filter((d) => days.has(d.date));
      if (sel.length === 0) continue;
      tw = sel.reduce(
        (a, d) => ({ net: a.net + d.twNet, cogs: a.cogs + d.twCogs }),
        { net: 0, cogs: 0 } as Pair,
      );
      // Still day-matched over a subset: a day only joins a comparison when
      // both sides have it, and it joins both sides or neither. COGS travels
      // with the net or the margin gets taken over a different set of days
      // than the cost it is measured against.
      const lwSum: Pair = { net: 0, cogs: 0 };
      const twLW: Pair = { net: 0, cogs: 0 };
      const lySum: Pair = { net: 0, cogs: 0 };
      const twLY: Pair = { net: 0, cogs: 0 };
      let lwSeen = false, lySeen = false;
      for (const d of sel) {
        if (d.lwNet !== null) {
          lwSum.net += d.lwNet; lwSum.cogs += d.lwCogs ?? 0;
          twLW.net += d.twNet; twLW.cogs += d.twCogs;
          lwSeen = true;
        }
        if (d.lyNet !== null) {
          lySum.net += d.lyNet; lySum.cogs += d.lyCogs ?? 0;
          twLY.net += d.twNet; twLY.cogs += d.twCogs;
          lySeen = true;
        }
      }
      lw = lwSeen ? lwSum : null;
      ly = lySeen ? lySum : null;
      twForLW = twLW;
      twForLY = twLY;
    }

    const lwPct = lw === null || lw.net === 0 ? null : delta(twForLW, lw);
    const lyPct = ly === null || ly.net === 0 ? null : delta(twForLY, ly);
    const grade = wholeWeek
      ? TIER_LABEL[getVendorTier(r, threshold, metric)]
      : TIER_LABEL[tierOfDelta(lyPct ?? lwPct, threshold)];

    out.push([
      r.vendorId,
      r.vendorName,
      grade ?? "",
      fmtNum(value(tw)),
      lw === null ? "" : fmtNum(value(lw)),
      lwPct === null ? "" : fmtNum(lwPct),
      ly === null ? "" : fmtNum(value(ly)),
      lyPct === null ? "" : fmtNum(lyPct),
    ]);
  }
  return rowsToCsv(headers, out);
};

const buildItemsCsv = (rows: SubDeptMargin[]) => {
  const headers = [
    "Product Code",
    "Description",
    "Sub department",
    "Net Sales",
    "Qty",
    "COGS",
    "Margin %",
  ];
  const grouped = new Map<
    string,
    { desc: string; dept: string; sales: number; qty: number; cogs: number }
  >();
  for (const m of rows) {
    const e = grouped.get(m.product_code);
    if (e) {
      e.sales += netSales(m);
      e.qty += m.qty;
      e.cogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        dept: m.sub_department_description,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const out = [...grouped.entries()].map(([code, v]) => [
    code,
    v.desc,
    v.dept,
    fmtNum(v.sales),
    v.qty,
    fmtNum(v.cogs),
    fmtNum(v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0),
  ]);
  return rowsToCsv(headers, out);
};

/** Items graded against LW and LY, filtered to the chosen severities. Grading
 *  runs through the same shared `getItemSeverity` the Items tab uses, at the
 *  same threshold, so a "Critical" row in the file is a red dot on screen. */
const buildItemsGradedCsv = (
  items: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
  threshold: number,
  gradingMetric: ItemGradingMetric,
  sevs: Set<GradedSev>,
) => {
  const headers = [
    "Product Code",
    "Description",
    "Grade",
    "TY Net Sales",
    "LW Net Sales",
    "vs LW %",
    "LY Net Sales",
    "vs LY %",
    "TY Qty",
    "LW Qty",
    "LY Qty",
    "TY Margin %",
    "LW Margin %",
    "LY Margin %",
    "Contribution %",
  ];
  const built = buildItemRows(items.tw, items.lw, items.ly);
  const out: (string | number)[][] = [];
  for (const r of built) {
    const sev = getItemSeverity(r, threshold, gradingMetric);
    if (sev === "ungraded" || !sevs.has(sev)) continue;
    out.push([
      r.productCode,
      r.description,
      SEV_LABEL[sev],
      fmtNum(r.grossSales),
      r.lwGrossSales === null ? "" : fmtNum(r.lwGrossSales),
      r.lwSalesPct === null ? "" : fmtNum(r.lwSalesPct),
      r.lyGrossSales === null ? "" : fmtNum(r.lyGrossSales),
      r.lySalesPct === null ? "" : fmtNum(r.lySalesPct),
      r.qty,
      r.lwQty === null ? "" : r.lwQty,
      r.lyQty === null ? "" : r.lyQty,
      fmtNum(r.tyMarginPct),
      r.lwMarginPct === null ? "" : fmtNum(r.lwMarginPct),
      r.lyMarginPct === null ? "" : fmtNum(r.lyMarginPct),
      fmtNum(r.tyContributionPct),
    ]);
  }
  return rowsToCsv(headers, out);
};

/**
 * The same graded item file, across every vendor rather than the open one.
 *
 * Costs nothing extra: the search already holds every vendor's TW/LW/LY rows,
 * so this is a regroup of data in hand rather than a fan-out. It's the only
 * dataset here that isn't scoped to the selected vendor, which is why the
 * vendor lands in a column instead of the filename.
 *
 * Vendors are walked in the left panel's order and their items graded exactly
 * as `buildItemsGradedCsv` does, so a row here matches the row that vendor's
 * own export would produce.
 */
/** One graded item, with the vendor and department it came from. The full
 *  export and the UPC-only export share this so the two can never disagree
 *  about which items are in scope — the second is the first with the columns
 *  taken away. */
interface GradedItem {
  vendorId: string;
  vendorName: string;
  dept: string;
  r: ItemMarginRow;
  sev: GradedSev;
}

const collectGradedItems = (
  rows: VendorRow[],
  raw: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
  threshold: number,
  gradingMetric: ItemGradingMetric,
  sevs: Set<GradedSev>,
): GradedItem[] => {
  const sevRank: Record<GradedSev, number> = { critical: 0, watch: 1, healthy: 2 };
  const out: GradedItem[] = [];

  for (const v of rows) {
    const tw = rowsForVendor(raw.tw, v.vendorId);
    if (tw.length === 0) continue;
    // Sub department isn't on the built item row, so it comes off the source
    // rows — an item sells under one department, so first match is the answer.
    const deptOf = new Map<string, string>();
    for (const m of tw) {
      if (!deptOf.has(m.product_code))
        deptOf.set(m.product_code, m.sub_department_description);
    }

    const built = buildItemRows(
      tw,
      rowsForVendor(raw.lw, v.vendorId),
      rowsForVendor(raw.ly, v.vendorId),
    );
    const kept: GradedItem[] = [];
    for (const r of built) {
      const sev = getItemSeverity(r, threshold, gradingMetric);
      if (sev === "ungraded" || !sevs.has(sev)) continue;
      kept.push({
        vendorId: v.vendorId,
        vendorName: v.vendorName,
        dept: deptOf.get(r.productCode) ?? "",
        r,
        sev,
      });
    }
    // Worst first inside a vendor, then biggest sellers — the order someone
    // works a list in.
    kept.sort(
      (a, b) => sevRank[a.sev] - sevRank[b.sev] || b.r.grossSales - a.r.grossSales,
    );
    out.push(...kept);
  }
  return out;
};

const buildAllVendorsCsv = (items: GradedItem[]) => {
  const headers = [
    "Vendor ID",
    "Vendor",
    "Product Code",
    "Description",
    "Sub department",
    "Grade",
    "TY Net Sales",
    "LW Net Sales",
    "vs LW %",
    "LY Net Sales",
    "vs LY %",
    "TY Qty",
    "TY Margin %",
    "LW Margin %",
    "LY Margin %",
  ];
  const out = items.map(({ vendorId, vendorName, dept, r, sev }) => [
    vendorId,
    vendorName,
    r.productCode,
    r.description,
    dept,
    SEV_LABEL[sev],
    fmtNum(r.grossSales),
    r.lwGrossSales === null ? "" : fmtNum(r.lwGrossSales),
    r.lwSalesPct === null ? "" : fmtNum(r.lwSalesPct),
    r.lyGrossSales === null ? "" : fmtNum(r.lyGrossSales),
    r.lySalesPct === null ? "" : fmtNum(r.lySalesPct),
    r.qty,
    fmtNum(r.tyMarginPct),
    r.lwMarginPct === null ? "" : fmtNum(r.lwMarginPct),
    r.lyMarginPct === null ? "" : fmtNum(r.lyMarginPct),
  ]);
  return rowsToCsv(headers, out);
};

/** The same item set with everything but the UPC dropped — a list to feed
 *  another page, not a report to read. Deduped because an item carried by two
 *  vendors would otherwise be uploaded twice. */
const buildUpcListCsv = (items: GradedItem[]) => {
  const seen = new Set<string>();
  const out: (string | number)[][] = [];
  for (const { r } of items) {
    if (seen.has(r.productCode)) continue;
    seen.add(r.productCode);
    out.push([r.productCode]);
  }
  return rowsToCsv(["UPC"], out);
};

/** TW rows to the chosen dates, LW/LY to the same dates shifted — the Items
 *  tab's narrowing, applied to whichever slice of the search it's handed. An
 *  empty set means the whole week and is returned untouched. */
const narrowToDays = (
  src: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
  days: Set<string>,
) => {
  if (days.size === 0) return src;
  const lw = new Set([...days].map((d) => shiftIso(d, LW_OFFSET)));
  const ly = new Set([...days].map((d) => shiftIso(d, LY_OFFSET)));
  const on = (rows: SubDeptMargin[], keep: Set<string>) =>
    rows.filter((r) => keep.has(isoOf(r.sale_date)));
  return { tw: on(src.tw, days), lw: on(src.lw, lw), ly: on(src.ly, ly) };
};

/* ── custom mode ─────────────────────────────────────────────────────────── */

const ITEM_DIMS = [
  { key: "sale_date", label: "Date" },
  { key: "product_code", label: "Product Code" },
  { key: "product_description", label: "Description" },
  { key: "sub_department_description", label: "Sub department" },
  { key: "price_type", label: "Price Type" },
];

const ITEM_METRICS = [
  { key: "net_sales_calc", label: "Net Sales" },
  { key: "qty", label: "Qty" },
  { key: "cogs_calc", label: "COGS" },
  { key: "total_tax", label: "Total Tax" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

const freshMetrics = () =>
  new Map<string, MetricSelection>(
    ITEM_METRICS.map((m) => [m.key, { fn: "sum" as AggFn, enabled: false }]),
  );

const PREVIEW_ROWS = 5;

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const SEV_CHIP: { sev: GradedSev; label: string; activeClass: string }[] = [
  { sev: "critical", label: "Critical", activeClass: "bg-red-600 border-red-600 text-custom-white" },
  { sev: "watch", label: "Watch", activeClass: "bg-amber-500 border-amber-500 text-custom-white" },
  { sev: "healthy", label: "Healthy", activeClass: "bg-emerald-600 border-emerald-600 text-custom-white" },
];

/**
 * Severity chips for one preset. Filter only.
 *
 * Clicking a chip never checks or unchecks its dataset. The two used to be
 * bound together — a chip that emptied the set also cleared the checkbox, and
 * seeding on check re-lit a chip the user had just turned off — so clicking
 * "Critical" on a preset whose Critical chip was already lit silently dropped
 * the whole dataset from the download. From the outside that read as the
 * severity filter doing nothing.
 *
 * One component for all three chip rows rather than three copies, so they can't
 * drift apart again.
 */
const SevChips = ({
  value,
  onToggle,
  disabled,
  hint,
}: {
  value: Set<GradedSev>;
  onToggle: (sev: GradedSev) => void;
  disabled?: boolean;
  /** Shown when the dataset is selected but no severity is — that combination
   *  produces an empty section, and saying so beats a silently missing file. */
  hint?: boolean;
}) => (
  <>
    <div className="flex gap-1.5 flex-wrap">
      {SEV_CHIP.map(({ sev, label, activeClass }) => (
        <button
          key={sev}
          disabled={disabled}
          onClick={() => onToggle(sev)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors disabled:cursor-not-allowed ${
            value.has(sev)
              ? activeClass
              : "bg-custom-white border-gray-200 text-content"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
    {hint && (
      <p className="text-[10px] text-amber-800 mt-1">
        Pick at least one severity or this dataset exports nothing.
      </p>
    )}
  </>
);

/* ── component ───────────────────────────────────────────────────────────── */

const VendorExportModal = ({
  onClose,
  storeName,
  vendorName,
  dateRange,
  rows,
  vendorRaw,
  allRaw,
  metric,
  threshold,
  itemThreshold,
  weekDates,
  selectedDay,
}: Props) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<GradedSev>>(new Set());
  const [allSevs, setAllSevs] = useState<Set<GradedSev>>(new Set());
  const [upcSevs, setUpcSevs] = useState<Set<GradedSev>>(new Set());
  const [source, setSource] = useState<CustomSource>("tw");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState(freshMetrics);
  const [exportDays, setExportDays] = useState<Set<string>>(
    () => new Set(selectedDay ? [selectedDay] : []),
  );

  const gradingMetric: ItemGradingMetric = metric === "margin" ? "margin" : "sales";

  /** Items narrowed to the chosen days — TW to those dates, LW/LY to the same
   *  dates shifted, exactly as the Items tab narrows them. */
  const scoped = useMemo(
    () => narrowToDays(vendorRaw, exportDays),
    [exportDays, vendorRaw],
  );
  // The day pills govern every dataset, so the all-vendors slice narrows the
  // same way — otherwise picking Tuesday would quietly export a whole week for
  // one preset and one day for the rest.
  const scopedAll = useMemo(
    () => narrowToDays(allRaw, exportDays),
    [exportDays, allRaw],
  );

  const hasItems = scoped.tw.length > 0;

  const toggleDay = (iso: string) =>
    setExportDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });

  const orderedDays = weekDates.filter((d) => exportDays.has(d));
  const scopeLabel =
    orderedDays.length === 0
      ? `Week of ${dateRange}`
      : orderedDays.map(fmtDayLabel).join(", ");
  const scopeNote =
    orderedDays.length === 0
      ? "Every dataset below covers the whole week."
      : orderedDays.length === 1
        ? "Every dataset below covers this day only."
        : `Every dataset below covers these ${orderedDays.length} days.`;

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, enabled: !cur.enabled });
      return next;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const next = new Map(prev);
      next.set(key, { ...next.get(key)!, fn });
      return next;
    });

  // Picking a severity chip activates the graded preset, and clearing them all
  // deactivates it, so the checkbox and the chips can never disagree.
  const toggleItemSev = (sev: GradedSev) =>
    setItemSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const toggleAllSev = (sev: GradedSev) =>
    setAllSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const toggleUpcSev = (sev: GradedSev) =>
    setUpcSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const hasAllItems = scopedAll.tw.length > 0;

  const flatRows = useMemo<AggRow[]>(
    () =>
      scoped[source].map(
        (m) =>
          ({
            ...m,
            sale_date: isoOf(m.sale_date),
            net_sales_calc: netSales(m),
            cogs_calc: itemCogs(m),
          }) as AggRow,
      ),
    [source, scoped],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = ITEM_DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = ITEM_METRICS.map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const built = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = built.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) {
        const raw = row[d.key];
        out[d.key] = d.key === "sale_date" ? fmtDate(String(raw)) : String(raw ?? "");
      }
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const cols = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
    ];

    return { aggRows: display, columns: cols };
  }, [flatRows, groupBy, metrics]);

  const presetDatasets: {
    id: ExportPreset;
    label: string;
    description: string;
    disabled: boolean;
  }[] = [
    {
      id: "vendors",
      label: "Vendor Performance",
      description: orderedDays.length
        ? "Every vendor with sales in the selected days, graded against last week and last year"
        : `All ${rows.length} vendors, graded, with last week and last year`,
      disabled: rows.length === 0,
    },
    {
      id: "items",
      label: "Items Report",
      description: hasItems
        ? `Net sales, qty, COGS and margin % per item from ${vendorName}`
        : "Nothing from this vendor in the selected days",
      disabled: !hasItems,
    },
  ];

  const safeName = `${storeName}_${vendorName}`.replace(/[^a-z0-9]/gi, "_");
  const fileDate =
    orderedDays.length === 0
      ? dateRange.replace(/\s/g, "")
      : orderedDays.length === 1
        ? orderedDays[0]
        : `${orderedDays[0]}_to_${orderedDays[orderedDays.length - 1]}`;

  const handlePresetDownload = () => {
    const sections: string[] = [];
    const title = (name: string) => `${name} — ${scopeLabel}`;
    if (selected.has("vendors"))
      sections.push(
        `${title("Vendor Performance")}\n${buildVendorsCsv(rows, metric, threshold, exportDays)}`,
      );
    if (selected.has("items"))
      sections.push(`${title("Items Report")}\n${buildItemsCsv(scoped.tw)}`);
    if (selected.has("items_graded") && itemSevs.size > 0)
      sections.push(
        `${title("Items Graded")}\n${buildItemsGradedCsv(scoped, itemThreshold, gradingMetric, itemSevs)}`,
      );
    if (selected.has("all_vendors") && allSevs.size > 0)
      sections.push(
        `${title("Items Graded — All Vendors")}\n${buildAllVendorsCsv(
          collectGradedItems(rows, scopedAll, itemThreshold, gradingMetric, allSevs),
        )}`,
      );
    if (selected.has("upc_list") && upcSevs.size > 0)
      sections.push(
        `${title("UPC List")}\n${buildUpcListCsv(
          collectGradedItems(rows, scopedAll, itemThreshold, gradingMetric, upcSevs),
        )}`,
      );
    if (!sections.length) return;
    // The store-wide presets aren't about the open vendor, so a file made only
    // of those shouldn't be named after it.
    const storeWide = new Set<ExportPreset>(["all_vendors", "upc_list"]);
    const scopeName = [...selected].every((p) => storeWide.has(p))
      ? storeName.replace(/[^a-z0-9]/gi, "_")
      : safeName;
    downloadCsv(sections.join("\n\n"), `${scopeName}_${fileDate}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const out = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(rowsToCsv(headers, out), `${safeName}_custom_${fileDate}.csv`);
    onClose();
  };

  const sourceLabel: Record<CustomSource, string> = {
    tw: "This Week",
    lw: "Last Week",
    ly: "Last Year",
  };

  const dayPills = (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => setExportDays(new Set())}
        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
          exportDays.size === 0
            ? "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white"
            : "bg-custom-white border-gray-200 text-content"
        }`}
      >
        All week
      </button>
      {weekDates.map((iso) => (
        <button
          key={iso}
          onClick={() => toggleDay(iso)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
            exportDays.has(iso)
              ? "bg-[#1e2a4a] border-[#1e2a4a] text-custom-white"
              : "bg-custom-white border-gray-200 text-content"
          }`}
        >
          {fmtDayLabel(iso)}
        </button>
      ))}
    </div>
  );

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:vendors:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div>
          <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
          <p className="text-custom-white text-[10px] mt-0.5">
            {vendorName} · {storeName}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m ? "bg-custom-white text-[#1e2a4a]" : "text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3 overflow-y-auto thin-scrollbar">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>

            {/* Scope. Sits above the datasets because it changes what every one
                of them contains — All week is the cleared state rather than an
                eighth toggle, so the two can't contradict each other. */}
            {dayPills}
            <span className="block text-[10px] text-content">{scopeNote}</span>

            {presetDatasets.map(({ id, label, description, disabled }) => (
              <label
                key={id}
                className={`flex items-start gap-3 group ${disabled ? "opacity-40" : "cursor-pointer"}`}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected.has(id)}
                  onChange={() =>
                    setSelected((prev) => {
                      const n = new Set(prev);
                      if (n.has(id)) n.delete(id);
                      else n.add(id);
                      return n;
                    })
                  }
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    {label}
                  </p>
                  <p className="text-[11px] text-content mt-0.5">{description}</p>
                </div>
              </label>
            ))}

            <div className={`flex items-start gap-3 ${hasItems ? "" : "opacity-40"}`}>
              <input
                type="checkbox"
                disabled={!hasItems}
                checked={selected.has("items_graded")}
                onChange={() => {
                  const checking = !selected.has("items_graded");
                  // Seeds only when nothing is chosen, and never clears on
                  // uncheck — a severity the user picked survives them toggling
                  // the dataset off and back on.
                  if (checking && itemSevs.size === 0) setItemSevs(new Set(["critical", "watch", "healthy"]));
                  setSelected((prev) => {
                    const n = new Set(prev);
                    if (checking) n.add("items_graded");
                    else n.delete("items_graded");
                    return n;
                  });
                }}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-content">Items Graded</p>
                <p className="text-[11px] text-content mt-0.5 mb-1.5">
                  {hasItems
                    ? `TY vs LW vs LY per item, graded on ${gradingMetric} at ${itemThreshold}%`
                    : "Nothing from this vendor in the selected days"}
                </p>
                <SevChips
                  value={itemSevs}
                  onToggle={toggleItemSev}
                  disabled={!hasItems}
                  hint={selected.has("items_graded") && itemSevs.size === 0}
                />
              </div>
            </div>

            {/* The only dataset here that isn't scoped to the open vendor.
                Free — the search already holds every vendor's rows. */}
            <div
              className={`flex items-start gap-3 pt-3 border-t border-gray-100 ${hasAllItems ? "" : "opacity-40"}`}
            >
              <input
                type="checkbox"
                disabled={!hasAllItems}
                checked={selected.has("all_vendors")}
                onChange={() => {
                  const checking = !selected.has("all_vendors");
                  // Seeds only when nothing is chosen, and never clears on
                  // uncheck — a severity the user picked survives them toggling
                  // the dataset off and back on.
                  if (checking && allSevs.size === 0) setAllSevs(new Set(["critical", "watch", "healthy"]));
                  setSelected((prev) => {
                    const n = new Set(prev);
                    if (checking) n.add("all_vendors");
                    else n.delete("all_vendors");
                    return n;
                  });
                }}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-content">
                  Items Graded — All Vendors
                </p>
                <p className="text-[11px] text-content mt-0.5 mb-1.5">
                  {hasAllItems
                    ? `Every item across all ${rows.length} vendors, tagged with its vendor, graded on ${gradingMetric} at ${itemThreshold}%`
                    : "Nothing sold in the selected days"}
                </p>
                <SevChips
                  value={allSevs}
                  onToggle={toggleAllSev}
                  disabled={!hasAllItems}
                  hint={selected.has("all_vendors") && allSevs.size === 0}
                />
              </div>
            </div>

            {/* The same item set with every column but the UPC dropped — a list
                to feed another page, not a report to read. Its own severities,
                so it doesn't have to ride along with the full export. */}
            <div
              className={`flex items-start gap-3 pt-3 border-t border-gray-100 ${hasAllItems ? "" : "opacity-40"}`}
            >
              <input
                type="checkbox"
                disabled={!hasAllItems}
                checked={selected.has("upc_list")}
                onChange={() => {
                  const checking = !selected.has("upc_list");
                  // Seeds only when nothing is chosen, and never clears on
                  // uncheck — a severity the user picked survives them toggling
                  // the dataset off and back on.
                  if (checking && upcSevs.size === 0)
                    setUpcSevs(new Set(["critical"]));
                  setSelected((prev) => {
                    const n = new Set(prev);
                    if (checking) n.add("upc_list");
                    else n.delete("upc_list");
                    return n;
                  });
                }}
                className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-content">UPC List</p>
                <p className="text-[11px] text-content mt-0.5 mb-1.5">
                  {hasAllItems
                    ? "Just the UPCs from every vendor, one per row, ready to load into another page."
                    : "Nothing sold in the selected days"}
                </p>
                <SevChips
                  value={upcSevs}
                  onToggle={toggleUpcSev}
                  disabled={!hasAllItems}
                  hint={selected.has("upc_list") && upcSevs.size === 0}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
            <button onClick={onClose} className="text-[12px] text-content transition-colors">
              Cancel
            </button>
            <button
              onClick={handlePresetDownload}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </>
      )}

      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Data Source
                </p>
                <div className="flex flex-col gap-1.5">
                  {(["tw", "lw", "ly"] as CustomSource[]).map((s) => (
                    <label key={s} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={source === s}
                        onChange={() => {
                          setSource(s);
                          setGroupBy(new Set());
                          setMetrics(freshMetrics());
                        }}
                        className="accent-[#1e2a4a] h-3.5 w-3.5"
                      />
                      <span className="text-[12px] text-content">{sourceLabel[s]}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-content mt-2 leading-relaxed">
                  Items from {vendorName} only.
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Date
                </p>
                {dayPills}
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Group By
                </p>
                <div className="space-y-1.5">
                  {ITEM_DIMS.map((d) => (
                    <label key={d.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={groupBy.has(d.key)}
                        onChange={() => toggleGroupBy(d.key)}
                        className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                      />
                      <span className="text-[12px] text-content">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Metrics
                </p>
                <div className="space-y-2">
                  {ITEM_METRICS.map((m) => {
                    const sel = metrics.get(m.key)!;
                    return (
                      <div key={m.key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={sel.enabled}
                          onChange={() => toggleMetric(m.key)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                        />
                        <span className="text-[12px] flex-1 text-content">{m.label}</span>
                        <select
                          value={sel.fn}
                          disabled={!sel.enabled}
                          onChange={(e) => setMetricFn(m.key, e.target.value as AggFn)}
                          className="text-[10px] border border-gray-200 rounded px-1 py-0.5 text-content disabled:opacity-30 bg-custom-white outline-none"
                          style={{ minWidth: 52 }}
                        >
                          {AGG_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                <p className="text-[11px] font-semibold text-content uppercase tracking-wide">
                  Preview
                </p>
                <span className="text-[10px] text-content">
                  {aggRows.length === 0
                    ? "No data — select at least one group or metric"
                    : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                </span>
              </div>

              {columns.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[12px] text-content leading-relaxed">
                    Select at least one group-by dimension
                    <br />
                    or metric to see a preview.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-auto thin-scrollbar">
                  <table className="min-w-full text-[11px] border-collapse">
                    <thead className="sticky top-0 bg-gray-50 z-10">
                      <tr>
                        {columns.map((c) => (
                          <th
                            key={c.key}
                            className="text-left px-3 py-2 text-content font-semibold border-b border-gray-100 whitespace-nowrap"
                          >
                            {c.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {aggRows.slice(0, PREVIEW_ROWS).map((r, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          {columns.map((c) => (
                            <td
                              key={c.key}
                              className="px-3 py-1.5 text-content whitespace-nowrap tabular-nums"
                            >
                              {r[c.key] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button onClick={onClose} className="text-[12px] text-content transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCustomDownload}
              disabled={!columns.length || !aggRows.length}
              className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </>
      )}
    </ResizableModalShell>
  );
};

export default VendorExportModal;
