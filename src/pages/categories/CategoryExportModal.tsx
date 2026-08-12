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
} from "../../utils/itemMargins";
import type { CatItem, CatSalesHourly } from "../../interfaces";
import type { CategoryMetric, CategoryRow } from "./categoriesUtils";
import {
  getTier,
  tierOfDelta,
  pctChange,
  shiftIso,
  LW_OFFSET,
  LY_OFFSET,
} from "./categoriesUtils";
import { fmtDayLabel } from "../../utils/dateLabels";

/**
 * CSV export for Categories.
 *
 * Same shell and the same Presets/Custom split as the other seven export
 * modals. What differs is scope: the category list covers every category, while
 * items and hours only ever cover the open one, because that is all the
 * endpoints return per selection. The preset labels say so rather than leaving
 * someone to discover it in the file.
 */

type ExportPreset = "categories" | "items" | "items_graded" | "hours";
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
  categoryName: string;
  dateRange: string;
  /** Every category — the left panel's list. */
  rows: CategoryRow[];
  /** Item rows for the open category only. */
  items: { tw: CatItem[]; lw: CatItem[]; ly: CatItem[] };
  /** Hourly rows for the open category, empty until the Hours tab is opened. */
  hourly: { tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] };
  metric: CategoryMetric;
  /** Grades the category list. */
  threshold: number;
  /** Grades the item list — the same figure the Items tab is showing. */
  itemThreshold: number;
  /** This week's dates, in order — the day picker's options. */
  weekDates: string[];
  /** The day open in the panel, or null for the whole week. Seeds the picker so
   *  the file defaults to matching what's on screen. */
  selectedDay: string | null;
}

const netSales = (m: CatItem) => m.total_sales - m.total_tax;
const itemCogs = (m: CatItem) =>
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

/* ── Preset builders ──────────────────────────────────────────────────────── */

/** Every category, graded, with both baselines. Uses the day-matched TW
 *  subtotals (`twNetForLW` / `twNetForLY`) rather than the raw week total —
 *  comparing a full week against a partial one is the bug those fields exist to
 *  prevent, and an export is exactly where it would go unnoticed. */
const buildCategoriesCsv = (
  rows: CategoryRow[],
  metric: CategoryMetric,
  threshold: number,
  days: Set<string>,
) => {
  const isQty = metric === "qty";
  const headers = [
    "Category",
    "Description",
    "Grade",
    isQty ? "TY Qty" : "TY Net Sales",
    isQty ? "LW Qty" : "LW Net Sales",
    "vs LW %",
    isQty ? "LY Qty" : "LY Net Sales",
    "vs LY %",
  ];
  const wholeWeek = days.size === 0;
  const out: (string | number)[][] = [];

  for (const r of rows) {
    let tw: number, lw: number | null, ly: number | null;
    let twForLW: number, twForLY: number;

    if (wholeWeek) {
      tw = isQty ? r.twQty : r.twNet;
      lw = r.hasLW ? (isQty ? r.lwQty : r.lwNet) : null;
      ly = r.hasLY ? (isQty ? r.lyQty : r.lyNet) : null;
      twForLW = isQty ? r.twQtyForLW : r.twNetForLW;
      twForLY = isQty ? r.twQtyForLY : r.twNetForLY;
    } else {
      // A category with nothing on the chosen days is left out rather than
      // written as a row of zeroes — the screen doesn't show it either.
      const sel = r.days.filter((d) => days.has(d.date));
      if (sel.length === 0) continue;

      tw = sel.reduce((s, d) => s + (isQty ? d.twQty : d.twNet), 0);

      // Still day-matched, just over a subset: a day only contributes to a
      // comparison when both sides have it, and it contributes to *both*
      // sides or neither. Summing all seven TY days against three LY ones is
      // exactly the bug the whole-week subtotals exist to prevent.
      let lwSum = 0, twLW = 0, lwSeen = false;
      let lySum = 0, twLY = 0, lySeen = false;
      for (const d of sel) {
        const t = isQty ? d.twQty : d.twNet;
        const l = isQty ? d.lwQty : d.lwNet;
        const y = isQty ? d.lyQty : d.lyNet;
        if (l !== null) { lwSum += l; twLW += t; lwSeen = true; }
        if (y !== null) { lySum += y; twLY += t; lySeen = true; }
      }
      lw = lwSeen ? lwSum : null;
      ly = lySeen ? lySum : null;
      twForLW = twLW;
      twForLY = twLY;
    }

    const lwPct = lw === null || lw === 0 ? null : pctChange(twForLW, lw);
    const lyPct = ly === null || ly === 0 ? null : pctChange(twForLY, ly);
    // The whole week grades off the row; a subset grades off its own primary
    // delta, through the same boundaries.
    const grade = wholeWeek
      ? TIER_LABEL[getTier(r, threshold, metric)]
      : TIER_LABEL[tierOfDelta(lyPct ?? lwPct, threshold)];

    out.push([
      r.category,
      r.description ?? "Uncategorized",
      grade ?? "",
      fmtNum(tw),
      lw === null ? "" : fmtNum(lw),
      lwPct === null ? "" : fmtNum(lwPct),
      ly === null ? "" : fmtNum(ly),
      lyPct === null ? "" : fmtNum(lyPct),
    ]);
  }
  return rowsToCsv(headers, out);
};

/** Items in the open category, this week, aggregated per UPC. */
const buildItemsCsv = (rows: CatItem[]) => {
  const headers = [
    "Product Code",
    "Description",
    "Vendor",
    "Net Sales",
    "Qty",
    "COGS",
    "Margin %",
  ];
  const grouped = new Map<
    string,
    { desc: string; vendor: string; sales: number; qty: number; cogs: number }
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
        vendor: m.vendor_name,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const out = Array.from(grouped.entries()).map(([code, v]) => [
    code,
    v.desc,
    v.vendor,
    fmtNum(v.sales),
    v.qty,
    fmtNum(v.cogs),
    fmtNum(v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0),
  ]);
  return rowsToCsv(headers, out);
};

/** Items graded against LW and LY, filtered to the chosen severities.
 *  Grading runs through the same shared `getItemSeverity` the Items tab uses,
 *  at the same threshold, so a "Critical" row in the file is a red dot on the
 *  screen and not an approximation of one. */
const buildItemsGradedCsv = (
  items: { tw: CatItem[]; lw: CatItem[]; ly: CatItem[] },
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
      fmtNum(r.netSales),
      r.lwNetSales === null ? "" : fmtNum(r.lwNetSales),
      r.lwSalesPct === null ? "" : fmtNum(r.lwSalesPct),
      r.lyNetSales === null ? "" : fmtNum(r.lyNetSales),
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

/** Hours for the open category, folded across the week and compared to the
 *  same hour last week and last year — an hour in isolation says nothing. */
const buildHoursCsv = (
  hourly: { tw: CatSalesHourly[]; lw: CatSalesHourly[]; ly: CatSalesHourly[] },
  metric: CategoryMetric,
) => {
  const isQty = metric === "qty";
  const headers = [
    "Hour",
    isQty ? "TY Qty" : "TY Net Sales",
    isQty ? "LW Qty" : "LW Net Sales",
    "vs LW %",
    isQty ? "LY Qty" : "LY Net Sales",
    "vs LY %",
    "Gross Sales",
    "Tax",
  ];
  const fold = (list: CatSalesHourly[]) => {
    const m = new Map<number, { v: number; gross: number; tax: number }>();
    for (const h of list) {
      const cur = m.get(h.hour) ?? { v: 0, gross: 0, tax: 0 };
      cur.v += isQty ? h.qty : h.net_sales;
      cur.gross += h.total_sales;
      cur.tax += h.total_tax;
      m.set(h.hour, cur);
    }
    return m;
  };
  const tw = fold(hourly.tw);
  const lw = fold(hourly.lw);
  const ly = fold(hourly.ly);

  const out = [...new Set([...tw.keys(), ...lw.keys(), ...ly.keys()])]
    .sort((a, b) => a - b)
    .map((hour) => {
      const t = tw.get(hour);
      const l = lw.get(hour);
      const y = ly.get(hour);
      const lwPct = !l || l.v === 0 ? null : pctChange(t?.v ?? 0, l.v);
      const lyPct = !y || y.v === 0 ? null : pctChange(t?.v ?? 0, y.v);
      return [
        `${String(hour).padStart(2, "0")}:00`,
        fmtNum(t?.v ?? 0),
        l ? fmtNum(l.v) : "",
        lwPct === null ? "" : fmtNum(lwPct),
        y ? fmtNum(y.v) : "",
        lyPct === null ? "" : fmtNum(lyPct),
        fmtNum(t?.gross ?? 0),
        fmtNum(t?.tax ?? 0),
      ];
    });
  return rowsToCsv(headers, out);
};

/* ── Custom-mode config ───────────────────────────────────────────────────── */

const ITEM_DIMS = [
  { key: "sale_date", label: "Date" },
  { key: "product_code", label: "Product Code" },
  { key: "product_description", label: "Description" },
  { key: "vendor_name", label: "Vendor" },
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

/* ── Component ────────────────────────────────────────────────────────────── */

const CategoryExportModal = ({
  onClose,
  storeName,
  categoryName,
  dateRange,
  rows,
  items,
  hourly,
  metric,
  threshold,
  itemThreshold,
  weekDates,
  selectedDay,
}: Props) => {
  // Nothing is preselected — same as every other export modal here.
  const [mode, setMode] = useState<ModalMode>("presets");
  // Empty means the whole week. Seeded from the panel so the file matches the
  // screen by default, but retargetable without leaving the modal.
  const [exportDays, setExportDays] = useState<Set<string>>(
    () => new Set(selectedDay ? [selectedDay] : []),
  );
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<GradedSev>>(new Set());
  const [source, setSource] = useState<CustomSource>("tw");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState(freshMetrics);

  const gradingMetric: ItemGradingMetric = metric === "qty" ? "qty" : "sales";

  /** Items and hours narrowed to the chosen days — TY to those dates, LW/LY to
   *  the same dates shifted, exactly as the Items tab narrows them. An empty
   *  selection leaves all three periods whole. */
  const scoped = useMemo(() => {
    if (exportDays.size === 0) return { items, hourly };
    const tw = exportDays;
    const lw = new Set([...exportDays].map((d) => shiftIso(d, LW_OFFSET)));
    const ly = new Set([...exportDays].map((d) => shiftIso(d, LY_OFFSET)));
    const on = <T extends { sale_date: string }>(src: T[], keep: Set<string>) =>
      src.filter((r) => keep.has(r.sale_date.split("T")[0]));
    return {
      items: {
        tw: on(items.tw, tw),
        lw: on(items.lw, lw),
        ly: on(items.ly, ly),
      },
      hourly: {
        tw: on(hourly.tw, tw),
        lw: on(hourly.lw, lw),
        ly: on(hourly.ly, ly),
      },
    };
  }, [exportDays, items, hourly]);

  // Availability follows the scope: a category with nothing on the chosen day
  // has no item export to offer, and saying so beats an empty file.
  const hasItems = scoped.items.tw.length > 0;
  const hasHours = scoped.hourly.tw.length > 0;

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    setMetrics(freshMetrics());
  };

  const toggleDay = (iso: string) =>
    setExportDays((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });

  // Kept in week order rather than click order, so a three-day pick reads as a
  // date range and not a history of which pill was pressed first.
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
  const toggleItemSev = (sev: GradedSev) => {
    const next = new Set(itemSevs);
    if (next.has(sev)) next.delete(sev);
    else next.add(sev);
    setItemSevs(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("items_graded");
      else n.delete("items_graded");
      return n;
    });
  };

  const flatRows = useMemo<AggRow[]>(
    () =>
      scoped.items[source].map(
        (m) =>
          ({
            ...m,
            sale_date: m.sale_date.split("T")[0],
            net_sales_calc: netSales(m),
            cogs_calc: itemCogs(m),
          }) as AggRow,
      ),
    [source, scoped],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = ITEM_DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = ITEM_METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
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
        out[d.key] =
          d.key === "sale_date" ? fmtDate(String(raw)) : String(raw ?? "");
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
      id: "categories",
      label: "Category Performance",
      description: orderedDays.length
        ? "Every category with sales in the selected days, graded against last week and last year"
        : `All ${rows.length} categories, graded, with last week and last year`,
      disabled: rows.length === 0,
    },
    {
      id: "items",
      label: "Items Report",
      description: hasItems
        ? `Net sales, qty, COGS and margin % per item in ${categoryName}`
        : "Select a category to export its items",
      disabled: !hasItems,
    },
    {
      id: "hours",
      label: "Hourly Breakdown",
      description: hasHours
        ? `Every hour in ${categoryName}, against the same hour LW and LY`
        : "Open the Hours tab first — hourly data loads on demand",
      disabled: !hasHours,
    },
  ];

  const SEV_CHIP: { sev: GradedSev; label: string; activeClass: string }[] = [
    {
      sev: "critical",
      label: "Critical",
      activeClass: "bg-red-600 border-red-600 text-custom-white",
    },
    {
      sev: "watch",
      label: "Watch",
      activeClass: "bg-amber-500 border-amber-500 text-custom-white",
    },
    {
      sev: "healthy",
      label: "Healthy",
      activeClass: "bg-emerald-600 border-emerald-600 text-custom-white",
    },
  ];

  const safeName = `${storeName}_${categoryName}`.replace(/[^a-z0-9]/gi, "_");
  // The filename names the scope, so a week pull and a Tuesday pull don't land
  // in Downloads under the same name.
  const fileDate =
    orderedDays.length === 0
      ? dateRange.replace(/\s/g, "")
      : orderedDays.length === 1
        ? orderedDays[0]
        : `${orderedDays[0]}_to_${orderedDays[orderedDays.length - 1]}`;

  const handlePresetDownload = () => {
    const sections: string[] = [];
    // Each section names its own scope — the columns stay clean, and a file
    // opened a month later still says what window it covers.
    const title = (name: string) => `${name} — ${scopeLabel}`;
    if (selected.has("categories"))
      sections.push(
        `${title("Category Performance")}\n${buildCategoriesCsv(rows, metric, threshold, exportDays)}`,
      );
    if (selected.has("items"))
      sections.push(`${title("Items Report")}\n${buildItemsCsv(scoped.items.tw)}`);
    if (selected.has("items_graded") && itemSevs.size > 0)
      sections.push(
        `${title("Items Graded")}\n${buildItemsGradedCsv(scoped.items, itemThreshold, gradingMetric, itemSevs)}`,
      );
    if (selected.has("hours"))
      sections.push(
        `${title("Hourly Breakdown")}\n${buildHoursCsv(scoped.hourly, metric)}`,
      );
    if (!sections.length) return;
    downloadCsv(sections.join("\n\n"), `${safeName}_${fileDate}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const out = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(
      rowsToCsv(headers, out),
      `${safeName}_custom_${fileDate}.csv`,
    );
    onClose();
  };

  const sourceLabel: Record<CustomSource, string> = {
    tw: "This Week",
    lw: "Last Week",
    ly: "Last Year",
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:categories:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div>
          <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
          <p className="text-custom-white text-[10px] mt-0.5">
            {categoryName} · {storeName}
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

      {/* ── PRESETS ── */}
      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3 overflow-y-auto thin-scrollbar">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>

            {/* Scope. Sits above the datasets because it changes what every one
                of them contains — All week is the cleared state rather than an
                eighth toggle, so the two can't contradict each other. */}
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
              <span className="text-[10px] text-content w-full">
                {scopeNote}
              </span>
            </div>

            {presetDatasets.map(({ id, label, description, disabled }) => (
              <label
                key={id}
                className={`flex items-start gap-3 group ${
                  disabled ? "opacity-40" : "cursor-pointer"
                }`}
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

            {/* Graded items — the severity chips are the filter, same as
                Sub Dept Margins. */}
            <div className={`flex items-start gap-3 ${hasItems ? "" : "opacity-40"}`}>
              <input
                type="checkbox"
                disabled={!hasItems}
                checked={selected.has("items_graded")}
                onChange={() => {
                  const checking = !selected.has("items_graded");
                  if (checking) {
                    if (itemSevs.size === 0)
                      setItemSevs(new Set(["critical", "watch", "healthy"]));
                  } else {
                    setItemSevs(new Set());
                  }
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
                    ? `TY vs LW vs LY per item, graded on ${
                        gradingMetric === "qty" ? "qty" : "sales"
                      } at ${itemThreshold}%`
                    : "Select a category to export its items"}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {SEV_CHIP.map(({ sev, label, activeClass }) => (
                    <button
                      key={sev}
                      disabled={!hasItems}
                      onClick={() => toggleItemSev(sev)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors disabled:cursor-not-allowed ${
                        itemSevs.has(sev)
                          ? activeClass
                          : "bg-custom-white border-gray-200 text-content"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
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

      {/* ── CUSTOM ── */}
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
                        onChange={() => switchSource(s)}
                        className="accent-[#1e2a4a] h-3.5 w-3.5"
                      />
                      <span className="text-[12px] text-content">{sourceLabel[s]}</span>
                    </label>
                  ))}
                </div>
                <p className="text-[10px] text-content mt-2 leading-relaxed">
                  Items in {categoryName} only.
                </p>
              </div>

              {/* Same scope control as Presets — one selection, both modes. */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Date
                </p>
                <div className="flex flex-wrap gap-1">
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

            {/* Preview */}
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
                    {hasItems ? (
                      <>
                        Select at least one group-by dimension
                        <br />
                        or metric to see a preview.
                      </>
                    ) : (
                      <>
                        Select a category first — custom exports
                        <br />
                        are built from its item rows.
                      </>
                    )}
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

export default CategoryExportModal;
