import type { SubSale } from "../../../interfaces";
import { isValidData } from ".";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

interface CompareCardProps {
  data: SubSale;
  compareData: SubSale;
  side: "left" | "right";
}

const CompareCard = ({ data, compareData, side }: CompareCardProps) => {
  const formatDate = (date: string) => {
    const split = date.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  if (!isValidData(data)) {
    return (
      <div className="pb-2 shadow-md bg-custom-white rounded-lg min-h-[160px] max-h-[160px]">
        <div className="bg-blue-500 text-custom-white font-medium px-2 rounded-t-lg py-0.5 flex justify-between">
          <div>{formatDate(data.sale_date)}</div>
          <div>{data.sub_department_description}</div>
        </div>
        <div className="flex justify-center items-center font-medium text-content/60 h-[130px]">
          No Data found on this day
        </div>
      </div>
    );
  }

  const showArrowIcon = (key: keyof SubSale) => {
    if (!isValidData(compareData) || side === "right") return null;
    if (data[key] > compareData[key]) {
      return (
        <ArrowUpCircleIcon className="h-5 w-5 stroke-emerald-500 stroke-2 inline-block" />
      );
    } else if (data[key] < compareData[key]) {
      return (
        <ArrowDownCircleIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block" />
      );
    }
    return null;
  };

  return (
    <div className="pb-2 shadow-md bg-custom-white rounded-lg text-[13px] min-h-[160px] max-h-[160px]">
      <div className="bg-blue-500 text-custom-white font-medium px-2 rounded-t-lg py-0.5 flex justify-between">
        <div>{data.store_name}</div>
        <div>{data.sub_department_description}</div>
      </div>
      <div className="px-2 font-medium mt-1">Totals</div>
      <div className="grid grid-cols-4 px-2 mb-1">
        <div>
          <div className="text-content/60">
            Sales {showArrowIcon("total_sales")}
          </div>
          <div className="font-medium">
            {formatCurrency2(data.total_sales - data.total_tax)}
          </div>
        </div>
        <div>
          <div className="text-content/60">
            Net {showArrowIcon("net_sales")}
          </div>
          <div className="font-medium">{formatCurrency2(data.net_sales)}</div>
        </div>
        <div>
          <div className="text-content/60">Qty {showArrowIcon("qty")}</div>
          <div className="font-medium">{formatBigNumber(data.qty, 0)}</div>
        </div>
        <div>
          <div className="text-content/60">
            Weight {showArrowIcon("weight")}
          </div>
          <div className="font-medium">{formatBigNumber(data.weight, 2)}</div>
        </div>
      </div>
      <div className="px-2 font-medium">Coupons</div>
      <div className="grid grid-cols-4 px-2">
        <div>
          <div className="text-content/60">
            Digital {showArrowIcon("digital_coupons")}
          </div>
          <div className="font-medium">
            {formatCurrency2(data.digital_coupons)}
          </div>
        </div>
        <div>
          <div className="text-content/60">
            Store {showArrowIcon("store_coupon")}
          </div>
          <div className="font-medium">
            {formatCurrency2(data.store_coupon)}
          </div>
        </div>
        <div>
          <div className="text-content/60">
            E. Store {showArrowIcon("elec_store_coupons")}
          </div>
          <div className="font-medium">
            {formatCurrency2(data.elec_store_coupons)}
          </div>
        </div>
        <div>
          <div className="text-content/60">
            E. Instore {showArrowIcon("elec_instore_coupons")}
          </div>
          <div className="font-medium">
            {formatCurrency2(data.elec_instore_coupons)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareCard;
