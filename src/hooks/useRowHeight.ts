import { useState, useEffect } from "react";

export const useRowHeight = () => {
  const [rows, setRows] = useState<string>("grid-rows-[20%_80%]");
  useEffect(() => {
    const handleRows = () => {
      if (window.innerWidth > 1536) {
        setRows("grid-rows-[18%_82%]");
      } else {
        setRows("grid-rows-[20%_80%]");
      }
    };

    handleRows();
    window.addEventListener("resize", handleRows);
    return () => {
      window.removeEventListener("resize", handleRows);
    };
  }, []);
  return { rows };
};
