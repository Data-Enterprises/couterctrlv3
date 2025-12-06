import { useState, useEffect } from "react";

export const useGridCols = () => {
  const [cols, setCols] = useState("grid-cols-3");

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setCols("grid-cols-1");
      } else if (width > 768) {
        setCols("grid-cols-3");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return cols;
};
