import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type {
  JsonError,
  SelectedSalesPanel,
  WeeklySale,
} from "../../../interfaces";
import {
  finishQuery,
  reQuery,
  setHourlySales,
  setHourlySalesLastYear,
  setLeftSubCompare,
  setPeriodSubSales,
  setRightSubCompare,
  setSelectedSalesPanel,
  setSubSales,
  setTopTenItems,
  setWeeklySales,
  setWeeklySalesLastYear,
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
    if (sales.salesPanels.length) {
      handleDataFetch(null);
    }
  }, [sales.salesPanels]);

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

  const handleDataFetch = async (p: SelectedSalesPanel | null) => {
    dispatch(reQuery());
    dispatch(setLeftSubCompare(null));
    dispatch(setRightSubCompare(null));

    // const p = sales.selectedSalesPanel;
    const start =
      p !== null
        ? p.sale_date.split("T")[0]
        : formatGoliathDate(search.singleDate);
    const end =
      p !== null
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
    const groupParam = p && p.storeid > 0 ? 0 : useGroups;
    const singleStoreParam = p && p.storeid > 0 ? 1 : singleStore;
    const searchParam = p && p.storeid > 0 ? p.storeid : searchValue;

    // This is for determining the search type for Top Ten
    const searchType = p && p.storeid > 0 ? "Store" : search.type;

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

          // Then fetch last year
          const endDateLY = sameWeekDayLastYear(weeklyEnd);
          const lyDate = new Date(endDateLY.date);
          const lyWkEnd = setDates(lyDate);
          const lyWkStart = setDates(lyDate, 6);
          getWeekly(
            context.url,
            context.token,
            lyWkStart,
            lyWkEnd,
            groupParam,
            searchParam,
            singleStoreParam,
          )
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                dispatch(setWeeklySalesLastYear(j.sales));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .then(() => dispatch(finishQuery("weekly")))
      .catch((err: JsonError) =>
        toast.error("Error fetching weekly data: " + err.message),
      );

    await getTopTen(
      context.url,
      context.token,
      searchParam,
      searchType,
      p && p.sale_date ? start : weeklyStart,
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
          // Then fetch last year
          const endDateLY = sameWeekDayLastYear(weeklyEnd);
          const lyDate = new Date(endDateLY.date);
          const lyWkEnd = setDates(lyDate);
          const lyWkStart = setDates(lyDate, 6);
          getHourly(
            context.url,
            context.token,
            lyWkStart,
            lyWkEnd,
            groupParam,
            searchParam,
            singleStoreParam,
          )
            .then((resp) => {
              const j = resp.data;
              if (j.error === 0) {
                dispatch(setHourlySalesLastYear(j.subs));
              }
            })
            .catch((err: JsonError) => toast.error(err.message));
        }
      })
      .then(() => dispatch(finishQuery("hourly")))
      .catch((err: JsonError) =>
        toast.error("Error fetching hourly data: " + err.message),
      );

    await getSubs(
      context.url,
      context.token,
      p && p.sale_date ? start : weeklyStart,
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
          getSubsData(p ? lastWeekEnd : lastWeekStart, lastWeekEnd, 2);

          // Last year's same week
          const endDateLY = sameWeekDayLastYear(weeklyEnd);
          const lyDate = new Date(endDateLY.date);
          const lyWkEnd = setDates(lyDate);
          const lyWkStart = setDates(lyDate, 6);
          getSubsData(p ? lyWkEnd : lyWkStart, lyWkEnd, 3);
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
    const newSelection: SelectedSalesPanel = {
      sale_date: date,
      storeid: panel.storeid,
      store_name: panel.store_name,
    };
    if (!comparePanels(panel, sales.selectedSalesPanel)) {
      dispatch(setSelectedSalesPanel(newSelection));
      handleDataFetch(newSelection);
    } else {
      dispatch(
        setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
      );
      handleDataFetch(null);
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
