import { useAppSelector, useAppDispatch } from "../../../hooks";
import { addDays, formatGoliathDate } from "../../../utils";

export const useMobileSalesCtx = () => {
  const dispatch = useAppDispatch();
  const {
    dashboardOption,
    hourlyKey,
    salesTrackerView,
    hours,
    hourlySales,
    hourlySalesLastYear,
    lastYrSubTrackerMobile,
    loadingTYTrackerMobile,
    loadingLYTrackerMobile,
    lyCollapsedSubSalesMobile,
    lyWeekCardsMobile,
    panelsLoading,
    panelSortOption,
    salesPanels,
    salesTrackerSelectedSubDept,
    salesViewHourly,
    salesViewHourlyLastYear,
    salesViewTopTen,
    salesViewWeekly,
    selectedStore,
    selectedSubDept,
    sortDir,
    subSales,
    subSalesWk1,
    subSalesWk2,
    subSalesWk3,
    subSalesWk4,
    thisYrSubTrackerMobile,
    topSubDept,
    topTenItems,
    trackerKpis,
    tyCollapsedSubSalesMobile,
    tyReducedTotalsMobile,
    tyReducedTotalsMobileFilteredBySub,
    tyWeekCardsMobile,
    uniqueSubsMobile,
    view,
    weeklySales,
    weeklySalesLastYear,
  } = useAppSelector((state) => state.salesMobile);
  const { groups } = useAppSelector((state) => state.group);
  const { assignedStores } = useAppSelector((state) => state.user);

  const { token, url } = useAppSelector((state) => state.app);
  const { lastGroup, lastStore, singleDate, type } = useAppSelector(
    (state) => state.search,
  );

  const endDate = formatGoliathDate(singleDate);
  const useGroups = type === "Group" ? 1 : 0;
  const singleStore = type === "Store" ? 1 : 0;
  const searchValue = useGroups === 1 ? lastGroup : lastStore;
  const startDate = addDays(singleDate, -6).toISOString().split("T")[0];

  return {
    dispatch,
    assignedStores,
    dashboardOption,
    endDate,
    groups,
    hourlyKey,
    hours,
    hourlySales,
    hourlySalesLastYear,
    lastGroup,
    lastStore,
    panelsLoading,
    panelSortOption,
    salesPanels,
    salesViewHourly,
    salesViewHourlyLastYear,
    salesViewTopTen,
    salesViewWeekly,
    searchValue,
    selectedStore,
    selectedSubDept,
    singleStore,
    sortDir,
    startDate,
    subSales,
    subSalesWk1,
    subSalesWk2,
    subSalesWk3,
    subSalesWk4,
    token,
    topSubDept,
    topTenItems,
    type,
    url,
    useGroups,
    view,
    weeklySales,
    weeklySalesLastYear,
    // Sales Tracker
    lastYrSubTrackerMobile,
    loadingTYTrackerMobile,
    loadingLYTrackerMobile,
    lyCollapsedSubSalesMobile,
    lyWeekCardsMobile,
    salesTrackerSelectedSubDept,
    thisYrSubTrackerMobile,
    trackerKpis,
    tyCollapsedSubSalesMobile,
    tyReducedTotalsMobile,
    tyWeekCardsMobile,
    uniqueSubsMobile,
    salesTrackerView,
    tyReducedTotalsMobileFilteredBySub,
  };
};
