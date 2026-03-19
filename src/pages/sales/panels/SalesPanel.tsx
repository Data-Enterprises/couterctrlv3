import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  formatCurrency2,
  formatBigNumber,
  formatGoliathDate,
} from "../../../utils";
import type {
  JsonError,
  SelectedSalesPanel,
  WeeklySale,
} from "../../../interfaces";
import { getDateLayout } from "../utils";
import { getSubsComp } from "../../../api/sales";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCompareSubsLeftCompareData,
  setCompareSubsModalOpen,
  setLeftSubCompare,
} from "../../../features/salesSlice";

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
  const { selectedSalesPanel } = useAppSelector((state) => state.sales);

  const border = (panel: WeeklySale, selected: SelectedSalesPanel) => {
    const date = panel.sale_date.split("T")[0];
    if (date === selected.sale_date && panel.storeid === selected.storeid) {
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

  const handleCompareClick = (panel: WeeklySale) => {
    // set the left compare panel
    dispatch(setLeftSubCompare(panel));
    dispatch(setCompareSubsModalOpen(true));
    const date = formatGoliathDate(panel.sale_date);
    getSubsComp(context.url, context.token, date, date, panel.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setCompareSubsLeftCompareData(j.subs));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
    // make the api call to get the sub dept sales for this panel
    // then open the compare subs modal
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
        className={`justify-around mt-2 gap-4 ${
          !context.isDesktop && "hidden"
        }`}
      >
        <button
          data-testid={`sales-panel-2-${id}`}
          className={`btn-themeGreen py-1.5 px-0 text-nowrap w-full`}
          onClick={() => handleCompareClick(panel)}
        >
          Compare Sub Depts
        </button>
      </div>
    </div>
  );
};

export default SalesPanel;
