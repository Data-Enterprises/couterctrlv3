// Hooks
import { useMemo, useState } from "react";

// Utils
import { fmtNum, rowsToCsv, downloadCsv, aggregateRows } from "../../../../../utils/csvExport";
import { fmtDayLabel } from "../../../../../utils/dateLabels";
import { shiftIso, LW_OFFSET, LY_OFFSET } from "../../utils";
import {
  netSales,
  itemCogs,
  buildCategoriesCsv,
  buildItemsCsv,
  buildItemsGradedCsv,
  buildHoursCsv,
  ITEM_DIMS,
  ITEM_METRICS,
  freshMetrics,
  fmtDate,
} from "../utils";

// Interfaces
import type { AggFn, AggRow } from "../../../../../utils/csvExport";
import type { ItemGradingMetric } from "../../../../../utils/itemMargins";
import type {
  CategoryExportProps,
  CustomSource,
  ExportPreset,
  GradedSev,
  ModalMode,
} from "../interfaces";

/**
 * Everything the Categories export modal holds: its mode, the days it covers,
 * the presets and severities picked, the custom group-bys and metrics, the
 * preview rows, and the two downloads.
 */
export const useCategoryExport = ({
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
}: CategoryExportProps) => {
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

  const togglePreset = (id: ExportPreset) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // Ticking graded items with no chips picked picks all three; unticking it
  // clears them, so the checkbox and the chips agree.
  const toggleGradedItems = () => {
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
  };

  return {
    mode,
    setMode,
    exportDays,
    setExportDays,
    toggleDay,
    scopeNote,
    presetDatasets,
    selected,
    togglePreset,
    toggleGradedItems,
    itemSevs,
    toggleItemSev,
    hasItems,
    gradingMetric,
    source,
    switchSource,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
    handlePresetDownload,
    handleCustomDownload,
  };
};
