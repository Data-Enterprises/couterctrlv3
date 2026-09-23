import { useState } from "react";
import { formatBigNumber } from "../../../utils";
import {
  CurrencyDollarIcon,
  HashtagIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

interface OptMetricCardProps {
  metric: number;
  label: string;
  type: "Price" | "Qty" | "Rev";
  info: string;
  id: number;
}
const OptMetricCard = ({ metric, label, type, info, id }: OptMetricCardProps) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  const icons = {
    Price: (
      <CurrencyDollarIcon
        height={42}
        width={42}
        className="absolute left-2"
        fill="#3b82f6"
      />
    ),
    Qty: (
      <HashtagIcon
        height={42}
        width={42}
        className="absolute left-2"
        fill="#f97316"
      />
    ),
    Rev: (
      <CurrencyDollarIcon
        height={42}
        width={42}
        className="absolute left-2"
        fill="#10b981"
      />
    ),
  };

  const bg =
    type === "Price"
      ? "bg-blue-100"
      : type === "Qty"
      ? "bg-orange-100"
      : "bg-green-100";
  const border =
    type === "Price"
      ? "border-blue-300"
      : type === "Qty"
      ? "border-orange-300"
      : "border-green-300";

  return (
    <div className="bg-custom-white rounded-lg shadow-lg h-[80px] flex flex-col justify-center items-center relative">
      {icons[type]}
      <div
        style={{ zIndex: showTooltip ? 1000 : -1 }}
        className={`${
          showTooltip ? "opacity-100" : "opacity-0 pointer-events-none"
        } max-w-[170px] absolute right-6 transition-all duration-200 ${bg} text-xs text-content rounded p-2 shadow-md border ${border} z-50`}
      >
        {info}
      </div>
      <div className="font-medium text-[16px]">{label}</div>
      <div className="font-medium text-[18px]">
        {type === "Qty"
          ? formatBigNumber(metric).split(".")[0]
          : `$${formatBigNumber(metric)}`}
      </div>
      <InformationCircleIcon
        data-testid={`opt-metric-info-icon-${id}-${type}`}
        height={22}
        width={22}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="cursor-pointer absolute right-0 top-0 fill-content/30 hover:fill-blue-500 hover:shadow-lg rounded-full transition-all duration-200"
      />
    </div>
  );
};

export default OptMetricCard;
