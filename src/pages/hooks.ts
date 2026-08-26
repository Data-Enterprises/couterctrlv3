import { useState, useEffect } from "react";
import { useAppSelector } from "../hooks";
import { formatGoliathDate } from "../utils";
import { isGroupSearch } from "../features/searchSlice";

export const useApiContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  const useGroups = isGroupSearch(search.type) ? 1 : 0;
  const singleStore = search.type === "Store" ? 1 : 0;
  const searchValue =
    isGroupSearch(search.type) ? search.lastGroup : search.lastStore;

  const start = formatGoliathDate(search.startDate);
  const end = formatGoliathDate(search.endDate);

  const [sm, sd, sy] = search.singleDate.split("/").map(Number);
  const lpEndD      = new Date(sy, sm - 1, sd);
  const lpStartD    = new Date(sy, sm - 1, sd - 6);
  const lpBaseEndD  = new Date(sy, sm - 1, sd - 7);
  const lpBaseStartD = new Date(sy, sm - 1, sd - 20);
  const padFmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const lpStart     = padFmt(lpStartD);
  const lpEnd       = padFmt(lpEndD);
  const lpBaseStart = padFmt(lpBaseStartD);
  const lpBaseEnd   = padFmt(lpBaseEndD);

  return {
    url,
    token,
    useGroups,
    singleStore,
    searchValue,
    start,
    end,
    lpStart,
    lpEnd,
    lpBaseStart,
    lpBaseEnd,
  };
};

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