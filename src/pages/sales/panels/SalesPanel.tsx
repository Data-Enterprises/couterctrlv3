import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  formatCurrency2,
  formatBigNumber,
  addDays,
  formatGoliathDate,
} from "../../../utils";
import type {
  SelectedSalesPanel,
  SalesPanelInfo,
  JsonError,
} from "../../../interfaces";
import { getHourly, getSubs } from "../../../api/sales";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getDateLayout } from "../utils";
import {
  setHourlySales,
  setSelectedSalesPanel,
  setSubSales,
  setWindowVisible,
} from "../../../features/salesSlice";

interface SalesPanelProps {
  panel: SalesPanelInfo;
  handlePanelClick: (
    e: React.MouseEvent<HTMLDivElement>,
    panel: SalesPanelInfo
  ) => void;
}

const SalesPanel = ({ panel, handlePanelClick }: SalesPanelProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const { selectedSalesPanel } = useAppSelector((state) => state.sales);

  const bg = (panel: SalesPanelInfo, selected: SelectedSalesPanel) => {
    const date = panel.sale_date.split("T")[0];
    if (date === selected.sale_date && panel.storeid === selected.storeid) {
      return "bg-panel_active/75";
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

  const handleHourlyClick = (p: SalesPanelInfo) => {
    const date = p.sale_date.split("T")[0];
    dispatch(
      setSelectedSalesPanel({
        sale_date: date,
        storeid: panel.storeid,
        store_name: panel.store_name,
      })
    );
    const end = p.sale_date.split("T")[0];
    const start = addDays(end, -7).toISOString().split("T")[0];
    getHourly(context.url, context.token, start, end, 0, p.storeid, 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setHourlySales(j.subs));
          dispatch(setWindowVisible({ key: "hourly", show: true }));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching hourly data: " + err.message)
      );
  };

  const handleSubClick = (p: SalesPanelInfo) => {
    const date = p.sale_date.split("T")[0];
    dispatch(
      setSelectedSalesPanel({
        sale_date: date,
        storeid: panel.storeid,
        store_name: panel.store_name,
      })
    );
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    // currently useGroups is 0 and singleStore is 1 until we build out further
    getSubs(context.url, context.token, start, end, 0, p.storeid, 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSubSales(j.subs));
          dispatch(setWindowVisible({ key: "subs", show: true }));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching subs data: " + err.message)
      );
  };

  const handleCatClick = (p: SalesPanelInfo) => {
    const date = p.sale_date.split("T")[0];
    dispatch(
      setSelectedSalesPanel({
        sale_date: date,
        storeid: panel.storeid,
        store_name: panel.store_name,
      })
    );

    // Get the category data here later
  };

  return (
    <div
      className={`${bg(
        panel,
        selectedSalesPanel
      )} rounded-lg p-2 shadow-lg cursor-pointer hover:shadow-inner 
      transition-all duration-200 select-none ripple-button min-h-[185px] relative`}
      onClick={(e) => handlePanelClick(e, panel)}
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
          className={`btn-themeBlue py-1.5 px-6`}
          onClick={() => handleSubClick(panel)}
        >
          Subs
        </button>
        <button
          className={`btn-themeOrange py-1.5 px-6`}
          onClick={() => handleHourlyClick(panel)}
        >
          Hourly
        </button>
        <button
          className={`btn-themeGreen py-1.5 px-6`}
          onClick={() => handleCatClick(panel)}
        >
          Cats
        </button>
      </div>
    </div>
  );
};

export default SalesPanel;
