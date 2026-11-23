// Hooks
import { useMemo, useState } from "react";
import { useCouponSalesCtx } from "../../hooks";

// Redux
import {
  setCouponExportOpen,
  COUPON_THRESHOLD_DEFAULT,
  COUPON_TREND_THRESHOLD_DEFAULT,
} from "../../../../../features/couponSalesSlice";

// Utils
import {
  aggregateRows,
  downloadCsv,
  fmtNum,
  rowsToCsv,
  type AggFn,
  type AggRow,
} from "../../../../../utils/csvExport";
import { couponValueOf, usesFallbackValue } from "../../utils";
import {
  buildCouponPresetCsv,
  PRESET_OPTIONS,
  CPN_SALES_DIMS,
  CPN_SALES_METRICS,
  type CouponPreset,
} from "../utils";

// Interfaces
import type { CouponItem } from "../../../../../interfaces";
import type { Mode, Scope } from "../interfaces";

/**
 * The export's choices and what they make: the mode and scope, the presets
 * ticked, the Custom group-by and metrics with their preview, and the
 * download itself.
 */
export const useCpnSalesExport = (storeCoupons: CouponItem[]) => {
  const {
    dispatch,
    coupons: allCoupons,
    threshold: rawThreshold,
    trendThreshold: rawTrendThreshold,
    metric,
    baselineCoupons,
    assignedStores,
    groupStores,
  } = useCouponSalesCtx();
  const threshold = rawThreshold ?? COUPON_THRESHOLD_DEFAULT;

  const [mode, setMode] = useState<Mode>("presets");
  const [scope, setScope] = useState<Scope>("store");
  const [presets, setPresets] = useState<Set<CouponPreset>>(
    new Set(["stores"]),
  );
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<
    Map<string, { fn: AggFn; enabled: boolean }>
  >(
    new Map([
      ["coupon_amount", { fn: "sum", enabled: true }],
      ["qty", { fn: "sum", enabled: false }],
      ["total_sales", { fn: "sum", enabled: false }],
    ]),
  );

  const source = scope === "all" ? allCoupons : storeCoupons;

  // Scope selection drives the baseline the same way it drives the source, so
  // an all-stores export grades against the all-stores baseline.
  const grading = useMemo(
    () => ({
      metric,
      threshold,
      trendThreshold: rawTrendThreshold ?? COUPON_TREND_THRESHOLD_DEFAULT,
      baseline:
        scope === "all"
          ? baselineCoupons
          : baselineCoupons.filter((c) =>
              storeCoupons.some(
                (sc) =>
                  sc.storeid === c.storeid &&
                  sc.store_number === c.store_number,
              ),
            ),
    }),
    [
      metric,
      threshold,
      rawTrendThreshold,
      baselineCoupons,
      scope,
      storeCoupons,
    ],
  );

  const close = () => dispatch(setCouponExportOpen(false));

  // Two normalisations before the generic aggregator sees the rows:
  //   sale_date carries a time component the grouping shouldn't split on, and
  //   coupon_amount can be null with the real figure in store_coupon /
  //   vendor_coupon. That fallback is transaction-level and repeated on every
  //   line, so it is written onto the first line of each sale and zeroed on
  //   the rest — otherwise summing the column in a spreadsheet multiplies it
  //   by the basket size.
  const aggSource: AggRow[] = useMemo(() => {
    const seenSales = new Set<number>();
    return source.map((c) => {
      let amount = couponValueOf(c);
      if (usesFallbackValue(c)) {
        if (seenSales.has(c.sale_id)) amount = 0;
        else seenSales.add(c.sale_id);
      }
      return {
        ...c,
        coupon_amount: amount,
        sale_date_only: c.sale_date.split("T")[0],
      };
    }) as unknown as AggRow[];
  }, [source]);

  const activeMetrics = useMemo(
    () =>
      [...metrics.entries()]
        .filter(([, m]) => m.enabled)
        .map(([key, m]) => ({ key, fn: m.fn })),
    [metrics],
  );

  const previewColumns = useMemo(
    () => [
      ...[...groupBy].map((d) => ({
        key: d,
        label: CPN_SALES_DIMS.find((x) => x.key === d)?.label ?? d,
      })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.toUpperCase()} ${CPN_SALES_METRICS.find((x) => x.key === m.key)?.label ?? m.key}`,
      })),
    ],
    [groupBy, activeMetrics],
  );

  const previewRows = useMemo(() => {
    if (!groupBy.size && !activeMetrics.length) return [];
    return aggregateRows(aggSource, [...groupBy], activeMetrics);
  }, [aggSource, groupBy, activeMetrics]);

  const customCsv = () => {
    const dims = [...groupBy];
    const rows = aggregateRows(aggSource, dims, activeMetrics);
    const headers = [
      ...dims.map((d) => CPN_SALES_DIMS.find((x) => x.key === d)?.label ?? d),
      ...activeMetrics.map(
        (m) =>
          `${CPN_SALES_METRICS.find((x) => x.key === m.key)?.label ?? m.key} (${m.fn})`,
      ),
    ];
    const data = rows.map((r) => [
      ...dims.map((d) => r[d] ?? ""),
      ...activeMetrics.map((m) => {
        // aggregateRows emits `${fn}__${key}`, not the bare key — reading the
        // bare key left every metric column blank in the download.
        const v = r[`${m.fn}__${m.key}`];
        return typeof v === "number" ? fmtNum(v) : (v ?? "");
      }),
    ]);
    return rowsToCsv(headers, data);
  };

  const togglePreset = (key: CouponPreset) =>
    setPresets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleDim = (key: string) =>
    setGroupBy((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const toggleMetric = (key: string) =>
    setMetrics((prev) => {
      const sel = prev.get(key)!;
      const next = new Map(prev);
      next.set(key, { ...sel, enabled: !sel.enabled });
      return next;
    });

  const setMetricFn = (key: string, fn: AggFn) =>
    setMetrics((prev) => {
      const sel = prev.get(key)!;
      const next = new Map(prev);
      next.set(key, { ...sel, fn });
      return next;
    });

  const handleExport = () => {
    const scopeTag = scope === "all" ? "all-stores" : "store";
    // Several presets concatenate into one labelled file, the way Sales
    // stacks its selected datasets — one download, not one per checkbox.
    const csv =
      mode === "presets"
        ? PRESET_OPTIONS.filter((p) => presets.has(p.key))
            .map(
              (p) =>
                `${p.label}\n${buildCouponPresetCsv(p.key, source, grading, assignedStores, groupStores)}`,
            )
            .join("\n\n")
        : customCsv();
    const name =
      mode === "presets"
        ? `coupon-sales-${scopeTag}.csv`
        : `coupon-sales-custom-${scopeTag}.csv`;
    downloadCsv(csv, name);
    close();
  };

  const canExport =
    mode === "presets"
      ? presets.size > 0
      : groupBy.size > 0 || activeMetrics.length > 0;

  return {
    mode,
    setMode,
    scope,
    setScope,
    presets,
    togglePreset,
    groupBy,
    toggleDim,
    metrics,
    toggleMetric,
    setMetricFn,
    previewColumns,
    previewRows,
    source,
    canExport,
    handleExport,
    close,
  };
};
