// Hooks
import { useState, useMemo } from "react";

// Utils
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
  type AggFn,
  type AggRow,
} from "../../../../../utils/csvExport";
import { collectGradedItems, type ItemSev } from "../../utils/gradedItems";
import {
  fmtDate,
  netSales,
  itemCogs,
  buildItemsCsv,
  buildItemsVsLyCsv,
  buildCostCsv,
  buildNoCostCsv,
  buildAllDeptsCsv,
  buildUpcListCsv,
  ITEM_DIMS,
  ITEM_METRICS,
} from "../utils";

// Interfaces
import type {
  CustomSource,
  ExportPreset,
  MarginPerfExportModalProps,
  MetricSelection,
  ModalMode,
} from "../interfaces";

/**
 * The export pop-up's state: the presets and their severity picks, the custom
 * builder (source, departments, group-by, metrics, aggregated for the
 * preview), and both downloads. Nothing is selected to begin with.
 */
export const useMarginPerfExport = ({
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
      ["qty", { fn: "sum", enabled: false }],
      ["cogs_calc", { fn: "sum", enabled: false }],
      ["total_tax", { fn: "sum", enabled: false }],
    ]),
  );

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    setMetrics(
      new Map([
        ["net_sales_calc", { fn: "sum", enabled: false }],
        ["qty", { fn: "sum", enabled: false }],
        ["cogs_calc", { fn: "sum", enabled: false }],
        ["total_tax", { fn: "sum", enabled: false }],
      ]),
    );
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

  const gradedCount = subDepts.filter((s) => grades[s.key]).length;

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
    return src.map(
      (m) =>
        ({
          ...m,
          sale_date: m.sale_date.split("T")[0],
          net_sales_calc: netSales(m),
          cogs_calc: itemCogs(m),
        }) as AggRow,
    );
  }, [source, tyMargins, lyMargins]);

  const { aggRows, columns } = useMemo(() => {
    const activeDims = ITEM_DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = ITEM_METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
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

    const cols: { key: string; label: string }[] = [
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
  }[] = [
    {
      id: "items",
      label: "Items Report",
      description: "TY net sales, qty, COGS, and margin % aggregated by item",
    },
    {
      id: "cost",
      label: "Cost Analysis",
      description: "Cost, net cost, case size, and COGS breakdown per item",
    },
    {
      id: "nocost",
      label: "No Cost Items",
      description: "Items flagged for missing cost data",
    },
  ];

  const safeName = (storeName + "_" + subDeptName).replace(/[^a-z0-9]/gi, "_");

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("items"))
      sections.push(`Items Report\n${buildItemsCsv(tyMargins)}`);
    if (selected.has("cost"))
      sections.push(`Cost Analysis\n${buildCostCsv(tyMargins)}`);
    if (selected.has("nocost"))
      sections.push(`No Cost Items\n${buildNoCostCsv(tyMargins)}`);
    if (selected.has("items_vs_ly") && itemSevs.size > 0) {
      sections.push(
        `Items vs Last Year\n${buildItemsVsLyCsv(tyMargins, lyMargins, threshold, itemSevs)}`,
      );
    }
    // Narrowing the department list before the collector runs keeps the filter
    // out of the grading logic entirely — it decides scope, not severity.
    const pickedDepts =
      deptPick.length === 0
        ? subDepts
        : subDepts.filter((d) => deptPick.includes(d.key));

    if (selected.has("all_depts") && deptSevs.size > 0) {
      const items = collectGradedItems(
        pickedDepts,
        grades,
        threshold,
        gradingMetric,
        deptSevs,
      );
      sections.push(
        `Graded Items — All Departments\n${buildAllDeptsCsv(items, gradingMetric)}`,
      );
    }
    if (selected.has("upc_list") && upcSevs.size > 0) {
      const items = collectGradedItems(
        pickedDepts,
        grades,
        threshold,
        gradingMetric,
        upcSevs,
      );
      // No section title on this one. It is the only preset written to be read
      // back in - by UPC List, Item Actions and Forecasting - and its single
      // `UPC` column header already names it. A title above that header is a
      // second header: the paste box drops it (digits only), but a spreadsheet
      // shows two heading rows and the file stops looking like a list of UPCs.
      sections.push(buildUpcListCsv(items));
    }
    if (!sections.length) return;
    // The store-wide presets aren't about the open department, so a file made
    // only of those shouldn't be named after it.
    const storeWide = new Set<ExportPreset>(["all_depts", "upc_list"]);
    const scopeName = [...selected].every((p) => storeWide.has(p))
      ? storeName.replace(/[^a-z0-9]/gi, "_")
      : safeName;
    downloadCsv(
      sections.join("\n\n"),
      `${scopeName}_${dateRange.replace(/\s/g, "")}.csv`,
    );
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_custom_${dateRange.replace(/\s/g, "")}.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return {
    switchSource,
    toggleGroupBy,
    toggleMetric,
    toggleItemSev,
    toggleDeptSev,
    toggleUpcSev,
    gradedCount,
    setMetricFn,
    presetDatasets,
    handlePresetDownload,
    handleCustomDownload,
    canCustomDownload,
    mode,
    setMode,
    selected,
    setSelected,
    itemSevs,
    setItemSevs,
    deptSevs,
    setDeptSevs,
    upcSevs,
    setUpcSevs,
    deptPick,
    setDeptPick,
    source,
    groupBy,
    metrics,
    aggRows,
    columns,
  };
};
