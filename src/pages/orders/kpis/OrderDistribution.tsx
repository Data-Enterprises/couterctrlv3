import type { PieData } from "../../sales/mobile";
import { formatBigNumber } from "../../../utils";

interface OrderDistributionProps {
  data: PieData[];
}

const OrderDistribution = ({ data }: OrderDistributionProps) => {

  return (
    <div className="grid grid-cols-2 gap-2 h-full w-[20%]">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex flex-col justify-center bg-custom-white rounded-lg shadow-lg items-center text-[12px]"
        >
          <div className="text-content/60">{d.id}</div>
          <div className="font-medium">{formatBigNumber(d.value, 0)}</div>
        </div>
      ))}
    </div>
  );
};

export default OrderDistribution;
