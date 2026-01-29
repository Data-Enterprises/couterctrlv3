import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2, formatBigNumber, addDays } from "../../../utils";
import type {
  JsonError,
  SelectedSalesPanel,
  WeeklySale,
} from "../../../interfaces";
import { comparePanels, getDateLayout } from "../utils";
import {
  setCompareSalesPanel,
  setCompareSubs,
} from "../../../features/salesSlice";
import { getSubs } from "../../../api/sales";
import { useToast } from "../../../components/toasts/hooks/useToast";
// import { getCats } from "../../../api/sales";

interface SalesPanelProps {
  panel: WeeklySale;
  handlePanelClick: (
    e: React.MouseEvent<HTMLDivElement>,
    panel: WeeklySale,
  ) => void;
  id: number;
}

const SalesPanel = ({ panel, handlePanelClick, id }: SalesPanelProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  // const state = useAppSelector((state) => state.sales);
  const { selectedSalesPanel, compareSalesPanel } = useAppSelector(
    (state) => state.sales,
  );

  const border = (panel: WeeklySale, selected: SelectedSalesPanel) => {
    const date = panel.sale_date.split("T")[0];
    if (
      date === compareSalesPanel.sale_date &&
      panel.storeid === compareSalesPanel.storeid
    ) {
      return "shadow-inner border-2 border-emerald-500 rounded-xl";
    } else if (
      date === selected.sale_date &&
      panel.storeid === selected.storeid
    ) {
      return "shadow-inner border-2 border-content/70 rounded-xl";
    } else {
      return "";
    }
  };

  const formatWeight = (weight: number) => {
    const formatted = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(weight);

    return formatted;
  };

  // const handleCatClick = (panel: WeeklySale) => {
  //   // Toggling the cats data off if the same panel is clicked again
  //   if (state.catSales.length > 0 && state.catSales[0].storeid === panel.storeid) {
  //     dispatch(setCatSales([]));
  //     return;
  //   }

  //   const pd = panel.sale_date.split("T")[0];
  //   const start = pd;
  //   const end = pd;
  //   getCats(context.url, context.token, start, end, 0, panel.storeid, 1)
  //     .then((resp) => {
  //       const j = resp.data;
  //       if (j.error === 0) {
  //         dispatch(setCatSales(j.subs));
  //       }
  //     })
  //     .catch((err: JsonError) =>
  //       toast.error("Error fetching cats data: " + err.message)
  //     );
  // };

  const handleCompareClick = (panel: WeeklySale) => {
    const date = panel.sale_date.split("T")[0];
    if (!comparePanels(panel, compareSalesPanel)) {
      dispatch(
        setCompareSalesPanel({
          sale_date: date,
          storeid: panel.storeid,
          store_name: panel.store_name,
        }),
      );
      const weeklyStart = addDays(date, -6).toISOString().split("T")[0];
      const weeklyEnd = new Date(date).toISOString().split("T")[0];

      getSubs(
        context.url,
        context.token,
        weeklyStart,
        weeklyEnd,
        0,
        panel.storeid,
        1,
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setCompareSubs(j.subs));
          }
        })
        .catch((err: JsonError) =>
          toast.error("Error fetching subs data: " + err.message),
        );
    } else {
      dispatch(
        setCompareSalesPanel({ sale_date: "", storeid: 0, store_name: "" }),
      );
    }
  };

  return (
    <div
      className={`${border(
        panel,
        selectedSalesPanel,
      )} bg-custom-white rounded-lg p-2 shadow-lg cursor-pointer hover:shadow-inner 
      transition-all duration-200 select-none ripple-button md:min-h-[160px] relative text-sm`}
    >
      <div
        data-testid={`sales-panel-${id}`}
        className={`font-bold text-center`}
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div className="">{panel.store_name}</div>
      </div>
      <div
        data-testid={`sales-panel-0-${id}`}
        className={`flex justify-between items-center px-2`}
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div className="">
          <div className="text-left">Net Sales</div>
          <div className="font-medium">
            {formatCurrency2(panel.total_sales - panel.total_tax)}
          </div>
        </div>
        <div className="font-medium">
          {getDateLayout(panel.sale_date.split("T")[0])}
        </div>
        <div className=" pl-4">
          <div>Quantity</div>
          <div className="font-medium">{formatBigNumber(panel.qty, 0)}</div>
        </div>
      </div>
      <div
        data-testid={`sales-panel-1-${id}`}
        className="w-full flex flex-col items-center"
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div>
          <div>Weight</div>
          <div className="font-medium">{formatWeight(panel.weight)}</div>
        </div>
      </div>
      <div
        className={`flex justify-around mt-2 gap-4 ${
          !context.isDesktop && "hidden"
        }`}
      >
        <button
          data-testid={`sales-panel-2-${id}`}
          className={`btn-themeGreen py-1.5 px-7 text-nowrap w-full ${
            selectedSalesPanel.storeid === 0
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
          onClick={() => handleCompareClick(panel)}
        >
          Compare Subs
        </button>
        {/* <button
          data-testid={`sales-panel-cat-${id}`}
          className={`btn-themeBlue py-1.5 w-full`}
          onClick={() => handleCatClick(panel)}
        >
          Cats
        </button> */}
      </div>
    </div>
  );
};

export default SalesPanel;
