import { useState, useMemo } from "react";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type { SubSale, HourlySale } from "../../../../interfaces";
import type { DayDot } from "./LedgerRow";
import type { ExportSubDeptItem } from "../../../../features/dev/devSalesLedgerSlice";
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
} from "../../../../utils/csvExport";
import type { AggFn, AggRow } from "../../../../utils/csvExport";
import {
  getFinancials,
  type FinancialsResponse,
  type FinancialsRow,
} from "../../../../api/financials";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useAppSelector } from "../../../../hooks";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SalesExportModalProps {
  onClose: () => void;
  storeName: string;
  dateLabel: string;
  rawSubs: SubSale[];
  rawLWSubs: SubSale[];
  rawLYSubs: SubSale[];
  rawHourly: HourlySale[];
  rawLWHourly: HourlySale[];
  rawLYHourly: HourlySale[];
  days: DayDot[];
  subDeptItems?: ExportSubDeptItem[];
  subDeptName?: string;
  /** The store this popup is about, and the week it is showing. The Financials
   *  option is the only one that fetches, so it is the only one that needs
   *  them. */
  storeId: number;
  startDate: string;
  endDate: string;
  /** The group the ledger searched, when it searched one. Lets Financials
   *  offer the whole chain rather than just the store being looked at. */
  group?: { id: number; name: string } | null;
  /** Every store the ledger returned, so Financials can be narrowed to some
   *  of them. */
  stores?: { storeid: number; store_number: string; store_name: string }[];
}

type ExportDataset =
  | "subdept"
  | "deptgrid"
  | "hourly"
  | "summary"
  | "items"
  | "financials";


type ItemSev = "critical" | "watch" | "healthy";
type ModalMode = "presets" | "custom";
type CustomSource = "subdept" | "hourly";

interface DimDef {
  key: string;
  label: string;
}
interface MetricDef {
  key: string;
  label: string;
}
interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const fmtHour = (h: number) => {
  const ampm = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
};

// ─── Preset CSV builders ──────────────────────────────────────────────────────

/**
 * Financials, as the POS holds them.
 *
 * Deliberately unformatted: no rounding, no derived columns, no totals. This
 * is the one export that exists because a customer asked for the records
 * themselves, and a figure tidied on the way out is a figure that disagrees
 * with whatever they are reconciling against.
 *
 * `weight` is null on anything not sold by weight, which becomes an empty
 * cell rather than a nought — nought pounds and not-weighed are different
 * facts and a spreadsheet will happily average the first.
 */
const buildFinancialsCsv = (rows: FinancialsRow[]) => {
  const headers = [
    "Store #",
    "Store",
    "Date",
    "Bin",
    "Description",
    "Qty",
    "Weight",
    "Sales",
  ];
  return rowsToCsv(
    headers,
    rows.map((r) => [
      r.store_number,
      r.store_name ?? "",
      fmtDate(r.sale_date.split("T")[0]),
      r.bin,
      r.description,
      r.qty,
      r.weight ?? "",
      r.sales,
    ]),
  );
};

const buildSubDeptCsv = (ty: SubSale[], lw: SubSale[], ly: SubSale[]) => {
  const headers = [
    "Date",
    "Sub Dept #",
    "Sub Dept",
    "Period",
    "Net Sales",
    "Qty",
    "Transactions",
    "Total Tax",
  ];
  const toRows = (subs: SubSale[], period: string) =>
    subs.map((s) => [
      fmtDate(s.sale_date.split("T")[0]),
      s.sub_department,
      s.sub_department_description,
      period,
      fmtNum(s.net_sales),
      s.qty,
      s.transaction_count,
      fmtNum(s.total_tax),
    ]);
  return rowsToCsv(headers, [
    ...toRows(ty, "This Year"),
    ...toRows(lw, "Last Week"),
    ...toRows(ly, "Last Year"),
  ]);
};

const buildHourlyCsv = (
  ty: HourlySale[],
  lw: HourlySale[],
  ly: HourlySale[],
) => {
  const headers = [
    "Date",
    "Hour",
    "Period",
    "Net Sales",
    "Qty",
    "Transactions",
    "Basket Size ($)",
    "Basket Size (Qty)",
    "Avg Item Price",
  ];
  const toRows = (hourly: HourlySale[], period: string) =>
    hourly.map((h) => [
      fmtDate(h.sale_date.split("T")[0]),
      fmtHour(h.hour),
      period,
      fmtNum(h.net_sales),
      h.qty,
      h.transactions,
      fmtNum(h.basket_size_sales),
      fmtNum(h.basket_size_qty),
      fmtNum(h.avg_item_price),
    ]);
  return rowsToCsv(headers, [
    ...toRows(ty, "This Year"),
    ...toRows(lw, "Last Week"),
    ...toRows(ly, "Last Year"),
  ]);
};

const buildSummaryCsv = (days: DayDot[]) => {
  const headers = ["Date", "TY Net Sales", "LW Net Sales", "LY Net Sales"];
  const rows = [...days]
    .sort((a, b) => a.sale_date.localeCompare(b.sale_date))
    .map((d) => [
      fmtDate(d.sale_date.split("T")[0]),
      fmtNum(d.twNet),
      d.lwNet !== null ? fmtNum(d.lwNet) : "",
      d.lyNet !== null ? fmtNum(d.lyNet) : "",
    ]);
  return rowsToCsv(headers, rows);
};

/**
 * Every sub department against every day of the week, as a grid.
 *
 * The long-format Sub Department preset above is one row per dept per day per
 * period — right for a pivot table, hard to read. This is the shape you hold
 * next to a printed day report: departments down the side, days across the top,
 * one number per cell, and totals on both edges so nothing has to be re-added
 * by hand.
 *
 * This week only, and `net_sales` deliberately — that is the field the register
 * report agrees with, since it already has tax and coupons taken out. LW/LY
 * belong to the other presets; this one exists to be checked against the
 * store's own paperwork.
 */
const buildDeptDayGridCsv = (subs: SubSale[], days: DayDot[]) => {
  const dates = [...days]
    .map((d) => d.sale_date.split("T")[0])
    .sort((a, b) => a.localeCompare(b));

  const deptName = new Map<number, string>();
  const cell = new Map<string, number>();
  for (const s of subs) {
    if (!deptName.has(s.sub_department))
      deptName.set(s.sub_department, s.sub_department_description ?? "");
    const key = `${s.sub_department}__${s.sale_date.split("T")[0]}`;
    cell.set(key, (cell.get(key) ?? 0) + s.net_sales);
  }

  const ids = [...deptName.keys()].sort((a, b) => a - b);
  const headers = [
    "Sub Dept #",
    "Sub Dept",
    ...dates.map(fmtDate),
    "Week Total",
  ];

  const rows: (string | number)[][] = ids.map((id) => {
    const values = dates.map((d) => cell.get(`${id}__${d}`) ?? 0);
    return [
      id,
      deptName.get(id) ?? "",
      ...values.map(fmtNum),
      fmtNum(values.reduce((acc, v) => acc + v, 0)),
    ];
  });

  // Column totals on the bottom row — the day figure to hold against the
  // store's day report without re-adding the column by hand.
  const dayTotals = dates.map((d) =>
    ids.reduce((acc, id) => acc + (cell.get(`${id}__${d}`) ?? 0), 0),
  );
  rows.push([
    "",
    "All Sub Depts",
    ...dayTotals.map(fmtNum),
    fmtNum(dayTotals.reduce((acc, v) => acc + v, 0)),
  ]);

  return rowsToCsv(headers, rows);
};

const SEV_LABEL: Record<ItemSev, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Healthy",
};

const fmtPctRaw = (pct: number | null) =>
  pct === null ? "" : `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

const buildItemsCsv = (items: ExportSubDeptItem[], sevs: Set<ItemSev>) => {
  // Ungraded items (neither comparison covers the week) go out only with the
  // full export — they don't belong under any one severity.
  const everything = sevs.size >= 3;
  const filtered = items.filter((i) =>
    i.sev === null ? everything : sevs.has(i.sev),
  );
  const headers = [
    "Product Code",
    "Description",
    "Severity",
    "TY Net",
    "TY Qty",
    "LW Net",
    "LW Qty",
    "LW vs %",
    "LY Net",
    "LY Qty",
    "LY vs %",
  ];
  const rows = filtered.map((i) => {
    const lwPct =
      i.lwNet !== null && i.lwNet > 0
        ? (((i.tyNetForLW ?? i.tyNet) - i.lwNet) / i.lwNet) * 100
        : null;
    const lyPct =
      i.lyNet !== null && i.lyNet > 0
        ? (((i.tyNetForLY ?? i.tyNet) - i.lyNet) / i.lyNet) * 100
        : null;
    return [
      i.productCode,
      i.desc,
      i.sev ? SEV_LABEL[i.sev] : "Not graded",
      fmtNum(i.tyNet),
      i.tyQty,
      i.lwNet !== null ? fmtNum(i.lwNet) : "",
      i.lwQty ?? "",
      fmtPctRaw(lwPct),
      i.lyNet !== null ? fmtNum(i.lyNet) : "",
      i.lyQty ?? "",
      fmtPctRaw(lyPct),
    ];
  });
  return rowsToCsv(headers, rows);
};

// ─── Config ───────────────────────────────────────────────────────────────────

const SUBDEPT_DIMS: DimDef[] = [
  { key: "sale_date", label: "Date" },
  { key: "period", label: "Period" },
  { key: "sub_department", label: "Sub Dept #" },
  { key: "sub_department_description", label: "Sub Dept Name" },
];

const SUBDEPT_METRICS: MetricDef[] = [
  { key: "net_sales", label: "Net Sales" },
  { key: "qty", label: "Qty" },
  { key: "transaction_count", label: "Transactions" },
  { key: "total_tax", label: "Total Tax" },
];

const HOURLY_DIMS: DimDef[] = [
  { key: "sale_date", label: "Date" },
  { key: "period", label: "Period" },
  { key: "hour", label: "Hour" },
];

const HOURLY_METRICS: MetricDef[] = [
  { key: "net_sales", label: "Net Sales" },
  { key: "qty", label: "Qty" },
  { key: "transactions", label: "Transactions" },
  { key: "basket_size_sales", label: "Basket Size ($)" },
  { key: "avg_item_price", label: "Avg Item Price" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

const PREVIEW_ROWS = 5;

// ─── Component ────────────────────────────────────────────────────────────────

const SalesExportModal = ({
  onClose,
  storeName,
  dateLabel,
  rawSubs,
  rawLWSubs,
  rawLYSubs,
  rawHourly,
  rawLWHourly,
  rawLYHourly,
  days,
  subDeptItems,
  subDeptName,
  storeId,
  startDate,
  endDate,
  group,
  stores,
}: SalesExportModalProps) => {
  const hasItems = !!subDeptItems && subDeptItems.length > 0;
  const toast = useToast();
  const { url, token } = useAppSelector((state) => state.app);
  /** Fetched with the search — see SalesLedger's fetchLedger. */
  const {
    financials: searchedRows,
    financialsWindow,
    financialsTruncated,
    financialsLoading,
  } = useAppSelector((state) => state.dev.salesLedger);

  // ── Preset state — no default selections ──
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<ExportDataset>>(new Set());
  const [itemSevs, setItemSevs] = useState<Set<ItemSev>>(new Set());
  // Defaults to the store being looked at, even when a group was searched:
  // this popup is about one store, and the wider answer should be asked for
  // rather than assumed.
  const [fetching, setFetching] = useState(false);
  // Its own dates, defaulting to the week on screen. Financials is the only
  // export that can answer for a range the page is not showing, and a month
  // of records is the usual ask.
  const [finFrom, setFinFrom] = useState(startDate);
  const [finTo, setFinTo] = useState(endDate);
  // Starts on the store being looked at. A whole group's records should be
  // asked for rather than arrive by default.
  const [finStores, setFinStores] = useState<Set<number>>(
    () => new Set([storeId]),
  );

  /** Narrowing by store needs a group to fetch and more than one store in it. */
  const canFilterStores = !!group && !!stores && stores.length > 1;
  const finTicked = [...finStores];

  // Selecting a severity chip activates the "Sub Dept Items" preset (and
  // clearing them all back out deactivates it), so the two stay in sync.
  const toggleItemSev = (sev: ItemSev) => {
    const next = new Set(itemSevs);
    next.has(sev) ? next.delete(sev) : next.add(sev);
    setItemSevs(next);
    setSelected((prev) => {
      const n = new Set(prev);
      if (next.size > 0) n.add("items");
      else n.delete("items");
      return n;
    });
  };

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

  /**
   * Fetch the financials rows, or null if the call failed.
   *
   * The only part of an export that can fail — the other presets are built
   * from data already on the page.
   */
  /**
   * The rows the search already brought back, when they answer the question
   * being asked. Null when the dates have been moved off the searched week,
   * which is the one case this has to go and ask.
   */
  const searchedAnswers =
    financialsWindow &&
    financialsWindow.start === finFrom &&
    financialsWindow.end === finTo;

  const fetchFinancials = async (): Promise<FinancialsResponse | null> => {
    if (searchedAnswers) {
      return {
        error: 0,
        success: true,
        record_count: searchedRows.length,
        truncated: financialsTruncated,
        maxRows: 0,
        storeids: [],
        data: searchedRows.filter((r) => finStores.has(r.storeid)),
      };
    }
    // The endpoint takes one store OR one group, never an arbitrary set. So a
    // subset is fetched at group scope and cut down here: one call either way,
    // where asking per store would be a call each.
    const asGroup = finTicked.length !== 1 && canFilterStores;
    try {
      const resp = await getFinancials(
        url,
        token,
        finFrom,
        finTo,
        asGroup ? group!.id : (finTicked[0] ?? storeId),
        asGroup ? 1 : 0,
      );
      const j: FinancialsResponse = resp.data;
      if (j.error !== 0) {
        toast.error(j.msg || "Could not read the financials");
        return null;
      }
      return asGroup
        ? { ...j, data: j.data.filter((r) => finStores.has(r.storeid)) }
        : j;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not read the financials",
      );
      return null;
    }
  };

  // ── Preset download ──
  const handlePresetDownload = async () => {
    const sections: string[] = [];
    if (selected.has("summary"))
      sections.push(`Weekly Summary\n${buildSummaryCsv(days)}`);
    if (selected.has("subdept"))
      sections.push(
        `Sub Department\n${buildSubDeptCsv(rawSubs, rawLWSubs, rawLYSubs)}`,
      );
    if (selected.has("deptgrid"))
      sections.push(
        `Sub Dept by Day — This Week\n${buildDeptDayGridCsv(rawSubs, days)}`,
      );
    if (selected.has("hourly"))
      sections.push(
        `Hourly Breakdown\n${buildHourlyCsv(rawHourly, rawLWHourly, rawLYHourly)}`,
      );
    if (selected.has("items") && subDeptItems && itemSevs.size > 0) {
      const label = subDeptName ? `Items — ${subDeptName}` : "Sub Dept Items";
      sections.push(`${label}\n${buildItemsCsv(subDeptItems, itemSevs)}`);
    }
    // Last, and the only one that goes to the network. A failure here must
    // not lose the sections already built, so a null answer simply leaves
    // Financials out of a file that still carries everything else.
    if (selected.has("financials")) {
      setFetching(true);
      const fin = await fetchFinancials();
      setFetching(false);
      if (fin) {
        const scopeLabel =
          finTicked.length === 1 ? storeName : `${finTicked.length} stores`;
        // The caveat belongs IN the file. Somebody opens this a week later
        // with no idea a cap was involved, and a short CSV looks exactly like
        // a complete one.
        const note = fin.truncated
          ? " — INCOMPLETE: the row cap bit, narrow the dates or pick fewer stores"
          : "";
        sections.push(
          `Financials — ${scopeLabel}, ${finFrom} to ${finTo}${note}\n${buildFinancialsCsv(fin.data)}`,
        );
        if (fin.truncated) {
          toast.warn(
            "Financials hit the row cap — the file is incomplete",
          );
        }
        if (fin.data.length === 0) {
          toast.warn("No financials rows for those stores and dates");
        }
      }
    }

    if (!sections.length) return;
    const safeName = storeName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(sections.join("\n\n"), `${safeName}_${dateLabel}.csv`);
    onClose();
  };

  // ── Custom download ──
  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    const headers = columns.map((c) => c.label);
    const rows = aggRows.map((r) => columns.map((c) => r[c.key] ?? ""));
    const safeName = storeName.replace(/[^a-z0-9]/gi, "_");
    downloadCsv(
      rowsToCsv(headers, rows),
      `${safeName}_custom_${dateLabel}.csv`,
    );
    onClose();
  };

  const presetDatasets: {
    id: ExportDataset;
    label: string;
    description: string;
  }[] = [
    {
      id: "summary",
      label: "Weekly Summary",
      description: "Day-by-day net sales vs last week and last year",
    },
    {
      id: "subdept",
      label: "Sub Department",
      description:
        "Net sales, qty, and transactions by sub dept (TY / LW / LY)",
    },
    {
      id: "deptgrid",
      label: "Sub Dept by Day",
      description:
        "Every sub dept against every day of this week — net sales, with row and column totals",
    },
    {
      id: "hourly",
      label: "Hourly Breakdown",
      description:
        "Hourly net sales, basket size, and avg item price (TY / LW / LY)",
    },
    {
      id: "financials",
      label: "Financials",
      description:
        "Daily POS records by bin — qty, weight and sales, exactly as the register holds them",
    },
  ];

  const SEV_CHIP: { sev: ItemSev; label: string; activeClass: string }[] = [
    {
      sev: "critical",
      label: "Critical",
      activeClass: "bg-red-600 border-red-600 text-custom-white",
    },
    {
      sev: "watch",
      label: "Watch",
      activeClass: "bg-amber-500 border-amber-500 text-custom-white",
    },
    {
      sev: "healthy",
      label: "Healthy",
      activeClass: "bg-emerald-600 border-emerald-600 text-custom-white",
    },
  ];

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:sales:v2"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-brand_navy">
        <div>
          <p className="text-custom-white text-[13px] font-semibold">
            Export CSV
          </p>
          <p className="text-custom-white text-[10px] mt-0.5">{storeName}</p>
        </div>
        {/* Mode tabs */}
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m
                  ? "bg-custom-white text-brand_navy"
                  : "text-custom-white"
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

      {/* ── PRESETS MODE ── */}
      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3">
            <p className="text-[11px] text-content uppercase tracking-wide font-medium">
              Select data to include
            </p>
            {presetDatasets.map(({ id, label, description }) => (
              <div key={id}>
                <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selected.has(id)}
                  onChange={() =>
                    setSelected((prev) => {
                      const n = new Set(prev);
                      n.has(id) ? n.delete(id) : n.add(id);
                      return n;
                    })
                  }
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
                    {label}
                  </p>
                  <p className="text-[11px] text-content mt-0.5">
                    {description}
                  </p>
                </div>
                </label>

                {/* Financials is the only preset that fetches, so it is the
                      only one that can answer for dates and stores the page is
                      not showing. The controls live under it rather than in
                      the header for exactly that reason — they narrow this
                      one dataset, not the export.

                      Shown whether or not the row is ticked. Revealing them on
                      the tick hid the whole point of the option: somebody
                      looking for a date range does not find it by checking a
                      box to see what happens, they decide the export cannot do
                      it and go back to asking for a query. */}
                {id === "financials" && (
                  <div className="ml-[26px] mt-2 rounded-lg bg-bkg shadow-card-sm px-3 py-2.5">
                      <p className="text-[10px] text-content/85 leading-snug mb-2">
                        {financialsLoading
                          ? "Reading the records for this search…"
                          : searchedAnswers
                            ? `${searchedRows.length.toLocaleString()} records in hand for this week${
                                financialsTruncated ? " (capped)" : ""
                              }`
                            : "These dates are outside the search — they will be fetched on download."}
                      </p>
                      <div className="flex items-end gap-2 flex-wrap">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
                            From
                          </span>
                          <input
                            type="date"
                            value={finFrom}
                            max={finTo}
                            onChange={(e) => setFinFrom(e.target.value)}
                            className="text-[11.5px] px-2 py-1 rounded-md border border-gray-200 text-content bg-custom-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
                            To
                          </span>
                          <input
                            type="date"
                            value={finTo}
                            min={finFrom}
                            onChange={(e) => setFinTo(e.target.value)}
                            className="text-[11.5px] px-2 py-1 rounded-md border border-gray-200 text-content bg-custom-white"
                          />
                        </div>
                        <button
                          onClick={() => {
                            setFinFrom(startDate);
                            setFinTo(endDate);
                          }}
                          className="text-[11px] font-semibold text-content/85 hover:underline pb-1.5"
                        >
                          This week
                        </button>
                      </div>

                      {canFilterStores && (
                        <div className="mt-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[9px] font-bold uppercase tracking-wide text-content/85">
                              Stores
                            </span>
                            <span className="text-[10px] font-semibold text-content">
                              {finTicked.length} of {stores!.length}
                            </span>
                            <button
                              onClick={() =>
                                setFinStores(
                                  new Set(stores!.map((st) => st.storeid)),
                                )
                              }
                              className="text-[10px] font-semibold text-content/85 hover:underline"
                            >
                              All
                            </button>
                            <button
                              onClick={() => setFinStores(new Set([storeId]))}
                              className="text-[10px] font-semibold text-content/85 hover:underline"
                            >
                              Just this one
                            </button>
                          </div>
                          <div className="max-h-[132px] overflow-y-auto thin-scrollbar rounded-md border border-gray-100 bg-custom-white">
                            {stores!.map((st) => (
                              <label
                                key={st.storeid}
                                className="flex items-center gap-2 px-2 py-1 text-[11.5px] text-content cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={finStores.has(st.storeid)}
                                  onChange={() =>
                                    setFinStores((prev) => {
                                      const n = new Set(prev);
                                      n.has(st.storeid)
                                        ? n.delete(st.storeid)
                                        : n.add(st.storeid);
                                      return n;
                                    })
                                  }
                                  className="h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                                />
                                <span className="tabular-nums font-semibold w-[46px] flex-shrink-0">
                                  {st.store_number}
                                </span>
                                <span className="truncate">
                                  {st.store_name}
                                </span>
                              </label>
                            ))}
                          </div>
                          {finTicked.length === 0 && (
                            <p className="text-[10.5px] font-semibold text-severity_watch_text mt-1">
                              Pick at least one store.
                            </p>
                          )}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}

            {hasItems && (
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has("items")}
                  onChange={() => {
                    const checking = !selected.has("items");
                    if (checking) {
                      if (itemSevs.size === 0)
                        setItemSevs(new Set(["critical", "watch", "healthy"]));
                    } else {
                      setItemSevs(new Set());
                    }
                    setSelected((prev) => {
                      const n = new Set(prev);
                      checking ? n.add("items") : n.delete("items");
                      return n;
                    });
                  }}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <p className="text-[13px] font-medium text-content">
                      Sub Dept Items
                    </p>
                    {subDeptName && (
                      <span className="text-[10px] text-content italic truncate">
                        {subDeptName}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-content mt-0.5 mb-1.5">
                    Product-level items with severity grading (TY / LW / LY)
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {SEV_CHIP.map(({ sev, label, activeClass }) => (
                      <button
                        key={sev}
                        onClick={() => toggleItemSev(sev)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
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
            )}
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
            <button
              onClick={onClose}
              className="text-[12px] text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => void handlePresetDownload()}
              disabled={
                selected.size === 0 ||
                fetching ||
                // Financials with nothing ticked would fall back to the one
                // store, which is not what an empty list means.
                (selected.has("financials") &&
                  canFilterStores &&
                  finTicked.length === 0)
              }
              className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              {fetching ? "Fetching financials…" : "Download CSV"}
            </button>
          </div>
        </>
      )}

      {/* ── CUSTOM MODE ── */}
      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
            {/* Left: config panel */}
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              {/* Source */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Data Source
                </p>
                <div className="flex flex-col gap-1.5">
                  {(["subdept", "hourly"] as CustomSource[]).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="radio"
                        checked={source === s}
                        onChange={() => switchSource(s)}
                        className="accent-brand_navy h-3.5 w-3.5"
                      />
                      <span className="text-[12px] text-content">
                        {s === "subdept" ? "Sub Department" : "Hourly"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Group by */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Group By
                </p>
                <div className="space-y-1.5">
                  {dims.map((d) => (
                    <label
                      key={d.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={groupBy.has(d.key)}
                        onChange={() => toggleGroupBy(d.key)}
                        className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
                      />
                      <span className="text-[12px] text-content">
                        {d.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Metrics */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content mb-2">
                  Metrics
                </p>
                <div className="space-y-2">
                  {mDefs.map((m) => {
                    const sel = metrics.get(m.key)!;
                    return (
                      <div key={m.key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={sel.enabled}
                          onChange={() => toggleMetric(m.key)}
                          className="accent-brand_navy h-3.5 w-3.5 rounded flex-shrink-0"
                        />
                        <span className="text-[12px] flex-1 text-content">
                          {m.label}
                        </span>
                        <select
                          value={sel.fn}
                          disabled={!sel.enabled}
                          onChange={(e) =>
                            setMetricFn(m.key, e.target.value as AggFn)
                          }
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

            {/* Right: preview */}
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
                      {aggRows.slice(0, PREVIEW_ROWS).map((row, i) => (
                        <tr
                          key={i}
                          className={
                            i % 2 === 0 ? "bg-custom-white" : "bg-gray-50/50"
                          }
                        >
                          {columns.map((c) => (
                            <td
                              key={c.key}
                              className="px-3 py-1.5 text-content whitespace-nowrap border-b border-gray-50"
                            >
                              {row[c.key] ?? "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {aggRows.length > PREVIEW_ROWS && (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-3 py-2 text-[10px] text-content italic"
                          >
                            + {aggRows.length - PREVIEW_ROWS} more rows in
                            download…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="text-[12px] text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomDownload}
              disabled={!canCustomDownload}
              className="flex items-center gap-1.5 bg-brand_navy hover:bg-brand_navy/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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

export default SalesExportModal;
