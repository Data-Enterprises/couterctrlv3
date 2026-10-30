import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { getSalesCompKpis } from "../modules/salesComp/SalesCompKpis";
import { getForecastKpis } from "../modules/forecast/ForecastKpis";
import { getPriceOptKpis } from "../modules/priceOpt/PriceOptKpis";
import { getTrendKpis } from "../modules/trend/TrendKpis";
import { getAssociationKpis } from "../modules/association/AssociationKpis";
import { seedDataFor } from "../modules/association/associationStats";
import { getMovementKpis } from "../modules/movement/MovementKpis";
import { movementGrid, movementStores } from "../modules/movement/movementStats";
import { useMovementWindow } from "../modules/movement/useMovementWindow";

const UpcKpiStrip = () => {
  const ctx = useUpcDevCtx();
  const movementWindow = useMovementWindow();

  // No selected UPCs means nothing to summarize — every module's KPI
  // computation either produces meaningless placeholders or (Association)
  // just hasn't fetched anything yet, so the strip shouldn't render at all
  // rather than show empty/dash metrics above the "No UPCs selected" state.
  if (ctx.selectedUpcs.length === 0) return null;

  const kpis = (() => {
    switch (ctx.activeTab) {
      case "salesComp":
        return getSalesCompKpis(ctx.salesComp, ctx.salesCompLY, ctx.selectedUpcs, ctx.endDate);
      case "movement": {
        // The item the grid is showing: the strip describes one item, as the
        // grid does. Same fallback as the tab when nothing is picked yet.
        const inView = ctx.searchedUpcs.filter((u) => ctx.selectedUpcs.includes(u));
        const code =
          ctx.movementSelected && inView.includes(ctx.movementSelected)
            ? ctx.movementSelected
            : inView[0];
        const stores = movementStores(
          ctx.storeids.split(",").map(Number).filter((n) => Number.isFinite(n) && n > 0),
          ctx.assignedStores,
          ctx.movementRows,
        );
        return getMovementKpis(
          movementGrid(ctx.movementRows, code ?? "", stores, movementWindow.weekEndings),
          movementWindow.weeks,
          movementWindow.endIso,
        );
      }
      case "forecast":
        return getForecastKpis(ctx.forecastQtyData, ctx.selectedUpcs);
      case "priceOpt":
        return getPriceOptKpis(ctx.optBestPrices, ctx.optBestPricesByUpc, ctx.selectedUpcs, ctx.fixes);
      case "trend":
        return getTrendKpis(ctx.upcTrends, ctx.selectedUpcs, ctx.fixes, ctx.trendWindow);
      case "association":
        return getAssociationKpis(
          seedDataFor(ctx.selectedUpcs, ctx.associationSeedData, ctx.associationSeedDataKey),
          ctx.associationRerootUpc,
          ctx.associationRerootUpc ? ctx.associationRerootCache[ctx.associationRerootUpc] ?? null : null,
        );
    }
  })();

  return (
    <div
      className="grid divide-x divide-brand_navy/15 border-b border-gray-100 bg-gray-50 flex-shrink-0"
      style={{ gridTemplateColumns: `repeat(${kpis.length}, 1fr)` }}
    >
      {kpis.map((kpi, i) => (
        <div key={i} className="px-4 pt-2.5 pb-2.5 text-center min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {kpi.label}
          </div>
          {kpi.sub && (
            <div className="text-[10px] font-bold text-content mb-0.5">{kpi.sub}</div>
          )}
          <div
            className={`text-[13px] font-bold truncate ${
              kpi.variant === "down"
                ? "text-severity_critical_text"
                : kpi.variant === "up"
                ? "text-severity_healthy_text"
                : "text-content"
            }`}
          >
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UpcKpiStrip;
