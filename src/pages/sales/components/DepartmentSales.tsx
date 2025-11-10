import { useAppSelector } from "../../../hooks";
import type { DepartmentSale } from "../../../interfaces";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import "../utils/grid.css";

// Ag Grid React
import {
  themeQuartz,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, ColGroupDef } from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

const DepartmentSales = () => {
  const sales = useAppSelector((state) => state.sales);
  const colDefs: (ColDef<DepartmentSale> | ColGroupDef<DepartmentSale>)[] = [
    {
      headerName: "Dept",
      field: "sub_department_description",
      flex: 1,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Sales",
      field: "sales",
      flex: 0.8,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatCurrency2(params.value as number),
    },
    {
      headerName: "Qty",
      field: "qty",
      flex: 0.8,
      resizable: false,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatBigNumber(params.value as number, 0),
    },
  ];

  const theme = themeQuartz.withParams({
    headerHeight: 40,
    rowHeight: 25.5,
    headerBackgroundColor: "#3b82f6",
    headerTextColor: "#ffffff",
    oddRowBackgroundColor: "#bfdbfe",
    rowHoverColor: "#93c5fd",
    headerFontWeight: "bold",
    dataFontSize: 13,
    selectCellBorder: "transparent",
    rowBorder: "1px solid white",
  });

  return (
    <div data-testid="dept-sales" className="bg-custom-white rounded-lg shadow-lg no-scrollbar">
      <div className="h-[100%] relative no-scrollbar">
        <AgGridReact
          rowData={sales.departmentSales}
          columnDefs={colDefs}
          headerHeight={28}
          pagination={true}
          paginationAutoPageSize={true}
          animateRows={true}
          enableCellTextSelection={true}
          theme={theme}
          className="no-scrollbar"
        />
      </div>
    </div>
  );
};

export default DepartmentSales;
