import { useAppSelector, useAppDispatch } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  TooltipModule,
} from "ag-grid-community";

import {
  loadSimRowData,
  reloadRowData,
  resetSimulations,
  setGlobalFcstPrice,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
  setSelectedSim,
  updateGlobalFcstRows,
} from "../../../features/forecastSlice";
ModuleRegistry.registerModules([AllCommunityModule, TooltipModule]);
import type {
  ForecastOutlierRow,
  SimBtns,
} from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";
import CalcNowCheckbox from "../../priceSimulator/grid/CheckBoxCell";
import CalcModal from "../CalcModal";
import SaveSimModal from "../SaveSimModal";
import { useState } from "react";

const OutlierGrid = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const colDefs: (
    | ColDef<ForecastOutlierRow>
    | ColGroupDef<ForecastOutlierRow>
  )[] = [
    {
      headerName: "Calc Now",
      field: "calcNow",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus flex justify-center items-center",
      cellRenderer: CalcNowCheckbox, // Use the custom component
      cellRendererSelector: undefined, // Ensure it always uses your renderer
    },
    {
      headerName: "UPC",
      field: "upc",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      headerTooltip: "UPC",
    },
    {
      headerName: "Description",
      field: "description",
      flex: 1.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
      headerTooltip: "Description",
    },
    {
      headerName: "Qty Sold",
      field: "qtySold",
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
      headerTooltip: "Quantity Sold",
    },
    {
      headerName: "Days Active",
      field: "daysActive",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => `${params.value}/90`,
      headerTooltip: "Days Active",
    },
    {
      headerName: "At Price",
      field: "daysAtPrice",
      flex: 0.8,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => `${params.value}/${params.data!.daysActive}`,
      headerTooltip: "At Price",
    },
    {
      headerName: "Forecast",
      field: "forecastWindow",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
      headerTooltip: "Forecast",
    },
    {
      // Future forecasted qty
      headerName: "Ad Days",
      field: "adDays",
      flex: 0.6,
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },
      headerTooltip: "Ad Days",
      valueFormatter: (params) => (params.value === 0 ? "" : params.value),
      editable: true,
      valueSetter: (params) => {
        const upc = params.data.upc;
        const newAdDays = parseInt(params.newValue);
        if (!isNaN(newAdDays)) {
          dispatch(setNewRowAdDaysValue({ upc, newAdDays }));
        }

        return !isNaN(newAdDays);
      },
    },
    {
      headerName: "Fcst Price",
      field: "fcstPrice",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },
      headerTooltip: "Forecast Price",
      valueFormatter: (params) => formatCurrency2(params.value),
      editable: true,
      valueSetter: (params) => {
        const upc = params.data.upc;
        const newPrice = parseFloat(params.newValue);
        if (!isNaN(newPrice)) {
          dispatch(setNewRowPriceValue({ upc, newPrice }));
        }
        return !isNaN(newPrice);
      },
    },
    {
      // Future forecasted qty
      headerName: "Ad Fcst",
      field: "adFcst",
      flex: 0.6,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
      headerTooltip: "Ad Forecast",
    },
    {
      headerName: "Fcst Total",
      field: "fcstTotal",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      headerTooltip: "Forecast Total",
    },
    {
      headerName: "Markdown $",
      field: "markdownDollars",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatCurrency2(params.value),
      headerTooltip: "Markdown Dollars",
    },
  ];

  const simBtnClassName = (sim: keyof SimBtns) => {
    if (state.simBtns[sim] === 0) {
      return "btn-themeBlue opacity-50 cursor-not-allowed pointer-events-none";
    }

    if (state.selectedSim === sim) {
      return "btn-themeGreen";
    }

    return "btn-themeBlue";
  };

  const renderTitle = () => {
    const sim = state.selectedSim;
    if (sim) {
      return state.simTitles[sim as keyof SimBtns];
    }
    return "Next 7 Day Forecast";
  };

  const openSaveSimModal = () => {
    setIsOpen(true);
  };

  const loadSimulationRows = (sim: string) => {
    dispatch(setSelectedSim(sim as keyof SimBtns));
    dispatch(loadSimRowData(sim as keyof SimBtns));
  };

  const simsFull = () => {
    for (const sim in state.simBtns) {
      if (state.simBtns[sim as keyof SimBtns] === 0) {
        return false;
      }
    }
    return true;
  };

  return (
    <div
      className={`${
        state.initialRowData.length > 0
          ? "animate-windowIn p-2 bg-custom-white rounded-lg shadow-lg relative"
          : "hidden"
      }`}
    >
      <CalcModal />
      <SaveSimModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <div className="absolute -translate-y-[70px] right-2 flex items-end justify-between w-full gap-2">
        <div className="pl-4 flex items-end gap-2">
          <div>
            <label
              htmlFor="global-price"
              className="pl-0.5 text-xs font-medium"
            >
              Global Price
            </label>
            <input
              id="global-price"
              data-testid="global-price-input"
              type="text"
              className="basic-input focus:border py-1 bg-custom-white w-20"
              value={state.globalFcstPrice === "0" ? "" : state.globalFcstPrice}
              onChange={(e) => {
                dispatch(setGlobalFcstPrice(e.currentTarget.value));
              }}
            />
          </div>
          <button
            data-testid="set-global-price-btn"
            className="btn-themeBlue py-1"
            onClick={() => dispatch(updateGlobalFcstRows())}
          >
            Set
          </button>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="sim1-btn"
            className={`py-0.5 ${simBtnClassName("sim1")}`}
            onClick={() => loadSimulationRows("sim1")}
          >
            Sim 1
          </button>
          <button
            data-testid="sim2-btn"
            className={`py-0.5 ${simBtnClassName("sim2")}`}
            onClick={() => loadSimulationRows("sim2")}
          >
            Sim 2
          </button>
          <button
            data-testid="sim3-btn"
            className={`py-0.5 ${simBtnClassName("sim3")}`}
            onClick={() => loadSimulationRows("sim3")}
          >
            Sim 3
          </button>
          <button
            data-testid="sim4-btn"
            className={`py-0.5 ${simBtnClassName("sim4")}`}
            onClick={() => loadSimulationRows("sim4")}
          >
            Sim 4
          </button>
          <button
            data-testid="reload-sim-btn"
            className={`btn-themeBlue py-0.5`}
            onClick={() => dispatch(reloadRowData())}
          >
            Reload
          </button>
          <button
            data-testid="reset-sim-btn"
            className={`btn-themeOrange py-0.5`}
            onClick={() => dispatch(resetSimulations())}
          >
            Reset
          </button>
        </div>
      </div>
      <div className="flex justify-between">
        <div className="text-lg font-medium underline px-1">
          {renderTitle()}
        </div>
        <button
          data-testid="save-new-sim-btn"
          className={`${
            simsFull() && "opacity-50 pointer-events-none"
          } btn-themeGreen py-0 mb-1`}
          onClick={openSaveSimModal}
        >
          Save New Sim
        </button>
      </div>
      <div className="h-[95%] shadow rounded-lg">
        <AgGridReact
          rowData={state.rowData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          // onRowClicked={onRowClicked}
          paginationAutoPageSize={true}
        />
      </div>
    </div>
  );
};

export default OutlierGrid;
