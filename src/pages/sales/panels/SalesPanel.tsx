import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import type {
  JsonError,
  SelectedSalesPanel,
  WeeklySale,
} from "../../../interfaces";
import { comparePanels, getDateLayout } from "../utils";
import {
  setCatSales,
  setCompareSalesPanel,
} from "../../../features/salesSlice";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getCats } from "../../../api/sales";

interface SalesPanelProps {
  panel: WeeklySale;
  handlePanelClick: (
    e: React.MouseEvent<HTMLDivElement>,
    panel: WeeklySale
  ) => void;
}

const SalesPanel = ({ panel, handlePanelClick }: SalesPanelProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const { selectedSalesPanel, compareSalesPanel } = useAppSelector(
    (state) => state.sales
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

  const handleCatClick = (panel: WeeklySale) => {
    const pd = panel.sale_date.split("T")[0];
    const start = pd;
    const end = pd;
    getCats(context.url, context.token, start, end, 0, panel.storeid, 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setCatSales(j.subs));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cats data: " + err.message)
      );
  };

  const handleCompareClick = (panel: WeeklySale) => {
    const date = panel.sale_date.split("T")[0];
    if (!comparePanels(panel, compareSalesPanel)) {
      dispatch(
        setCompareSalesPanel({
          sale_date: date,
          storeid: panel.storeid,
          store_name: panel.store_name,
        })
      );
    } else {
      dispatch(
        setCompareSalesPanel({ sale_date: "", storeid: 0, store_name: "" })
      );
    }
  };

  return (
    <div
      className={`${border(
        panel,
        selectedSalesPanel
      )} bg-custom-white rounded-lg p-2 shadow-lg cursor-pointer hover:shadow-inner 
      transition-all duration-200 select-none ripple-button md:min-h-[185px] relative`}
    >
      <div
        className={`font-bold text-center`}
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div className="">{panel.store_name}</div>
      </div>
      <div
        className={`flex justify-between items-center px-2`}
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div className="">
          <div className="text-left">Sales</div>
          <div className="font-medium">
            {formatCurrency2(panel.total_sales)}
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
          className={`btn-themeGreen py-1.5 px-7 text-nowrap w-full ${
            selectedSalesPanel.storeid === 0
              ? "opacity-50 pointer-events-none"
              : ""
          }`}
          onClick={() => handleCompareClick(panel)}
        >
          Compare Subs
        </button>
        <button
          className={`btn-themeBlue py-1.5 w-full`}
          onClick={() => handleCatClick(panel)}
        >
          Cats
        </button>
      </div>
    </div>
  );
};

export default SalesPanel;
