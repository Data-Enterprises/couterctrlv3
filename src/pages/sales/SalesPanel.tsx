import type { SalesTwoDates } from "../../interfaces";
import { formatCurrency2 } from "../../utils";
import { useStyling } from "./hooks";

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
  const getDateLayout = (date: string) => {
    const [year, month, day] = date.split("-");
    console.log(`${month}/${day}/${year}`);
    return `${month}/${day}/${year}`;
  };

  return (
    <div
      className="bg-custom-white rounded-lg px-2 py-1 shadow-lg cursor-pointer hover:shadow-inner transition-shadow duration-500"
      onClick={() => handlePanelClick(panel)}
    >
      <div className="font-medium border-b border-content/30 flex justify-between">
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
      <div className={`font-medium text-center ${text}`}>Terminal: {panel.terminal}</div>
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
