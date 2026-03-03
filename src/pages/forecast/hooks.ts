import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks";

export const useForecastContext = () => {
  const { storeids, radioId, selectedStores, isLoading } = useAppSelector(
    (state) => state.forecast,
  );
  const { url, token } = useAppSelector((state) => state.app);
  const { userid, assignedStores } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  const { groups } = useAppSelector((state) => state.group);
  const { forecastResults } = useAppSelector((state) => state.forecast);

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
    forecastResults,
  };
};

export const useResizeContext = (alt: string) => {
  const [height, setHeight] = useState<string>("min-h-28 max-h-28");
  const [scrollHeight, setInnerHeight] = useState<string>("min-h-24 max-h-24");

  useEffect(() => {
    const calcHeight = () => {
      if (window.innerWidth < 1537) {
        setHeight("min-h-[86px] max-h-[86px]");
        setInnerHeight("min-h-[82px] max-h-[82px]");
      } else {
        const newHeight =
          alt === "large" ? "min-h-32 max-h-32" : "min-h-28 max-h-28 mb-3";
        const newInnerHeight =
          alt === "large" ? "min-h-32 max-h-32" : "min-h-24 max-h-24";
        setHeight(newHeight);
        setInnerHeight(newInnerHeight);
      }
    };

    window.addEventListener("resize", calcHeight);
    calcHeight();
    return () => {
      window.removeEventListener("resize", calcHeight);
    };
  }, []);

  return {
    height,
    scrollHeight,
  };
};
