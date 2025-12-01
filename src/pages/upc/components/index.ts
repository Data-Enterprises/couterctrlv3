import { themeQuartz, type ColDef, type ColGroupDef } from "ag-grid-community";
import { useRef, useState, useEffect } from "react";
import type { UpcSalesComp } from "../../../interfaces";
import { formatCurrency2, formatDate } from "../../../utils";

export const useScrollHeight = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const calcHeight = () => {
    if (!topRef.current) return;
    const position = topRef.current.getBoundingClientRect().height;
    setHeight(window.innerHeight - position - 80); // 32 for page padding + 48 for the titlebar height
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
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
  {
    headerName: "Tue",
    field: "Tuesday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
  {
    headerName: "Wed",
    field: "Wednesday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
  {
    headerName: "Thu",
    field: "Thursday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
  {
    headerName: "Fri",
    field: "Friday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
  {
    headerName: "Sat",
    field: "Saturday",
    flex: 0.6,
    resizable: false,
    headerStyle: { borderRight: "1px solid white" },
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
  {
    headerName: "Sun",
    field: "Sunday",
    flex: 0.6,
    resizable: false,
    cellClass: "no-outline-on-focus text-right",
    valueFormatter: (params) => {
      if (!params.value) return formatCurrency2(0);
      return formatCurrency2(params.value);
    }
  },
];
