import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { costCols } from "../display/widgets";
import { type ThreshOperator } from "../../../features/subMarginSlice";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import CostGridFiltersTablet from "./CostGridFiltersTablet";

const CostGridTablet = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const sm = useAppSelector((state) => state.subMargin);

  useEffect(() => {
    if (sm.margins.length) {
      const date = sm.selectedWeekDay;
      const upc = sm.upcFilter;
      const desc = sm.descFilter;
      const unitCost = sm.unitCostFilter;
      const qty = sm.qtyFilter;
      const cogs = sm.cogsFilter;
      const caseCost = sm.caseCostFilter;

      const handleOperator = (
        filter: number,
        operator: ThreshOperator,
        rowValue: number,
      ) => {
        switch (operator) {
          case ">":
            return rowValue > filter;
          case "<":
            return rowValue < filter;
          case "=":
            return rowValue === filter;
          default:
            return true; // if no operator, don't filter
        }
      };

      const filteredData = [...sm.subDeptCost].filter((item) => {
        const dateMatch = date.length ? date === item.date : true;
        const upcMatch = upc.length ? item.product_code.includes(upc) : true;
        const descMatch = desc.length
          ? item.description.toLowerCase().includes(desc.toLowerCase())
          : true;

        const unitCostMatch = unitCost.value
          ? handleOperator(
              unitCost.value,
              unitCost.operator,
              item.calculated_cost,
            )
          : true;
        const qtyMatch = qty.operator.length
          ? handleOperator(qty.value, qty.operator, item.qty)
          : true;
        const cogsMatch = cogs.operator.length
          ? handleOperator(cogs.value, cogs.operator, item.total_cost)
          : true;
        const caseCostMatch = caseCost.operator.length
          ? handleOperator(caseCost.value, caseCost.operator, item.cost)
          : true;

        return (
          dateMatch &&
          upcMatch &&
          descMatch &&
          unitCostMatch &&
          qtyMatch &&
          cogsMatch &&
          caseCostMatch
        );
      });

      dispatch(actions.setFilteredCostGridData(filteredData));
    }
  }, [
    sm.subDeptGridView,
    sm.selectedWeekDay,
    sm.upcFilter,
    sm.descFilter,
    sm.caseCostFilter,
    sm.cogsFilter,
    sm.qtyFilter,
    sm.unitCostFilter,
  ]);

  const textPos = (header: string) => {
    if (
      header.toLowerCase() !== "upc" &&
      header.toLowerCase() !== "description"
    )
      return "text-right";
    return "text-left";
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-sm text-sm">
      <CostGridFiltersTablet />
      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200/70">
        <div className="grid grid-cols-[0.9fr_2.1fr_0.7fr_1fr_0.6fr_0.7fr] bg-slate-100/90 px-2 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">
          {costCols.map((col, i) => (
            <div
              key={i}
              className={`truncate ${textPos(col.headerName as string)}`}
            >
              {col.headerName}
            </div>
          ))}
        </div>

        <div className="divide-y divide-slate-200/80 bg-custom-white max-h-[calc(100vh-28rem)] overflow-y-auto">
          {sm.filteredCostGridData.map((data, i) => (
            <div
              key={i}
              className="grid grid-cols-[0.9fr_2.1fr_0.7fr_1fr_0.6fr_0.7fr] items-center px-2 py-1.5 text-[12.2px] text-slate-700 odd:bg-white even:bg-slate-50/80 hover:bg-sky-50/70 transition-colors duration-150"
            >
              <div className="font-medium text-slate-900 truncate">
                {data.product_code}
              </div>
              <div className="truncate text-slate-600">{data.description}</div>
              <div className="text-right tabular-nums">
                {formatCurrency2(data.calculated_cost)}
              </div>
              <div className="text-right tabular-nums">
                {formatCurrency2(data.cost)}
              </div>
              <div className="text-right tabular-nums">
                {formatBigNumber(data.qty, 0)}
              </div>
              <div className="text-right tabular-nums">
                {formatCurrency2(data.total_cost)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CostGridTablet;
