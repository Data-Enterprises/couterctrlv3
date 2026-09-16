import { useState, useMemo } from "react";
import ResizableModalShell from "../../components/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import type {
  SuggestedItem,
  SuggestedGroupRow,
  SuggestedNotSelling,
  NotSellingItem,
} from "../../interfaces";
import {
  fmtNum,
  rowsToCsv,
  downloadCsv,
  aggregateRows,
} from "../../utils/csvExport";
import type { AggFn, AggRow } from "../../utils/csvExport";
import {
  deptLabel,
  lostLb,
  suggestedAction,
  ACTION_ORDER,
  SCOPE_TEXT,
} from ".";

/**
 * Presets / Custom CSV export, the shape every other page uses.
 *
 * One preset per view. The panel answers four questions in four places, so the
 * file menu offers the same four rather than making anyone learn a second
 * arrangement: the store's heaviest lines, one department's sheet, the
 * production reading, and what has stopped selling. The rollup behind the tree
 * is the fifth, and the only one that spans stores.
 *
 * Custom is the same group-by + metric-with-aggregate builder as Receivers,
 * Coupons and Sub Dept Margins, running on the store's item rows.
 */
interface Props {
  onClose: () => void;
  /** Every scale item in the active store, all departments. */
  items: SuggestedItem[];
  /** Just the department on screen, with its column filters applied — what the
   *  buyer is actually looking at, which is what the Order Sheet has to be. */
  sheetItems: SuggestedItem[];
  /** Every store x department row behind the tree. */
  groupRows: SuggestedGroupRow[];
  /** The active store's dead / stopped / declining set, when it was asked for. */
  notSelling: SuggestedNotSelling | null;
  storeLabel: string;
  /** Null when no department is selected — the store overview is open. */
  departmentLabel: string | null;
  coverWindow: { start: string; end: string } | null;
  /** `leadDays + coverDays`, off the response. Every rhythm sentence is argued
   *  against it, so the export has to carry the same figure the screen used. */
  cycleDays: number;
}

type ModalMode = "presets" | "custom";
type PresetId =
  | "storeOrder"
  | "actions"
  | "sheet"
  | "production"
  | "notSelling"
  | "rollup";

interface MetricSelection {
  fn: AggFn;
  enabled: boolean;
}

/** Sunday-first, matching the `dow_rates` keys. */
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DIMS = [
  { key: "product_code", label: "UPC" },
  { key: "product_description", label: "Description" },
  { key: "sub_department_description", label: "Department" },
  { key: "store_name", label: "Store" },
  // Renamed with the column it describes — "shrink" means total inventory loss
  // on a grocery floor, which is not what this is.
  { key: "shrink_source", label: "Waste source" },
  { key: "rhythm_action", label: "Rhythm" },
];

const METRICS = [
  { key: "suggested_weight", label: "Order lb" },
  { key: "demand_weight", label: "Cover demand lb" },
  { key: "avg_daily_weight", label: "Avg lb/day" },
  { key: "sold_weight_window", label: "Lookback lb" },
  { key: "shrink_multiplier", label: "Shrink multiplier" },
  { key: "markdown_weight_window", label: "Marked down lb" },
  ...DOW.map((d, i) => ({ key: `dow_${i}`, label: `${d} lb` })),
  { key: "on_hand_weight", label: "On hand lb" },
  { key: "days_of_cover", label: "Days of cover" },
];

const AGG_OPTIONS: { value: AggFn; label: string }[] = [
  { value: "sum", label: "Sum" },
  { value: "avg", label: "Avg" },
  { value: "min", label: "Min" },
  { value: "max", label: "Max" },
  { value: "count", label: "Count" },
];

const PREVIEW_ROWS = 5;

/* ── Preset builders ──────────────────────────────────────────────────────── */

const buildSheetCsv = (items: SuggestedItem[]) => {
  const headers = [
    "UPC",
    "Description",
    "Department",
    "Avg lb/day",
    "Cover demand lb",
    // The two the sheet on screen does not have room for. A buyer checking a
    // suggestion against their own sense of the item reaches for these before
    // anything else: what did we buy over the window, and what went out.
    "Ordered lb (lookback)",
    "Sold lb (lookback)",
    "Shrink source",
    "Shrink multiplier",
    "Capped",
    "Marked down lb (lookback)",
    "On hand lb",
    "Order lb",
    ...DOW.map((d) => `${d} lb`),
  ];
  const rows = items.map((i) => [
    i.product_code,
    i.product_description ?? "",
    deptLabel(i.sub_department_description),
    fmtNum(i.avg_daily_weight ?? 0),
    fmtNum(i.demand_weight ?? 0),
    fmtNum(i.ordered_weight ?? 0),
    fmtNum(i.sold_weight_window ?? 0),
    i.shrink_source,
    fmtNum(i.shrink_multiplier ?? 1, 4),
    i.shrink_clamped ? "yes" : "",
    fmtNum(i.markdown_weight_window ?? 0),
    fmtNum(i.on_hand_weight ?? 0),
    fmtNum(i.suggested_weight ?? 0),
    ...DOW.map((_, d) => fmtNum(i.dow_rates?.[String(d)] ?? 0)),
  ]);
  // The order total is the number the buyer signs off on, so it ships with the
  // sheet rather than being left for a spreadsheet formula.
  rows.push([
    "",
    "Totals",
    "",
    fmtNum(items.reduce((s, i) => s + (i.avg_daily_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.demand_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.ordered_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.sold_weight_window ?? 0), 0)),
    "",
    "",
    "",
    fmtNum(items.reduce((s, i) => s + (i.markdown_weight_window ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.on_hand_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.suggested_weight ?? 0), 0)),
    ...DOW.map((_, d) =>
      fmtNum(items.reduce((s, i) => s + (i.dow_rates?.[String(d)] ?? 0), 0)),
    ),
  ]);
  return rowsToCsv(headers, rows);
};

/**
 * The store's heaviest lines, every department, in the order the endpoint
 * returned them.
 *
 * Not truncated. A buyer wanting the top twenty sorts or filters in Excel;
 * shipping two presets that differ only by row count is a control nobody asked
 * for. The Department column is what makes it readable as one list.
 */
const buildStoreOrderCsv = (items: SuggestedItem[]) => {
  const headers = [
    "UPC",
    "Description",
    "Department",
    "Avg lb/day",
    "Cover demand lb",
    "Waste %",
    "Order lb",
  ];
  const rows = items.map((i) => [
    i.product_code,
    i.product_description ?? "",
    deptLabel(i.sub_department_description),
    fmtNum(i.avg_daily_weight ?? 0),
    fmtNum(i.demand_weight ?? 0),
    fmtNum(((i.shrink_multiplier ?? 1) - 1) * 100),
    fmtNum(i.suggested_weight ?? 0),
  ]);
  rows.push([
    "",
    `Totals — ${items.length} items`,
    "",
    fmtNum(items.reduce((s, i) => s + (i.avg_daily_weight ?? 0), 0)),
    fmtNum(items.reduce((s, i) => s + (i.demand_weight ?? 0), 0)),
    "",
    fmtNum(items.reduce((s, i) => s + (i.suggested_weight ?? 0), 0)),
  ]);
  return rowsToCsv(headers, rows);
};

/**
 * The rows with something to do about them, and why.
 *
 * The one preset that is not a copy of a view: the sheet on screen shows a chip
 * and hides the reasoning in a popover, which does not survive a CSV. Here the
 * sentence IS the row, because the person reading the file is usually not the
 * person who opened the page.
 *
 * Ordered by the action ladder rather than by pounds. Every other export on
 * this page is heaviest-first; this one is worst-first, because a list of
 * things to do is worked from the top.
 */
const buildActionsCsv = (
  items: SuggestedItem[],
  notSelling: SuggestedNotSelling | null,
  cycleDays: number,
) => {
  const nsByCode = new Map<string, NotSellingItem>();
  for (const r of notSelling?.items ?? []) nsByCode.set(String(r.product_code), r);
  const recentDays = notSelling?.window.recent.days ?? 0;

  const rank = new Map(ACTION_ORDER.map((a, i) => [a.key, i]));
  const withAction = items
    .map((i) => ({
      item: i,
      action: suggestedAction(
        i,
        nsByCode.get(String(i.product_code)),
        recentDays,
        cycleDays,
      ),
    }))
    .filter((r) => r.action !== null)
    .sort(
      (a, b) =>
        (rank.get(a.action!.key) ?? 99) - (rank.get(b.action!.key) ?? 99) ||
        (b.item.suggested_weight ?? 0) - (a.item.suggested_weight ?? 0),
    );

  const headers = [
    "Action",
    "About",
    "UPC",
    "Description",
    "Department",
    "Order lb",
    "On hand lb",
    "Days of cover",
    `Days one delivery covers`,
    "Ordered ÷ sold",
    "Waste %",
    "Why",
  ];
  const rows = withAction.map(({ item: i, action: a }) => [
    a!.label,
    SCOPE_TEXT[a!.scope],
    i.product_code,
    i.product_description ?? "",
    deptLabel(i.sub_department_description),
    fmtNum(i.suggested_weight ?? 0),
    fmtNum(i.on_hand_weight ?? 0),
    i.days_of_cover == null ? "" : fmtNum(i.days_of_cover),
    cycleDays,
    i.order_ratio == null ? "" : fmtNum(i.order_ratio, 3),
    fmtNum(((i.shrink_multiplier ?? 1) - 1) * 100),
    a!.detail,
  ]);
  return rowsToCsv(headers, rows);
};

/**
 * The production reading: what each department produces on each weekday.
 *
 * Department grain rather than item, because that is the level somebody plans a
 * week at — an item's Tuesday rate is noise, a department's is a shift.
 */
const buildProductionCsv = (rows: SuggestedGroupRow[]) => {
  const headers = [
    "Store",
    "Department",
    "Items",
    "Avg lb/day",
    ...DOW.map((d) => `${d} lb`),
    "Lookback lb",
  ];
  return rowsToCsv(
    headers,
    rows.map((r) => [
      r.store_name ?? String(r.storeid),
      deptLabel(r.sub_department_description),
      r.item_count,
      fmtNum(r.avg_daily_weight ?? 0),
      ...DOW.map((_, d) => fmtNum(r.dow_rates?.[String(d)] ?? 0)),
      fmtNum(r.sold_weight_window ?? 0),
    ]),
  );
};

/**
 * What has stopped or slowed, worst first.
 *
 * Ordered by Lost lb rather than by status: a heavy item that stopped costs
 * more than a slow one that died, and grouping by status alone buries it. Lost
 * lb is computed here for the same reason it is computed on screen — the
 * endpoint returns both rates but not the gap between them.
 */
const buildNotSellingCsv = (ns: SuggestedNotSelling) => {
  const days = ns.window.recent.days;
  const headers = [
    "Status",
    "UPC",
    "Description",
    "Department",
    "Prior lb/day",
    "Recent lb/day",
    "Change %",
    "Lost lb",
  ];
  const sorted = [...ns.items].sort(
    (a, b) => lostLb(b, days) - lostLb(a, days),
  );
  return rowsToCsv(
    headers,
    sorted.map((r) => [
      r.status,
      r.product_code,
      r.product_description ?? "",
      deptLabel(r.sub_department_description),
      fmtNum(r.prior_lb_per_day ?? 0),
      fmtNum(r.recent_lb_per_day ?? 0),
      r.change_ratio === null ? "" : fmtNum(r.change_ratio * 100),
      fmtNum(lostLb(r, days)),
    ]),
  );
};

const buildRollupCsv = (rows: SuggestedGroupRow[]) => {
  const headers = [
    "Store",
    "Store #",
    "Department",
    "Items",
    "Avg lb/day",
    "Lb/day per item",
    "Cover demand lb",
    "Order lb",
    "Shrink items",
    "Capped items",
    ...DOW.map((d) => `${d} lb/day`),
  ];
  return rowsToCsv(
    headers,
    rows.map((r) => [
      r.store_name ?? String(r.storeid),
      r.store_number ?? "",
      deptLabel(r.sub_department_description),
      r.item_count,
      fmtNum(r.avg_daily_weight ?? 0),
      // The only figure here that compares across stores. Raw lb/day says a
      // store carrying five meat items is down 99% on one carrying 189, when it
      // simply has no meat case.
      fmtNum(r.item_count > 0 ? (r.avg_daily_weight ?? 0) / r.item_count : 0),
      fmtNum(r.demand_weight ?? 0),
      fmtNum(r.suggested_weight ?? 0),
      // Every source that produced an uplift, not just damage. Markdown
      // REPLACES damage per item rather than stacking, so once markdown lands
      // `items_damage` collapses to the handful markdown missed — exporting it
      // alone would read as "this department tracks no waste" on exactly the
      // departments where waste is now measured best. Matches the Shrink
      // applied tile, which counts shrink_source !== "none".
      r.items_receipts + r.items_markdown + r.items_damage,
      r.items_clamped,
      ...DOW.map((_, d) => fmtNum(r.dow_rates?.[String(d)] ?? 0)),
    ]),
  );
};

/* ── Component ────────────────────────────────────────────────────────────── */

const SuggestedExportModal = ({
  onClose,
  items,
  sheetItems,
  groupRows,
  notSelling,
  storeLabel,
  departmentLabel,
  coverWindow,
  cycleDays,
}: Props) => {
  const [mode, setMode] = useState<ModalMode>("presets");
  const [selected, setSelected] = useState<Set<PresetId>>(new Set(["storeOrder"]));

  const [groupBy, setGroupBy] = useState<Set<string>>(new Set());
  const [metrics, setMetrics] = useState<Map<string, MetricSelection>>(
    new Map([
      ["suggested_weight", { fn: "sum", enabled: false }],
      ["demand_weight", { fn: "sum", enabled: false }],
      ["avg_daily_weight", { fn: "sum", enabled: false }],
      ["sold_weight_window", { fn: "sum", enabled: false }],
      ["shrink_multiplier", { fn: "avg", enabled: false }],
      ["markdown_weight_window", { fn: "sum", enabled: false }],
      ...DOW.map(
        (_, i) =>
          [`dow_${i}`, { fn: "sum", enabled: false }] as [string, MetricSelection],
      ),
      ["on_hand_weight", { fn: "sum", enabled: false }],
      // Averaged, not summed: adding days of cover across items produces a
      // number with no meaning at all.
      ["days_of_cover", { fn: "avg", enabled: false }],
    ]),
  );

  const togglePreset = (id: PresetId) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

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
    () =>
      items.map((i) => {
        // `aggregateRows` walks flat keys, so the seven rates have to be
        // columns here rather than a nested object.
        const dow: Record<string, number> = {};
        for (let d = 0; d < 7; d++) {
          dow[`dow_${d}`] = i.dow_rates?.[String(d)] ?? 0;
        }
        return {
          ...i,
          ...dow,
          sub_department_description: deptLabel(i.sub_department_description),
        } as unknown as AggRow;
      }),
    [items],
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

  const safeName = `${storeLabel} ${departmentLabel}`
    .replace(/[^a-z0-9]/gi, "_")
    .replace(/_+/g, "_");
  const windowLabel = coverWindow
    ? `${coverWindow.start} to ${coverWindow.end}`
    : "";

  /** The active store's departments. Item rows carry their own storeid, so the
   *  scope comes from the data rather than another prop. */
  const activeStoreId = items.length ? items[0].storeid : null;
  const storeDeptRows = groupRows.filter((r) => r.storeid === activeStoreId);

  const handlePresetDownload = () => {
    const sections: string[] = [];
    if (selected.has("storeOrder")) {
      sections.push(
        `Top to Order — ${storeLabel} — all departments${
          windowLabel ? ` — covers ${windowLabel}` : ""
        }\n${buildStoreOrderCsv(items)}`,
      );
    }
    if (selected.has("actions")) {
      sections.push(
        `Suggested Actions — ${storeLabel} — all departments${
          windowLabel ? ` — covers ${windowLabel}` : ""
        }
${buildActionsCsv(items, notSelling, cycleDays)}`,
      );
    }
    if (selected.has("sheet") && departmentLabel) {
      sections.push(
        `Order Sheet — ${storeLabel} — ${departmentLabel}${
          windowLabel ? ` — covers ${windowLabel}` : ""
        }\n${buildSheetCsv(sheetItems)}`,
      );
    }
    if (selected.has("production")) {
      sections.push(
        `Production — ${storeLabel} — average lb by weekday\n${buildProductionCsv(storeDeptRows)}`,
      );
    }
    if (selected.has("notSelling") && notSelling) {
      sections.push(
        `Not Selling — ${storeLabel} — recent ${notSelling.window.recent.days}d vs prior ${notSelling.window.prior.days}d\n${buildNotSellingCsv(notSelling)}`,
      );
    }
    if (selected.has("rollup")) {
      sections.push(
        `Store Rollup${windowLabel ? ` — covers ${windowLabel}` : ""}\n${buildRollupCsv(groupRows)}`,
      );
    }
    if (sections.length === 0) return;
    downloadCsv(sections.join("\n\n"), `${safeName}_order.csv`);
    onClose();
  };

  const handleCustomDownload = () => {
    if (!columns.length || !aggRows.length) return;
    downloadCsv(
      rowsToCsv(
        columns.map((c) => c.label),
        aggRows.map((r) => columns.map((c) => r[c.key] ?? "")),
      ),
      `${safeName}_custom.csv`,
    );
    onClose();
  };

  const canCustomDownload = columns.length > 0 && aggRows.length > 0;

  /** Quoted on the preset card. Built the same way the file is, so the number
   *  the card promises is the number of rows that come out. */
  const actionCount = useMemo(() => {
    const ns = new Map<string, NotSellingItem>();
    for (const r of notSelling?.items ?? []) ns.set(String(r.product_code), r);
    const recentDays = notSelling?.window.recent.days ?? 0;
    return items.filter(
      (i) =>
        suggestedAction(
          i,
          ns.get(String(i.product_code)),
          recentDays,
          cycleDays,
        ) !== null,
    ).length;
  }, [items, notSelling, cycleDays]);

  // Only offer what the current scope can actually fill. A preset that silently
  // exports a header and no rows is worse than one that is not there.
  const PRESETS: { id: PresetId; label: string; description: string }[] = [
    {
      id: "storeOrder",
      label: "Top to Order",
      description: `${items.length.toLocaleString()} items across every department at ${storeLabel}, heaviest first`,
    },
    {
      id: "actions",
      label: "Suggested Actions",
      description: `${actionCount.toLocaleString()} items at ${storeLabel} with something to do about them, worst first, each with its reasoning`,
    },
    ...(departmentLabel
      ? [
          {
            id: "sheet" as PresetId,
            label: "Order Sheet",
            description: `${sheetItems.length.toLocaleString()} items for ${departmentLabel} as filtered on screen, with a totals row`,
          },
        ]
      : []),
    {
      id: "production",
      label: "Production",
      description: `${storeDeptRows.length.toLocaleString()} departments at ${storeLabel}, with the seven weekday rates`,
    },
    ...(notSelling
      ? [
          {
            id: "notSelling" as PresetId,
            label: "Not Selling",
            description: `${notSelling.items.length.toLocaleString()} dead, stopped and declining items, ranked by pounds lost`,
          },
        ]
      : []),
    {
      id: "rollup",
      label: "Store Rollup",
      description: `${groupRows.length.toLocaleString()} store and department rows behind the tree`,
    },
  ];

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:suggested:v1"
      defaultWidth={1140}
      defaultHeight={960}
    >
      {/* Header */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 py-3 bg-[#1e2a4a]">
        <div>
          <p className="text-custom-white text-[13px] font-semibold">
            Export CSV
          </p>
          <p className="text-custom-white/85 text-[10px] mt-0.5">
            {storeLabel} — {departmentLabel}
            {windowLabel && ` · covers ${windowLabel}`}
          </p>
        </div>
        <div className="flex items-center gap-0.5 bg-custom-white/10 rounded-md p-0.5">
          {(["presets", "custom"] as ModalMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                mode === m
                  ? "bg-custom-white text-[#1e2a4a]"
                  : "text-custom-white/85 hover:text-custom-white"
              }`}
            >
              {m === "presets" ? "Presets" : "Custom"}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="text-custom-white/85 hover:text-custom-white transition-colors justify-self-end"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* ── PRESETS MODE ── */}
      {mode === "presets" && (
        <>
          <div className="px-4 pt-4 pb-2 space-y-3">
            <p className="text-[11px] text-content/85 uppercase tracking-wide font-medium">
              Select data to include
            </p>
            {PRESETS.map((p) => (
              <label
                key={p.id}
                className="flex items-start gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => togglePreset(p.id)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-[#1e2a4a] cursor-pointer flex-shrink-0"
                />
                <div>
                  <p className="text-[13px] font-medium text-content group-hover:text-[#1e2a4a] transition-colors">
                    {p.label}
                  </p>
                  <p className="text-[11px] text-content/85 mt-0.5">
                    {p.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 mt-2">
            <button
              onClick={onClose}
              className="text-[12px] text-content/85 hover:text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePresetDownload}
              disabled={selected.size === 0}
              className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </>
      )}

      {/* ── CUSTOM MODE ── */}
      {mode === "custom" && (
        <>
          <div className="grid grid-cols-[200px_1fr] divide-x divide-gray-100 min-h-[360px] max-h-[calc(100vh-220px)]">
            <div className="overflow-y-auto no-scrollbar p-4 space-y-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">
                  Group By
                </p>
                <div className="space-y-1.5">
                  {DIMS.map((d) => (
                    <label
                      key={d.key}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={groupBy.has(d.key)}
                        onChange={() => toggleGroupBy(d.key)}
                        className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                      />
                      <span className="text-[12px] text-content">{d.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">
                  Metrics
                </p>
                <div className="space-y-2">
                  {METRICS.map((m) => {
                    const sel = metrics.get(m.key)!;
                    return (
                      <div key={m.key} className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={sel.enabled}
                          onChange={() => toggleMetric(m.key)}
                          className="accent-[#1e2a4a] h-3.5 w-3.5 rounded flex-shrink-0"
                        />
                        <span
                          className={`text-[12px] flex-1 ${
                            sel.enabled ? "text-content" : "text-content/85"
                          }`}
                        >
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

              <p className="text-[10px] text-content/85 leading-relaxed">
                Working on {items.length.toLocaleString()} items for{" "}
                {storeLabel} — {departmentLabel}.
              </p>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
                <p className="text-[11px] font-semibold text-content/85 uppercase tracking-wide">
                  Preview
                </p>
                <span className="text-[10px] text-content/85">
                  {aggRows.length === 0
                    ? "No data — select at least one group or metric"
                    : `Showing ${Math.min(PREVIEW_ROWS, aggRows.length)} of ${aggRows.length} rows`}
                </span>
              </div>

              {columns.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6 text-center">
                  <p className="text-[12px] text-content/85 leading-relaxed">
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
                            className="text-left px-3 py-2 text-content/85 font-semibold border-b border-gray-100 whitespace-nowrap"
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
                              className="px-3 py-1.5 text-content/85 whitespace-nowrap border-b border-gray-50"
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
                            className="px-3 py-2 text-[10px] text-content/85"
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

          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={onClose}
              className="text-[12px] text-content/85 hover:text-content transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomDownload}
              disabled={!canCustomDownload}
              className="flex items-center gap-1.5 bg-[#1e2a4a] hover:bg-[#1e2a4a]/85 disabled:opacity-40 text-custom-white text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
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

export default SuggestedExportModal;
