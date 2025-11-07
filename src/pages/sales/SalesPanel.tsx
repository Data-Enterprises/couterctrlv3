import type { SalesTwoDates, SelectedSalesPanel } from "../../interfaces";
import { formatCurrency2 } from "../../utils";
import { useStyling } from "./hooks";
import { useAppSelector } from "../../hooks";

interface SalesPanelProps {
  panel: SalesTwoDates;
  handlePanelClick: (panel: SalesTwoDates) => void;
  handleBtnClick: (panel: SalesTwoDates, type: string) => void;
}

const SalesPanel = ({
  panel,
  handlePanelClick,
  handleBtnClick,
}: SalesPanelProps) => {
  const { style, text } = useStyling();
  const selectedSalesPanel = useAppSelector(
    (state) => state.sales.selectedSalesPanel
  );

  const getDateLayout = (date: string) => {
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  };

  const bg = (panel: SalesTwoDates, selected: SelectedSalesPanel) => {
    const date = panel.sale_date.split("T")[0];
    if (
      date === selected.sale_date &&
      panel.terminal === selected.terminal &&
      panel.storeid === selected.storeid
    ) {
      return "bg-blue-200/90";
    } else {
      return "bg-custom-white";
    }
  };

  return (
    <div
      className={`${bg(
        panel,
        selectedSalesPanel
      )} bg-custom-white rounded-lg px-2 py-1 shadow-lg cursor-pointer hover:shadow-inner transition-all duration-200`}
      onClick={() => handlePanelClick(panel)}
    >
      <div
        className={`font-medium border-b border-content/30 flex justify-between ${text} py-[1px]`}
      >
        <div className="">{panel.store_name}</div>
        <div className=" text-center">
          {getDateLayout(panel.sale_date.split("T")[0])}
        </div>
      </div>
      <div className={`flex justify-between px-2 mt-1 ${text}`}>
        <div>
          <div className={text}>
            <div>Sales</div>
            <div className="font-medium">
              {formatCurrency2(panel.total_sales)}
            </div>
          </div>
          <div className={text}>
            <div>Weight</div>
            <div className="font-medium">{panel.weight.toFixed(2)}</div>
          </div>
        </div>
        <div>
          <div className={text}>
            <div>Quantity</div>
            <div className="font-medium">{panel.qty}</div>
          </div>
        </div>
      </div>
      <div className={`font-medium text-center ${text}`}>
        Terminal: {panel.terminal}
      </div>
      <div className="flex justify-around">
        <button
          className={`btn-themeBlue ${style}`}
          onClick={() => handleBtnClick(panel, "Subs")}
        >
          Subs
        </button>
        <button
          className={`btn-themeOrange ${style}`}
          onClick={() => handleBtnClick(panel, "Hourly")}
        >
          Hourly
        </button>
        <button
          className={`btn-themeGreen ${style}`}
          onClick={() => handleBtnClick(panel, "Cats")}
        >
          Cats
        </button>
      </div>
    </div>
  );
};

export default SalesPanel;
