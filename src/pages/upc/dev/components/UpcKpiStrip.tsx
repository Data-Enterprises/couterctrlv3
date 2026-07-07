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
        return getSalesCompKpis(ctx.salesComp, ctx.selectedUpcs);
      case "forecast":
        return getForecastKpis(ctx.forecastQtyData, ctx.selectedUpcs);
      case "priceOpt":
        return getPriceOptKpis(ctx.optBestPrices, ctx.selectedUpcs);
      case "trend":
        return getTrendKpis(ctx.upcTrends, ctx.selectedUpcs);
      case "association":
        return getAssociationKpis(ctx.itemAssociations, ctx.upcs);
    }
  })();

  return (
    <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
      {kpis.map((kpi, i) => (
        <div key={i} className="px-4 py-2.5">
          <div className="text-[9px] font-medium uppercase tracking-wide text-content/70">
            {kpi.label}
          </div>
          {kpi.sub && (
            <div className="text-[8px] text-content/55 italic mb-0.5">{kpi.sub}</div>
          )}
          <div className="text-[13px] font-semibold text-content">{kpi.value}</div>
        </div>
      ))}
    </div>
  );
};

export default UpcKpiStrip;
