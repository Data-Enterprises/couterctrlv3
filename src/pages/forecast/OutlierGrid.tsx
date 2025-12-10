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
  setLastUpdatedHistory,
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
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },

      valueFormatter: (params) => {
        if (!state.selectedHistory.lift || isNaN(params.value)) {
          return "";
        }
        return params.value.toFixed(0);
      },
      valueSetter: (params) => {
        const newValue = Number(params.newValue);
        if (isNaN(newValue) || newValue === params.data.futureForecast)
          return false;

        // This stops me from having to rely on the actual adFcst and fcstTotal redux variables
        const futureForecast = Math.floor(newValue);
        const forecastPrice = params.data.forecastPrice || 0;
        const futureForecastTotal = futureForecast * forecastPrice;

        const updatedRow = {
          ...params.data,
          futureForecast,
          futureForecastTotal,
        };

        dispatch(setLastUpdatedHistory(updatedRow));
        setTableData((prev) =>
          prev.map((row) => (row.upc === updatedRow.upc ? updatedRow : row))
        );
        return true;
      },
      editable: true,
    },
    {
      headerName: "Fcst Price",
      field: "forecastPrice",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },
      valueFormatter: (params) => {
        if (!state.selectedHistory.activePrice) {
          return "";
        }
        return params.value.toFixed(2);
      },
      editable: true,
      valueSetter: (params) => {
        const newValue = Number(params.newValue);
        if (isNaN(newValue) || newValue === params.data.forecastPrice)
          return false;

        // This stops me from having to rely on the actual adFcst and fcstTotal redux variables
        const forecastPrice = newValue;
        const futureForecast = params.data.futureForecast || 0; // Use current row's forecast
        const futureForecastTotal = futureForecast * forecastPrice;

        const updatedRow = {
          ...params.data,
          forecastPrice,
          futureForecastTotal,
        };

        dispatch(setLastUpdatedHistory(updatedRow));
        setTableData((prev) =>
          prev.map((row) => (row.upc === updatedRow.upc ? updatedRow : row))
        );
        return true;
      },
    },
    {
      headerName: "Fcst Total",
      field: "futureForecastTotal",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => {
        if (!state.selectedHistory.lift || isNaN(params.value)) {
          return "";
        }
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
          const lastUpdated = state.lastUpdatedHistory.find(
            (lastUpdated) =>
              lastUpdated.upc === item.upc &&
              lastUpdated.desc === item.metrics.description
          );
          // if this item was recently updated, get the last updated
          if (lastUpdated) {
            return lastUpdated;
          }

          // If it is new to the table or hasn't been updated, then go through the original logic
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
          const futureCast =
            item.upc === state.selectedHistory.upc
              ? item.forecast * avgLift
              : 0;
          const forecastPrice =
            item.upc === state.selectedHistory.upc
              ? state.selectedHistory.activePrice
              : 0;
          const total =
            item.upc === state.selectedHistory.upc
              ? futureCast * forecastPrice
              : 0;

          const result = {
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

          dispatch(setHistoryData([...state.historyData, result]));

          if (
            result.futureForecast > 0 &&
            result.forecastPrice > 0 &&
            result.futureForecastTotal > 0
          ) {
            dispatch(setLastUpdatedHistory(result));
          }
          return result;
        });
      setTableData(data);
    } else {
      setTableData([]);
    }
  }, [
    state.selectedUpcs,
    state.selectedHistory,
    // state.fcstTotal,
    // state.adFcst,
  ]);

  const onRowClicked = (e: RowClickedEvent<HistoryData>) => {
    if (e.data) {
      const upc = e.data.upc;
      const forecast = e.data.forecast;

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
        />
      </div>
      <div className="h-[100%] w-1/4 opacity-0 shadow-lg"></div>
    </div>
  );
};

export default OutlierGrid;
