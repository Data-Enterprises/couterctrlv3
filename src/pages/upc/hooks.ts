import { useAppSelector } from "../../hooks";

export const useUpcContext = () => {
  const { url, token } = useAppSelector((state) => state.app);
  const { userid } = useAppSelector((state) => state.user);
  const { startDate, endDate, type } = useAppSelector((state) => state.search);
  const {
    index,
    selectedMode,
    storeids,
    dataLoaded,
    upcCount,
    upcItems,
    salesComp,
    trendPeriods,
    selectedUpcs,
    selectedStores,
    selectedCompOne,
    selectedCompTwo,
    radioId,
    isLoading,
    forecast,
    optBestPrices,
    upcTrends,
    uploadedUpcs,
    selectedView,
    selectedAssociationUpcParam,
    forecastQtyData
  } = useAppSelector((state) => state.upc);

  return {
    url,
    token,
    userid,
    startDate,
    endDate,
    forecastQtyData,
    index,
    selectedMode,
    storeids,
    dataLoaded,
    upcCount,
    salesComp,
    upcItems,
    trendPeriods,
    selectedUpcs,
    selectedStores,
    selectedCompOne,
    selectedCompTwo,
    radioId,
    type,
    isLoading,
    forecast,
    optBestPrices,
    upcTrends,
    uploadedUpcs,
    selectedView,
    selectedAssociationUpcParam,
  };
};
