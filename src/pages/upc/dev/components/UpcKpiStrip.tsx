import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { getSalesCompKpis } from "../modules/salesComp/SalesCompKpis";
import { getForecastKpis } from "../modules/forecast/ForecastKpis";
import { getPriceOptKpis } from "../modules/priceOpt/PriceOptKpis";
import { getTrendKpis } from "../modules/trend/TrendKpis";
import { getAssociationKpis } from "../modules/association/AssociationKpis";

const UpcKpiStrip = () => {
  const ctx = useUpcDevCtx();

  // No selected UPCs means nothing to summarize — every module's KPI
  // computation either produces meaningless placeholders or (Association)
  // just hasn't fetched anything yet, so the strip shouldn't render at all
  // rather than show empty/dash metrics above the "No UPCs selected" state.
  if (ctx.selectedUpcs.length === 0) return null;

  const kpis = (() => {
    switch (ctx.activeTab) {
      case "salesComp":
        return getSalesCompKpis(ctx.salesComp, ctx.salesCompLY, ctx.selectedUpcs, ctx.endDate);
      case "forecast":
        return getForecastKpis(ctx.forecastQtyData, ctx.selectedUpcs);
      case "priceOpt":
        return getPriceOptKpis(ctx.optBestPrices, ctx.optBestPricesByUpc, ctx.selectedUpcs);
      case "trend":
        return getTrendKpis(ctx.upcTrends, ctx.selectedUpcs);
      case "association":
        return getAssociationKpis(
          ctx.associationSeedData,
          ctx.associationRerootUpc,
          ctx.associationRerootUpc ? ctx.associationRerootCache[ctx.associationRerootUpc] ?? null : null,
        );
    }
  })();

  return (
    <div
      className="grid divide-x divide-[#1e2a4a]/15 border-b border-gray-100 bg-gray-50 flex-shrink-0"
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
