import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks";

export const useForecastContext = () => {
  const { storeids, radioId, selectedStores, isLoading } = useAppSelector(
    (state) => state.forecast
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

  useEffect(() => {
    const calcHeight = () => {
      if (window.innerWidth < 1537) {
        setHeight("min-h-[86px] max-h-[86px]");
      } else {
        const newHeight = alt === "large" ? "min-h-32 max-h-32" : "min-h-28 max-h-28 mb-3";
        setHeight(newHeight);
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
  };
};
