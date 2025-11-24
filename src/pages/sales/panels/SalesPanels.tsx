import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type {
  JsonError,
  SalesTwoDates,
  SelectedSalesPanel,
} from "../../../interfaces";
import {
  setSelectedSalesPanel,
  setWeeklySales,
  setWindowVisible,
  type WindowVisible,
} from "../../../features/salesSlice";
import SalesPanel from "./SalesPanel";
import { getWeekly } from "../../../api/sales";
// import { addDays, formatGoliathDate, handleRipple } from "../../../utils"; // => this is what is actually needed
import { addDays, handleRipple } from "../../../utils"; // using this to avoid unused imports for now until hourly, subs, and cats are ready on the backend
import { useToast } from "../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const sales = useAppSelector((state) => state.sales);
  // uncomment this when cats, subs, and hourly endpoints are ready
  const search = useAppSelector((state) => state.search);
  const [filtered, setFiltered] = useState<SalesTwoDates[]>([]);

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

  const comparePanels = (a: SalesTwoDates, b: SelectedSalesPanel) => {
    const date = a.sale_date.split("T")[0];
    return (
      date === b.sale_date &&
      a.storeid === b.storeid &&
      b.store_name === a.store_name
    );
  };

  const handlePanelClick = (
    e: React.MouseEvent<HTMLDivElement>,
    panel: SalesTwoDates
  ) => {
    handleRipple(e); // Sets the ripple effect on click

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

      const useGroups = search.type === "Group" ? 1 : 0;
      const singleStore = search.type === "Store" ? 1 : 0;
      const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;
      const weeklyStart = addDays(panel.sale_date, -7)
        .toISOString()
        .split("T")[0];
      const weeklyEnd = new Date(panel.sale_date).toISOString().split("T")[0];
      getWeekly(
        context.url,
        context.token,
        weeklyStart,
        weeklyEnd,
        useGroups,
        searchValue,
        singleStore
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
      return;
    }

    // Getting the weekly net sales for the selected panel
    const weeklyStart = addDays(panel.sale_date, -7)
      .toISOString()
      .split("T")[0];
    const weeklyEnd = new Date(panel.sale_date).toISOString().split("T")[0];

    getWeekly(
      context.url,
      context.token,
      weeklyStart,
      weeklyEnd,
      0,
      panel.storeid,
      1
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
  };

  const showWindow = (type: keyof WindowVisible) => {
    dispatch(
      setWindowVisible({
        key: type,
        show: sales.windowVisible[type] ? false : true,
      })
    );
  };

  const handleBtnClick = (panel: SalesTwoDates, type: keyof WindowVisible) => {
    console.log("handleBtnClick", panel);
    // const start = formatGoliathDate(search.startDate);
    // const end = formatGoliathDate(search.endDate);
    // const useGroups = search.type === "Group" ? 1 : 0;
    // const singleStore = search.type === "Store" ? 1 : 0;
    // const searchValue = useGroups === 1 ? search.lastGroup : search.lastStore;
    if (type === "cats") {
      showWindow("cats");
      return;
    } else if (type === "subs") {
      showWindow("subs");
      return;
    } else if (type === "hourly") {
      showWindow("hourly");
      return;
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
            handleBtnClick={handleBtnClick}
          />
        ))}
      {sales.salesPanels.length === 0 ? (
        <LoadingIndicator message="Loading Sales Panels..." />
      ) : null}
    </div>
  );
};

export default SalesPanels;
