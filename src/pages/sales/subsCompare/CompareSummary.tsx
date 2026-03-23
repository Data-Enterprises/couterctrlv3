import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import SummaryRow from "./SummaryRow";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

const CompareSummary = () => {
  const {
    compareSubsLeftCompare,
    compareSubsRightCompare,
    leftSubCompare,
    rightSubCompare,
  } = useAppSelector((state) => state.sales);

  const formatDate = (date: string) => {
    const [year, month, day] = date.split("T")[0].split("-");
    return `${month}/${day}/${year}`;
  };

  const totals = () => {
    const leftTotal = compareSubsLeftCompare.reduce(
      // (acc, sub) => acc + sub.total_sales,
      (acc, sub) => acc + sub.total_sales - sub.total_tax,
      0,
    );
    const rightTotal = compareSubsRightCompare.reduce(
      // (acc, sub) => acc + sub.total_sales,
      (acc, sub) => acc + sub.total_sales - sub.total_tax,
      0,
    );
    return { leftTotal, rightTotal };
  };

  const resultIcons = (side: "left" | "right") => {
    if (side === "left") {
      return totals().leftTotal > totals().rightTotal ? (
        <ArrowUpCircleIcon className="h-6 w-6 stroke-emerald-500 stroke-2 inline-block" />
      ) : totals().leftTotal < totals().rightTotal ? (
        <ArrowDownCircleIcon className="h-6 w-6 stroke-orange-500 stroke-2 inline-block" />
      ) : null;
    } else {
      return totals().rightTotal > totals().leftTotal ? (
        <ArrowUpCircleIcon className="h-6 w-6 stroke-emerald-500 stroke-2 inline-block" />
      ) : totals().rightTotal < totals().leftTotal ? (
        <ArrowDownCircleIcon className="h-6 w-6 stroke-orange-500 stroke-2 inline-block" />
      ) : null;
    }
  };

  // console.log("Left Compare Total Sales", compareSubsLeftCompare.reduce((acc, sub) => acc + sub.total_sales, 0));
  // console.log("Right Compare Total Sales", compareSubsRightCompare.reduce((acc, sub) => acc + sub.total_sales, 0));

  // console.log(
  //   "Left Compare Total Sales - Total Tax",
  //   compareSubsLeftCompare.reduce(
  //     (acc, sub) => acc + sub.total_sales - sub.total_tax,
  //     0,
  //   ),
  // );
  // console.log(
  //   "Right Compare Total Sales - Total Tax",
  //   compareSubsRightCompare.reduce(
  //     (acc, sub) => acc + sub.total_sales - sub.total_tax,
  //     0,
  //   ),
  // );

  // console.log(
  //   "Left Compare Net Sales",
  //   compareSubsLeftCompare.reduce((acc, sub) => acc + sub.net_sales, 0),
  // );

  // console.log(
  //   "Left Compare Total Tax",
  //   compareSubsLeftCompare.reduce((acc, sub) => acc + sub.total_tax, 0),
  // );
  // console.log(
  //   "Right Compare Total Tax",
  //   compareSubsRightCompare.reduce((acc, sub) => acc + sub.total_tax, 0),
  // );

  // console.log(
  //   "Right Compare Net Sales",
  //   compareSubsRightCompare.reduce((acc, sub) => acc + sub.net_sales, 0),
  // );

  // console.log(
  //   "Left Compare Qty",
  //   compareSubsLeftCompare.reduce((acc, sub) => acc + sub.qty, 0),
  // );
  // console.log(
  //   "Right Compare Qty",
  //   compareSubsRightCompare.reduce((acc, sub) => acc + sub.qty, 0),
  // );
  // console.log(
  //   "Left Compare Weight",
  //   compareSubsLeftCompare.reduce((acc, sub) => acc + sub.weight, 0),
  // );
  // console.log(
  //   "Right Compare Weight",
  //   compareSubsRightCompare.reduce((acc, sub) => acc + sub.weight, 0),
  // );

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="flex">
        <div className="bg-custom-white pt-1 pl-2 w-1/2 border-b border-content/60 rounded-tl-lg">
          <div className="flex gap-1">
            <div className="font-medium">{leftSubCompare!.store_name}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">
              {formatDate(leftSubCompare!.sale_date)}
            </div>
          </div>
        </div>
        <div className="bg-custom-white border-b border-content/60 font-medium text-nowrap flex items-end">
          Total Sales
        </div>
        <div className="bg-custom-white pt-1 pr-2 w-1/2 border-b border-content/60 rounded-tr-lg text-right">
          <div className="flex justify-end">
            <div className="font-medium">{rightSubCompare!.store_name}</div>
          </div>
          <div className="flex justify-end">
            <div className="font-medium">
              {formatDate(rightSubCompare!.sale_date)}
            </div>
          </div>
        </div>
      </div>

      {/* Grid cols */}
      <div className="bg-custom-white p-2 rounded-b-lg shadow-lg mb-4">
        {compareSubsLeftCompare.map((sub, i) => (
          <SummaryRow
            key={i}
            left={sub}
            right={compareSubsRightCompare[i]}
            compKey="total_sales"
          />
        ))}
        <div className="grid grid-cols-[5.5%_42.5%_42.5%_5.5%] gap-2 py-0.5">
          <div className="flex justify-center">{resultIcons("left")}</div>
          <div className="flex justify-between font-medium">
            <div>Total</div>
            <div>{formatCurrency2(totals().leftTotal)}</div>
          </div>
          <div className="flex justify-between font-medium">
            <div>{formatCurrency2(totals().rightTotal)}</div>
            <div>Total</div>
          </div>
          <div className="flex justify-center">{resultIcons("right")}</div>
        </div>
      </div>
    </div>
  );
};

export default CompareSummary;
