import { useEffect, useState } from "react";
import { useOrdersCtx } from "../hooks";
import CatDistribution from "./CatDistribution";
import OrderDistribution from "./OrderDistribution";
import TotalsKpi from "./TotalsKpi";
import VendorDistribution from "./VendorDistribution";
import { defaultSummary, type TotalsSummary } from "./index";
import type { PieData } from "../../sales/mobile";

const KpiContainer = () => {
  const ctx = useOrdersCtx();
  const [summary, setSummary] = useState<TotalsSummary>(defaultSummary);
  const [orderPieData, setOrderPieData] = useState<PieData[]>([]);
  const [vendorPieData, setVendorPieData] = useState<PieData[]>([]);
  const [catPieData, setCatPieData] = useState<PieData[]>([]);

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
            o.scalable > 0
              ? o.active_retail_price * o.weight
              : o.active_retail_price * o.qty),
        0,
      );
      // const vendors = new Set(ctx.filteredOrders.map((o) => o.vendor_id)).size;
      const categories = new Set(ctx.filteredOrders.map((o) => o.category))
        .size;

      const orderPie = [...ctx.filteredOrders].reduce((acc: PieData[], o) => {
        const found = acc.find((a) => a.id === o.order_type);
        if (found) {
          found.value += 1;
        } else {
          acc.push({ id: o.order_type, value: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.value - a.value);

      const vendorPie = [...ctx.filteredOrders].reduce((acc: PieData[], o) => {
        const found = acc.find((a) => a.id === o.vendor_name);
        if (found) {
          found.value += 1;
        } else {
          acc.push({ id: o.vendor_name, value: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.value - a.value);

      const catPie = [...ctx.filteredOrders].reduce((acc: PieData[], o) => {
        const found = acc.find((a) => a.id === o.category_description);
        if (found) {
          found.value += 1;
        } else {
          acc.push({ id: o.category_description, value: 1 });
        }
        return acc;
      }, []).sort((a, b) => b.value - a.value);

      const vendors = new Set(ctx.filteredOrders.map((o) => o.sub_department)).size;

      setSummary({ weight, cost, retail, qty, eret, vendors, categories });
      setOrderPieData(orderPie);
      setVendorPieData(vendorPie);
      setCatPieData(catPie);
    } else {
      setSummary(defaultSummary);
    }
  }, [ctx.filteredOrders]);

  if (!ctx.filteredOrders.length) return null;

  return (
    <div className="flex justify-between gap-2">
      <TotalsKpi summary={summary} />
      <OrderDistribution data={orderPieData} />
      <VendorDistribution data={vendorPieData} />
      <CatDistribution data={catPieData} />
    </div>
  );
};

export default KpiContainer;
