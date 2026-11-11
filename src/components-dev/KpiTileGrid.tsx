// Interfaces
import type { KpiCell } from "./interfaces";

interface KpiTileGridProps {
  items: KpiCell[];
}

/** A full-width band of KPI cells (label, value, optional delta pill) shown
 *  under a selected item's detail title. */
// One continuous divided KPI band for a single selected item's detail
// panel — matches PopupSubDeptList.tsx's own "selected item" KPI strip
// convention exactly (same one StoreDetailPopup's store-level strip uses
// too): grid-cols-N divide-x border-b bg-fill_soft, centered cells,
// font-bold labels/values, delta shown as a rounded pill badge rather than
// inline colored text. Meant to render full-bleed (no side margin/padding
// of its own) directly below a detail panel's title strip. Reusable by
// any module's future per-item detail view, not just Sales Comp.
const KpiTileGrid = ({ items }: KpiTileGridProps) => {
  return (
    <div
      className="grid divide-x divide-brand_navy/15 border-b border-line_hair bg-fill_soft leading-snug"
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((kpi) => (
        <div key={kpi.label} className="px-4 py-3 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {kpi.label}
          </div>
          <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
            <span
              className={`text-[13px] font-bold ${
                kpi.variant === "up"
                  ? "text-severity_healthy_text"
                  : kpi.variant === "down"
                  ? "text-severity_critical_text"
                  : "text-content"
              }`}
            >
              {kpi.value}
            </span>
            {kpi.sub && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  kpi.subVariant === "up"
                    ? "bg-severity_healthy_bg text-severity_healthy_text"
                    : kpi.subVariant === "neutral"
                    ? "bg-gray-200 text-content"
                    : "bg-severity_critical_bg text-severity_critical_text"
                }`}
              >
                {kpi.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KpiTileGrid;
