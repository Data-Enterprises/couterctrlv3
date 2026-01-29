import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, WeeklySale } from "../../../interfaces";
import {
  finishQuery,
  reQuery,
  setCompareSalesPanel,
  setCompareSubs,
  setHourlySales,
  setSelectedSalesPanel,
  setSubSales,
  setTopTenItems,
  setWeeklySales,
} from "../../../features/salesSlice";
import { getHourly, getSubs, getTopTen, getWeekly } from "../../../api/sales";
import { addDays, formatGoliathDate, handleRipple } from "../../../utils";
import { useToast } from "../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import SalesPanel from "./SalesPanel";
import { comparePanels } from "../utils";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const sales = useAppSelector((state) => state.sales);
  const search = useAppSelector((state) => state.search);
  const [filtered, setFiltered] = useState<WeeklySale[]>([]);

  // on mount, fetch the data once
  useEffect(() => {
    handleDataFetch();
  }, []);

  // This runs after sales panels have been fetched and the user is toggling the selected sales panel
  useEffect(() => {
    if (sales.salesPanels.length === 0) return;
    handleDataFetch();
  }, [sales.selectedSalesPanel]);

  useEffect(() => {
    // Filter sales panels based on search text
    if (sales.salesPanelSearchText.trim() === "") {
      setFiltered(sales.salesPanels);
    } else {
      const searchText = sales.salesPanelSearchText.toLowerCase();
      const filteredPanels = sales.salesPanels.filter((panel) =>
        panel.store_name.toLowerCase().includes(searchText),
      );
      setFiltered(filteredPanels);
    }
  }, [sales.salesPanelSearchText, sales.salesPanels]);

  const handleDataFetch = () => {
    dispatch(reQuery());
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

    getWeekly(
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

    getTopTen(
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
    getHourly(
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

    getSubs(
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
          dispatch(finishQuery("subs"));
        }
      })
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
    // When selecting a new panel, clear out compare panel data
    dispatch(
      setCompareSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
    );
    dispatch(setCompareSubs([]));
  };

  const isReady = sales.salesPanels.length > 0 && !sales.panelsLoading;
  return (
    <div className="min-h-[100%] max-h-[100%] relative flex flex-col gap-2">
      {isReady &&
        filtered.map((panel, idx) => (
          <SalesPanel
            key={idx}
            id={idx}
            panel={panel}
            handlePanelClick={handlePanelClick}
          />
        ))}
      {sales.panelsLoading ? (
        <LoadingIndicator message="Loading Sales Panels..." />
      ) : null}
    </div>
  );
};

export default SalesPanels;
