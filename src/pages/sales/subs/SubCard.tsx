import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";

interface SubCardProps {
  sub: SubSale;
}
const SubCard = ({ sub }: SubCardProps) => {
  return (
    <div className="rounded-lg shadow-md shadow-content/30 p-4 text-sm">
      <div className="flex justify-between border-b border-content/20 font-medium">
        <div>{sub.store_name}</div>
        <div>{sub.sub_department_description}</div>
      </div>

      <div className="font-medium mt-2">Totals</div>
      <div className="border-b border-content/20 grid grid-cols-2 pb-2">
        <div className="flex gap-1">
          <div className="font-medium">Net Sales:</div>
          <div>{formatCurrency2(sub.net_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Qty:</div>
          <div>
            {formatBigNumber(sub.qty).split(".")[0]}
          </div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Total Sales:</div>
          <div>{formatCurrency2(sub.total_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Weight:</div>
          <div>
            {formatBigNumber(sub.weight).split(".")[0]}
          </div>
        </div>
      </div>

      <div className="font-medium pt-2">Coupons</div>
      <div className="grid grid-cols-2">
        <div className="flex gap-1">
          <div className="font-medium">Store:</div>
          <div>{sub.store_coupon}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Digital:</div>
          <div>{sub.digital_coupons}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Elect. Store:</div>
          <div>{sub.elec_store_coupons}</div>
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
