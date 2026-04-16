import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, WeeklySale } from "../../../interfaces";
import {
  finishQuery,
  reQuery,
  setHourlySales,
  setLeftSubCompare,
  setPeriodSubSales,
  setRightSubCompare,
  setSelectedSalesPanel,
  setSubSales,
  setTopTenItems,
  setWeeklySales,
} from "../../../features/salesSlice";
import { getHourly, getSubs, getTopTen, getWeekly } from "../../../api/sales";
import {
  addDays,
  formatGoliathDate,
  handleRipple,
  sameWeekDayLastYear,
} from "../../../utils";
import { useToast } from "../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import SalesPanel from "./SalesPanel";
import { comparePanels, setDates } from "../utils";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const sales = useAppSelector((state) => state.sales);
  const search = useAppSelector((state) => state.search);

  // on mount, fetch the data once
  useEffect(() => {
    handleDataFetch();
  }, [sales.salesPanels]);

  // This runs after sales panels have been fetched and the user is toggling the selected sales panel
  useEffect(() => {
    if (sales.selectedSalesPanel.storeid === 0) return;
    handleDataFetch();
  }, [sales.selectedSalesPanel]);

  const getSubsData = (ws: string, we: string, period: number) => {
    const p = sales.selectedSalesPanel;
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    const groupParam = p.storeid > 0 ? 0 : useGroups;
    const singleStoreParam = p.storeid > 0 ? 1 : singleStore;
    const searchParam = p.storeid > 0 ? p.storeid : searchValue;
    getSubs(
      context.url,
      context.token,
      ws,
      we,
      groupParam,
      searchParam,
      singleStoreParam,
    ).then((resp) => {
      const j = resp.data;
      if (j.error === 0 && j.subs.length > 0) {
        dispatch(setPeriodSubSales({ subs: j.subs, period }));
      } else {
        toast.warn(`No Sub-Department data found for week ${period}.`);
      }
    });
  };

  const handleDataFetch = async () => {
    dispatch(reQuery());
    dispatch(setLeftSubCompare(null));
    dispatch(setRightSubCompare(null));

    const p = sales.selectedSalesPanel;
    const start = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.singleDate);
    const end = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.singleDate);

    // useGroups and singleStore logic
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    // date logic for weekly sales
    const weeklyStart = addDays(end, -6).toISOString().split("T")[0];
    const weeklyEnd = new Date(end).toISOString().split("T")[0];

    // Final logic for params based on if a store panel is selected
    const groupParam = p.storeid > 0 ? 0 : useGroups;
    const singleStoreParam = p.storeid > 0 ? 1 : singleStore;
    const searchParam = p.storeid > 0 ? p.storeid : searchValue;

    // This is for determining the search type for Top Ten
    const searchType = p.storeid > 0 ? "Store" : search.type;

    // For this week
    await getWeekly(
      context.url,
      context.token,
      weeklyStart,
      weeklyEnd,
      groupParam,
      searchParam,
      singleStoreParam,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setWeeklySales(j.sales));
          dispatch(finishQuery("weekly"));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching weekly data: " + err.message),
      );

    await getTopTen(
      context.url,
      context.token,
      searchParam,
      searchType,
      p.sale_date ? start : weeklyStart,
      weeklyEnd,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setTopTenItems(j.items));
          dispatch(finishQuery("top ten"));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Top Ten data: " + err.message);
      });

    // Keep an eye on this - might need to adjust for weeklyStart and weeklyEnd
    await getHourly(
      context.url,
      context.token,
      weeklyStart,
      weeklyEnd,
      groupParam,
      searchParam,
      singleStoreParam,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setHourlySales(j.subs));
          dispatch(finishQuery("hourly"));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching hourly data: " + err.message),
      );

    await getSubs(
      context.url,
      context.token,
      p.sale_date ? start : weeklyStart,
      weeklyEnd,
      groupParam,
      searchParam,
      singleStoreParam,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSubSales(j.subs));
          // Last week
          const lastWkDate = new Date(weeklyEnd);
          const lastWeekEnd = setDates(lastWkDate, 7);
          const lastWeekStart = setDates(lastWkDate, 13);
          getSubsData(lastWeekStart, lastWeekEnd, 2);

          // Last year's same week
          const endDateLY = sameWeekDayLastYear(weeklyEnd);
          const lyDate = new Date(endDateLY.date);
          const lyWkEnd = setDates(lyDate);
          const lyWkStart = setDates(lyDate, 6);
          getSubsData(lyWkStart, lyWkEnd, 3);
        }
      })
      .then(() => dispatch(finishQuery("subs")))
      .catch((err: JsonError) =>
        toast.error("Error fetching subs data: " + err.message),
      );
  };

  const handlePanelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    panel: WeeklySale,
  ) => {
    handleRipple(e);
    // This date is being used to compare with the selected panel in redux
    const date = panel.sale_date.split("T")[0];
    if (!comparePanels(panel, sales.selectedSalesPanel)) {
      dispatch(
        setSelectedSalesPanel({
          sale_date: date,
          storeid: panel.storeid,
          store_name: panel.store_name,
        }),
      );
    } else {
      dispatch(
        setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
      );
    }
  };

  const isReady = sales.salesPanels.length > 0 && !sales.panelsLoading;
  return (
    <div className="min-h-[100%] max-h-[100%] relative flex flex-col justify-center gap-2">
      {isReady &&
        sales.salesPanels.map((panel, idx) => (
          <SalesPanel
            key={idx}
            id={idx}
            panel={panel}
            handlePanelClick={handlePanelClick}
          />
        ))}
      {sales.panelsLoading ? (
        <div className="mt-52 relative">
          <LoadingIndicator message="Loading Sales Panels..." />
        </div>
      ) : null}
    </div>
  );
};

export default SalesPanels;
