import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../../hooks";

export const useHeight = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);
  useEffect(() => {
    const updateHeight = () => {
      if (gridRef.current) {
        const newHeight = gridRef.current.getBoundingClientRect().height;
        let mult = 0.676;
        if (window.innerWidth < 1537) {
          mult = 0.63;
        }
        const newHeight75 = newHeight * mult;
        setHeight(newHeight75);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => {
      window.removeEventListener("resize", updateHeight);
    };
  }, []);
  return { gridRef, height };
};

export const useLeftColHeight = () => {
  const sales = useAppSelector((state) => state.sales);
  const [height, setHeight] = useState<number>(0);
  const topLeftRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleheight = () => {
      if (topLeftRef.current && leftColRef.current) {
        setHeight(leftColRef.current.clientHeight - topLeftRef.current.clientHeight - 18);
      }
    };
    handleheight();

    window.addEventListener("resize", handleheight);
    return () => {
      window.removeEventListener("resize", handleheight);
    };
  }, [sales.salesPanels]);

  return { height, topLeftRef, leftColRef };
};
