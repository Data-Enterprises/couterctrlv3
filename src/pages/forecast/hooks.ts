import { useAppSelector } from "../../hooks";

export const useForecastContext = () => {
  const { storeids, radioId, selectedStores, isLoading } = useAppSelector(
    (state) => state.forecast,
  );
  const { url, token, isTablet } = useAppSelector((state) => state.app);
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
    isTablet
  };
};

// Moved to src/hooks; re-exported for this page's files.
export { useResizeContext } from "../../hooks/useResizeContext";
