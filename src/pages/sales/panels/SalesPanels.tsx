import { useAppSelector, useAppDispatch } from "../../../hooks";
import type {
  JsonError,
  SalesTwoDates,
  SelectedSalesPanel,
} from "../../../interfaces";
import {
  setSelectedSalesPanel,
  setWeeklySales,
} from "../../../features/salesSlice";
import SalesPanel from "./SalesPanel";
import { getWeekly } from "../../../api/sales";
import { addDays, handleRipple } from "../../../utils";
import { useToast } from "../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const sales = useAppSelector((state) => state.sales);

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
      return;
    }

    const weeklyStart = addDays(panel.sale_date, -7)
      .toISOString()
      .split("T")[0];
    const weeklyEnd = new Date(panel.sale_date).toISOString().split("T")[0];
    getWeekly(context.url, context.token, panel.storeid, weeklyStart, weeklyEnd)
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

  const handleBtnClick = (panel: SalesTwoDates, type: string) => {
    console.log(panel, type);
    // The handlePanelClick is also being called which handles setting the selected panel
    // Here we just need to fire off which window we want to open (subs, Hourly, or Cats)
  };

  const isReady = sales.salesPanels.length > 0 && !sales.panelsLoading;
  return (
    <div className="min-h-[100%] max-h-[100%] relative flex flex-col gap-2">
      {isReady &&
        sales.salesPanels.map((panel, idx) => (
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
