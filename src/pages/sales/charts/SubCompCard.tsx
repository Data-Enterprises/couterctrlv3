import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import { useAppSelector } from "../../../hooks";

interface SubCompCardProps {
  sub: SubSale;
  type: "selected" | "compare";
}
const SubCompCard = ({ sub, type }: SubCompCardProps) => {
  // const sales = useAppSelector((state) => state.sales);
  // const renderIcon = () => {
  //   if (type === "selected") {
  //     //
  //     const found = 
  //   } else {
  //     //
  //   }
  // };

  return (
    <div className="rounded-lg shadow-md p-1">
      <div className="text-xs font-medium border-b">
        {sub.sub_department_description}
      </div>
      {/* Totals */}
      <div className="text-xs font-medium pt-1">Totals</div>
      <div className="grid grid-cols-2 border-b text-xs py-1">
        <div className="flex gap-1">
          <div className="font-medium flex gap-1">Net Sales:</div>
          <div>{formatCurrency2(sub.net_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium flex gap-1">Qty:</div>
          <div>{formatBigNumber(sub.qty)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium flex gap-1">Total Sales:</div>
          <div>{formatCurrency2(sub.total_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium flex gap-1">Weight:</div>
          <div>{formatBigNumber(sub.weight)}</div>
        </div>
      </div>

      {/* Coupons */}
      <div className="text-xs font-medium pt-1">Coupons</div>
      <div className="grid grid-cols-2 text-xs py-1">
        <div className="flex gap-1">
          <div className="font-medium flex gap-1">Store:</div>
          <div>{formatCurrency2(sub.store_coupon)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium flex gap-1">Elec. Store:</div>
          <div>{formatCurrency2(sub.elec_store_coupons)}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium flex gap-1">Digital:</div>
          <div>{formatCurrency2(sub.digital_coupons)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium flex gap-1">Elec. In-store:</div>
          <div>{formatCurrency2(sub.elec_instore_coupons)}</div>
        </div>
      </div>
    </div>
  );
};

export default SubCompCard;
