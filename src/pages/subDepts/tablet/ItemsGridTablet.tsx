import { useEffect, useState } from "react";
import { useSubMarginCtx } from "../hooks";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { calculateCogs } from "..";

import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { itemCols, type ItemRow } from "../display/widgets";
import { type ThreshOperator } from "../../../features/subMarginSlice";
import { useSubMarginActions } from "../hooks/useSubMarginActions";
import ItemsGridFiltersTablet from "./ItemsGridFiltersTablet";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

const ItemsGridTablet = () => {
  const dispatch = useAppDispatch();
  const actions = useSubMarginActions();
  const { margins, selectedWeekDay } = useSubMarginCtx();
  const sm = useAppSelector((state) => state.subMargin);
  const [gridData, setGridData] = useState<ItemRow[]>([]);

  useEffect(() => {
    // handle the filtering here
    if (sm.itemGridData.length) {
      const upc = sm.upcFilter;
      const desc = sm.descFilter;
      const sales = sm.salesFilter;
      const qty = sm.qtyFilter;
      const cogs = sm.cogsFilter;
      const margin = sm.marginFilter;

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

      const filteredData = [...sm.itemGridData].filter((item) => {
        const upcMatch = upc ? item.product_code.includes(upc) : true;
        const descMatch = desc
          ? item.product_description.toLowerCase().includes(desc.toLowerCase())
          : true;
        const salesMatch = sales.operator
          ? handleOperator(sales.value, sales.operator, item.total_sales)
          : true;
        const qtyMatch = qty.operator
          ? handleOperator(qty.value, qty.operator, item.qty)
          : true;
        const cogsMatch = cogs.operator
          ? handleOperator(cogs.value, cogs.operator, item.cogs)
          : true;
        const marginMatch = margin.operator
          ? handleOperator(margin.value, margin.operator, item.margin)
          : true;

        return (
          upcMatch &&
          descMatch &&
          salesMatch &&
          qtyMatch &&
          cogsMatch &&
          marginMatch
        );
      });
      setGridData(filteredData);
      dispatch(actions.setFilteredItemGridData(filteredData));
    }
  }, [
    sm.upcFilter,
    sm.descFilter,
    sm.salesFilter,
    sm.qtyFilter,
    sm.cogsFilter,
    sm.marginFilter,
  ]);

  useEffect(() => {
    const dateComp = selectedWeekDay
      ? new Date(selectedWeekDay).toISOString().split("T")[0]
      : "";

    const filtered = margins.filter((margin) => {
      return dateComp ? margin.sale_date.split("T")[0] === dateComp : true;
    });

    const reduced = filtered.reduce((acc: ItemRow[], margin) => {
      const found = acc.find(
        (item) => item.product_code === margin.product_code,
      );
      if (!found) {
        acc.push({
          sub_department_description: margin.sub_department_description,
          product_code: margin.product_code,
          product_description: margin.product_description,
          cogs: calculateCogs(
            margin.net_cost,
            margin.cost,
            margin.case_size,
            margin.qty,
            margin.weight,
          ),
          cost_fees: margin.cost_fees,
          total_sales: margin.total_sales - margin.total_tax,
          net_sales: margin.net_sales,
          total_tax: margin.total_tax,
          qty: margin.qty,
          margin: 0,
        });
      } else {
        found.cogs += calculateCogs(
          margin.net_cost,
          margin.cost,
          margin.case_size,
          margin.qty,
          margin.weight,
        );
        found.total_sales += margin.total_sales - margin.total_tax;
        found.net_sales += margin.net_sales;
        found.total_tax += margin.total_tax;
        found.qty += margin.qty;
      }
      return acc;
    }, []);

    const newData = reduced.map((item) => ({
      ...item,
      margin: ((item.total_sales - item.cogs) / item.total_sales) * 100 || 0,
    }));
    
    dispatch(actions.setItemGridData(newData));
    dispatch(actions.setFilteredItemGridData(newData));
    setGridData(newData);
  }, [selectedWeekDay]);

  const textPos = (header: string) => {
    if (header.toLowerCase() === "net sales") return "hidden";
    if (
      header.toLowerCase() !== "upc" &&
      header.toLowerCase() !== "description"
    )
      return "text-right";
    return "text-left";
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-3 shadow-sm text-sm">
      <ItemsGridFiltersTablet />

      <div className="mt-3 rounded-xl overflow-hidden border border-slate-200/70">
        <div className="grid grid-cols-[1fr_2.4fr_0.9fr_0.6fr_0.6fr_0.8fr_0.9fr_0.8fr] bg-slate-100/90 px-2 py-2 text-[12.5px] font-semibold uppercase tracking-wide text-slate-500">
          {itemCols.map((col, i) => (
            <div
              key={i}
              className={`truncate ${textPos(col.headerName as string)}`}
            >
              {col.headerName}
            </div>
          ))}
        </div>

        <div className="divide-y divide-slate-200/80 bg-custom-white max-h-[calc(100vh-28rem)] overflow-y-auto">
          {gridData.map((data, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_2.4fr_0.9fr_0.6fr_0.6fr_0.8fr_0.9fr_0.8fr] items-center px-2 py-1.5 text-[12.2px] text-slate-700 odd:bg-white even:bg-slate-50/80 hover:bg-sky-50/70 transition-colors duration-150"
            >
              <div className="font-medium text-slate-900 truncate">
                {data.product_code}
              </div>
              <div className="truncate text-slate-600">
                {data.product_description}
              </div>
              <div className="text-right tabular-nums">
                {formatCurrency2(data.total_sales)}
              </div>
              {/* <div className="text-right tabular-nums">
                {formatCurrency2(data.net_sales)}
              </div> */}
              <div className="text-right tabular-nums">
                {formatBigNumber(data.qty, 0)}
              </div>
              <div className="text-right tabular-nums">
                {formatCurrency2(data.total_tax)}
              </div>
              <div className="text-right tabular-nums">
                {formatCurrency2(data.cogs)}
              </div>
              <div className="text-right tabular-nums">
                {data.cost_fees.toFixed(2)}%
              </div>
              <div className="text-right tabular-nums font-semibold text-slate-900">
                {data.margin.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ItemsGridTablet;
