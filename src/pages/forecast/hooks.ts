import { useAppSelector } from "../../hooks";

export const useForecastContext = () => {
  const { storeids, radioId, selectedStores } = useAppSelector((state) => state.forecast);
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
    startDate,
    endDate,
    groups,
  };
};
