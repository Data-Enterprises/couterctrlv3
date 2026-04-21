import { useEffect, useState } from "react";
import { useOrdersCtx } from "../hooks";
import CatDistribution from "./CatDistribution";
import OrderDistribution from "./OrderDistribution";
import TotalsKpi from "./TotalsKpi";
import VendorDistribution from "./VendorDistribution";
import { defaultSummary, type TotalsSummary } from "./index";

const KpiContainer = () => {
  const ctx = useOrdersCtx();
  const [summary, setSummary] = useState<TotalsSummary>(defaultSummary);

  useEffect(() => {
    if (ctx.filteredOrders.length) {
      const weight = ctx.filteredOrders.reduce((acc, o) => acc + o.weight, 0);
      const cost = ctx.filteredOrders.reduce(
        (acc, o) => {

          if (o.weight > 0) {
            return acc += o.base_cost / o.weight
          }
          return acc += o.base_cost / o.casesize || 1;
        },
        0,
      );
      const retail = ctx.filteredOrders.reduce(
        (acc, o) => acc += o.active_retail_price,
        0,
      );
      const qty = ctx.filteredOrders.reduce((acc, o) => (acc += o.qty), 0);
      const eret = ctx.filteredOrders.reduce(
        (acc, o) =>
          (acc +=
            o.weight > 0
              ? o.active_retail_price * o.weight
              : o.active_retail_price * o.qty),
        0,
      );
      const vendors = new Set(ctx.filteredOrders.map((o) => o.vendor_id)).size;
      const categories = new Set(ctx.filteredOrders.map((o) => o.category))
        .size;
      setSummary({ weight, cost, retail, qty, eret, vendors, categories });
    } else {
      setSummary(defaultSummary);
    }
  }, [ctx.filteredOrders]);

  return (
    <div className="grid grid-cols-4 gap-2">
      <TotalsKpi summary={summary} />
      <OrderDistribution />
      <VendorDistribution />
      <CatDistribution />
    </div>
  );
};

export default KpiContainer;
