import { useState } from "react";
import ResizableModalShell from "../../../../components-dev/modals/ResizableModalShell";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import type { UpcDevTab, AssociationItem } from "../../../../features/dev/devUpcDevSlice";
import {
  computeUpcSalesCompStats,
  salesCompCodes,
  salesCompRange,
  DAYS,
  DAY_SHORT,
} from "../modules/salesComp/salesCompStats";
import { getTrendStatus, impactUnits, isDecline } from "../modules/trend/trendStats";
import { computePriceOptRowSummary } from "../modules/priceOpt/priceOptStats";
import { movementCsv, movementStores } from "../modules/movement/movementStats";
import { useMovementWindow } from "../modules/movement/useMovementWindow";
import { exportWaitReason } from "./exportWait";
import {
  seedDataFor,
  getDisplayItems,
  getDepartmentBreakdown,
  getQueryDepartments,
  splitDeptBreakdown,
} from "../modules/association/associationStats";

interface Props {
  onClose: () => void;
}

type Preset = { id: string; label: string };
type ExportShape = "summary" | "detail";

const SHAPES: { id: ExportShape; label: string }[] = [
  { id: "summary", label: "Summary — Total, vs LY, WoW, Peak day" },
  { id: "detail", label: "Weekly detail — raw rows" },
];

const PRESETS: Record<UpcDevTab, Preset[]> = {
  salesComp: [
    { id: "all", label: "All UPCs" },
    { id: "selected", label: "Selected UPCs" },
  ],
  movement: [
    { id: "all", label: "All UPCs" },
    { id: "selected", label: "Selected UPCs" },
  ],
  forecast: [
    { id: "dates", label: "Date history" },
    { id: "metrics", label: "Metrics only" },
  ],
  priceOpt: [
    { id: "all", label: "All UPCs" },
    { id: "selected", label: "Selected UPCs" },
  ],
  trend: [
    { id: "all", label: "All trends" },
    { id: "growing", label: "Growing" },
    { id: "declining", label: "Declining" },
    { id: "reduced-availability", label: "Reduced availability" },
    { id: "new", label: "New since pivot" },
  ],
  association: [
    { id: "companions", label: "Companions (current view)" },
    { id: "seed", label: "Seed items" },
    { id: "full", label: "Full export (seed + companions)" },
    { id: "depts", label: "Department rollup" },
  ],
};

const TAB_LABELS: Record<UpcDevTab, string> = {
  salesComp: "Sales Comp",
  movement: "Movement",
  forecast: "Forecast",
  priceOpt: "Price Opt",
  trend: "Trend",
  association: "Association",
};

const toBlobCsv = (headers: string[], rows: string[][]): Blob => {
  const lines = [headers.join(","), ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))];
  return new Blob([lines.join("\n")], { type: "text/csv" });
};

const download = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const UpcExportModal = ({ onClose }: Props) => {
  const ctx = useUpcDevCtx();
  const movementWindow = useMovementWindow();
  // "New since pivot" is a status that only exists behind the flag, so on
  // prod the preset would filter to nothing.
  const presets = PRESETS[ctx.activeTab].filter((p) => ctx.fixes || p.id !== "new");
  const [selectedPreset, setSelectedPreset] = useState(presets[0].id);
  const [exportShape, setExportShape] = useState<ExportShape>("summary");

  /** Ticked in the left list. Nothing ticked means nothing, as on screen,
   *  which reads "No UPCs selected" -- it used to mean every UPC, so "Selected
   *  UPCs" with none ticked downloaded all of them. */
  const isSelected = (pc: string) => ctx.selectedUpcs.includes(pc);
  const nothingSelected = ctx.selectedUpcs.length === 0;
  // The seed answer only if it is for the UPCs ticked now: see seedDataFor.
  const seedData = seedDataFor(
    ctx.selectedUpcs,
    ctx.associationSeedData,
    ctx.associationSeedDataKey,
  );

  const waitReason = exportWaitReason({
    tab: ctx.activeTab,
    preset: selectedPreset,
    shape: exportShape,
    searchedUpcs: ctx.searchedUpcs,
    selectedUpcs: ctx.selectedUpcs,
    salesCompCoverage: ctx.salesCompCoverage,
    salesCompLYLoading: ctx.salesCompLYLoading,
    priceOptCoverage: ctx.priceOptCoverage,
    trendCoverage: ctx.trendCoverage,
    movementCoverage: ctx.movementCoverage,
    associationSeedReady: seedData !== null,
    associationSeedError: ctx.associationSeedError,
    associationRerootUpc: ctx.associationRerootUpc,
    associationRerootLoaded: Boolean(
      ctx.associationRerootUpc && ctx.associationRerootCache[ctx.associationRerootUpc],
    ),
  });

  const handleExport = () => {
    if (waitReason) return;
    const tab = ctx.activeTab;
    const sel = selectedPreset;

    switch (tab) {
      case "salesComp": {
        const data = ctx.salesComp.filter((s) => sel === "all" || isSelected(s.product_code));
        if (exportShape === "summary") {
          const dataLY = ctx.salesCompLY.filter((s) => sel === "all" || isSelected(s.product_code));
          const upcCodes = salesCompCodes(data, dataLY);
          const stats = computeUpcSalesCompStats(
            upcCodes,
            data,
            dataLY,
            salesCompRange(ctx.startDate, ctx.endDate),
          );
          const headers = ["UPC", "Description", "TY Total", "LY Total", "vs LY %", "WoW %", "Peak Day", "Peak Shifted vs LY"];
          const rows = stats.map((s) => [
            s.code,
            s.desc,
            String(Math.round(s.periodTotal)),
            s.hasLY ? String(Math.round(s.lyPeriodTotal)) : "",
            s.vsLYPct === null ? "" : s.vsLYPct.toFixed(2),
            s.wowPct === null ? "" : s.wowPct.toFixed(2),
            s.peakIdx >= 0 ? DAY_SHORT[s.peakIdx] : "",
            s.hasLY ? (s.peakShifted ? "Yes" : "No") : "",
          ]);
          download(toBlobCsv(headers, rows), `sales_comp_summary_${sel}.csv`);
        } else {
          const headers = ["UPC", "Description", "Week", ...DAYS.map((d) => d.slice(0, 3)), "Total"];
          const rows = data.map((s) => {
            const total = DAYS.reduce((acc, d) => acc + (s[d] ?? 0), 0);
            return [s.product_code, s.description, s.week, ...DAYS.map((d) => String(s[d] ?? 0)), String(total)];
          });
          download(toBlobCsv(headers, rows), `sales_comp_detail_${sel}.csv`);
        }
        break;
      }
      case "forecast": {
        if (sel === "dates") {
          const data = ctx.forecastExport.filter((f) => isSelected(f.upc));
          const headers = ["UPC", "Description", "Date", "Quantity"];
          const rows = data.map((f) => [f.upc, f.description, f.date, String(f.quantity)]);
          download(toBlobCsv(headers, rows), "forecast_dates.csv");
        } else {
          const data = ctx.forecastMetricExport.filter((f) => isSelected(f.upc));
          const headers = ["UPC", "Description", "Avg Daily Qty", "Days Active", "Max Day Qty", "Total Qty"];
          const rows = data.map((f) => [f.upc, f.description, String(f.avg_daily_qty), String(f.days_active), String(f.max_day_qty), String(f.qty)]);
          download(toBlobCsv(headers, rows), "forecast_metrics.csv");
        }
        break;
      }
      case "priceOpt": {
        const data = ctx.optBestPricesByUpc.filter((o) => sel === "all" || isSelected(o.product_code));
        // "Best Qty" meant a ring count on scale items, where the price is per
        // pound — the Unit column says which one a row is in, so a mixed
        // export can still be summed correctly downstream.
        const headers = ctx.fixes
          ? ["UPC", "Description", "Best Price", "Best Revenue", "Best Volume", "Unit", "Elasticity", "Price Points"]
          : ["UPC", "Description", "Best Price", "Best Revenue", "Best Qty", "Elasticity", "Price Points"];
        // The panel's own summary, so the file's points, elasticity and
        // volume are the ones on screen.
        const rows = data.map((row) => {
          const s = computePriceOptRowSummary(row, ctx.optBestPrices, ctx.fixes);
          return [
            row.product_code,
            row.product_description,
            String(row.price),
            String(ctx.fixes ? s.bestRevenue : row.total_revenue),
            String(ctx.fixes ? s.bestUnits : row.total_qty),
            ...(ctx.fixes ? [s.weighted ? "lb" : "ea"] : []),
            s.elasticity !== null ? s.elasticity.toFixed(2) : "",
            String(s.points.length),
          ];
        });
        download(toBlobCsv(headers, rows), `price_opt_${sel}.csv`);
        break;
      }
      case "trend": {
        const src = ctx.upcTrends.filter((t) => {
          if (!isSelected(t.product_code)) return false;
          if (sel === "all") return true;
          const status = getTrendStatus(t, ctx.fixes, ctx.trendWindow);
          if (sel === "declining") return isDecline(status);
          return status === sel;
        });
        const headers = ["UPC", "Description", "Status", "Slope Before", "Slope After", "Slope Change", "Confidence", "Mean Before", "Mean After", "Pct Change Mean", "Impact Units"];
        const rows = src.map((t) => [t.product_code, t.product_description, getTrendStatus(t, ctx.fixes, ctx.trendWindow), String(t.slope_before), String(t.slope_after), String(t.slope_change), String(t["r2-after"]), String(t.mean_before), String(t.mean_after), String(t.pct_change_mean), ctx.fixes ? String(Math.round(impactUnits(t, ctx.fixes, ctx.trendWindow))) : String(t.impact_units)]);
        download(toBlobCsv(headers, rows), `trends_${sel}.csv`);
        break;
      }
      case "movement": {
        // The grid's shape: a line per UPC per store, a column per week
        // ending. Every store in the search is in it for every UPC, blanks
        // included, as on screen.
        const codes = ctx.searchedUpcs.filter((u) => sel === "all" || isSelected(u));
        const stores = movementStores(
          ctx.storeids.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0),
          ctx.assignedStores,
          ctx.movementRows,
        );
        const { headers, lines } = movementCsv(
          ctx.movementRows,
          codes,
          new Map(ctx.upcItems.map((i) => [i.product_code, i.description])),
          stores,
          movementWindow.weekEndings,
        );
        download(
          toBlobCsv(headers, lines),
          `movement_${movementWindow.weeks}wk_ending_${movementWindow.endIso}_${sel}.csv`,
        );
        break;
      }
      case "association": {
        // Current view is reroot-aware: once re-rooted, "companions" and
        // "department rollup" reflect the reroot target's own result, same
        // as the on-screen grid/CTA do — not the stale seed-level fetch.
        // Seed items stay tied to the original seed set regardless of
        // reroot state, matching the left panel's own persistent list.
        const rerootUpc = ctx.associationRerootUpc;
        const rerootResult = rerootUpc ? ctx.associationRerootCache[rerootUpc] : null;
        const activeResult = rerootUpc ? rerootResult : seedData;
        const activeItems = activeResult ? getDisplayItems(activeResult.items, rerootUpc) : [];
        const seedItems = (seedData?.items ?? []).filter((i) => i.is_seed);
        const rerootTargetItem = rerootUpc ? rerootResult?.items.find((i) => i.is_seed) : undefined;

        const itemFields = (item: AssociationItem) => [
          item.product_code,
          item.product_description,
          item.sub_department_description,
          String(item.qty),
          String(item.basket_count),
          item.revenue.toFixed(2),
          item.avg_price.toFixed(2),
          item.attach_rate.toFixed(2),
        ];
        const ITEM_HEADERS = ["UPC", "Description", "Sub Dept", "Qty", "Basket Count", "Revenue", "Avg Price", "Attach Rate %"];

        if (sel === "companions") {
          const rows = activeItems.map((item) => itemFields(item));
          download(toBlobCsv(ITEM_HEADERS, rows), "association_companions.csv");
        } else if (sel === "seed") {
          const rows = seedItems.map((item) => itemFields(item));
          download(toBlobCsv(ITEM_HEADERS, rows), "association_seed_items.csv");
        } else if (sel === "full") {
          const headers = ["Type", ...ITEM_HEADERS];
          const rows: string[][] = [
            ...seedItems.map((item) => ["Seed", ...itemFields(item)]),
            ...(rerootTargetItem ? [["Reroot Target", ...itemFields(rerootTargetItem)]] : []),
            ...activeItems.map((item) => [rerootUpc ? "Reroot Companion" : "Companion", ...itemFields(item)]),
          ];
          download(toBlobCsv(headers, rows), "association_full.csv");
        } else if (sel === "depts") {
          const queryDepartments = activeResult ? getQueryDepartments(activeResult.items) : new Set<number>();
          const { cross, same } = splitDeptBreakdown(getDepartmentBreakdown(activeItems), queryDepartments);
          const headers = ["Group", "Sub Dept", "Item Count", "Revenue"];
          const rows: string[][] = [
            ...cross.map((d) => ["Cross Sub Dept", d.label, String(d.count), d.revenue.toFixed(2)]),
            ...same.map((d) => ["Same as seed", d.label, String(d.count), d.revenue.toFixed(2)]),
          ];
          download(toBlobCsv(headers, rows), "association_department_rollup.csv");
        }
        break;
      }
    }
    onClose();
  };

  return (
    <ResizableModalShell
      onClose={onClose}
      storageKey="export-modal:upc"
      defaultWidth={440}
      defaultHeight={520}
    >
        {/* header */}
        <div className="bg-brand_navy px-5 py-3 flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-custom-white">Export CSV</div>
            <div className="text-[10px] mt-0.5" style={{ color: "rgb(var(--color-custom-white) / 0.50)" }}>
              {TAB_LABELS[ctx.activeTab]}
            </div>
          </div>
          <button onClick={onClose} className="text-custom-white/60 hover:text-custom-white transition-colors">
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* shape — sales comp only: what the rows represent */}
          {ctx.activeTab === "salesComp" && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">
                Export shape
              </div>
              <div className="flex flex-col gap-1.5">
                {SHAPES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={exportShape === s.id}
                      onChange={() => setExportShape(s.id)}
                      className="accent-brand_navy"
                    />
                    <span className="text-[11px] text-content/85">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* presets — scope: which UPCs */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/85 mb-2">
              Export type
            </div>
            <div className="flex flex-col gap-1.5">
              {presets.map((p) => {
                const unavailable = p.id === "selected" && nothingSelected;
                return (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 ${unavailable ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="radio"
                      checked={selectedPreset === p.id}
                      disabled={unavailable}
                      onChange={() => setSelectedPreset(p.id)}
                      className="accent-brand_navy"
                    />
                    <span className="text-[11px] text-content/85">
                      {p.label}
                      {unavailable ? " (none selected)" : ""}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {ctx.selectedUpcs.length > 0 && (
            <div className="text-[10px] text-content/85 bg-gray-50 rounded px-3 py-2">
              {ctx.selectedUpcs.length} UPC{ctx.selectedUpcs.length !== 1 ? "s" : ""} selected — "Selected UPCs" presets will use this filter.
            </div>
          )}

          {waitReason && (
            <div className="text-[10px] text-content/85 bg-gray-50 rounded px-3 py-2">
              {waitReason}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={waitReason !== null}
            className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-custom-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-40"
            style={{ background: "rgb(var(--color-brand-navy))" }}
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>
    </ResizableModalShell>
  );
};

export default UpcExportModal;
