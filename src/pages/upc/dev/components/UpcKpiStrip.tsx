import { useUpcDevCtx } from "../hooks/useUpcDevCtx";
import { getSalesCompKpis } from "../modules/salesComp/SalesCompKpis";
import { getForecastKpis } from "../modules/forecast/ForecastKpis";
import { getPriceOptKpis } from "../modules/priceOpt/PriceOptKpis";
import { getTrendKpis } from "../modules/trend/TrendKpis";
import { getAssociationKpis } from "../modules/association/AssociationKpis";

const UpcKpiStrip = () => {
  const ctx = useUpcDevCtx();

  const kpis = (() => {
    switch (ctx.activeTab) {
      case "salesComp":
        return getSalesCompKpis(ctx.salesComp, ctx.salesCompLY, ctx.selectedUpcs, ctx.endDate);
      case "forecast":
        return getForecastKpis(ctx.forecastQtyData, ctx.selectedUpcs);
      case "priceOpt": {
        const resolvedStoreId = ctx.searchType === "Store" ? ctx.selectedStore.storeid : ctx.priceOptStoreId;
        return getPriceOptKpis(ctx.optBestPrices, ctx.optBestPricesByUpc, ctx.selectedUpcs, ctx.currentPriceCost, resolvedStoreId);
      }
      case "trend":
        return getTrendKpis(ctx.upcTrends, ctx.selectedUpcs);
      case "association":
        return getAssociationKpis(ctx.itemAssociations, ctx.upcs);
    }
  })();

  return (
    <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
      {kpis.map((kpi, i) => (
        <div key={i} className="px-4 pt-2.5 pb-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            {kpi.label}
          </div>
          {kpi.sub && (
            <div className="text-[10px] font-bold text-content mb-0.5">{kpi.sub}</div>
          )}
          <div
            className={`text-[14px] font-bold ${
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
