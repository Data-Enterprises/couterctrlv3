import { useAppSelector, useAppDispatch } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
  type RowClickedEvent,
} from "ag-grid-community";
import type { JsonError } from "../../../interfaces";
import {
  loadSimRowData,
  setNewRowAdDaysValue,
  setNewRowPriceValue,
  setPriceHistory,
  setSimRowData,
} from "../../../features/forecastSlice";
ModuleRegistry.registerModules([AllCommunityModule]);
import type {
  ForecastOutlierRow,
  SimBtns,
} from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";
import { getPriceHistory } from "../../../api/forecast";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useForecastContext } from "../hooks";

const OutlierGrid = () => {
  const toast = useToast();
  const context = useForecastContext();
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.forecast);

  const colDefs: (
    | ColDef<ForecastOutlierRow>
    | ColGroupDef<ForecastOutlierRow>
  )[] = [
    {
      headerName: "UPC",
      field: "upc",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Description",
      field: "description",
      flex: 1.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Qty Sold",
      field: "qtySold",
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      headerName: "Days Active",
      field: "daysActive",
      flex: 0.8,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => `${params.value}/90`,
    },
    {
      headerName: "Days at Price",
      field: "daysAtPrice",
      flex: 0.8,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => `${params.value}/${params.data!.daysActive}`,
    },
    {
      headerName: "Forecast",
      field: "forecastWindow",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
    },
    {
      // Future forecasted qty
      headerName: "Ad Days",
      field: "adDays",
      flex: 0.6,
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },
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
    },
    {
      headerName: "Fcst Total",
      field: "fcstTotal",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
    },
    {
      headerName: "Markdown $",
      field: "markdownDollars",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatCurrency2(params.value),
    },
  ];

  const onRowClicked = (e: RowClickedEvent<ForecastOutlierRow>) => {
    if (e.data) {
      const upc = e.data.upc;

      // Dont fetch the data and get a re-render if price history already matches the item we're clicking on
      const found = state.priceHistory.find(
        (item) => item.product_code === upc
      );

      if (found) {
        return;
      }

      getPriceHistory(
        context.url,
        context.token,
        state.storeids,
        context.endDate,
        upc,
        e.data.adFcst
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setPriceHistory(j.result));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  };

  const simBtnClassName = (sim: keyof SimBtns) => {
    if (state.simBtns[sim] === 0) {
      return "opacity-50 cursor-not-allowed pointer-events-none";
    }

    return "";
  };

  const renderTitle = () => {
    const sim = state.selectedSim;
    if (sim && state.simBtns[sim] === 1) {
      return `Next 7 Day Forecast - ${sim.toUpperCase()}`;
    }
    return "Next 7 Day Forecast";
  };

  const saveSimulation = () => {
    const sim1 = state.simBtns.sim1;
    const sim2 = state.simBtns.sim2;
    const sim3 = state.simBtns.sim3;
    const sim4 = state.simBtns.sim4;
    let simToSave = "";
    // if no sims have been saved, save to sim1
    if (sim1 === 0) {
      // save to sim1
      simToSave = "sim1";
    } else if (sim2 === 0) {
      // save to sim2
      simToSave = "sim2";
    } else if (sim3 === 0) {
      // save to sim3
      simToSave = "sim3";
    } else if (sim4 === 0) {
      // save to sim4
      simToSave = "sim4";
    }
    dispatch(
      setSimRowData({ sim: simToSave as keyof SimBtns, rows: state.rowData })
    );
  };

  // const updateSimulation = () => {
  //   const sim = state.selectedSim;
  // };

  const loadSimulationRows = (sim: string) => {
    dispatch(loadSimRowData(sim as keyof SimBtns));
  };

  return (
    <div
      className={`${
        state.selectedUpcs.length > 0
          ? "animate-windowIn p-2 bg-custom-white rounded-lg shadow-lg relative"
          : "hidden"
      }`}
    >
      <div className="absolute -translate-y-11 right-2 flex gap-2">
        <button
          className={`btn-themeBlue py-0.5 ${simBtnClassName("sim1")}`}
          onClick={() => loadSimulationRows("sim1")}
        >
          Sim 1
        </button>
        <button
          className={`btn-themeBlue py-0.5 ${simBtnClassName("sim2")}`}
          onClick={() => loadSimulationRows("sim2")}
        >
          Sim 2
        </button>
        <button
          className={`btn-themeBlue py-0.5 ${simBtnClassName("sim3")}`}
          onClick={() => loadSimulationRows("sim3")}
        >
          Sim 3
        </button>
        <button
          className={`btn-themeBlue py-0.5 ${simBtnClassName("sim4")}`}
          onClick={() => loadSimulationRows("sim4")}
        >
          Sim 4
        </button>
        <button className={`btn-themeBlue py-0.5`}>Reload</button>
      </div>
      <div className="flex gap-2">
        <div className="text-lg font-medium underline px-1">
          {renderTitle()}
        </div>
        <button className="btn-themeGreen py-0 mb-1" onClick={saveSimulation}>
          Save Sim
        </button>
      </div>
      <div className="h-[95%] shadow rounded-lg">
        <AgGridReact
          rowData={state.rowData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          onRowClicked={onRowClicked}
          paginationAutoPageSize={true}
        />
      </div>
    </div>
  );
};

export default OutlierGrid;
