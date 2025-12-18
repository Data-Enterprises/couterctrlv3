import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import { useRef, useState, useEffect } from "react";
import { useAppSelector } from "../../hooks";
import type { HistoryData } from "../../features/forecastSlice";

export const useScrollHeight = () => {
  const state = useAppSelector((state) => state.forecast);
  const topRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const calcHeight = () => {
    if (topRef.current) {
      const position = topRef.current.getBoundingClientRect().bottom;
      console.log("Position:", position);
      setHeight(window.innerHeight - position - 16);
    }
  };

  useEffect(() => {
    if (state.items.length > 0) {
      calcHeight();
    }

    window.addEventListener("resize", calcHeight);
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, [window.innerWidth, state.items]);

  return { height, topRef };
};

export const theme = themeQuartz.withParams({
  headerHeight: 30,
  rowHeight: 26.5,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#bfdbfe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  // selectedRowBackgroundColor: "#93c5fd",
  selectedRowBackgroundColor: "#fed7aa",
});

export const themeTwo = themeQuartz.withParams({
  headerHeight: 30,
  rowHeight: 26.5,
  headerBackgroundColor: "#3b82f6",
  headerTextColor: "#ffffff",
  oddRowBackgroundColor: "#bfdbfe",
  rowHoverColor: "#93c5fd",
  headerFontWeight: "bold",
  dataFontSize: 13,
  selectCellBorder: "transparent",
  rowBorder: "1px solid white",
  // selectedRowBackgroundColor: "#93c5fd",
});

export const exportHeaders: (ColDef<HistoryData> | ColGroupDef<HistoryData>)[] = [
  {
    headerName: "Outliers",
    field: "outliers",
  },
  {
    headerName: "UPC",
    field: "upc",
  },
  {
    headerName: "Description",
    field: "desc",
  },
  {
    headerName: "Qty Sold",
    field: "forecastQty",
  },
  {
    headerName: "Days Active",
    field: "daysActive",
  },
  {
    headerName: `Fcst Qty (x7)`,
    field: "forecast",
  },
  {
    headerName: "Ad Fcst",
    field: "futureForecast",
  },
  {
    headerName: "Fcst Price",
    field: "forecastPrice",
  },
  {
    headerName: "Fcst Total",
    field: "futureForecastTotal",
  },
];
