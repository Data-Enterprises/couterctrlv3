import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../../../hooks";

import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  // type ColumnHeaderContextMenuEvent,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);

import { theme, costCols } from ".";
import {
  setFilteredCostGridData,
  type ThreshOperator,
} from "../../../../features/subMarginSlice";
// import type { SubDeptCost } from "../../../../interfaces";
import {
  setMenuPosition,
  setSMClipboardText,
} from "../../../../features/ctxMenuSlice";
// import { useSubMarginCtx } from "../../hooks";

const SubDeptCostGrid = () => {
  const gridRef = useRef<AgGridReact>(null);
  const dispatch = useAppDispatch();
  const sm = useAppSelector((state) => state.subMargin);
  // const { selectedWeekDay } = useSubMarginCtx();

  useEffect(() => {
    if (sm.subDeptCost.length) {
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
        const upcMatch = upc ? item.product_code.includes(upc) : true;
        const descMatch = desc
          ? item.description.toLowerCase().includes(desc.toLowerCase())
          : true;
        const unitCostMatch = unitCost.value
          ? handleOperator(
              unitCost.value,
              unitCost.operator,
              item.calculated_cost,
            )
          : true;
        const qtyMatch = qty.value
          ? handleOperator(qty.value, qty.operator, item.qty)
          : true;
        const cogsMatch = cogs.value
          ? handleOperator(cogs.value, cogs.operator, item.total_cost)
          : true;
        const caseCostMatch = caseCost.value
          ? handleOperator(caseCost.value, caseCost.operator, item.cost)
          : true;

        return (
          upcMatch &&
          descMatch &&
          unitCostMatch &&
          qtyMatch &&
          cogsMatch &&
          caseCostMatch
        );
      });

      dispatch(setFilteredCostGridData(filteredData));
    }
  }, [
    sm.upcFilter,
    sm.descFilter,
    sm.caseCostFilter,
    sm.cogsFilter,
    sm.qtyFilter,
    sm.unitCostFilter,
  ]);

  useEffect(() => {
    if (sm.subDeptCost.length) {
      dispatch(setFilteredCostGridData(sm.subDeptCost));
    }
  }, [sm.subDeptCost]);

  const handleCtxMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!gridRef.current) return;
    event.preventDefault();

    const target = event.target as HTMLElement;
    const upc = !isNaN(Number(target.innerText)) ? target.innerText : "";

    dispatch(setMenuPosition({ x: event.clientX + 5, y: event.clientY }));
    const allUpc = sm.filteredCostGridData
      .map((item) => item.product_code)
      .join(", ");
    dispatch(
      setSMClipboardText({
        upc,
        allUpc,
      }),
    );
  };

  return (
    <div onContextMenuCapture={handleCtxMenu}>
      <AgGridReact
        ref={gridRef}
        rowData={sm.filteredCostGridData}
        columnDefs={costCols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default SubDeptCostGrid;
