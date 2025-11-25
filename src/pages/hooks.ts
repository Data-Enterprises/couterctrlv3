import { useRef, useState, useEffect } from "react";
import { useAppSelector } from "../hooks";
import { formatGoliathDate } from "../utils";

export const useApiContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  const useGroups = search.type === "Group" ? 1 : 0;
  const singleStore = search.type === "Store" ? 1 : 0;
  const searchValue =
    search.type === "Group" ? search.lastGroup : search.lastStore;

  const start = formatGoliathDate(search.startDate);
  const end = formatGoliathDate(search.endDate);

  return {
    url,
    token,
    useGroups,
    singleStore,
    searchValue,
    start,
    end,
  };
};

export const useHeight = () => {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(385);

  useEffect(() => {
    const calcHeight = () => {
      if (topRef.current && bottomRef.current) {
        const topHeight = topRef.current.getBoundingClientRect().height;
        const bottomHeight = bottomRef.current.getBoundingClientRect().height;
        setHeight(topHeight - bottomHeight);
      }
    };
    calcHeight();
    window.addEventListener("resize", calcHeight);
    return () => window.removeEventListener("resize", calcHeight);
  });

  return { topRef, bottomRef, height };
};