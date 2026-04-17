import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  formatCurrency2,
  formatBigNumber,
  formatGoliathDate,
} from "../../../utils";
import type {
  JsonError,
  SelectedSalesPanel,
  SubSale,
  WeeklySale,
} from "../../../interfaces";
import { getDateLayout } from "../utils";
import { getSubsComp } from "../../../api/sales";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setCompareSubsLeftCompareData,
  setCompareSubsModalOpen,
  setCompareSubsRightCompareData,
  setLeftSubCompare,
  setRightSubCompare,
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
  const {
    selectedSalesPanel,
    leftSubCompare,
    rightSubCompare,
    compareSubsLeftCompare,
  } = useAppSelector((state) => state.sales);

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
    let compareSide: "left" | "right" = "left";
    if (!leftSubCompare) {
      dispatch(setLeftSubCompare(panel));
    } else {
      compareSide = "right";
      dispatch(setRightSubCompare(panel));
    }

    const date = formatGoliathDate(panel.sale_date);
    getSubsComp(context.url, context.token, date, date, panel.storeid)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          if (compareSide === "left") {
            const sortedLeft = [...j.subs].sort(
              (a, b) => a.sub_department - b.sub_department,
            );
            dispatch(setCompareSubsLeftCompareData(sortedLeft));
          } else {
            const subs: SubSale[] = [...j.subs];
            const leftSide = [...compareSubsLeftCompare];
            const rightSide = [...subs];

            rightSide.forEach((sub) => {
              const found = leftSide.find(
                (leftSub) => leftSub.sub_department === sub.sub_department,
              );

              if (!found) {
                leftSide.push({
                  sub_department: sub.sub_department,
                  sub_department_description: sub.sub_department_description,
                  qty: 0,
                  total_sales: 0,
                  net_sales: 0,
                  total_tax: 0,
                  digital_coupons: 0,
                  weight: 0,
                  sale_date: leftSubCompare!.sale_date,
                  storeid: 0,
                  store_name: "",
                  elec_instore_coupons: 0,
                  elec_store_coupons: 0,
                  store_coupon: 0,
                  store_number: "",
                });
              }
            });

            leftSide.forEach((sub) => {
              const found = rightSide.find(
                (rightSub) => rightSub.sub_department === sub.sub_department,
              );
              if (!found) {
                rightSide.push({
                  sub_department: sub.sub_department,
                  sub_department_description: sub.sub_department_description,
                  qty: 0,
                  total_sales: 0,
                  net_sales: 0,
                  total_tax: 0,
                  digital_coupons: 0,
                  weight: 0,
                  sale_date: leftSubCompare!.sale_date,
                  storeid: 0,
                  store_name: "",
                  elec_instore_coupons: 0,
                  elec_store_coupons: 0,
                  store_coupon: 0,
                  store_number: "",
                });
              }
            });

            const leftSorted = leftSide.sort(
              (a, b) => a.sub_department - b.sub_department,
            );
            const rightSorted = rightSide.sort(
              (a, b) => a.sub_department - b.sub_department,
            );
            dispatch(setCompareSubsLeftCompareData(leftSorted));
            dispatch(setCompareSubsRightCompareData(rightSorted));
            dispatch(setCompareSubsModalOpen(true));
          }
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const displayCompareText = (panel: WeeklySale) => {
    if (
      !leftSubCompare ||
      (panel.storeid === leftSubCompare.storeid &&
        panel.sale_date === leftSubCompare.sale_date)
    ) {
      return "Compare Subs Left";
    } else {
      return "Compare Subs Right";
    }
  };

  const buttonStyle = (panel: WeeklySale) => {
    if (
      (leftSubCompare &&
        panel.storeid === leftSubCompare.storeid &&
        panel.sale_date === leftSubCompare.sale_date) ||
      (rightSubCompare &&
        panel.storeid === rightSubCompare.storeid &&
        panel.sale_date === rightSubCompare.sale_date)
    ) {
      return "btn-themeOrange";
    } else {
      return "btn-themeGreen";
    }
  };

  return (
    <div
      className={`${border(
        panel,
        selectedSalesPanel,
      )} bg-custom-white rounded-lg p-2 shadow-lg cursor-pointer hover:shadow-inner 
      transition-all duration-200 select-none ripple-button relative text-[13.2px]`}
    >
      <div
        data-testid={`sales-panel-${id}`}
        className={`font-medium grid grid-cols-2`}
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div className="">{panel.store_name}</div>

        <div className="font-medium text-right">
          {getDateLayout(panel.sale_date.split("T")[0])}
        </div>
        <div className="grid grid-cols-2 col-span-2">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
        </div>
      </div>
      <div
        data-testid={`sales-panel-0-${id}`}
        className={`grid grid-cols-3 text-center pt-1`}
        onClick={(e) => handlePanelClick(e, panel)}
      >
        <div className="text-left">
          <div className="">Net Sales</div>
          <div className="font-medium">
            {formatCurrency2(panel.total_sales - panel.total_tax)}
          </div>
        </div>
        <div className="">
          <div>Qty</div>
          <div className="font-medium">{formatBigNumber(panel.qty, 0)}</div>
        </div>
        <div className="text-right">
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
          className={`${buttonStyle(panel)} py-1.5 px-0 text-nowrap w-full`}
          onClick={() => handleCompareClick(panel)}
        >
          {displayCompareText(panel)}
        </button>
      </div>
    </div>
  );
};

export default SalesPanel;
