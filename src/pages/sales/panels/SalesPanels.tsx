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
import Carousel from "../../../components/Carousel";
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

  const comparePanels = (a: SalesTwoDates, b: SelectedSalesPanel) => {
    const date = a.sale_date.split("T")[0];
    return (
      date === b.sale_date &&
      a.terminal === b.terminal &&
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
          terminal: panel.terminal,
          storeid: panel.storeid,
        })
      );
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
          terminal: panel.terminal,
          storeid: panel.storeid,
        })
      );
    }
    console.log(type);

    // Depending on the button type, different actions can be taken or just get rid of the buttons and call all three upon selection???
  };

  const chunkTrends = (arr: SalesTwoDates[], chunkSize: number) => {
    const chunks: SalesTwoDates[][] = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const panelChunks = chunkTrends(sales.salesPanels, 10);
  const isReady = sales.salesPanels.length > 0 && !sales.panelsLoading;
  return (
    <div className="min-h-[100%] max-h-[100%] relative">
      <Carousel className="bg-transparent h-[100%] animate-windowIn">
        {isReady &&
          panelChunks.map((chunk, chunkIdx) => (
            <div key={chunkIdx} className="grid grid-cols-5 gap-2">
              {chunk.map((panel, idx) => (
                <SalesPanel
                  key={idx}
                  panel={panel}
                  handlePanelClick={handlePanelClick}
                  handleBtnClick={handleBtnClick}
                />
              ))}
            </div>
          ))}
      </Carousel>
      {!isReady && <LoadingIndicator message="Loading Sales Panels..." />}
    </div>
  );
};

export default SalesPanels;
