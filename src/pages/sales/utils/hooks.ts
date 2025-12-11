import { useState, useEffect, useRef } from "react";

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
