// Hooks
import { useState, useMemo } from "react";

// Utils
import {
  fmtNum,
  aggregateRows,
  type AggFn,
  type AggRow,
} from "../../../../../../utils/csvExport";
import { DIMS, METRICS } from "../../../utils";

// Interfaces
import type { MetricSelection } from "../../../interfaces";
import type { CouponItem } from "../../../../../../interfaces";

/**
 * The export's choices and what they make: the stores ticked (multi-store
 * data only), the group-by fields and metrics, the rows they cover and the
 * Custom rows and columns. Nothing is picked to start with.
 */
export const useCouponExport = (rows: CouponItem[]) => {
  // No default selections
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["coupon_amount", { fn: "sum", enabled: false }],
      ["qty", { fn: "sum", enabled: false }],
    ]),
  );

  // Unique stores derived from rows
  const uniqueStores = useMemo(() => {
    const map = new Map<string, { name: string; number: string }>();
    rows.forEach((r) => {
      if (!map.has(r.store_number))
        map.set(r.store_number, {
          name: r.store_name ?? r.store_number,
          number: r.store_number,
        });
    });
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [rows]);

  const isMultiStore = uniqueStores.length > 1;

  // Selected stores — no default selections
  const [selectedStores, setSelectedStores] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleStore = (num: string) =>
    setSelectedStores((prev) => {
      const n = new Set(prev);
      n.has(num) ? n.delete(num) : n.add(num);
      return n;
    });

  // Rows filtered by selected stores
  const filteredRows = useMemo(
    () =>
      isMultiStore
        ? rows.filter((r) => selectedStores.has(r.store_number))
        : rows,
    [rows, selectedStores, isMultiStore],
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

  const flatRows = useMemo<AggRow[]>(
    () => filteredRows.map((r) => ({ ...r }) as unknown as AggRow),
    [filteredRows],
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

  return {
    uniqueStores,
    isMultiStore,
    selectedStores,
    setSelectedStores,
    toggleStore,
    filteredRows,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  };
};
