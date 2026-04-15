import { useMobileSalesCtx } from "../hooks";

interface SalesViewTopTenProps {
  displayName: string;
}

const SalesViewTopTen = ({ displayName }: SalesViewTopTenProps) => {
  const ctx = useMobileSalesCtx();
  console.log(ctx.salesViewTopTen);
  
  return (
    <div className="bg-custom-white rounded-lg shadow-md px-2 py-0.5">
      <div className="flex justify-between font-medium">
        <div>Top Ten Items</div>
        <div>{displayName}</div>
      </div>
      <div className="grid grid-cols-2 mb-1">
        <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
      </div>
      <div>
        <div>Sales View - Top Ten</div>
      </div>
    </div>
  );
};

export default SalesViewTopTen;
