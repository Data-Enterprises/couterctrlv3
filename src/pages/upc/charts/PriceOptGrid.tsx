import {
  themeQuartz,
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ColGroupDef } from "ag-grid-community";
import type { UpcPriceOpt } from "../../../interfaces";
import { useAppSelector } from "../../../hooks";
import "./grid.css";

interface GridProps {
  rowData: UpcPriceOpt[];
  handleCellClick?: (x: UpcPriceOpt) => void;
}

type UpcRow = {
  product_code: string;
  product_description: string;
  price: number;
  total_qty: number;
  total_revenue: number;
  total_weight: number;
};

const Grid = ({ rowData, handleCellClick }: GridProps) => {
  const state = useAppSelector((state) => state.upc);
  const [rows, setRows] = useState<UpcRow[]>(rowData);

  const colDefs: (ColDef<UpcRow> | ColGroupDef<UpcRow>)[] = [
    {
      headerName: "Upc",
      field: "product_code",
      flex: 1,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Description",
      field: "product_description",
      flex: 2,
      resizable: false,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Best Price",
      field: "price",
      flex: 1,
      resizable: false,
      cellStyle: { textAlign: "right" },
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => `$${params.value}`,
      cellClass: "no-outline-on-focus select-none",
    },
    {
      headerName: "Qty",
      field: "total_qty",
      flex: 0.8,
      resizable: false,
      cellStyle: { textAlign: "right" },
      valueFormatter: (params) => params.value.toLocaleString(),
      cellClass: "no-outline-on-focus select-none",
    },
  ];

  useEffect(() => {
    const filtered = rowData.filter((item) =>
      state.selectedUpcs.includes(item.product_code)
    );
    setRows(filtered);
  }, [rowData, state.selectedUpcs]);

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
    selectedRowBackgroundColor: "#fed7aa",
  });

  const handleClick = (e: CellClickedEvent<UpcRow>) => {
    e.event?.preventDefault();
    if (handleCellClick) handleCellClick(e.data as UpcPriceOpt);
  };

  return (
    <div className="h-[100%] shadow-lg rounded-lg">
      {state.selectedUpcs.length ? (
        <div className="h-full relative">
          <AgGridReact
            rowData={rows}
            columnDefs={colDefs}
            headerHeight={30}
            pagination={true}
            paginationAutoPageSize={true}
            animateRows={true}
            enableCellTextSelection={true}
            rowSelection={"multiple"}
            theme={theme}
            onCellClicked={handleClick}
          />
        </div>
      ) : (
        <div className="bg-custom-white h-full flex flex-col pt-16 rounded-lg items-center relative">
          <div className="bg-blue-500 w-full rounded-t-lg py-1 pl-4 text-custom-white font-medium absolute top-0">
            Best Prices by UPC
          </div>
          <div className="text-sm text-content/50 font-medium mt-2 text-center px-10">
            <div>
              Select UPCs to view their optimal prices and associated quantity
            </div>
            <div className="mt-2">
              Selecting a single UPC in this grid displays its historical
              pricing, quantity, and revenue data
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grid;
