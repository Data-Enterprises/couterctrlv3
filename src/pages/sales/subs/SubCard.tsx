import { useState, useEffect } from "react";
import { useAppSelector } from "../../../hooks";
import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

interface SubCardProps {
  sub: SubSale;
  type?: "main" | "compare";
}
const SubCard = ({ sub, type = "main" }: SubCardProps) => {
  const [isComparing, setIsComparing] = useState(false);
  const sales = useAppSelector((state) => state.sales);

  useEffect(() => {
    setIsComparing(sales.compareSalesPanel.storeid > 0);
  }, [sales.compareSalesPanel]);

  const showIcon = (
    num: number,
    key: keyof SubSale,
    type: "main" | "compare"
  ) => {
    if (!isComparing) return null;
    let found;
    if (type === "main") {
      found = sales.compareSubs.find(
        (s) => s.sub_department === sub.sub_department
      );
    } else {
      found = sales.subSales.find(
        (s) => s.sub_department === sub.sub_department
      );
    }

    if (!found) return null;

    const foundValue = Number(found[key as keyof SubSale]);
    if (num > foundValue) {
      return (
        <ArrowUpCircleIcon className="h-5 w-5 stroke-green-500 stroke-2 inline-block" />
      );
    } else if (num < foundValue) {
      return (
        <ArrowDownCircleIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block" />
      );
    }
  };

  return (
    <div className="rounded-lg shadow-md shadow-content/30 p-1.5 text-xs">
      <div className="flex justify-between border-b border-content/20 font-medium text-xs">
        <div>{sub.sub_department_description}</div>
        <div>{sub.store_name}</div>
      </div>

      <div className="font-medium mt-2">Totals</div>
      <div className="border-b border-content/20 grid grid-cols-[65%_35%] pb-2">
        <div className="flex gap-1">
          {showIcon(sub.net_sales, "net_sales", type)}
          <div className="font-medium">Net Sales:</div>
          <div>{formatCurrency2(sub.net_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          {showIcon(sub.qty, "qty", type)}
          <div className="font-medium">Qty:</div>
          <div>{formatBigNumber(sub.qty).split(".")[0]}</div>
        </div>
        <div className="flex gap-1">
          {showIcon(sub.total_sales, "total_sales", type)}
          <div className="font-medium">Total Sales:</div>
          <div>{formatCurrency2(sub.total_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          {showIcon(sub.weight, "weight", type)}
          <div className="font-medium">Weight:</div>
          <div>{formatBigNumber(sub.weight).split(".")[0]}</div>
        </div>
      </div>

      <div className="font-medium pt-2">Coupons</div>
      <div className="grid grid-cols-[40%_60%]">
        <div className="flex gap-1">
          <div className="font-medium">Store:</div>
          <div>{sub.store_coupon}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Elect. Store:</div>
          <div>{sub.elec_store_coupons}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Digital:</div>
          <div>{sub.digital_coupons}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Elect. In-store:</div>
          <div>{sub.elec_instore_coupons}</div>
        </div>
      </div>
    </div>
  );
};

export default SubCard;
