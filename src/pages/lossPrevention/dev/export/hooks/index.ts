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
import {
  buildCashiersCsv,
  buildTransactionsCsv,
  CASHIER_DIMS,
  CASHIER_METRICS,
  fmtDate,
  TRANS_DIMS,
  TRANS_METRICS,
} from "../utils";

// Interfaces
import type { TransactionOverview } from "../../../../../interfaces";
import type { CashierGrade, CashierSeverity } from "../../interfaces";
import type {
  CustomSource,
  ExportDataset,
  MetricSelection,
  ModalMode,
} from "../interfaces";

interface LPExportInput {
  onClose: () => void;
  storeName: string;
  saleType: string;
  dateRange: string;
  transactions: TransactionOverview[];
  cashierGrades: CashierGrade[];
}

/**
 * The export pop-up's state: the presets (the transaction list, and the
 * cashier summary by severity) and the custom builder (a source, its group-by
 * and metrics, aggregated for the preview), and both downloads. Nothing is
 * selected to begin with.
 */
export const useLPExport = ({
  onClose,
  storeName,
  saleType,
  dateRange,
  transactions,
  cashierGrades,
}: LPExportInput) => {
  // ── Preset state — no default selections ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(new Set());
  const [cashierSevs, setCashierSevs] = useState<Set<CashierSeverity>>(
    new Set(),
  );

  // Selecting a severity chip activates the "Cashier Summary" preset (and
  // clearing them all back out deactivates it), so the two stay in sync.
  const toggleCashierSev = (sev: CashierSeverity) => {
    const next = new Set(cashierSevs);
    next.has(sev) ? next.delete(sev) : next.add(sev);
    setCashierSevs(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("cashiers");
      else n.delete("cashiers");
      return n;
    });
  };

  // ── Custom builder state — no default selections ──
  const [source, setSource] = useState<CustomSource>("transactions");
  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["qty", { fn: "sum", enabled: false }],
      ["total_sales", { fn: "sum", enabled: false }],
    ]),
  );

  const dims = source === "transactions" ? TRANS_DIMS : CASHIER_DIMS;
  const mDefs = source === "transactions" ? TRANS_METRICS : CASHIER_METRICS;

  const switchSource = (s: CustomSource) => {
    setSource(s);
    setGroupBy(new Set());
    if (s === "transactions") {
      setMetrics(
        new Map([
          ["qty", { fn: "sum", enabled: false }],
          ["total_sales", { fn: "sum", enabled: false }],
        ]),
      );
    } else {
      setMetrics(
        new Map([
          ["trans_value", { fn: "sum", enabled: false }],
          ["qty_value", { fn: "sum", enabled: false }],
          ["sales_value", { fn: "sum", enabled: false }],
          ["avgTicket_value", { fn: "avg", enabled: false }],
        ]),
      );
    }
  };

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

  // ── Flat rows ──
  const flatRows = useMemo<AggRow[]>(() => {
    if (source === "transactions") {
      return transactions.map((o) => ({
        transaction_id: o.transaction_id,
        cashier_name: o.cashier_name,
        cashier_number: o.cashier_number,
        sale_date: o.sale_date.split("T")[0],
        sale_type: o.sale_type,
        store_number: o.store_number,
        qty: o.qty,
        total_sales: o.total_sales,
      }));
    }
    // Flatten CashierGrade nested metrics into flat row
    return cashierGrades.map((g) => ({
      cashier_name: g.cashier_name,
      cashier_number: g.cashier_number,
      store_number: g.store_number,
      severity: g.severity,
      trans_value: g.trans.value,
      qty_value: g.qty.value,
      sales_value: g.sales.value,
      avgTicket_value: g.avgTicket.value,
    }));
  }, [source, transactions, cashierGrades]);

  // ── Aggregated result ──
  const { aggRows, columns } = useMemo(() => {
    const activeDims = dims.filter((d) => groupBy.has(d.key));
    const activeMetrics = mDefs
      .map((m) => ({ ...m, sel: metrics.get(m.key) }))
      .filter((m) => m.sel?.enabled)
      .map((m) => ({ key: m.key, fn: m.sel!.fn, label: m.label }));

    const agg = aggregateRows(
      flatRows,
      activeDims.map((d) => d.key),
      activeMetrics.map((m) => ({ key: m.key, fn: m.fn })),
    );

    const display = agg.map((row) => {
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

    const columns = [
      ...activeDims.map((d) => ({ key: d.key, label: d.label })),
      ...activeMetrics.map((m) => ({
        key: `${m.fn}__${m.key}`,
        label: `${m.fn.charAt(0).toUpperCase() + m.fn.slice(1)} ${m.label}`,
      })),
    ];

    return { aggRows: display, columns };
  }, [flatRows, groupBy, metrics, dims, mDefs]);

  // ── Preset download ──
  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("transactions"))
      sections.push(`Transaction List\n${buildTransactionsCsv(transactions)}`);
    if (selected.has("cashiers") && cashierSevs.size > 0) {
      sections.push(
        `Cashier Summary\n${buildCashiersCsv(cashierGrades, cashierSevs)}`,
      );
    }
    if (!sections.length) return;
    const safeName = `${storeName}_${saleType}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${dateRange}.csv`);
    onClose();
  };

  // ── Custom download ──
  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = `${storeName}_${saleType}`.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_custom_${dateRange}.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return {
    mode,
    setMode,
    selected,
    setSelected,
    cashierSevs,
    setCashierSevs,
    toggleCashierSev,
    source,
    switchSource,
    groupBy,
    toggleGroupBy,
    metrics,
    toggleMetric,
    setMetricFn,
    dims,
    mDefs,
    aggRows,
    columns,
    handlePresetDownload,
    handleCustomDownload,
    canCustomDownload,
  };
};
