import type { SelectedSalesPanel, SalesPanelInfo } from "../../../interfaces";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import { useAppSelector } from "../../../hooks";
import { getDateLayout } from "../utils";

interface SalesPanelProps {
  panel: SalesPanelInfo;
  handlePanelClick: (panel: SalesPanelInfo) => void;
  handleBtnClick: (panel: SalesPanelInfo, type: string) => void;
}

const SalesPanel = ({
  panel,
  handlePanelClick,
  handleBtnClick,
}: SalesPanelProps) => {
  const { selectedSalesPanel } = useAppSelector((state) => state.sales);

  const bg = (panel: SalesPanelInfo, selected: SelectedSalesPanel) => {
    const date = panel.sale_date.split("T")[0];
    if (date === selected.sale_date && panel.storeid === selected.storeid) {
      return "bg-blue-200/90";
    } else {
      return "bg-custom-white";
    }
  };

  const formatWeight = (weight: number) => {
    const formatted = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(weight);

    return formatted;
  };

  return (
    <div
      className={`${bg(
        panel,
        selectedSalesPanel
      )} bg-custom-white rounded-lg p-2 shadow-lg cursor-pointer hover:shadow-inner transition-all duration-200 select-none`}
      onClick={() => handlePanelClick(panel)}
    >
      <div className={`font-bold text-center`}>
        <div className="">{panel.store_name}</div>
      </div>
      <div className={`flex justify-between items-center px-2`}>
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
      <div className="w-full flex flex-col items-center">
        <div>
          <div>Weight</div>
          <div className="font-medium">{formatWeight(panel.weight)}</div>
        </div>
      </div>
      <div className="flex justify-around mt-2">
        <button
          className={`btn-themeBlue py-1.5`}
          onClick={() => handleBtnClick(panel, "Subs")}
        >
          Subs
        </button>
        <button
          className={`btn-themeOrange py-1.5`}
          onClick={() => handleBtnClick(panel, "Hourly")}
        >
          Hourly
        </button>
        <button
          className={`btn-themeGreen py-1.5`}
          onClick={() => handleBtnClick(panel, "Cats")}
        >
          Cats
        </button>
      </div>
    </div>
  );
};

export default SalesPanel;
