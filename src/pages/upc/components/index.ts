import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import { useRef, useState, useEffect } from "react";
import type { UpcSalesComp, UpcForecastData } from "../../../interfaces";
import { formatCurrency2, formatDate } from "../../../utils";

export const useScrollHeight = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const calcHeight = () => {
    if (topRef.current) {
      const position = topRef.current.getBoundingClientRect().bottom;
      setHeight(window.innerHeight - position - 24);
    }
  };

  useEffect(() => {
    calcHeight();

    window.addEventListener("resize", calcHeight);
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, []);

  return { height, topRef };
};

export const theme = themeQuartz.withParams({
  headerHeight: 26,
  rowHeight: 26,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#bfdbfe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
});

export const compCols: (ColDef<UpcSalesComp> | ColGroupDef<UpcSalesComp>)[] = [
  {
    headerName: "Week Of",
    field: "week",
    flex: 0.7,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
    valueFormatter: (params) => formatDate(params.value),
  },
  {
    headerName: "Upc",
    field: "product_code",
    flex: 0.7,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Description",
    field: "description",
    flex: 1.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus",
  },
  {
    headerName: "Mon",
    field: "Monday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
  {
    headerName: "Tue",
    field: "Tuesday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
  {
    headerName: "Wed",
    field: "Wednesday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
  {
    headerName: "Thu",
    field: "Thursday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
  {
    headerName: "Fri",
    field: "Friday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
  {
    headerName: "Sat",
    field: "Saturday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
  {
    headerName: "Sun",
    field: "Sunday",
    flex: 0.6,
    resizable: false,
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      return formatCurrency2(params.value || 0);
    },
  },
];

export const instructions = [
  {
    text: "1. Select one or more UPCs (left) to view the history/forecast data line chart",
  },
  {
    text: "2. The forecast date range extends 7 days beyond the selected end date",
  },
  { text: `3. Hovering over the icons will display each metric definition` },
  {
    text: "4. Export either the Date Range or Metrics to a .csv file",
  },
];

export const colorCodes = [
  "#d946ef", // fuchsia-500
  "#f0abfc", // fuchsia-300
  "#3b82f6", // blue-500
  "#60a5fa", // blue-300
  "#10b981", // emerald-500
  "#6ee7b7", // emerald-300
  "#4fd1c5", // teal-400
  "#99f6e4", // teal-200
  "#f97316", // orange-500
  "#fdba74", // orange-300
];

export type Price = {
  price: string;
  qty: number;
};
export const reducePriceHistory = (prices: Price[]) => {
  return prices.reduce((acc: number, cur) => acc + cur.qty, 0);
};

export const getOverallMetrics = (
  upcList: UpcForecastData[],
  top: UpcForecastData,
  bottom: UpcForecastData,
) => {
  if (upcList.length === 0) {
    return [
      { label: "Total Qty", value: 0, item: null, type: "quantity" },
      {
        label: "Total Range",
        value: 0,
        item: null,
        type: "qtyRange",
      },
      { label: "Median Qty", value: 0, item: null, type: "median" },
      {
        label: "Avg Daily Qty",
        value: 0,
        item: null,
        type: "avgQty",
      },
      {
        label: "ADQ Range",
        value: 0,
        item: null,
        type: "avgQtyRange",
      },
    ];
  }

  const totalQty = upcList.reduce(
    (acc, cur) => (acc += reducePriceHistory(cur.data.metrics.prices)),
    0,
  );

  const avgDailyQty =
    upcList.reduce((acc, cur) => (acc += cur.data.metrics.avg_daily_qty), 0) /
    upcList.length;

  const totalQtyRange = top.data.metrics.qty - bottom.data.metrics.qty;
  const avgDailyQtyRange =
    top.data.metrics.avg_daily_qty - bottom.data.metrics.avg_daily_qty;

  const sorted = [...upcList].sort(
    (a, b) => a.data.metrics.qty - b.data.metrics.qty,
  );

  const mid = Math.floor(upcList.length / 2);
  const medianQty =
    upcList.length % 2 === 0
      ? (reducePriceHistory(sorted[mid - 1].data.metrics.prices) +
          reducePriceHistory(sorted[mid].data.metrics.prices)) /
        2
      : reducePriceHistory(sorted[mid].data.metrics.prices);

  return [
    { label: "Total Qty", value: totalQty, item: null, type: "quantity" },
    {
      label: "Total Range",
      value: totalQtyRange,
      item: null,
      type: "qtyRange",
    },
    { label: "Median Qty", value: medianQty, item: null, type: "median" },
    { label: "Avg Daily Qty", value: avgDailyQty, item: null, type: "avgQty" },
    {
      label: "ADQ Range",
      value: avgDailyQtyRange,
      item: null,
      type: "avgQtyRange",
    },
  ];
};

// Price Optimization Utils
export const listSelect = [
  { display: "All Upcs", value: "all" },
  { display: "Selected Upcs", value: "selected" },
];

export const modeSelect = [
  { display: "All Upc Prices", value: "allData" },
  { display: "Prices by UPC", value: "byUpc" },
];

export const priceOptTooltipInfo = {
  Price: [
    "Maximum optimal price across all UPCs",
    "Range between the highest and lowest optimal prices",
    "Median optimal price across all UPCs",
    "Average optimal price across all UPCs",
    "Minimum optimal price across all UPCs",
  ],
  Qty: [
    "Maximum optimal quantity across all UPCs",
    "Range between the highest and lowest quantities",
    "Median optimal quantity across all UPCs",
    "Average optimal quantity across all UPCs",
    "Minimum optimal quantity across all UPCs",
  ],
  Rev: [
    "Maximum optimal revenue across all UPCs",
    "Range between the highest and lowest revenues",
    "Median optimal revenue across all UPCs",
    "Average optimal revenue across all UPCs",
    "Minimum optimal revenue across all UPCs",
  ],
};
