import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { DepartmentSale, JsonError } from "../../../interfaces";
import {
  formatCurrency2,
  formatBigNumber,
  formatGoliathDate,
} from "../../../utils";
import "../utils/grid.css";

// Ag Grid React
import {
  themeQuartz,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-grid-community";

import { AgGridReact } from "ag-grid-react";
import type { ColDef, ColGroupDef } from "ag-grid-community";
import { useEffect } from "react";
import { getHourlyStoreDepts } from "../../../api/sales";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { setDepartmentSales } from "../../../features/salesSlice";
ModuleRegistry.registerModules([AllCommunityModule]);

const DepartmentSales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const sales = useAppSelector((state) => state.sales);

  useEffect(() => {
    const p = sales.selectedSalesPanel;
    const date = sales.selectedSalesPanel.sale_date.split("T")[0];

    const start = p.sale_date ? date : formatGoliathDate(search.startDate);
    const end = p.sale_date ? date : formatGoliathDate(search.endDate);

    const searchValue = p.storeid > 0 ? p.storeid : search.lastStore;
    getHourlyStoreDepts(context.url, context.token, searchValue, start, end)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setDepartmentSales(j.sales));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Hourly Store Depts data: " + err.message);
      });
  }, [sales.selectedSalesPanel]);

  const colDefs: (ColDef<DepartmentSale> | ColGroupDef<DepartmentSale>)[] = [
    {
      headerName: "Dept",
      field: "sub_department_description",
      flex: 1,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus select-none",
    },
    {
      headerName: "Dept Id",
      field: "sub_department",
      flex: 0.5,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus select-none text-right",
      valueFormatter: (params) => formatBigNumber(params.value as number, 0),
    },
    {
      headerName: "Sales",
      field: "sales",
      flex: 0.8,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus select-none text-right",
      valueFormatter: (params) => formatCurrency2(params.value as number),
    },
    {
      headerName: "Qty",
      field: "qty",
      flex: 0.8,
      resizable: false,
      cellClass: "no-outline-on-focus select-none text-right",
      valueFormatter: (params) => formatBigNumber(params.value as number, 0),
    },
  ];

  const theme = themeQuartz.withParams({
    headerHeight: 39,
    rowHeight: 25.5,
    headerBackgroundColor: "#3b82f6",
    headerTextColor: "#ffffff",
    oddRowBackgroundColor: "#bfdbfe",
    rowHoverColor: "#93c5fd",
    headerFontWeight: "bold",
    dataFontSize: 13,
    selectCellBorder: "transparent",
    rowBorder: "1px solid white",
    // borderColor: "transparent",
  });

  return (
    <div
      data-testid="dept-sales"
      className="shadow-lg rounded-lg no-scrollbar h-full"
    >
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
          // This is just testing to see if I can make an api call while listening to pagination changes
          // onPaginationChanged={(params) => {
          //   console.log(params.api.paginationGetCurrentPage());
          // }}
        />
      </div>
    </div>
  );
};

export default DepartmentSales;
