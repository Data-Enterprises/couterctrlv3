import { themeQuartz } from "ag-grid-community";
import { useRef, useState, useEffect } from "react";

export const useScrollHeight = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const calcHeight = () => {
    if (!topRef.current) return;
    const position = topRef.current.getBoundingClientRect().bottom;
    setHeight(window.innerHeight - position - 16);
  };

  useEffect(() => {
    calcHeight();

    window.addEventListener("resize", calcHeight);
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, [window.innerWidth]);

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