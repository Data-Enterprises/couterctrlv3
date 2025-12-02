import {
  themeQuartz,
  AllCommunityModule,
  ModuleRegistry,
  type CellContextMenuEvent,
  type CellClickedEvent,
  type RowClickedEvent,
} from "ag-grid-community";
// Register all Community features
ModuleRegistry.registerModules([AllCommunityModule]);

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ColGroupDef } from "ag-grid-community";
import { setOptDisplayMode } from "../../../features/upcSlice";
import type { UpcPriceOpt } from "../../../interfaces";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import "./grid.css";
// import { setMenuPosition } from "../../../features/contextMenuSlice";
// import { useDispatch } from "react-redux";
// import { setClipboardText } from "../../../features/upcListSlice";
// import { options } from "../utils";

interface GridProps {
  rowData: UpcPriceOpt[];
  onSelectionChanged?: (x: string[]) => void;
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

const Grid = ({ rowData, onSelectionChanged, handleCellClick }: GridProps) => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.upc);
  const [rows, setRows] = useState<UpcRow[]>(rowData);
  const [selectMode, setSelectMode] = useState<"singleRow" | "multiRow">(
    state.optDisplayMode
  );

  useEffect(() => {
    setSelectMode(state.optDisplayMode);
  }, [state.optDisplayMode]);

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
    // {
    //   headerName: "Revenue",
    //   field: "total_revenue",
    //   flex: 1,
    //   resizable: false,
    //   cellStyle: { textAlign: "right" },
    //   headerStyle: { borderRight: "1px solid white" },
    //   valueFormatter: (params) => `$${params.value}`,
    //   cellClass: "no-outline-on-focus select-none",
    // },
    // {
    //   headerName: "Weight",
    //   field: "total_weight",
    //   flex: 0.8,
    //   resizable: false,
    //   cellStyle: { textAlign: "right" },
    //   cellClass: "no-outline-on-focus select-none",
    // },
  ];

  useEffect(() => {
    const filtered = rowData.filter((item) =>
      state.selectedUpcs.includes(item.product_code)
    );
    setRows(filtered);
  }, [rowData, state.upcSearch, state.descSearch, state.selectedUpcs]);

  useEffect(() => {
    if (state.selectedOptItem) {
      const grid = document.querySelector(".ag-center-cols-container");
      if (!grid) return;
      const children = Array.from(grid.childNodes) as HTMLElement[];
      children.forEach((r) => {
        const rowUpc = r.children[0].children[0].textContent;
        if (
          state.selectedOptItem &&
          rowUpc === state.selectedOptItem.product_code
        ) {
          r.classList.add("bg-blue-500", "text-white");
        } else {
          r.classList.remove("bg-blue-500", "text-white");
        }
      });
    } else {
      toggleMultiSelect();
    }
  }, [state.selectedOptItem]);

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

  // const handleRightClick = (e: CellContextMenuEvent<UpcRow>) => {
  //   e.event.preventDefault();
  //   const mouseEvent = e.event as MouseEvent;
  //   if (options.length < 3)
  //     options.push({ label: "Show Prices", key: "selectUpc" });
  //   dispatch(
  //     setClipboardText({
  //       upc: e.data.product_code,
  //       desc: e.data.product_description,
  //     })
  //   );
  //   dispatch(setMenuPosition({ x: mouseEvent.pageX + 5, y: mouseEvent.pageY }));
  // };

  const handleClick = (e: CellClickedEvent<UpcRow>) => {
    e.event?.preventDefault();
    if (handleCellClick) handleCellClick(e.data as UpcPriceOpt);
  };

  const handleRowSelection = (e: RowClickedEvent<UpcRow>) => {
    const target = e.event?.target as HTMLElement;
    const rows = Array.from(
      target.parentNode?.parentNode?.parentNode?.parentNode?.childNodes ?? []
    ) as HTMLElement[];
    rows.forEach((r) => {
      // match the event's row index with the current row's index then toggle the selected row's background
      const rowIdx = r.getAttribute("row-index");
      if (
        rowIdx &&
        parseInt(rowIdx) === e.rowIndex &&
        !r.classList.contains("bg-blue-500")
      ) {
        r.classList.add("bg-blue-500", "text-white");
      } else {
        r.classList.remove("bg-blue-500", "text-white");
      }
    });
  };

  const toggleMultiSelect = () => {
    dispatch(setOptDisplayMode("multiRow"));
    const grid = document.querySelector(".ag-center-cols-container");
    // This gets called on mount and when selected Upcs changes, so grid can be null
    if (!grid) return;
    // This will run when Show All Selected button is clicked, meaning the grid is populated
    const children = Array.from(grid.childNodes) as HTMLElement[];
    children.forEach((r) => r.classList.remove("bg-blue-500", "text-white"));
  };

  return (
    <div
      className="h-[100%] shadow-lg rounded-lg"
      onContextMenuCapture={(e) => e.preventDefault()}
    >
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
            rowSelection={{
              mode: selectMode,
              headerCheckbox: false,
              checkboxes: false,
            }}
            theme={theme}
            // onCellContextMenu={handleRightClick}
            onCellClicked={handleClick}
            onRowClicked={handleRowSelection}
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
