// Hooks
import { useMemo, useState } from "react";

// Utils
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
  type AggFn,
  type AggRow,
} from "../../../../../utils/csvExport";
import { isoOf } from "../../../../../utils/grading";
import { fmtDayLabel } from "../../../../../utils/dateLabels";
import { collectGradedItems } from "../../utils/vendorGradedItems";
import {
  netSales,
  itemCogs,
  buildVendorsCsv,
  buildItemsCsv,
  buildItemsGradedCsv,
  buildAllVendorsCsv,
  buildUpcListCsv,
  narrowToDays,
  ITEM_DIMS,
  ITEM_METRICS,
  freshMetrics,
  fmtDate,
} from "../utils";

// Interfaces
import type { ItemGradingMetric } from "../../../../../utils/itemMargins";
import type { GradedSev } from "../../interfaces";
import type {
  CustomSource,
  ExportPreset,
  ModalMode,
  VendorExportProps,
} from "../interfaces";

/**
 * Everything the Vendors export modal holds: its mode and days, the presets
 * and each graded dataset's severities, the vendor filter for the store-wide
 * pair, the custom group-bys and metrics, the preview, and the two downloads.
 */
export const useVendorExport = ({
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
}: VendorExportProps) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportPreset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<GradedSev>>(new Set());
  const [allSevs, setAllSevs] = useState<Set<GradedSev>>(new Set());
  const [upcSevs, setUpcSevs] = useState<Set<GradedSev>>(new Set());
  /**
   * Which vendors the two store-wide datasets cover. Empty means all — an
   * untouched filter must never silently empty an export.
   *
   * One selection shared by both, not one each: they emit the same item set and
   * differ only in how many columns survive.
   */
  const [vendorPick, setVendorPick] = useState<string[]>([]);
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
    // Narrowing the vendor list before the collector runs keeps the filter out
    // of the grading logic entirely — it decides scope, not severity.
    const pickedVendors =
      vendorPick.length === 0
        ? rows
        : rows.filter((v) => vendorPick.includes(v.vendorId));

    if (selected.has("all_vendors") && allSevs.size > 0)
      sections.push(
        `${title("Items Graded — All Vendors")}\n${buildAllVendorsCsv(
          collectGradedItems(
            pickedVendors,
            scopedAll,
            itemThreshold,
            gradingMetric,
            allSevs,
          ),
        )}`,
      );
    // No section title on this one. It is the only preset written to be read
    // back in - by UPC List, Item Actions and Forecasting - and its single
    // `UPC` column header already names it. A title above that header is a
    // second header: the paste box drops it (digits only), but a spreadsheet
    // shows two heading rows and the file stops looking like a list of UPCs.
    if (selected.has("upc_list") && upcSevs.size > 0)
      sections.push(
        buildUpcListCsv(
          collectGradedItems(
            pickedVendors,
            scopedAll,
            itemThreshold,
            gradingMetric,
            upcSevs,
          ),
        ),
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


  const togglePreset = (id: ExportPreset) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  // A graded dataset's checkbox. Seeds its severities only when none are
  // chosen, and never clears them on uncheck, so a severity the user picked
  // survives toggling the dataset off and back on.
  const toggleGraded = (
    id: ExportPreset,
    sevs: Set<GradedSev>,
    setSevs: (s: Set<GradedSev>) => void,
    seed: GradedSev[],
  ) => {
    const checking = !selected.has(id);
    if (checking && sevs.size === 0) setSevs(new Set(seed));
    setSelected((prev) => {
      const n = new Set(prev);
      if (checking) n.add(id);
      else n.delete(id);
      return n;
    });
  };
  const ALL: GradedSev[] = ["critical", "watch", "healthy"];
  const toggleItemsGraded = () => toggleGraded("items_graded", itemSevs, setItemSevs, ALL);
  const toggleAllVendors = () => toggleGraded("all_vendors", allSevs, setAllSevs, ALL);
  const toggleUpcList = () => toggleGraded("upc_list", upcSevs, setUpcSevs, ["critical"]);

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    setMetrics(freshMetrics());
  };

  return {
    mode,
    setMode,
    selected,
    togglePreset,
    itemSevs,
    allSevs,
    upcSevs,
    toggleItemSev,
    toggleAllSev,
    toggleUpcSev,
    toggleItemsGraded,
    toggleAllVendors,
    toggleUpcList,
    vendorPick,
    setVendorPick,
    source,
    switchSource,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    exportDays,
    setExportDays,
    toggleDay,
    scopeNote,
    hasItems,
    hasAllItems,
    gradingMetric,
    presetDatasets,
    aggRows,
    columns,
    handlePresetDownload,
    handleCustomDownload,
  };
};
