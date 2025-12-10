import { useAppSelector } from "../../hooks";

export const useForecastContext = () => {
  const { storeids, radioId, selectedStores, isLoading } = useAppSelector(
    (state) => state.forecast
  );
  const { url, token } = useAppSelector((state) => state.app);
  const { userid, assignedStores } = useAppSelector((state) => state.user);
  const { singleDate } = useAppSelector((state) => state.search);
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
    singleDate
  };
};
