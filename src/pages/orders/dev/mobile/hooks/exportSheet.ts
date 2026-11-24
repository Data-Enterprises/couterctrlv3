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
import { buildOrdersCsv, DIMS, METRICS } from "../utils";

// Interfaces
import type { AllOrder } from "../../../../../interfaces";
import type { SelectedOrder } from "../../../../../features/dev/devOrdersSlice";
import type { ModalMode, ExportDataset, MetricSelection } from "../interfaces";

interface OrdersExportSheetInput {
  onClose: () => void;
  storeNames: string[];
  orderType: string;
  dateLabel: string;
  allOrders: AllOrder[];
  selectedOrderItems: AllOrder[];
  selectedOrder: SelectedOrder;
}

/**
 * The phone export sheet's state: the presets (all orders, the selected order,
 * chosen sub departments) and the custom builder (sub departments, group-by
 * and metrics), and both downloads.
 */
export const useOrdersExportSheet = ({
  onClose,
  storeNames,
  orderType,
  dateLabel,
  allOrders,
  selectedOrderItems,
  selectedOrder,
}: OrdersExportSheetInput) => {
  const isMultiStore = storeNames.length > 1;
  const storeLabel = isMultiStore
    ? `${storeNames.length} stores`
    : (storeNames[0] ?? "");

  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(() => new Set());

  const uniqueSubDepts = useMemo(() => {
    const map = new Map<string, { id: string; count: number }>();
    allOrders.forEach((o) => {
      const key = o.sub_department_description ?? "null";
      const existing = map.get(key);
      if (existing) existing.count += 1;
      else map.set(key, { id: key, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [allOrders]);

  const isMultiSubDept = uniqueSubDepts.length > 1;

  const [customSubDepts, setCustomSubDepts] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleCustomSubDept = (id: string) =>
    setCustomSubDepts((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const allSubDeptsSelected = customSubDepts.size === uniqueSubDepts.length;
  const noSubDeptsSelected = customSubDepts.size === 0;

  const customFilteredOrders = useMemo(
    () =>
      allOrders.filter(
        (o) =>
          !isMultiSubDept ||
          customSubDepts.has(o.sub_department_description ?? "null"),
      ),
    [allOrders, customSubDepts, isMultiSubDept],
  );

  const [presetSubDepts, setPresetSubDepts] = useState<Set<string>>(
    () => new Set(),
  );

  const applyPresetSubDepts = (next: Set<string>) => {
    setPresetSubDepts(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("subDepts");
      else n.delete("subDepts");
      return n;
    });
  };

  const togglePresetSubDept = (id: string) => {
    const next = new Set(presetSubDepts);
    next.has(id) ? next.delete(id) : next.add(id);
    applyPresetSubDepts(next);
  };

  const allPresetSubDeptsSelected =
    presetSubDepts.size === uniqueSubDepts.length;
  const noPresetSubDeptsSelected = presetSubDepts.size === 0;

  const presetSubDeptFilteredOrders = useMemo(
    () =>
      allOrders.filter((o) =>
        presetSubDepts.has(o.sub_department_description ?? "null"),
      ),
    [allOrders, presetSubDepts],
  );

  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["qty", { fn: "sum", enabled: false }],
      ["e_ret", { fn: "sum", enabled: false }],
      ["cogs", { fn: "sum", enabled: false }],
      ["rev", { fn: "sum", enabled: false }],
      ["active_retail_price", { fn: "avg", enabled: false }],
      ["net_cost", { fn: "sum", enabled: false }],
      ["profit", { fn: "sum", enabled: false }],
      ["margin", { fn: "avg", enabled: false }],
      ["weight", { fn: "sum", enabled: false }],
    ]),
  );

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, enabled: !c.enabled });
      return n;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const n = new Map(prev);
      const c = n.get(key)!;
      n.set(key, { ...c, fn });
      return n;
    });

  // Profit/Margin/Edited aren't raw AllOrder fields, so they're computed
  // here before aggregation — mirrors desktop's OrdersExportModal.tsx.
  const flatRows = useMemo<AggRow[]>(
    () =>
      customFilteredOrders.map((o) => {
        const profit = o.e_ret - o.cogs;
        const margin = o.e_ret > 0 ? (profit / o.e_ret) * 100 : 0;
        return {
          ...o,
          profit,
          margin,
          edited_label: o.edited ? "Yes" : "No",
        } as unknown as AggRow;
      }),
    [customFilteredOrders],
  );

  const { aggRows, columns } = useMemo(() => {
    const activeDims = DIMS.filter((d) => groupBy.has(d.key));
    const activeMetrics = METRICS.map((m) => ({
      ...m,
      sel: metrics.get(m.key),
    }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const agg = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = agg.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) out[d.key] = String(row[d.key] ?? "");
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

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("all"))
      sections.push(
        buildOrdersCsv(
          allOrders,
          `All Orders — ${storeLabel} ${orderType} ${dateLabel}`,
        ),
      );
    if (selected.has("selected") && selectedOrderItems.length)
      sections.push(
        buildOrdersCsv(selectedOrderItems, `Order #${selectedOrder?.orderId}`),
      );
    if (selected.has("subDepts") && presetSubDeptFilteredOrders.length) {
      sections.push(
        buildOrdersCsv(
          presetSubDeptFilteredOrders,
          `By Sub Depts (${presetSubDepts.size} of ${uniqueSubDepts.length}) — ${storeLabel} ${orderType} ${dateLabel}`,
        ),
      );
    }
    if (!sections.length) return;
    const safeName = (
      isMultiStore ? orderType : `${storeLabel}_${orderType}`
    ).replace(/[^a-z0-9]/gi, "_");
    const safeDateLabel = dateLabel.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${safeDateLabel}.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = (
      isMultiStore ? orderType : `${storeLabel}_${orderType}`
    ).replace(/[^a-z0-9]/gi, "_");
    const safeDateLabel = dateLabel.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_custom_${safeDateLabel}.csv`,
    );
    onClose();
  };

  const hasSelected = selectedOrder !== null && selectedOrderItems.length > 0;
  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return {
    storeLabel,
    mode,
    setMode,
    selected,
    setSelected,
    uniqueSubDepts,
    isMultiSubDept,
    customSubDepts,
    setCustomSubDepts,
    toggleCustomSubDept,
    allSubDeptsSelected,
    noSubDeptsSelected,
    customFilteredOrders,
    presetSubDepts,
    setPresetSubDepts,
    applyPresetSubDepts,
    togglePresetSubDept,
    allPresetSubDeptsSelected,
    noPresetSubDeptsSelected,
    presetSubDeptFilteredOrders,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    handlePresetDownload,
    handleCustomDownload,
    hasSelected,
    canCustomDownload,
  };
};
