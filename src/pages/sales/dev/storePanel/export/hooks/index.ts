import { useState, useMemo } from "react";
import type { SubSale, HourlySale } from "../../../../../../interfaces";
import { fmtNum, aggregateRows } from "../../../../../../utils/csvExport";
import type { AggFn, AggRow } from "../../../../../../utils/csvExport";
import {
  fmtDate,
  fmtHour,
  SUBDEPT_DIMS,
  SUBDEPT_METRICS,
  HOURLY_DIMS,
  HOURLY_METRICS,
} from "../utils/index";
import type { CustomSource, MetricSelection } from "../types/index";

interface CustomExportRows {
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
}

/** The Custom mode builder: its picks, and the rows they aggregate to. */
export const useCustomExport = ({
  rawSubs,
  rawLWSubs,
  rawLYSubs,
  rawHourly,
  rawLWHourly,
  rawLYHourly,
}: CustomExportRows) => {
  // ── Custom builder state — no default selections ──
  const [source, setSource] = useState<CustomSource>("subdept");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["net_sales", { fn: "sum", enabled: false }],
      ["qty", { fn: "sum", enabled: false }],
      ["transaction_count", { fn: "sum", enabled: false }],
      ["total_tax", { fn: "sum", enabled: false }],
    ]),
  );

  const dims = source === "subdept" ? SUBDEPT_DIMS : HOURLY_DIMS;
  const mDefs = source === "subdept" ? SUBDEPT_METRICS : HOURLY_METRICS;

  // Switch source → reset groupBy & metrics (no default selections)
  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    if (s === "subdept") {
      setMetrics(
        new Map([
          ["net_sales", { fn: "sum", enabled: false }],
          ["qty", { fn: "sum", enabled: false }],
          ["transaction_count", { fn: "sum", enabled: false }],
          ["total_tax", { fn: "sum", enabled: false }],
        ]),
      );
    } else {
      setMetrics(
        new Map([
          ["net_sales", { fn: "sum", enabled: false }],
          ["qty", { fn: "sum", enabled: false }],
          ["transactions", { fn: "sum", enabled: false }],
          ["basket_size_sales", { fn: "avg", enabled: false }],
          ["avg_item_price", { fn: "avg", enabled: false }],
        ]),
      );
    }
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

  const setMetricFn = (key: string, fn: AggFn) => {
    setMetrics((prev) => {
      const next = new Map(prev);
      const cur = next.get(key)!;
      next.set(key, { ...cur, fn });
      return next;
    });
  };

  // ── Build flat rows for aggregation ──
  const flatRows = useMemo<AggRow[]>(() => {
    const tagPeriod = (
      rows: (SubSale | HourlySale)[],
      period: string,
    ): AggRow[] => rows.map((r) => ({ ...r, period }) as AggRow);

    if (source === "subdept") {
      return [
        ...tagPeriod(rawSubs, "This Year"),
        ...tagPeriod(rawLWSubs, "Last Week"),
        ...tagPeriod(rawLYSubs, "Last Year"),
      ];
    }
    return [
      ...tagPeriod(rawHourly, "This Year"),
      ...tagPeriod(rawLWHourly, "Last Week"),
      ...tagPeriod(rawLYHourly, "Last Year"),
    ];
  }, [
    source,
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
  ]);

  // ── Aggregated result ──
  const { aggRows, columns } = useMemo(() => {
    const activeDims = dims.filter((d) => groupBy.has(d.key));
    const activeMetrics = mDefs
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const aggRows = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    // Format display values
    const display = aggRows.map((row) => {
      const out: Record<string, string> = {};
      for (const d of activeDims) {
        const raw = row[d.key];
        if (d.key === "sale_date")
          out[d.key] = fmtDate(String(raw).split("T")[0]);
        else if (d.key === "hour") out[d.key] = fmtHour(Number(raw));
        else out[d.key] = String(raw ?? "");
      }
      for (const m of activeMetrics) {
        const colKey = `${m.fn}__${m.key}`;
        const val = Number(row[colKey]);
        out[colKey] = m.fn === "count" ? String(Math.round(val)) : fmtNum(val);
      }
      return out;
    });

    const columns: { key: string; label: string }[] = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
    ];

    return { aggRows: display, columns };
  }, [flatRows, groupBy, metrics, dims, mDefs]);

  return {
    source,
    switchSource,
    dims,
    mDefs,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    aggRows,
    columns,
  };
};
