import { useAppSelector, useAppDispatch } from "../../../hooks";
import { addDays, formatGoliathDate } from "../../../utils";

export const useMobileSalesCtx = () => {
  const dispatch = useAppDispatch();
  const {
    hourlySales,
    panelsLoading,
    salesPanels,
    subSales,
    subSalesWk1,
    subSalesWk2,
    subSalesWk3,
    subSalesWk4,
    topSubDept,
    topTenItems,
  } = useAppSelector((state) => state.salesMobile);

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
    endDate,
    hourlySales,
    lastGroup,
    lastStore,
    panelsLoading,
    salesPanels,
    searchValue,
    singleStore,
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
  };
};
