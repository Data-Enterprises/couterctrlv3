import { useEffect, useState } from "react";
import { useSubMarginCtx } from "../../hooks";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { theme, itemCols, type ItemRow } from ".";
import {
  setFilteredItemGridData,
  setItemGridData,
  type ThreshOperator,
} from "../../../../features/subMarginSlice";

const ItemsGrid = () => {
  const dispatch = useAppDispatch();
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
      dispatch(setFilteredItemGridData(filteredData));
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
    const dateComp = new Date(selectedWeekDay).toISOString().split("T")[0];
    const filtered = margins.filter(
      (margin) => margin.sale_date.split("T")[0] === dateComp,
    );

    const reduced = filtered.reduce((acc: ItemRow[], margin) => {
      const found = acc.find(
        (item) => item.product_code === margin.product_code,
      );
      if (!found) {
        acc.push({
          sub_department_description: margin.sub_department_description,
          product_code: margin.product_code,
          product_description: margin.product_description,
          cogs: margin.calculated_cost * margin.qty,
          total_sales: margin.total_sales - margin.total_tax,
          net_sales: margin.net_sales,
          total_tax: margin.total_tax,
          qty: margin.qty,
          margin: 0,
        });
      } else {
        found.cogs += margin.calculated_cost * margin.qty;
        found.total_sales += margin.total_sales - margin.total_tax;
        found.net_sales += margin.net_sales;
        found.total_tax += margin.total_tax;
        found.qty += margin.qty;
      }
      return acc;
    }, []);

    const newData = reduced.map((item) => ({
      ...item,
      margin: ((item.total_sales - item.cogs) / item.total_sales) * 100,
    }));
    dispatch(setItemGridData(newData));
    dispatch(setFilteredItemGridData(newData));
    setGridData(newData);
  }, [selectedWeekDay]);

  return (
    <div>
      <AgGridReact
        rowData={gridData}
        columnDefs={itemCols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default ItemsGrid;
