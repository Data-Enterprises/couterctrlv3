import type { TopSub } from "../components";
import { formatCurrency2, formatBigNumber } from "../../../utils";

interface TrendRowProps {
  sub: TopSub;
  row: 1 | 2 | 3;
  dates: string;
}
const SubTrendCard = ({ sub, row, dates }: TrendRowProps) => {
  const shadowColor =
    row === 1
      ? "shadow-emerald-200"
      : row === 2
        ? "shadow-blue-200"
        : "shadow-orange-200";

  const gradient =
    row === 1
      ? `from-emerald-200 to-custom-white h-[1.5px]`
      : row === 2
        ? `from-blue-200 to-custom-white h-[1.5px]`
        : `from-orange-200 to-custom-white h-[1.5px]`;

  return (
    <div className={`px-2 py-1 rounded-lg shadow-md ${shadowColor}`}>
      <div className="flex justify-between">
        <div className="font-medium">{dates}</div>
      </div>

      <div className="grid grid-cols-2">
        <div className={`bg-gradient-to-r ${gradient} h-[1.5px]`}></div>
        <div className={`bg-gradient-to-l ${gradient} h-[1.5px]`}></div>
      </div>

      <div className="">
        <div className="font-medium text-content/60">Totals</div>
        <div className="grid grid-cols-3 text-[12px]">
          <div>
            <div>Sales</div>
            <div className="font-medium">
              {formatCurrency2(sub.total_sales)}
            </div>
          </div>
          <div>
            <div>Net</div>
            <div className="font-medium">{formatCurrency2(sub.net_sales)}</div>
          </div>
          <div>
            <div>Qty</div>
            <div className="font-medium">{formatBigNumber(sub.qty, 0)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className={`bg-gradient-to-r ${gradient} h-[1.5px]`}></div>
        <div className={`bg-gradient-to-l ${gradient} h-[1.5px]`}></div>
      </div>

      <div className="pt-1">
        <div className="grid grid-cols-2 text-[12px]">
          <div>
            <div>Digital Cpn</div>
            <div className="font-medium">
              {formatCurrency2(sub.digital_coupons)}
            </div>
          </div>
          <div>
            <div>Store Cpn</div>
            <div className="font-medium">
              {formatCurrency2(sub.store_coupon)}
            </div>
          </div>
          <div>
            <div>E. Store Cpn</div>
            <div className="font-medium">
              {formatCurrency2(sub.elec_store_coupons)}
            </div>
          </div>
          <div>
            <div>E. Instore Cpn</div>
            <div className="font-medium">
              {formatCurrency2(sub.elec_instore_coupons)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubTrendCard;
