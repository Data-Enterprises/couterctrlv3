import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../../../hooks";

export const usePriceSimContext = () => {
  const { storeids, radioId, selectedStores, isLoading } = useAppSelector(
    (state) => state.priceSim
  );
  const { url, token } = useAppSelector((state) => state.app);
  const { userid, assignedStores } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const { groups } = useAppSelector((state) => state.group);

  return {
    storeids,
    radioId,
    url,
    token,
    userid,
    assignedStores,
    selectedStores,
    groups,
    isLoading,
    startDate,
    endDate,
  };
};

export const  = () => {
  const state = useAppSelector((state) => state.priceSim);
  const topRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(0);

  const calcHeight = () => {
    if (topRef.current) {
      const position = topRef.current.getBoundingClientRect().bottom;
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
