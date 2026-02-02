import { useState, useEffect, useRef } from "react";
import { useAppSelector } from "../../../hooks";

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
