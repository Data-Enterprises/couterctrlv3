import { useMemo } from "react";
import { useSubMarginCtx } from "../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { MarginKpi, Mover } from "../../../interfaces";
import SubDeptMarginKpi from "./MarginKpi";

const KpiContainer = () => {
  const ctx = useSubMarginCtx();

  const findTopMover = () => {
    const movers = [...ctx.margins].reduce((acc: Mover[], curr) => {
      const found = acc.find((a) => a.vendor_id === curr.vendor_id);
      if (!found) {
        acc.push({
          vendor_id: curr.vendor_id,
          vendor_name: curr.vendor_name,
          total_sales: curr.total_sales - curr.total_tax,
          qty: curr.qty,
          cogs: curr.calculated_cost * curr.qty,
          gpm: 0,
        });
      } else {
        found.total_sales += curr.total_sales - curr.total_tax;
        found.qty += curr.qty;
        found.cogs += curr.calculated_cost * curr.qty;
      }
      return acc;
    }, []);

    const top = movers
      .filter((m) => m.vendor_id !== null)
      .map((m) => {
        return {
          ...m,
          gpm:
            m.total_sales === 0
              ? 0
              : ((m.total_sales - m.cogs) / m.total_sales) * 100,
        };
      });
    // console.log(
    //   "movers",
    //   top.sort((a, b) => b.gpm - a.gpm),
    // );
    return top.sort((a, b) => b.gpm - a.gpm)[0];
  };

  const kpiData: MarginKpi = useMemo(() => {
    return {
      total_sales: formatCurrency2(
        ctx.margins.reduce(
          (acc, curr) => acc + (curr.total_sales - curr.total_tax),
          0,
        ),
      ),
      qty: formatBigNumber(
        ctx.margins.reduce((acc, curr) => acc + curr.qty, 0),
        0,
      ),
      total_tax: formatCurrency2(
        ctx.margins.reduce((acc, curr) => acc + curr.total_tax, 0),
      ),
      avg_qty: formatBigNumber(
        ctx.margins.reduce((acc, curr) => acc + curr.qty, 0) /
          (ctx.margins.length || 1),
        2,
      ),
      avg_total_sales: formatCurrency2(
        ctx.margins.reduce(
          (acc, curr) => acc + (curr.total_sales - curr.total_tax),
          0,
        ) / ctx.margins.length,
      ),
      vendors: formatBigNumber(
        ctx.margins.reduce((acc: string[], curr) => {
          if (!acc.includes(curr.vendor_name)) {
            acc.push(curr.vendor_name);
          }
          return acc;
        }, []).length,
        0,
      ),
      top_mover: findTopMover(),
      total_cogs: formatCurrency2(
        ctx.margins.reduce((acc, curr) => acc + curr.cost, 0),
      ),
    };
  }, [ctx.margins]);

  return (
    <div className="grid grid-cols-4 gap-2 text-sm font-medium">
      <SubDeptMarginKpi data={kpiData.total_sales} title="Net Sales" />
      <SubDeptMarginKpi data={kpiData.qty} title="Total Qty" />
      <SubDeptMarginKpi data={kpiData.total_tax} title="Total Tax" />
      <SubDeptMarginKpi data={kpiData.vendors} title="Vendors" />

      <SubDeptMarginKpi data={kpiData.avg_total_sales} title="Avg Net Sales" />
      <SubDeptMarginKpi data={kpiData.avg_qty} title="Avg Qty" />
      <SubDeptMarginKpi data={kpiData.total_cogs} title="Total Cost" />
      <SubDeptMarginKpi
        data={kpiData.top_mover.vendor_name}
        title={`Top Vendor`}
      />
    </div>
  );
};

export default KpiContainer;
