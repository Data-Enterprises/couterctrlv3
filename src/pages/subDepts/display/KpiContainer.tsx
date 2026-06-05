import { useSubMarginCtx } from "../hooks";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import type { MarginKpi } from "../../../interfaces";
import SubDeptMarginKpi from "./MarginKpi";
import { gpm } from "../../../functions";
import { calculateCogs } from "..";

const KpiContainer = () => {
  const ctx = useSubMarginCtx();

  const getGpm = () => {
    const total_sales = ctx.margins.reduce(
      (acc, curr) => acc + (curr.total_sales - curr.total_tax),
      0,
    );
    const total_cogs = ctx.margins.reduce(
      (acc, curr) =>
        acc +
        calculateCogs(
          curr.net_cost,
          curr.cost,
          curr.case_size,
          curr.qty,
          curr.weight,
        ),
      0,
    );

    return gpm(total_sales, total_cogs);
  };

  const kpiData: MarginKpi = {
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
    items: formatBigNumber(
      ctx.margins.reduce((acc: string[], curr) => {
        if (!acc.includes(curr.product_code)) {
          acc.push(curr.product_code);
        }
        return acc;
      }, []).length,
      0,
    ),
    gpm: getGpm(),
    vendors: formatBigNumber(
      ctx.margins.reduce((acc: string[], curr) => {
        if (!acc.includes(curr.vendor_name)) {
          acc.push(curr.vendor_name);
        }
        return acc;
      }, []).length,
      0,
    ),
    // top_mover: findTopMover(),
    total_cogs: formatCurrency2(
      ctx.margins.reduce(
        (acc, curr) =>
          acc +
          calculateCogs(
            curr.net_cost,
            curr.cost,
            curr.case_size,
            curr.qty,
            curr.weight,
          ),
        0,
      ),
    ),
  };

  const layout = ctx.isTablet ? "grid grid-cols-6 leading-tight gap-3" : "flex justify-between items-start gap-2"

  return (
    <div className={`${layout} w-full text-[13px] xl:text-sm font-medium select-none px-2`}>
      <SubDeptMarginKpi data={kpiData.total_sales} title="Sales" />
      <SubDeptMarginKpi data={kpiData.total_cogs} title="Cost" />
      <SubDeptMarginKpi data={kpiData.gpm} title="Margin" />
      <SubDeptMarginKpi data={kpiData.qty} title="Qty" />
      <SubDeptMarginKpi data={kpiData.total_tax} title="Tax" />
      <SubDeptMarginKpi data={kpiData.items} title="Unique Items" />
    </div>
  );
};

export default KpiContainer;
