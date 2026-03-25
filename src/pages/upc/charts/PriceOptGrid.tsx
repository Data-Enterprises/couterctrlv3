import { useRef } from "react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import type { UpcPriceOpt } from "../../../interfaces";
import { useAppSelector } from "../../../hooks";
import "./grid.css";
import { priceColDefs, theme } from ".";

interface GridProps {
  rowData: UpcPriceOpt[];
  handleCellClick?: (x: UpcPriceOpt) => void;
  type?: "all" | "best";
}

const Grid = ({ rowData, handleCellClick, type = "best" }: GridProps) => {
  const gridRef = useRef<AgGridReact>(null);
  const { selectedUpcs, selectedOptItem } = useAppSelector(
    (state) => state.upc,
  );
  const [rows, setRows] = useState<UpcPriceOpt[]>(rowData);

  useEffect(() => {
    if (type === "all") {
      const filtered = rowData.filter(
        (item) =>
          item.product_code === selectedOptItem.product_code &&
          item.product_description
            .toLowerCase()
            .includes(selectedOptItem.product_description.toLowerCase()),
      );
      setRows(filtered);
    } else if (type === "best") {
      const filtered = rowData.filter((item) =>
        selectedUpcs.includes(item.product_code),
      );
      setRows(filtered);
    }
  }, [rowData, selectedOptItem, selectedUpcs]);

  useEffect(() => {
    if (gridRef.current && type === "best") {
      gridRef.current.api.forEachNode((node) => {
        if (node.data.product_code === selectedOptItem.product_code) {
          node.setSelected(true);
        }
      });
    }
  }, [rows, selectedOptItem]);

  const handleClick = (e: CellClickedEvent<UpcPriceOpt>) => {
    if (handleCellClick) {
      handleCellClick(e.data as UpcPriceOpt);
    }
  };

  return (
    <div className="h-[100%] shadow-lg rounded-lg">
      {selectedUpcs.length ? (
        <div className="h-full relative">
          <AgGridReact
            ref={gridRef}
            rowData={rows}
            columnDefs={priceColDefs}
            theme={theme}
            headerHeight={30}
            pagination={true}
            paginationAutoPageSize={true}
            animateRows={true}
            enableCellTextSelection={true}
            rowSelection={"single"}
            onCellClicked={handleClick}
          />
        </div>
      ) : (
        <div className="bg-custom-white h-full flex flex-col pt-16 rounded-lg items-center relative">
          <div className="bg-blue-500 w-full rounded-t-lg py-1 pl-4 text-custom-white font-medium absolute top-0">
            {type === "best" ? "Best Prices by UPC" : "Prices by UPC"}
          </div>
          <div className="text-sm text-content/50 font-medium mt-2 text-center px-10">
            <div>
              {type === "best"
                ? "Select UPCs to view their optimal prices and associated quantity"
                : "Select one or more UPCs to view all prices by those UPCs"}
            </div>
            <div className="mt-2">
              {type === "best"
                ? "Selecting a single UPC in this grid displays its historical pricing, quantity, and revenue data"
                : "Selecting a single UPC shows all prices by that UPC"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Grid;
