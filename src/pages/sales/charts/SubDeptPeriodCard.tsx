import type { SubSale } from "../../../interfaces";
import { useAppSelector } from "../../../hooks";
import { useEffect, useState } from "react";
import type { TopSub } from "../components";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface SubDeptPeriodCardProps {
  data: SubSale[];
  dateRange: string;
  period: number;
  inReport?: boolean;
}

const defaultSub = (): TopSub => {
  return {
    sub_department: 0,
    sub_department_description: "",
    total_sales: 0,
    net_sales: 0,
    qty: 0,
    digital_coupons: 0,
    elec_instore_coupons: 0,
    elec_store_coupons: 0,
    store_coupon: 0,
    total_tax: 0,
  };
};

const SubDeptPeriodCard = ({
  data,
  dateRange,
  period,
  inReport = false,
}: SubDeptPeriodCardProps) => {
  const sales = useAppSelector((state) => state.sales);
  const [display, setDisplay] = useState<TopSub>(defaultSub);

  useEffect(() => {
    if (sales.subSales.length === 0) {
      setDisplay(defaultSub);
    }
  }, [sales.subSales]);

  useEffect(() => {
    if (sales.selectedSubDept) {
      const displayData = formatCardData(data);
      setDisplay(displayData);
    }
  }, [sales.selectedSubDept]);

  const formatCardData = (cardData: SubSale[]) => {
    if (!sales.selectedSubDept) return defaultSub();
    const subId = sales.selectedSubDept.sub_department;
    const filtered = cardData.filter((s) => s.sub_department === subId);
    return filtered.reduce((acc: TopSub, curr: SubSale) => {
      acc.sub_department = curr.sub_department;
      acc.sub_department_description = curr.sub_department_description;
      acc.total_sales += curr.total_sales - curr.total_tax;
      acc.net_sales += curr.net_sales;
      acc.qty += curr.qty;
      acc.digital_coupons += curr.digital_coupons;
      acc.elec_instore_coupons += curr.elec_instore_coupons;
      acc.elec_store_coupons += curr.elec_store_coupons;
      acc.store_coupon += curr.store_coupon;
      acc.total_tax += curr.total_tax;

      return acc;
    }, defaultSub());
  };

  const renderArrowIcon = (val: number) => {
    let trendingUp = false;
    let textColor = "";
    const classStr = "h-5 w-5 inline-block stroke-2";

    const compareVal = formatCardData(sales.subSalesWk2).total_sales;

    console.log(val, compareVal);

    if (val === compareVal) return null;

    trendingUp = val >= compareVal;
    textColor = trendingUp ? "text-emerald-500" : "text-orange-500";
    
    // Return based on the total sales comparison
    if (trendingUp) {
      return <ArrowTrendingUpIcon className={classStr + " " + textColor} />;
    } else {
      return <ArrowTrendingDownIcon className={classStr + " " + textColor} />;
    }
  };

  return (
    <div
      className={`text-sm rounded-lg ${inReport ? "border border-content/50" : "shadow-md"} bg-custom-white`}
    >
      <div className="font-medium flex justify-between mb-1 border-b bg-blue-500 text-custom-white rounded-t-lg px-2 py-0.5">
        <div>{dateRange}</div>
        <div>{display.sub_department_description}</div>
      </div>
      <div className="relative">
        {period === 1 ? (
          <div className="absolute right-2 top-0 text-[13.5px] flex gap-2">
            <div className="text-content font-medium flex gap-1 items-center">
              <div>Trend</div>
              {renderArrowIcon(display.total_sales)}
            </div>
          </div>
        ) : null}

        <div className="font-medium px-2">Totals</div>
        <div className="grid grid-cols-3 gap-4 px-2 mt-1">
          <div>
            <div className="text-content/60">Sales</div>
            <div className="font-medium text-xs">
              {formatCurrency2(display.total_sales)}
            </div>
          </div>
          <div>
            <div className="text-content/60">Net</div>
            <div className="font-medium text-xs">
              {formatCurrency2(display.net_sales)}
            </div>
          </div>
          <div>
            <div className="text-content/60">Qty</div>
            <div className="font-medium text-xs">
              {formatBigNumber(display.qty, 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="px-2 pb-2 pt-1">
        <div className="font-medium">Coupons</div>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <div className="text-content/60">Digital</div>
            <div className="font-medium text-xs">
              {formatCurrency2(display.digital_coupons)}
            </div>
          </div>
          <div>
            <div className="text-content/60">Store</div>
            <div className="font-medium text-xs">
              {formatCurrency2(display.store_coupon)}
            </div>
          </div>
          <div>
            <div className="text-content/60">E. Store</div>
            <div className="font-medium text-xs">
              {formatCurrency2(display.elec_store_coupons)}
            </div>
          </div>
          <div>
            <div className="text-content/60">E. Instore</div>
            <div className="font-medium text-xs">
              {formatCurrency2(display.elec_instore_coupons)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SubDeptPeriodCard;
