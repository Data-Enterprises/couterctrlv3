import type { CatSale } from "../../../interfaces";
import { formatCurrency2, formatBigNumber } from "../../../utils";

interface CatCardProps {
  cat: CatSale;
}
const CatCard = ({ cat }: CatCardProps) => {
  return (
    <div className="rounded-lg shadow-md shadow-content/30 p-1.5 text-xs">
      <div className="flex justify-between border-b border-content/20 font-medium text-xs">
        <div>{cat.category_description || "n/a"}</div>
        <div>{cat.store_name}</div>
      </div>

      <div className="font-medium mt-2">Totals</div>
      <div className="border-b border-content/20 grid grid-cols-[65%_35%] pb-2">
        <div className="flex gap-1">
          <div className="font-medium">Net Sales:</div>
          <div>{formatCurrency2(cat.net_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Qty:</div>
          <div>{formatBigNumber(cat.qty).split(".")[0]}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Total Sales:</div>
          <div>{formatCurrency2(cat.total_sales)}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Weight:</div>
          <div>{formatBigNumber(cat.weight).split(".")[0]}</div>
        </div>
      </div>

      <div className="font-medium pt-2">Coupons</div>
      <div className="grid grid-cols-[40%_60%]">
        <div className="flex gap-1">
          <div className="font-medium">Store:</div>
          <div>{cat.store_coupon}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Elect. Store:</div>
          <div>{cat.elec_store_coupons}</div>
        </div>
        <div className="flex gap-1">
          <div className="font-medium">Digital:</div>
          <div>{cat.digital_coupons}</div>
        </div>
        <div className="flex gap-1 justify-end">
          <div className="font-medium">Elect. In-store:</div>
          <div>{cat.elec_instore_coupons}</div>
        </div>
      </div>
    </div>
  );
};

export default CatCard;
