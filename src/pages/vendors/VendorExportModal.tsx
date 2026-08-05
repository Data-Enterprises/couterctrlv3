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
import { getVendorTier } from "./vendorsUtils";

/**
 * CSV export for Vendors.
 *
 * Same shell and the same Presets/Custom split as the other export modals.
 * Scope differs by preset: the vendor list covers every vendor, while items and
 * departments cover the open one — which is all the panel has loaded per
 * selection.
 */

type ExportPreset = "vendors" | "items" | "items_graded" | "depts";
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
  const isQty = metric === "qty";
  const headers = [
    "Vendor ID",
    "Vendor",
    "Grade",
    "Items",
    "Sub depts",
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
      const sel = r.days.filter((d) => days.has(d.date));
      if (sel.length === 0) continue;
      tw = sel.reduce((s, d) => s + (isQty ? d.twQty : d.twNet), 0);
      // Still day-matched over a subset: a day only joins a comparison when
      // both sides have it, and it joins both sides or neither.
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
    const grade = wholeWeek
      ? TIER_LABEL[getVendorTier(r, threshold, metric)]
      : TIER_LABEL[tierOfDelta(lyPct ?? lwPct, threshold)];

    out.push([
      r.vendorId,
      r.vendorName,
      grade ?? "",
      r.itemCount,
      r.subDeptCount,
      fmtNum(tw),
      lw === null ? "" : fmtNum(lw),
      lwPct === null ? "" : fmtNum(lwPct),
      ly === null ? "" : fmtNum(ly),
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

/** Which departments the open vendor reaches, and how each moved. */
const buildDeptsCsv = (
  items: { tw: SubDeptMargin[]; lw: SubDeptMargin[]; ly: SubDeptMargin[] },
  metric: VendorMetric,
) => {
  const isQty = metric === "qty";
  const headers = [
    "Sub department",
    isQty ? "TY Qty" : "TY Net Sales",
    isQty ? "LW Qty" : "LW Net Sales",
    "vs LW %",
    isQty ? "LY Qty" : "LY Net Sales",
    "vs LY %",
  ];
  const agg = (src: SubDeptMargin[]) => {
    const m = new Map<number, { desc: string; v: number }>();
    for (const r of src) {
      const cur = m.get(r.sub_department) ?? {
        desc: r.sub_department_description,
        v: 0,
      };
      cur.v += isQty ? r.qty : netSales(r);
      m.set(r.sub_department, cur);
    }
    return m;
  };
  const tw = agg(items.tw), lw = agg(items.lw), ly = agg(items.ly);
  const out = [...tw.entries()].map(([id, t]) => {
    const l = lw.get(id), y = ly.get(id);
    const lwPct = !l || l.v === 0 ? null : pctChange(t.v, l.v);
    const lyPct = !y || y.v === 0 ? null : pctChange(t.v, y.v);
    return [
      t.desc || `Sub dept ${id}`,
      fmtNum(t.v),
      l ? fmtNum(l.v) : "",
      lwPct === null ? "" : fmtNum(lwPct),
      y ? fmtNum(y.v) : "",
      lyPct === null ? "" : fmtNum(lyPct),
    ];
  });
  return rowsToCsv(headers, out);
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

/* ── component ───────────────────────────────────────────────────────────── */

const VendorExportModal = ({
  onClose,
  storeName,
  vendorName,
  dateRange,
  rows,
  vendorRaw,
  metric,
  threshold,
  itemThreshold,
  weekDates,
  selectedDay,
}: Props) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<GradedSev>>(new Set());
  const [source, setSource] = useState<CustomSource>("tw");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState(freshMetrics);
  const [exportDays, setExportDays] = useState<Set<string>>(
    () => new Set(selectedDay ? [selectedDay] : []),
  );

  const gradingMetric: ItemGradingMetric = metric === "qty" ? "qty" : "sales";

  /** Items narrowed to the chosen days — TW to those dates, LW/LY to the same
   *  dates shifted, exactly as the Items tab narrows them. */
  const scoped = useMemo(() => {
    if (exportDays.size === 0) return vendorRaw;
    const tw = exportDays;
    const lw = new Set([...exportDays].map((d) => shiftIso(d, LW_OFFSET)));
    const ly = new Set([...exportDays].map((d) => shiftIso(d, LY_OFFSET)));
    const on = (src: SubDeptMargin[], keep: Set<string>) =>
      src.filter((r) => keep.has(isoOf(r.sale_date)));
    return {
      tw: on(vendorRaw.tw, tw),
      lw: on(vendorRaw.lw, lw),
      ly: on(vendorRaw.ly, ly),
    };
  }, [exportDays, vendorRaw]);

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
    {
      id: "depts",
      label: "Sub departments",
      description: hasItems
        ? `Which departments ${vendorName} reaches, and how each moved`
        : "Nothing from this vendor in the selected days",
      disabled: !hasItems,
    },
  ];

  const SEV_CHIP: { sev: GradedSev; label: string; activeClass: string }[] = [
    { sev: "critical", label: "Critical", activeClass: "bg-red-600 border-red-600 text-custom-white" },
    { sev: "watch", label: "Watch", activeClass: "bg-amber-500 border-amber-500 text-custom-white" },
    { sev: "healthy", label: "Healthy", activeClass: "bg-emerald-600 border-emerald-600 text-custom-white" },
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
    if (selected.has("depts"))
      sections.push(`${title("Sub departments")}\n${buildDeptsCsv(scoped, metric)}`);
    if (!sections.length) return;
    downloadCsv(sections.join("\n\n"), `${safeName}_${fileDate}.csv`);
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
      storageKey="export-modal:vendors"
      defaultWidth={760}
      defaultHeight={640}
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
                    : "Nothing from this vendor in the selected days"}
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
