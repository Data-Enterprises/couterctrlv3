import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { AgGridReact } from "ag-grid-react";
import { theme } from ".";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
import { getPriceHistory } from "../../api/forecast";
import type { JsonError } from "../../interfaces";
import {
  setAdFcst,
  setFcstTotal,
  setHistoryData,
  setPriceHistory,
} from "../../features/forecastSlice";
ModuleRegistry.registerModules([AllCommunityModule]);
import type { HistoryData } from "../../features/forecastSlice";

const OutlierGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.forecast);
  const search = useAppSelector((state) => state.search);
  const [tableData, setTableData] = useState<HistoryData[]>([]);

  const colDefs: (ColDef<HistoryData> | ColGroupDef<HistoryData>)[] = [
    {
      headerName: "Outliers",
      field: "outliers",
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus underline font-medium",
    },
    {
      headerName: "UPC",
      field: "upc",
      flex: 0.9,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Description",
      field: "desc",
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      headerName: "Qty Sold",
      field: "forecastQty",
      flex: 0.7,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      headerName: "Days Active",
      field: "daysActive",
      flex: 0.9,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      headerName: `Fcst Qty (x7)`,
      // headerName: `Forecast Qty (x${state.qty[0].forecast_dimension || 0})`,
      field: "forecast",
      flex: 1.2,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
    },
    {
      // Future forecasted qty
      headerName: "Ad Fcst",
      field: "futureForecast",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => {
        // if (!state.selectedHistory.lift) {
        //   return "";
        // }
        return params.value.toFixed(0);
      },
      editable: true,
      onCellValueChanged: (event) => {
        if (event.colDef.headerName === "Ad Fcst") {
          // dispatch(setAdFcst(Number(event.newValue)));
        }
      },
    },
    {
      headerName: "Fcst Price",
      field: "forecastPrice",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => {
        // if (!state.selectedHistory.activePrice) {
        //   return "";
        // }
        return params.value.toFixed(2);
      },
      editable: true,
      onCellValueChanged: (event) => {
        if (event.colDef.headerName === "Fcst Price") {
          dispatch(setFcstTotal(Number(event.newValue)));
        }
      },
    },
    {
      // Calculated field
      headerName: "Fcst Total",
      field: "futureForecastTotal",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => {
        // if (!state.selectedHistory.activePrice) {
        //   return "";
        // }
        return params.value.toFixed(2);
      },
    },
  ];

  useEffect(() => {
    if (state.selectedUpcs.length > 0) {
      const upcs = state.selectedUpcs;
      const data = state.qty
        .filter((item) => upcs.includes(item.upc))
        .map((item) => {
          const liftReduced = state.priceHistory.reduce((acc, cur) => {
            if (cur.unit_price === state.selectedHistory.activePrice) {
              return acc + cur.lift;
            }
            return acc;
          }, 0);

          const qtyReduced = state.priceHistory.reduce((acc, cur) => {
            if (cur.unit_price === state.selectedHistory.activePrice) {
              return (acc += 1);
            }
            return acc;
          }, 0);

          // Setting the average lift based on price history entries => if there is just one, then it acts as the default anyway
          const avgLift = liftReduced / qtyReduced;
          let futureCast =
            item.upc === state.selectedHistory.upc
              ? item.forecast * avgLift
              : 0;

          let forecastPrice =
            item.upc === state.selectedHistory.upc
              ? state.selectedHistory.activePrice
              : 0;

          let total =
            item.upc === state.selectedHistory.upc
              ? futureCast * forecastPrice
              : 0;

          // modified values
          if (state.adFcst > 0 && state.fcstTotal > 0) {
            if (item.upc === state.selectedHistory.upc) {
              total = state.adFcst * state.fcstTotal;
              futureCast = state.adFcst;
              forecastPrice = state.fcstTotal;
            }
          } else if (state.adFcst > 0) {
            total = state.adFcst * forecastPrice;
            if (item.upc === state.selectedHistory.upc) {
              futureCast = state.adFcst;
            }
          } else if (state.fcstTotal > 0) {
            if (item.upc === state.selectedHistory.upc) {
              forecastPrice = state.fcstTotal;
            }
            total = state.fcstTotal * futureCast;
          }

          // debugger;
          return {
            outliers: item.metrics.outliers.length,
            upc: item.upc,
            desc: item.metrics.description,
            forecastQty: item.metrics.qty,
            daysActive: item.metrics.days_active,
            forecast: item.forecast,
            futureForecast: Math.floor(futureCast),
            forecastPrice: forecastPrice,
            futureForecastTotal: total,
          };
        });
      setTableData(data);
    } else {
      setTableData([]);
    }
  }, [
    state.selectedUpcs,
    state.selectedHistory,
    state.fcstTotal,
    state.adFcst,
  ]);

  useEffect(() => {
    if (tableData.length) {
      dispatch(setHistoryData(tableData));
    }
  }, [tableData]);

  const onRowClicked = (e: RowClickedEvent<HistoryData>) => {
    // debugger;
    if (e.data) {
      const upc = e.data.upc;
      const forecast = e.data.forecast;

      getPriceHistory(
        context.url,
        context.token,
        state.storeids,
        search.endDate,
        upc,
        forecast
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

  return (
    <div
      className={`${
        tableData.length > 0 ? "animate-windowIn h-[100%] flex gap-4" : "hidden"
      }`}
    >
      <div className="h-[100%] w-3/4 shadow-lg">
        <AgGridReact
          rowData={tableData}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          onRowClicked={onRowClicked}
          rowSelection="single"
        />
      </div>
      <div className="h-[100%] w-1/4 opacity-0 shadow-lg"></div>
    </div>
  );
};

export default OutlierGrid;
