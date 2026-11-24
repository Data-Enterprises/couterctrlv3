// Hooks
import { useMemo, useState } from "react";

// Utils
import { aggregateRows, type AggFn } from "../../../../../utils/csvExport";
import { DIMS, METRICS, toAggRows } from "../../utils";

// Interfaces
import type { TransactionListItem } from "../../../../../interfaces";

/**
 * The Custom export's choices: the group-by dimensions, each metric's on/off
 * and function, and the aggregated rows and columns they make from the
 * exception lines.
 */
export const useCustomExport = (exceptionRows: TransactionListItem[]) => {
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set(["store"]));
  const [metrics, setMetrics] = useState<
    Map<string, { fn: AggFn; enabled: boolean }>
  >(
    () =>
      new Map(
        METRICS.map((m) => [
          m.key,
          {
            fn: m.key === "lines" ? "count" : "sum",
            enabled: m.key !== "lineNumber",
          },
        ]),
      ),
  );

  const toggleGroupBy = (key: string) =>
    setGroupBy((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
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

  const aggRows = useMemo(() => {
    const dims = [...groupBy];
    const mets = METRICS.filter((m) => metrics.get(m.key)?.enabled).map(
      (m) => ({
        key: m.key,
        fn: metrics.get(m.key)!.fn,
      }),
    );
    if (!dims.length && !mets.length) return [];
    return aggregateRows(toAggRows(exceptionRows), dims, mets);
  }, [exceptionRows, groupBy, metrics]);

  const columns = useMemo(() => {
    const cols: { key: string; label: string }[] = [];
    for (const d of DIMS)
      if (groupBy.has(d.key)) cols.push({ key: d.key, label: d.label });
    for (const m of METRICS) {
      const sel = metrics.get(m.key)!;
      if (sel.enabled)
        cols.push({
          key: `${sel.fn}__${m.key}`,
          label: `${sel.fn.toUpperCase()} ${m.label}`,
        });
    }
    return cols;
  }, [groupBy, metrics]);

  return {
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  };
};
