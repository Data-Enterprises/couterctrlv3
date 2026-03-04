import { useSubMarginCtx } from "../../hooks";
import { AgGridReact } from "ag-grid-react";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import { theme, itemCols, type ItemRow } from ".";
import { useState, useEffect } from "react";

const ItemsGrid = () => {
  const { margins, selectedWeekDay } = useSubMarginCtx();
  const [gridData, setGridData] = useState<ItemRow[]>([]);

  useEffect(() => {
    // handle the filtering here
  }, []);

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
    setGridData(newData);
  }, [selectedWeekDay]);

  return (
    <div>
      <AgGridReact
        rowData={gridData as ItemRow[]}
        columnDefs={itemCols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default ItemsGrid;
