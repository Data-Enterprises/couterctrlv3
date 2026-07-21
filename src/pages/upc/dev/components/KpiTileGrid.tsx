import type { KpiCell } from "../types";

interface Props {
  items: KpiCell[];
}

// One continuous divided KPI band for a single selected item's detail
// panel — matches PopupSubDeptList.tsx's own "selected item" KPI strip
// convention exactly (same one StoreDetailPopup's store-level strip uses
// too): grid-cols-N divide-x border-b bg-gray-50, centered cells,
// font-bold labels/values, delta shown as a rounded pill badge rather than
// inline colored text. Meant to render full-bleed (no side margin/padding
// of its own) directly below a detail panel's title strip. Reusable by
// any module's future per-item detail view, not just Sales Comp.
const KpiTileGrid = ({ items }: Props) => {
  return (
    <div
      className="grid divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 leading-snug"
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
