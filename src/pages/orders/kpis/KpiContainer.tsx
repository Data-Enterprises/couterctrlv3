import { useEffect, useState } from "react";
import { useOrdersCtx } from "../hooks";
import CatDistribution from "./CatDistribution";
import OrderDistribution from "./OrderDistribution";
import TotalsKpi from "./TotalsKpi";
import VendorDistribution from "./VendorDistribution";
import { defaultSummary, type TotalsSummary } from "./index";
import type { PieData } from "../../sales/mobile";
import { getCogs } from "..";

const orderTypes = ["PER", "DAM", "DMG", "INV"];

const KpiContainer = () => {
  const ctx = useOrdersCtx();
  const [summary, setSummary] = useState<TotalsSummary>(defaultSummary);
  const [orderPieData, setOrderPieData] = useState<PieData[]>([]);
  const [vendorPieData, setVendorPieData] = useState<PieData[]>([]);
  const [catPieData, setCatPieData] = useState<PieData[]>([]);

  useEffect(() => {
    if (ctx.filteredOrders.length) {
      const current = [...ctx.filteredOrders].filter((o) => {
        const statusCheck = o.status
          .toLowerCase()
          .includes(ctx.orderStatusFilter);
        const subIdCheck =
          ctx.subIdsFilter.length === 0 ||
          ctx.subIdsFilter.includes(o.sub_department);
        return statusCheck && subIdCheck;
      });

      const weight = current.reduce((acc, o) => acc + o.weight, 0);

      const tpr = current.reduce((acc, o) => (acc += o.tpr), 0);

      const cost = current.reduce((acc, o) => {
        const cogs = getCogs(
          o.base_cost,
          o.qty,
          o.scalable,
          o.weight,
          o.casesize,
        );
        return (acc += cogs);
      }, 0);

      const qty = current.reduce((acc, o) => (acc += o.qty), 0);
      const eret = current.reduce(
        (acc, o) =>
          (acc +=
            o.scalable > 0
              ? o.active_retail_price * o.weight
              : o.active_retail_price * o.qty),
        0,
      );

      const orderPie = current
        .reduce((acc: PieData[], o) => {
          const found = acc.find((a) => a.id === o.order_type);
          if (found) {
            found.value += 1;
          } else {
            acc.push({ id: o.order_type, value: 1, storeid: o.storeid });
          }
          return acc;
        }, [])
        .sort((a, b) => b.value - a.value);

      const vendorPie = current
        .reduce((acc: PieData[], o) => {
          const found = acc.find((a) => a.id === o.vendor_name);
          if (found) {
            found.value += 1;
          } else {
            acc.push({ id: o.vendor_name, value: 1, storeid: o.storeid });
          }
          return acc;
        }, [])
        .sort((a, b) => b.value - a.value);

      const catPie = current
        .reduce((acc: PieData[], o) => {
          const found = acc.find((a) => a.id === o.category_description);
          if (found) {
            found.value += 1;
          } else {
            acc.push({ id: o.category_description, value: 1, storeid: o.storeid });
          }
          return acc;
        }, [])
        .sort((a, b) => b.value - a.value);

      setSummary({
        weight,
        cost,
        qty,
        eret,
        tpr,
        uniqueItems: new Set(current.map((o) => o.product_code)).size,
      });

      const orderPieConcat = () => {
        const result = [...orderPie];
        orderTypes.forEach((type) => {
          const found = result.find((r) => r.id === type);
          if (!found) {
            result.push({ id: type, value: 0, storeid: 0 });
          }
        });
        return result;
      };
      setOrderPieData(orderPieConcat());
      setVendorPieData(vendorPie);
      setCatPieData(catPie);
    } else {
      setSummary(defaultSummary);
    }
  }, [ctx.filteredOrders, ctx.subIdsFilter]);

  if (!ctx.filteredOrders.length) return null;

  return (
    <div className="flex justify-between gap-2 select-none">
      <TotalsKpi summary={summary} />
      <OrderDistribution data={orderPieData} />
      <VendorDistribution data={vendorPieData} />
      <CatDistribution data={catPieData} />
    </div>
  );
};

export default KpiContainer;
