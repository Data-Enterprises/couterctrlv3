import { useState, useMemo } from "react";
import ResizableModalShell from "../../../../components/modals/ResizableModalShell";
import MultiSelectFilter from "../../../../components/filters/MultiSelectFilter";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { SubDept, SubDeptMargin } from "../../../../interfaces";
import type { SubDeptGrade } from "../../../../features/subMarginSlice";
import { calculateCogs, hasNoUsableCost } from "../..";
import { fmtNum, rowsToCsv, downloadCsv, aggregateRows } from "../../../../utils/csvExport";
import type { AggFn, AggRow } from "../../../../utils/csvExport";
import {
  buildItemRows,
  getItemSeverity,
  gradedDelta,
  type ItemGradingMetric,
  type ItemMarginRow,
} from "../../../../utils/itemMargins";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportPreset =
  | "items"
  | "items_vs_ly"
  | "cost"
  | "nocost"
  | "all_depts"
  | "upc_list";
type ModalMode = "presets" | "custom";
type CustomSource = "ty" | "ly";
type ItemSev = "critical" | "watch" | "healthy";

interface DimDef { key: string; label: string }
interface MetricDef { key: string; label: string }
interface MetricSelection { fn: AggFn; enabled: boolean }

interface MarginPerfExportModalProps {
  onClose: () => void;
  storeName: string;
  subDeptName: string;
  dateRange: string;
  tyMargins: SubDeptMargin[];
  lyMargins: SubDeptMargin[];
  threshold: number;
  /** Every department in the current search, for the all-departments preset. */
  subDepts: SubDept[];
  /** Their grades, which already carry each department's TY/LW/LY item rows —
   *  so a store-wide export costs no extra calls. Fills in as grading finishes,
   *  which is why the preset says how many are in hand. */
  grades: Record<number, SubDeptGrade>;
  /** The page's Margin/Sales toggle. Severity has to mean here what it means on
   *  screen, so the export grades on the same metric rather than assuming one. */
  gradingMetric: ItemGradingMetric;
  loadingGrades: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

const netSales = (m: SubDeptMargin) => m.total_sales - m.total_tax;
const itemCogs = (m: SubDeptMargin) => calculateCogs(m.net_cost, m.cost, m.case_size, m.qty, m.weight);

// ─── Preset CSV builders ──────────────────────────────────────────────────────

const buildItemsCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Net Sales", "Qty", "COGS", "Margin %"];
  const grouped = new Map<string, { desc: string; sales: number; qty: number; cogs: number }>();
  for (const m of margins) {
    const existing = grouped.get(m.product_code);
    if (existing) {
      existing.sales += netSales(m);
      existing.qty += m.qty;
      existing.cogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        sales: netSales(m),
        qty: m.qty,
        cogs: itemCogs(m),
      });
    }
  }
  const rows = Array.from(grouped.entries()).map(([code, v]) => {
    const marginPct = v.sales > 0 ? ((v.sales - v.cogs) / v.sales) * 100 : 0;
    return [code, v.desc, fmtNum(v.sales), v.qty, fmtNum(v.cogs), fmtNum(marginPct)];
  });
  return rowsToCsv(headers, rows);
};

const SEV_LABEL: Record<ItemSev, string> = { critical: "Critical", watch: "Watch", healthy: "Healthy" };

const getMarginPtsSeverity = (pts: number, threshold: number): ItemSev => {
  if (pts < -threshold) return "critical";
  if (pts < 0) return "watch";
  return "healthy";
};

const buildItemsVsLyCsv = (ty: SubDeptMargin[], ly: SubDeptMargin[], threshold: number, sevs: Set<ItemSev>) => {
  const headers = ["Product Code", "Description", "Severity", "TY Net Sales", "LY Net Sales", "TY Margin %", "LY Margin %", "Margin Pts Δ"];
  const agg = (src: SubDeptMargin[]) => {
    const map = new Map<string, { desc: string; sales: number; cogs: number }>();
    for (const m of src) {
      const e = map.get(m.product_code);
      if (e) { e.sales += netSales(m); e.cogs += itemCogs(m); }
      else map.set(m.product_code, { desc: m.product_description, sales: netSales(m), cogs: itemCogs(m) });
    }
    return map;
  };
  const tyMap = agg(ty);
  const lyMap = agg(ly);
  const allCodes = new Set([...tyMap.keys(), ...lyMap.keys()]);
  const rows: (string | number)[][] = [];
  allCodes.forEach((code) => {
    const t = tyMap.get(code);
    const l = lyMap.get(code);
    const tySales = t?.sales ?? 0;
    const tyCogs = t?.cogs ?? 0;
    const lySales = l?.sales ?? 0;
    const lyCogs = l?.cogs ?? 0;
    const tyMpct = tySales > 0 ? ((tySales - tyCogs) / tySales) * 100 : 0;
    const lyMpct = lySales > 0 ? ((lySales - lyCogs) / lySales) * 100 : 0;
    const pts = tyMpct - lyMpct;
    const sev = getMarginPtsSeverity(pts, threshold);
    if (!sevs.has(sev)) return;
    rows.push([code, t?.desc ?? l?.desc ?? "", SEV_LABEL[sev], fmtNum(tySales), fmtNum(lySales), fmtNum(tyMpct), fmtNum(lyMpct), fmtNum(pts)]);
  });
  return rowsToCsv(headers, rows);
};

const buildCostCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Cost", "Net Cost", "Case Size", "Calculated Cost", "Total COGS", "Qty"];
  const grouped = new Map<string, { desc: string; cost: number; netCost: number; caseSize: number; calcCost: number; totalCogs: number; qty: number }>();
  for (const m of margins) {
    const e = grouped.get(m.product_code);
    if (e) {
      e.qty += m.qty;
      e.totalCogs += itemCogs(m);
    } else {
      grouped.set(m.product_code, {
        desc: m.product_description,
        cost: m.cost,
        netCost: m.net_cost,
        caseSize: m.case_size,
        calcCost: m.calculated_cost,
        totalCogs: itemCogs(m),
        qty: m.qty,
      });
    }
  }
  const rows = Array.from(grouped.entries()).map(([code, v]) =>
    [code, v.desc, fmtNum(v.cost, 4), fmtNum(v.netCost, 4), v.caseSize, fmtNum(v.calcCost, 4), fmtNum(v.totalCogs), v.qty]
  );
  return rowsToCsv(headers, rows);
};

const buildNoCostCsv = (margins: SubDeptMargin[]) => {
  const headers = ["Product Code", "Description", "Qty", "Cost", "Net Cost", "Case Size"];
  const seen = new Set<string>();
  const rows: (string | number)[][] = [];
  for (const m of margins) {
    if (!seen.has(m.product_code) && hasNoUsableCost(m)) {
      seen.add(m.product_code);
      rows.push([m.product_code, m.product_description, m.qty, fmtNum(m.cost, 4), fmtNum(m.net_cost, 4), m.case_size]);
    }
  }
  return rowsToCsv(headers, rows);
};


/**
 * Every graded item in every department, filtered to the chosen severities.
 *
 * The one export on this page that isn't scoped to the open department. It
 * costs nothing extra: grading already fetched each department's TY/LW/LY item
 * rows and parked them on the grade, so this is a re-read of data the page is
 * holding rather than a store-wide fan-out.
 *
 * Severity is computed with the same `buildItemRows` + `getItemSeverity` the
 * items table renders from, and on the same Margin/Sales toggle — a row that
 * reads Critical here is the row that reads Critical on screen. (The older
 * `Items vs Last Year` preset above predates that helper and grades LY-only,
 * which is why the two can disagree on an item with no LY counterpart.)
 *
 * Ungraded items — no LW or LY to compare against — are dropped. They can't be
 * critical, and listing them with a blank severity in a file whose whole point
 * is severity invites them being read as healthy.
 */
const METRIC_LABEL: Record<ItemGradingMetric, string> = {
  margin: "Margin pts vs LY",
  sales: "Sales % vs LY",
  qty: "Qty % vs LY",
};

/** One graded item, with the department it came from. The full export and the
 *  UPC-only export share this so the two can never disagree about which items
 *  are in scope — the second is the first with the columns taken away. */
interface GradedItem {
  dept: string;
  row: ItemMarginRow;
  sev: ItemSev;
}

const collectGradedItems = (
  subDepts: SubDept[],
  grades: Record<number, SubDeptGrade>,
  threshold: number,
  gradingMetric: ItemGradingMetric,
  sevs: Set<ItemSev>,
): GradedItem[] => {
  const sevRank: Record<ItemSev, number> = { critical: 0, watch: 1, healthy: 2 };
  const out: GradedItem[] = [];

  // Department order is the left panel's, so the file reads down the page.
  for (const sd of subDepts) {
    const grade = grades[sd.id];
    if (!grade) continue;
    const items = buildItemRows(
      grade.tyWeekOneMargins,
      grade.lwWeekOneMargins,
      grade.lyWeekOneMargins,
    );
    const kept: GradedItem[] = [];
    for (const row of items) {
      const sev = getItemSeverity(row, threshold, gradingMetric);
      if (sev === "ungraded" || !sevs.has(sev)) continue;
      kept.push({ dept: sd.desc, row, sev });
    }
    // Worst first inside a department, then biggest sellers — the order someone
    // works a list in.
    kept.sort(
      (a, b) =>
        sevRank[a.sev] - sevRank[b.sev] || b.row.netSales - a.row.netSales,
    );
    out.push(...kept);
  }
  return out;
};

const buildAllDeptsCsv = (items: GradedItem[], gradingMetric: ItemGradingMetric) => {
  const headers = [
    "Sub Department",
    "Product Code",
    "Description",
    "Severity",
    "Graded On",
    "Graded Δ",
    "TY Net Sales",
    "Qty",
    "TY Margin %",
    "LW Margin %",
    "LY Margin %",
    "Sales Δ%",
    "Qty Δ%",
  ];
  const rows = items.map(({ dept, row, sev }) => {
    const delta = gradedDelta(row, gradingMetric);
    return [
      dept,
      row.productCode,
      row.description,
      SEV_LABEL[sev],
      METRIC_LABEL[gradingMetric],
      delta === null ? "" : fmtNum(delta),
      fmtNum(row.netSales),
      row.qty,
      fmtNum(row.tyMarginPct),
      row.lwMarginPct === null ? "" : fmtNum(row.lwMarginPct),
      row.lyMarginPct === null ? "" : fmtNum(row.lyMarginPct),
      row.salesTrendPct === null ? "" : fmtNum(row.salesTrendPct),
      row.qtyTrendPct === null ? "" : fmtNum(row.qtyTrendPct),
    ];
  });
  return rowsToCsv(headers, rows);
};

/** The same item set as above with everything but the UPC dropped — a list to
 *  paste or upload into another page, not a report to read. Deduped because the
 *  same UPC can be reached twice and an uploader would count it twice. */
const buildUpcListCsv = (items: GradedItem[]) => {
  const seen = new Set<string>();
  const rows: (string | number)[][] = [];
  for (const { row } of items) {
    if (seen.has(row.productCode)) continue;
    seen.add(row.productCode);
    rows.push([row.productCode]);
  }
  return rowsToCsv(["UPC"], rows);
};

// ─── Config ───────────────────────────────────────────────────────────────────

const ITEM_DIMS: DimDef[] = [
  { key: "sale_date",               label: "Date" },
  { key: "product_code",            label: "Product Code" },
  { key: "product_description",     label: "Description" },
];

const ITEM_METRICS: MetricDef[] = [
  { key: "net_sales_calc",  label: "Net Sales" },
  { key: "qty",             label: "Qty" },
  { key: "cogs_calc",       label: "COGS" },
  { key: "total_tax",       label: "Total Tax" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum",   label: "Sum" },
  { value: "avg",   label: "Avg" },
  { value: "min",   label: "Min" },
  { value: "max",   label: "Max" },
  { value: "count", label: "Count" },
];

const PREVIEW_ROWS = 5;

const SEV_CHIP: { sev: ItemSev; label: string; activeClass: string }[] = [
  { sev: "critical", label: "Critical", activeClass: "bg-red-600 border-red-600 text-custom-white" },
  { sev: "watch",    label: "Watch",    activeClass: "bg-amber-500 border-amber-500 text-custom-white" },
  { sev: "healthy",  label: "Healthy",  activeClass: "bg-emerald-600 border-emerald-600 text-custom-white" },
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
  hint,
}: {
  value: Set<ItemSev>;
  onToggle: (sev: ItemSev) => void;
  /** Shown when the dataset is selected but no severity is — that combination
   *  produces an empty section, and saying so beats a silently missing file. */
  hint?: boolean;
}) => (
  <>
    <div className="flex gap-1.5 flex-wrap">
      {SEV_CHIP.map(({ sev, label, activeClass }) => (
        <button
          key={sev}
          onClick={() => onToggle(sev)}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
            value.has(sev) ? activeClass : "bg-custom-white border-gray-200 text-content"
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

// ─── Component ────────────────────────────────────────────────────────────────

const MarginPerfExportModal = ({
  onClose,
  storeName,
  subDeptName,
  dateRange,
  tyMargins,
  lyMargins,
  threshold,
  subDepts,
  grades,
  gradingMetric,
  loadingGrades,
}: MarginPerfExportModalProps) => {

  // No default selections anywhere in this modal.
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<ItemSev>>(new Set());
  // Seeded to Critical because that is what this preset is for — the other two
  // are there to widen it, not to be chosen from scratch.
  const [deptSevs, setDeptSevs] = useState<Set<ItemSev>>(new Set(["critical"]));
  const [upcSevs, setUpcSevs] = useState<Set<ItemSev>>(new Set(["critical"]));
  /**
   * Which departments the two store-wide datasets cover. Empty means all — an
   * untouched filter must never silently empty an export.
   *
   * One selection shared by both, not one each: they emit the same item set and
   * differ only in how many columns survive, so two independent department
   * pickers would be two ways to describe one thing.
   */
  const [deptPick, setDeptPick] = useState<string[]>([]);
  const [source, setSource] = useState<CustomSource>("ty");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["net_sales_calc", { fn: "sum", enabled: false }],
      ["qty",            { fn: "sum", enabled: false }],
      ["cogs_calc",      { fn: "sum", enabled: false }],
      ["total_tax",      { fn: "sum", enabled: false }],
    ])
  );

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    setMetrics(new Map([
      ["net_sales_calc", { fn: "sum", enabled: false }],
      ["qty",            { fn: "sum", enabled: false }],
      ["cogs_calc",      { fn: "sum", enabled: false }],
      ["total_tax",      { fn: "sum", enabled: false }],
    ]));
  };

  const toggleGroupBy = (key: string) => {
    setGroupBy((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleMetric = (key: string) => {
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, enabled: !cur.enabled });
      return next;
    });
  };

  // Selecting a severity chip activates the "Items vs Last Year" preset (and
  // clearing them all back out deactivates it), so the two stay in sync.
  const toggleItemSev = (sev: ItemSev) =>
    setItemSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  // Same two-way tie as the Items vs Last Year chips: clearing every severity
  // is the same statement as unchecking the preset, so they move together.
  const toggleDeptSev = (sev: ItemSev) =>
    setDeptSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const toggleUpcSev = (sev: ItemSev) =>
    setUpcSevs((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });

  const gradedCount = subDepts.filter((s) => grades[s.id]).length;

  const setMetricFn = (key: string, fn: AggFn) => {
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, fn });
      return next;
    });
  };

  // Flatten margins into AggRow, computing derived fields
  const flatRows = useMemo<AggRow[]>(() => {
    const src = source === "ty" ? tyMargins : lyMargins;
    return src.map((m) => ({
      ...m,
      sale_date: m.sale_date.split("T")[0],
      net_sales_calc: netSales(m),
      cogs_calc: itemCogs(m),
    } as AggRow));
  }, [source, tyMargins, lyMargins]);

  const { aggRows, columns } = useMemo(() => {
    const activeDims = ITEM_DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = ITEM_METRICS
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const rows = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = rows.map((row) => {
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

    const cols: { key: string; label: string }[] = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({ key: `${m.fn}__${m.key}`, label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}` })),
    ];

    return { aggRows: display, columns: cols };
  }, [flatRows, groupBy, metrics]);

  const presetDatasets: { id: ExportPreset; label: string; description: string }[] = [
    { id: "items",  label: "Items Report",  description: "TY net sales, qty, COGS, and margin % aggregated by item" },
    { id: "cost",   label: "Cost Analysis", description: "Cost, net cost, case size, and COGS breakdown per item" },
    { id: "nocost", label: "No Cost Items", description: "Items flagged for missing cost data" },
  ];

  const safeName = (storeName + "_" + subDeptName).replace(/[^a-z0-9]/gi, "_");

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("items"))  sections.push(`Items Report\n${buildItemsCsv(tyMargins)}`);
    if (selected.has("cost"))   sections.push(`Cost Analysis\n${buildCostCsv(tyMargins)}`);
    if (selected.has("nocost")) sections.push(`No Cost Items\n${buildNoCostCsv(tyMargins)}`);
    if (selected.has("items_vs_ly") && itemSevs.size > 0) {
      sections.push(`Items vs Last Year\n${buildItemsVsLyCsv(tyMargins, lyMargins, threshold, itemSevs)}`);
    }
    // Narrowing the department list before the collector runs keeps the filter
    // out of the grading logic entirely — it decides scope, not severity.
    const pickedDepts =
      deptPick.length === 0
        ? subDepts
        : subDepts.filter((d) => deptPick.includes(String(d.id)));

    if (selected.has("all_depts") && deptSevs.size > 0) {
      const items = collectGradedItems(pickedDepts, grades, threshold, gradingMetric, deptSevs);
      sections.push(`Graded Items — All Departments\n${buildAllDeptsCsv(items, gradingMetric)}`);
    }
    if (selected.has("upc_list") && upcSevs.size > 0) {
      const items = collectGradedItems(pickedDepts, grades, threshold, gradingMetric, upcSevs);
      sections.push(`UPC List\n${buildUpcListCsv(items)}`);
    }
    if (!sections.length) return;
    // The store-wide presets aren't about the open department, so a file made
    // only of those shouldn't be named after it.
    const storeWide = new Set<ExportPreset>(["all_depts", "upc_list"]);
    const scopeName = [...selected].every((p) => storeWide.has(p))
      ? storeName.replace(/[^a-z0-9]/gi, "_")
      : safeName;
    downloadCsv(sections.join("\n\n"), `${scopeName}_${dateRange.replace(/\s/g, "")}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(rowsToCsv(headers, rows), `${safeName}_custom_${dateRange.replace(/\s/g, "")}.csv`);
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:sub-margins:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
        {/* Header */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
          <div>
            <p className="text-custom-white text-[13px] font-semibold">Export CSV</p>
            <p className="text-custom-white text-[10px] mt-0.5">{subDeptName} · {storeName}</p>
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
          <button onClick={onClose} className="text-custom-white/60 hover:text-custom-white transition-colors justify-self-end">
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* ── PRESETS MODE ── */}
        {mode === "presets" && (
          <>
            <div className="px-4 pt-4 pb-2 space-y-3">
              <p className="text-[11px] text-content uppercase tracking-wide font-medium">Select data to include</p>
              {presetDatasets.map(({ id, label, description }) => (
                <label key={id} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selected.has(id)}
                    onChange={() => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                    className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                  />
                  <div>
                    <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">{label}</p>
                    <p className="text-[11px] text-content mt-0.5">{description}</p>
                  </div>
                </label>
              ))}

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has("items_vs_ly")}
                  onChange={() => {
                    const checking = !selected.has("items_vs_ly");
                    // Seeds only when nothing is chosen, and never clears on
                    // uncheck — a severity the user picked survives them
                    // toggling the dataset off and back on.
                    if (checking && itemSevs.size === 0) setItemSevs(new Set(["critical", "watch", "healthy"]));
                    setSelected((prev) => { const n = new Set(prev); checking ? n.add("items_vs_ly") : n.delete("items_vs_ly"); return n; });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">Items vs Last Year</p>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">Side-by-side TY vs LY per item with margin pts Δ</p>
                  <SevChips
                    value={itemSevs}
                    onToggle={toggleItemSev}
                    hint={selected.has("items_vs_ly") && itemSevs.size === 0}
                  />
                </div>
              </div>

              {/* Scope for both store-wide datasets below. Sits above them
                  rather than inside either, because it governs the pair. */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <span className="text-[11px] text-content">Departments</span>
                <MultiSelectFilter
                  options={subDepts.map((d) => ({
                    label: d.desc,
                    value: String(d.id),
                  }))}
                  values={deptPick}
                  onChange={setDeptPick}
                  placeholder="All departments"
                  noun="departments"
                  className="w-[220px]"
                />
                <span className="text-[10px] text-content">
                  Applies to both datasets below.
                </span>
              </div>

              {/* The only presets that aren't scoped to the open department.
                  Cost nothing extra — grading already holds every department's
                  item rows. */}
              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={selected.has("all_depts")}
                  onChange={() => {
                    const checking = !selected.has("all_depts");
                    // Seeds only when nothing is chosen, and never clears on
                    // uncheck — a severity the user picked survives them
                    // toggling the dataset off and back on.
                    if (checking && deptSevs.size === 0) setDeptSevs(new Set(["critical"]));
                    setSelected((prev) => { const n = new Set(prev); checking ? n.add("all_depts") : n.delete("all_depts"); return n; });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">Graded Items — All Departments</p>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">
                    Every graded UPC in the store, tagged with its department and
                    severity. Graded on {METRIC_LABEL[gradingMetric]} at a{" "}
                    {threshold} threshold — the same as the items list.
                  </p>
                  <SevChips
                    value={deptSevs}
                    onToggle={toggleDeptSev}
                    hint={selected.has("all_depts") && deptSevs.size === 0}
                  />
                  {/* Departments grade in one at a time, so an export taken
                      early would silently be a partial store. */}
                  <p className="text-[10px] text-content mt-1.5">
                    {loadingGrades
                      ? `Still grading — ${gradedCount} of ${subDepts.length} departments ready`
                      : `${gradedCount} of ${subDepts.length} departments`}
                  </p>
                </div>
              </div>

              {/* The same item set with every column but the UPC dropped —
                  a list to feed another page, not a report to read. Its own
                  severities, so it doesn't have to ride along with the full
                  export to be taken. */}
              <div className="flex items-start gap-3 pt-3 border-t border-gray-100">
                <input
                  type="checkbox"
                  checked={selected.has("upc_list")}
                  onChange={() => {
                    const checking = !selected.has("upc_list");
                    // Seeds only when nothing is chosen, and never clears on
                    // uncheck — a severity the user picked survives them
                    // toggling the dataset off and back on.
                    if (checking && upcSevs.size === 0) setUpcSevs(new Set(["critical"]));
                    setSelected((prev) => { const n = new Set(prev); checking ? n.add("upc_list") : n.delete("upc_list"); return n; });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-content">UPC List</p>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">
                    Just the UPCs from every department, one per row, ready to
                    load into another page.
                  </p>
                  <SevChips
                    value={upcSevs}
                    onToggle={toggleUpcSev}
                    hint={selected.has("upc_list") && upcSevs.size === 0}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
              <button onClick={onClose} className="text-[12px] text-content transition-colors">Cancel</button>
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

        {/* ── CUSTOM MODE ── */}
        {mode === "custom" && (
          <>
            <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
              {/* Left: config */}
              <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Data Source</p>
                  <div className="flex flex-col gap-1.5">
                    {(["ty", "ly"] as CustomSource[]).map((s) => (
                      <label key={s} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={source === s}
                          onChange={() => switchSource(s)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5"
                        />
                        <span className="text-[12px] text-content">{s === "ty" ? "This Year" : "Last Year"}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Group By</p>
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">Metrics</p>
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
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right: preview */}
              <div className="flex flex-col min-w-0">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                  <p className="text-[11px] font-semibold text-content uppercase tracking-wide">Preview</p>
                  <span className="text-[10px] text-content">
                    {aggRows.length === 0
                      ? "No data — select at least one group or metric"
                      : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                  </span>
                </div>

                {columns.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-6 text-center">
                    <p className="text-[12px] text-content leading-relaxed">
                      Select at least one group-by dimension<br />or metric to see a preview.
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto thin-scrollbar">
                    <table className="min-w-full text-[11px] border-collapse">
                      <thead className="sticky top-0 bg-gray-50 z-10">
                        <tr>
                          {columns.map((c) => (
                            <th key={c.key} className="text-left px-3 py-2 text-content font-semibold border-b border-gray-100 whitespace-nowrap">
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"}>
                            {columns.map((c) => (
                              <td key={c.key} className="px-3 py-1.5 text-content whitespace-nowrap border-b border-gray-50">
                                {row[c.key] ?? "—"}
                              </td>
                            ))}
                          </tr>
                        ))}
                        {aggRows.length > PREVIEW_ROWS && (
                          <tr>
                            <td colSpan={columns.length} className="px-3 py-2 text-[10px] text-content">
                              + {aggRows.length - PREVIEW_ROWS} more rows in download…
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={onClose} className="text-[12px] text-content transition-colors">Cancel</button>
              <button
                onClick={handleCustomDownload}
                disabled={!canCustomDownload}
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

export default MarginPerfExportModal;
