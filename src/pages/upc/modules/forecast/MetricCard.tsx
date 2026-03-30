import {
  ArrowsRightLeftIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  ArrowUpCircleIcon,
  HashtagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";
import { useAppSelector } from "../../../../hooks";
import { useState } from "react";
import { formatBigNumber } from "../../../../utils";

interface MetricCardProps {
  metric: number;
  label: string;
  type: keyof typeof icons;
}

const icons = {
  quantity: (
    <HashtagIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-0"
      fill="#3b82f6"
    />
  ),
  qtyRange: (
    <ArrowsRightLeftIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-0"
      fill="#3b82f6"
    />
  ),
  mdq: (
    <ArrowUpCircleIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-0"
      fill="#3b82f6"
    />
  ),
  median: (
    <AdjustmentsHorizontalIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-1"
      fill="#f97316"
    />
  ),
  avgQty: (
    <HashtagIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-0"
      fill="#10b981"
    />
  ),
  avgQtyRange: (
    <ArrowsRightLeftIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-0"
      fill="#10b981"
    />
  ),
  active: (
    <ClockIcon
      height={42}
      width={42}
      className="absolute ml-2 -translate-y-0"
      fill="#f97316"
    />
  ),
};

const MetricCard = ({ metric, label, type }: MetricCardProps) => {
  const search = useAppSelector((state) => state.search);
  const upcState = useAppSelector((state) => state.upc);
  const isInteger = (n: number) =>
    Number.isInteger(n) ? formatBigNumber(n).split(".")[0] : n.toFixed(2);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const forecastStart = upcState.forecastQtyData[0].data.history[0].date;
  const lastIndex = upcState.forecastQtyData[0].data.history.length - 1;
  const forecastEnd = upcState.forecastQtyData[0].data.history[lastIndex].date;

  const days = () => {
    const d1 = new Date(search.startDate);
    const d2 = new Date(search.endDate);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const tooltipText = {
    quantity: `Total quantity ${forecastStart}-${forecastEnd}`,
    qtyRange: `Total quantity range ${forecastStart}-${forecastEnd}`,
    median: `Median quantity of all items ${forecastStart}-${forecastEnd}`,
    avgQty: `Average daily quantity ${forecastStart}-${forecastEnd}`,
    avgQtyRange: `Average daily quantity range ${forecastStart}-${forecastEnd}`,
    active: `Number of active days out of ${days()} days`,
    mdq: `Max daily quantity ${forecastStart}-${forecastEnd}`,
  };

  const bg = {
    quantity: "bg-blue-100",
    qtyRange: "bg-blue-100",
    mdq: "bg-blue-100",
    median: "bg-orange-100",
    avgQty: "bg-green-100",
    avgQtyRange: "bg-green-100",
    active: "bg-orange-100",
  };

  const border = {
    quantity: "border-blue-300",
    qtyRange: "border-blue-300",
    mdq: "border-blue-300",
    median: "border-orange-300",
    avgQty: "border-green-300",
    avgQtyRange: "border-green-300",
    active: "border-orange-300",
  };

  return (
    <div
      className={`relative flex flex-col justify-center py-3 rounded-lg bg-custom-white shadow-lg h-[85px]`}
    >
      {icons[type]}

      <div className="absolute top-0 select-none w-full">
        <div
          style={{ zIndex: showTooltip ? 1000 : -1 }}
          className={`${
            showTooltip ? "opacity-100" : "opacity-0 pointer-events-none"
          } max-w-[170px] absolute right-6 transition-all duration-200 mt-7 top-full -translate-y-1/2 ${
            bg[type]
          } text-xs text-content rounded px-3 py-2 shadow-md border ${
            border[type]
          } z-50`}
        >
          {tooltipText[type]}
        </div>
        <InformationCircleIcon
          data-testid={`info-icon-${type}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          height={23}
          width={23}
          className="cursor-pointer absolute right-0 fill-content/30 hover:fill-blue-500 hover:shadow-lg rounded-full transition-all duration-200"
        />
      </div>
      <div className="text-sm pl-2">
        <div className="font-semibold text-[15px] text-center ">{label}</div>
      </div>
      {type !== "active" ? (
        <div className="font-semibold text-[15px] text-center ">
          {isInteger(metric)}
        </div>
      ) : (
        <div className="font-semibold text-[15px] text-center ">
          {isInteger(metric)}/{days()}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
