import type { SubSale } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

interface SummaryRowProps {
  left: SubSale;
  right: SubSale;
  compKey: keyof SubSale;
}

const SummaryRow = ({ left, right, compKey }: SummaryRowProps) => {
  const resultIcons = () => {
    let leftResult = 0;
    let rightResult = 0;

    if (compKey === "total_sales") {
      leftResult = left[compKey] - left.total_tax;
      rightResult = right[compKey] - right.total_tax;
    }

    return {
      left:
        leftResult > rightResult ? (
          <ArrowUpCircleIcon className="h-5 w-5 stroke-emerald-500 stroke-2 inline-block" />
        ) : leftResult < rightResult ? (
          <ArrowDownCircleIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block" />
        ) : null,
      right:
        rightResult > leftResult ? (
          <ArrowUpCircleIcon className="h-6 w-6 stroke-emerald-500 stroke-2 inline-block" />
        ) : rightResult < leftResult ? (
          <ArrowDownCircleIcon className="h-6 w-6 stroke-orange-500 stroke-2 inline-block" />
        ) : null,
    };
  };

  return (
    <div className="grid grid-cols-[30%_40%_30%] border-b last:border-none justify-center items-center even:bg-blue-200/50 py-[3px] text-[13px]">
      {/* <div className="flex justify-center items-center">
        {resultIcons().left}
      </div> */}
      <div className="flex items-center justify-between pl-1">
        {resultIcons().left}
        <div className="font-medium">
          {formatCurrency2(left.total_sales - left.total_tax)}
        </div>
      </div>
      <div className="text-center text-[13px]">
        {left.sub_department_description}
      </div>
      <div className="flex items-center justify-between">
        <div className="font-medium">
          {formatCurrency2(right.total_sales - right.total_tax)}
        </div>
        {/* <div className="text-right">{right.sub_department_description}</div> */}
      </div>
    </div>
  );
};

export default SummaryRow;
