import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { AgGridReact } from "ag-grid-react";
import { theme } from "../../forecast";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type ColGroupDef,
} from "ag-grid-community";
ModuleRegistry.registerModules([AllCommunityModule]);
import type { JsonError, PriceSimHistory, SimGridRow } from "../../../interfaces";
import { calcFcstQty } from "../calc";
import { setNewRowPriceValue, setRowData } from "../../../features/priceSimSlice";
import { formatCurrency2 } from "../../../utils";
import { getHistoryFromList } from "../../../api/priceSim";
import { useToast } from "../../../components/toasts/hooks/useToast";

const PriceSimGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.priceSim);
  const search = useAppSelector((state) => state.search);

  useEffect(() => {
    if (state.selectedUpcs.length > 0) {
      getHistoryFromList(
        context.url,
        context.token,
        state.storeids,
        search.endDate,
        state.selectedUpcs.join(",")
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            // To maintain the state => if some upcs are already selected, filter them out
            const results = j.results.filter((item: PriceSimHistory<any>) => {
              // Return the opposite of found to filter out existing
              const found = state.rowData.find((row) => row.upc === item.upc);
              return !found;
            });

            console.log(state.selectedUpcs, results);

            // Those new rows left over, then calculate
            const rowData: SimGridRow[] = results.map((item: PriceSimHistory<any>) => {
              const prices = (
                Object.entries(item.prices) as [string, number][]
              ).map(([price, qty]) => [parseFloat(price), qty]);
              const fcstPrice = prices[0][0];
              const regQty =
                item.prices[item.regular_retail_price.toString()] || 0;
              
                // reg dollars = reg retail * reg qty
              const regDollars = item.regular_retail_price * regQty;

              // need the forecast qty at the current price to calc fcst dollars
              const fcstQty = calcFcstQty(prices, fcstPrice);
              const fcstDollars = fcstPrice * fcstQty;

              // Markdown Dollars =   (Regular retail - Fcast Price) * forecast qty
              const markdownDollars = (item.regular_retail_price - fcstPrice) * fcstQty;

              // lift = (fcst qty - reg qty) / reg qty
              const lift = regQty > 0 ? (fcstQty - regQty) / regQty : 0;

              return {
                upc: item.upc,
                description: item.description,
                fcstPrice: fcstPrice,
                calcNow: 0,
                fcstQty: fcstQty,
                fcstDollars: fcstDollars,
                regRetail: item.regular_retail_price,
                regQty: regQty,
                regDollars: regDollars,
                markdownDollars: markdownDollars,
                lift: lift,
                prices: prices,
              };
            })
            dispatch(setRowData([...state.rowData, ...rowData]));
          }
        })
        .catch((err: JsonError) => toast.error(err.message));
    }
  }, [state.selectedUpcs]);

  const colDefs: (ColDef<SimGridRow> | ColGroupDef<SimGridRow>)[] = [
    {
      field: "upc",
      headerName: "UPC",
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "description",
      headerName: "Description",
      flex: 1.9,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus",
    },
    {
      field: "fcstPrice",
      headerName: "Fcast Price",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      editable: true,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
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
      field: "calcNow",
      headerName: "Calc Now",
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
      // Render a checkbox here
    },
    {
      field: "fcstQty",
      headerName: "Fcast Qty",
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "fcstDollars",
      headerName: "Fcast Dollars",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "regRetail",
      headerName: "Reg Retail",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "regQty",
      headerName: "Reg Qty",
      flex: 1,
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "regDollars",
      headerName: "Reg Dollars",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "markdownDollars",
      headerName: "Markdown Dollars",
      flex: 1,
      valueFormatter: (params) => formatCurrency2(params.value),
      headerStyle: { borderRight: "1px solid white" },
      cellClass: "no-outline-on-focus text-right",
    },
    {
      field: "lift",
      headerName: "Lift",
      flex: 1,
      valueFormatter: (params) => params.value.toFixed(2) || 0,
      cellClass: "no-outline-on-focus text-right",
    },
  ];

  if (state.selectedUpcs.length === 0) return null;

  return (
    <div className="h-full shadow-lg rounded-lg">
      <AgGridReact
        rowData={state.rowData}
        columnDefs={colDefs}
        theme={theme}
        paginationAutoPageSize={true}
      />
    </div>
  );
};

export default PriceSimGrid;
