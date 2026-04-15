import { useMobileSalesCtx } from "../hooks";

interface SalesViewHourlyProps {
  displayName: string;
}

const SalesViewHourly = ({ displayName }: SalesViewHourlyProps) => {
  const ctx = useMobileSalesCtx();

  console.log(ctx.salesViewHourly);

  return (
    <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
      <div className="flex justify-between font-medium">
        <div>Hourly Sales</div>
        <div>{displayName}</div>
      </div>
      <div className="grid grid-cols-2 mb-1">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div>
        <div>Sales View - Hourly</div>
      </div>
    </div>
  );
};

export default SalesViewHourly;
