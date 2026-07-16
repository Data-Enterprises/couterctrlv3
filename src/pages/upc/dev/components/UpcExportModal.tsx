import { useState } from "react";
import { XMarkIcon, ArrowDownTrayIcon } from "@heroicons/react/16/solid";
import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import type { UpcDevTab } from "../../../../features/upcDevSlice";
import { computeUpcSalesCompStats, DAYS, DAY_SHORT } from "../modules/salesComp/salesCompStats";

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
    { id: "up", label: "Trending up" },
    { id: "down", label: "Declining" },
  ],
  association: [
    { id: "all", label: "All levels" },
  ],
};

const TAB_LABELS: Record<UpcDevTab, string> = {
  salesComp: "Sales Comp",
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
  const presets = PRESETS[ctx.activeTab];
  const [selectedPreset, setSelectedPreset] = useState(presets[0].id);
  const [exportShape, setExportShape] = useState<ExportShape>("summary");

  const handleExport = () => {
    const tab = ctx.activeTab;
    const sel = selectedPreset;
    const isSelected = (pc: string) => ctx.selectedUpcs.length === 0 || ctx.selectedUpcs.includes(pc);

    switch (tab) {
      case "salesComp": {
        const data = ctx.salesComp.filter((s) => sel === "all" || isSelected(s.product_code));
        if (exportShape === "summary") {
          const dataLY = ctx.salesCompLY.filter((s) => sel === "all" || isSelected(s.product_code));
          const upcCodes = [...new Set(data.map((s) => s.product_code))];
          const stats = computeUpcSalesCompStats(upcCodes, data, dataLY, ctx.endDate);
          const headers = ["UPC", "Description", "TY Total", "LY Total", "vs LY %", "WoW %", "Peak Day", "Peak Shifted vs LY"];
          const rows = stats.map((s) => [
            s.code,
            s.desc,
            String(Math.round(s.periodTotal)),
            s.hasLY ? String(Math.round(s.lyPeriodTotal)) : "",
            s.vsLYPct === null ? "" : s.vsLYPct.toFixed(1),
            s.wowPct === null ? "" : s.wowPct.toFixed(1),
            DAY_SHORT[s.peakIdx],
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
        const headers = ["UPC", "Description", "Price", "Total Qty", "Total Revenue", "Total Weight"];
        const rows = data.map((o) => [o.product_code, o.product_description, String(o.price), String(o.total_qty), String(o.total_revenue), String(o.total_weight)]);
        download(toBlobCsv(headers, rows), `price_opt_${sel}.csv`);
        break;
      }
      case "trend": {
        const src = ctx.upcTrends.filter((t) => {
          if (!isSelected(t.product_code)) return false;
          if (sel === "up") return t.slope_change > 0;
          if (sel === "down") return t.slope_change < 0;
          return true;
        });
        const headers = ["UPC", "Description", "Trend Date", "Slope Before", "Slope After", "Slope Change", "Mean Before", "Mean After", "Pct Change Mean", "Impact Units"];
        const rows = src.map((t) => [t.product_code, t.product_description, t.trend_date, String(t.slope_before), String(t.slope_after), String(t.slope_change), String(t.mean_before), String(t.mean_after), String(t.pct_change_mean), String(t.impact_units)]);
        download(toBlobCsv(headers, rows), `trends_${sel}.csv`);
        break;
      }
      case "association": {
        const headers = ["Level", "UPC", "Description", "Qty"];
        const rows: string[][] = [];
        ctx.itemAssociations.forEach((level, li) => {
          level.forEach((item) => {
            rows.push([String(li + 1), item.product_code, item.product_description, String(item.qty)]);
          });
        });
        download(toBlobCsv(headers, rows), "associations.csv");
        break;
      }
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.35)" }}
      onClick={onClose}
    >
      <div
        className="bg-custom-white rounded-xl shadow-xl overflow-hidden"
        style={{ width: 360 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="bg-[#1e2a4a] px-5 py-3 flex items-center justify-between">
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
              <div className="text-[10px] font-semibold uppercase tracking-wide text-content/50 mb-2">
                Export shape
              </div>
              <div className="flex flex-col gap-1.5">
                {SHAPES.map((s) => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={exportShape === s.id}
                      onChange={() => setExportShape(s.id)}
                      className="accent-[#1e2a4a]"
                    />
                    <span className="text-[11px] text-content/80">{s.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* presets — scope: which UPCs */}
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-content/50 mb-2">
              Export type
            </div>
            <div className="flex flex-col gap-1.5">
              {presets.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={selectedPreset === p.id}
                    onChange={() => setSelectedPreset(p.id)}
                    className="accent-[#1e2a4a]"
                  />
                  <span className="text-[11px] text-content/80">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          {ctx.selectedUpcs.length > 0 && (
            <div className="text-[10px] text-content/40 bg-gray-50 rounded px-3 py-2">
              {ctx.selectedUpcs.length} UPC{ctx.selectedUpcs.length !== 1 ? "s" : ""} selected — "Selected UPCs" presets will use this filter.
            </div>
          )}

          <button
            onClick={handleExport}
            className="w-full py-2.5 rounded-lg text-[12px] font-semibold text-custom-white flex items-center justify-center gap-2 transition-opacity"
            style={{ background: "#1e2a4a" }}
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpcExportModal;
