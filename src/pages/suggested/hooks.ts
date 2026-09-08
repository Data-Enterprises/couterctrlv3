import { useAppSelector, useAppDispatch } from "../../hooks";

/** Flat context selector, same shape as useOrdersCtx/useReceiversCtx. */
export const useSuggestedCtx = () => {
  const dispatch = useAppDispatch();
  const { url, token, isMobile, isTablet } = useAppSelector((s) => s.app);
  const { type, singleDate, lastStore, lastGroup, selectedGroup, selectedStore } =
    useAppSelector((s) => s.search);
  const { userid, assignedStores, selectedGroupStores } = useAppSelector(
    (s) => s.user,
  );
  const {
    leadDays,
    coverDays,
    lookbackWeeks,
    groupRows,
    items,
    parameters,
    coverage,
    requestedStoreIds,
    sheetKey,
    expandedStores,
    loadingGroup,
    loadingItems,
    exportOpen,
    selectedDay,
    storeSearch,
    upcFilter,
    descFilter,
    onlyFlagged,
  } = useAppSelector((s) => s.suggested);

  return {
    dispatch,
    url,
    token,
    isMobile,
    isTablet,
    type,
    singleDate,
    lastStore,
    lastGroup,
    selectedGroup,
    selectedStore,
    userid,
    assignedStores,
    selectedGroupStores,
    leadDays,
    coverDays,
    lookbackWeeks,
    groupRows,
    items,
    parameters,
    coverage,
    requestedStoreIds,
    sheetKey,
    expandedStores,
    loadingGroup,
    loadingItems,
    exportOpen,
    selectedDay,
    storeSearch,
    upcFilter,
    descFilter,
    onlyFlagged,
  };
};
