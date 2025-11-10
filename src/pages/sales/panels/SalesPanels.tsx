import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type {
  JsonError,
  SalesTwoDates,
  SelectedSalesPanel,
  SalesPanelInfo,
} from "../../../interfaces";
import {
  setSelectedSalesPanel,
  setWeeklySales,
} from "../../../features/salesSlice";
import SalesPanel from "./SalesPanel";
import { getWeekly } from "../../../api/sales";
import { formatGoliathDate } from "../../../utils";
import { useToast } from "../../../components/toasts/hooks/useToast";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";

const SalesPanels = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const sales = useAppSelector((state) => state.sales);
  const search = useAppSelector((state) => state.search);
  const [panels, setPanels] = useState<SalesPanelInfo[]>([]);

  useEffect(() => {
    if (sales.salesPanels.length > 0) {
      // Reduce panels to combine same storeid and sale_date entries and sum their qty, total_sales, and weight without terminal
      const reducedPanels: SalesPanelInfo[] = [...sales.salesPanels]
        .reduce((acc, panel) => {
          const found = acc.find(
            (p) =>
              p.storeid === panel.storeid && p.sale_date === panel.sale_date
          );
          if (found) {
            found.qty += panel.qty;
            found.total_sales += panel.total_sales;
            found.weight += panel.weight;
          } else {
            const panelWithoutTerminal = { ...panel };
            delete panelWithoutTerminal.terminal; // Remove terminal property, this has to be optional for TS to be okay with that
            acc.push({ ...panelWithoutTerminal });
          }
          return acc;
        }, [] as SalesPanelInfo[])
        .sort((a, b) =>
          new Date(a.sale_date) > new Date(b.sale_date) ? -1 : 1
        );
      setPanels(reducedPanels);
    }
  }, [sales.salesPanels]);

  const comparePanels = (a: SalesTwoDates, b: SelectedSalesPanel) => {
    const date = a.sale_date.split("T")[0];
    return (
      date === b.sale_date &&
      // a.terminal === b.terminal &&
      a.storeid === b.storeid
    );
  };

  const handlePanelClick = (panel: SalesTwoDates) => {
    // For now I'm formatting the date before the api call since the api needs it that way
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);

    // This date is being used to compare with the selected panel in redux
    const date = panel.sale_date.split("T")[0];
    if (!comparePanels(panel, sales.selectedSalesPanel)) {
      dispatch(
        setSelectedSalesPanel({
          sale_date: date,
          storeid: panel.storeid,
        })
      );
    } else {
      dispatch(setSelectedSalesPanel({ sale_date: "", storeid: 0 }));
      return;
    }
    getWeekly(context.url, context.token, panel.storeid, start, end)
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
    // This date is being used to compare with the selected panel in redux
    const date = panel.sale_date.split("T")[0];
    if (!comparePanels(panel, sales.selectedSalesPanel)) {
      dispatch(
        setSelectedSalesPanel({
          sale_date: date,
          storeid: panel.storeid,
        })
      );
    }
    console.log(type);

    // Depending on the button type, different actions can be taken or just get rid of the buttons and call all three upon selection???
  };

  const isReady = panels.length > 0 && !sales.panelsLoading;
  return (
    <div className="min-h-[100%] max-h-[100%] relative flex flex-col gap-2">
      {isReady &&
        panels.map((panel, idx) => (
          <SalesPanel
            key={idx}
            panel={panel}
            handlePanelClick={handlePanelClick}
            handleBtnClick={handleBtnClick}
          />
        ))}
      {!isReady && <LoadingIndicator message="Loading Sales Panels..." />}
    </div>
  );
};

export default SalesPanels;
