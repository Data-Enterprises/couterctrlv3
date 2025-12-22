import { useAppSelector, useAppDispatch } from "../../../hooks";
// import { useToast } from "../../../components/toasts/hooks/useToast";
import { AgGridReact } from "ag-grid-react";
import { theme } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
// import type { JsonError } from "../../../interfaces";
import {
  setNewRowPriceValue,
  setNewRowQtyValue,
} from "../../../features/forecastSlice";
ModuleRegistry.registerModules([AllCommunityModule]);
import type { ForecastOutlierRow } from "../../../features/forecastSlice";
import { formatCurrency2 } from "../../../utils";
import { useEffect } from "react";
// import { getHistoryFromList } from "../../../api/priceSim";

const OutlierGrid = () => {
  // const toast = useToast();
  const dispatch = useAppDispatch();
  // const context = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.forecast);
  // const search = useAppSelector((state) => state.search);

  useEffect(() => {
    // const upcs = state.selectedUpcs
    //   .filter((upc) => {
    //     const found = state.rowData.find((row) => row.upc === upc);
    //     return !found;
    //   })
    //   .join(",");

    // if (upcs === "") return;

    // getHistoryFromList(
    //   context.url,
    //   context.token,
    //   state.storeids,
    //   search.endDate,
    //   upcs
    // )
    //   .then((resp) => {
    //     const j = resp.data;
    //     if (j.error === 0) {
    //       console.log(j);
    //       const prices = j.results.priceHistory;
    //       const fcstPrice = parseFloat(prices[0].price);
    //       const regQty =
    //         prices.find((p) => p.price === fcstPrice.toString()).qty || 0;
    //     }
    //   })
    //   .catch((err: JsonError) => toast.error(err.message));
  }, [state.selectedUpcs]);

  const colDefs: (
    | ColDef<ForecastOutlierRow>
    | ColGroupDef<ForecastOutlierRow>
  )[] = [
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
      field: "description",
      flex: 1,
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
      flex: 0.9,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      headerName: "Weekly Avg",
      field: "forecast",
      flex: 1.2,
      cellClass: "no-outline-on-focus text-right",
      headerStyle: { borderRight: "1px solid white" },
    },
    {
      // Future forecasted qty
      headerName: "Ad Fcst",
      field: "adFcst",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },
      editable: true,
      valueSetter: (params) => {
        const upc = params.data.upc;
        const newQty = parseInt(params.newValue);
        if (!isNaN(newQty)) {
          dispatch(setNewRowQtyValue({ upc, newQty }));
        }
        return !isNaN(newQty);
      },
    },
    {
      headerName: "Fcst Price",
      field: "fcstPrice",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right border border-content",
      headerStyle: { borderRight: "1px solid white" },
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
      headerName: "Fcst Total",
      field: "fcstTotal",
      flex: 1.0,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => formatCurrency2(params.value),
    },
    {
      headerName: "Lift",
      field: "lift",
      flex: 0.7,
      cellClass: "no-outline-on-focus text-right",
      valueFormatter: (params) => params.value.toFixed(2),
    },
  ];

  // const onRowClicked = (e: RowClickedEvent<ForecastOutlierRow>) => {
  //   if (e.data) {
  //     const upc = e.data.upc;
  //     const forecast = e.data.forecast;

  //     // Dont fetch the data and get a re-render if price history already matches the item we're clicking on
  //     const found = state.priceHistory.find(
  //       (item) => item.product_code === upc
  //     );

  //     // testing this here
  //     dispatch(setSelectedUpc(upc));

  //     if (found) {
  //       return;
  //     }

  //     getPriceHistory(
  //       context.url,
  //       context.token,
  //       state.storeids,
  //       search.endDate,
  //       upc,
  //       forecast
  //     )
  //       .then((resp) => {
  //         const j = resp.data;
  //         if (j.error === 0) {
  //           dispatch(setPriceHistory(j.result));
  //         }
  //       })
  //       .catch((err: JsonError) => toast.error(err.message));
  //   }
  // };

  const renderRows = () => {
    if (state.selectedUpcs.length > 0) {
      const filtered = state.rowData.filter((row) =>
        state.selectedUpcs.includes(row.upc)
      );
      return filtered;
    }
  };

  return (
    <div
      className={`${
        state.selectedUpcs.length > 0
          ? "animate-windowIn h-[100%] flex gap-4"
          : "hidden"
      }`}
    >
      <div className="h-[100%] w-full shadow-lg">
        <AgGridReact
          rowData={renderRows()}
          columnDefs={colDefs}
          theme={theme}
          pagination={true}
          paginationAutoPageSize={true}
          // onRowClicked={onRowClicked}
        />
      </div>
      {/* <div className="h-[100%] w-1/4 opacity-0 shadow-lg"></div> */}
    </div>
  );
};

export default OutlierGrid;
