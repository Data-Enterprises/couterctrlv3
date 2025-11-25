import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type {
  JsonError,
  WeeklySale,
  SelectedSalesPanel,
} from "../../../interfaces";
import {
  setSelectedSalesPanel,
  setSubSales,
  setTopTenItems,
  setWeeklySales,
  setWindowVisible,
  // setWindowVisible,
  // type WindowVisible,
} from "../../../features/salesSlice";
import { getSubs, getTopTen, getWeekly } from "../../../api/sales";
import { addDays, formatGoliathDate, handleRipple } from "../../../utils";
import { useToast } from "../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import SalesPanel from "./SalesPanel";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const sales = useAppSelector((state) => state.sales);
  const search = useAppSelector((state) => state.search);
  const [filtered, setFiltered] = useState<WeeklySale[]>([]);

  useEffect(() => {
    // Filter sales panels based on search text
    if (sales.salesPanelSearchText.trim() === "") {
      setFiltered(sales.salesPanels);
    } else {
      const searchText = sales.salesPanelSearchText.toLowerCase();
      const filteredPanels = sales.salesPanels.filter((panel) =>
        panel.store_name.toLowerCase().includes(searchText)
      );
      setFiltered(filteredPanels);
    }
  }, [sales.salesPanelSearchText, sales.salesPanels]);

  const comparePanels = (a: WeeklySale, b: SelectedSalesPanel) => {
    const date = a.sale_date.split("T")[0];
    return (
      date === b.sale_date &&
      a.storeid === b.storeid &&
      b.store_name === a.store_name
    );
  };

  useEffect(() => {
    const p = sales.selectedSalesPanel;
    const start = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.startDate);
    const end = p.sale_date
      ? p.sale_date.split("T")[0]
      : formatGoliathDate(search.endDate);

    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;

    const weeklyStart = addDays(end, -7).toISOString().split("T")[0];
    const weeklyEnd = new Date(end).toISOString().split("T")[0];

    const groupParam = p.storeid > 0 ? 0 : useGroups;
    const singleStoreParam = p.storeid > 0 ? 1 : singleStore;
    const searchParam = p.storeid > 0 ? p.storeid : searchValue;

    getWeekly(
      context.url,
      context.token,
      weeklyStart,
      weeklyEnd,
      groupParam,
      searchParam,
      singleStoreParam
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setWeeklySales(j.sales));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching weekly data: " + err.message)
      );

    getSubs(
      context.url,
      context.token,
      start,
      end,
      groupParam,
      searchParam,
      singleStoreParam
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSubSales(j.subs));
          dispatch(setWindowVisible({ key: "subs", show: true }));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching subs data: " + err.message)
      );

      const searchType = p.storeid > 0 ? "Store" : search.type;
    getTopTen(context.url, context.token, searchParam, searchType, start, end)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setTopTenItems(j.items));
        }
      })
      .catch((err: JsonError) => {
        toast.error("Error getting Top Ten data: " + err.message);
      });
  }, [sales.selectedSalesPanel]);

  const handlePanelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    panel: WeeklySale
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
        })
      );
    } else {
      dispatch(
        setSelectedSalesPanel({ sale_date: "", storeid: 0, store_name: "" })
      );
    }
  };

  const isReady = sales.salesPanels.length > 0 && !sales.panelsLoading;
  return (
    <div className="min-h-[100%] max-h-[100%] relative flex flex-col gap-2">
      {isReady &&
        filtered.map((panel, idx) => (
          <SalesPanel
            key={idx}
            panel={panel}
            handlePanelClick={handlePanelClick}
          />
        ))}
      {sales.salesPanels.length === 0 ? (
        <LoadingIndicator message="Loading Sales Panels..." />
      ) : null}
    </div>
  );
};

export default SalesPanels;
