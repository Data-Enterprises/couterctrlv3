import type { TopSub } from "../../components";
import {
  formatCurrency2,
  formatBigNumber,
  sameWeekDayLastYear,
} from "../../../../utils";
import { useAppSelector } from "../../../../hooks";
import { setDates } from "../../utils";
import { couponSalePct } from "../../../../functions";

interface TrendRowProps {
  sub: TopSub;
  row: 1 | 2 | 3;
  dates: string;
}
const SubTrendCard = ({ sub, row, dates }: TrendRowProps) => {
  const { selectedStore } = useAppSelector((state) => state.salesMobile);

  const formatDate = (dte: string) => {
    const split = dte.split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const borderColor =
    row === 1
      ? "border-emerald-200"
      : row === 2
        ? "border-blue-200"
        : "border-orange-200";

  const gradient =
    row === 1
      ? `from-emerald-200 to-custom-white h-[1.5px]`
      : row === 2
        ? `from-blue-200 to-custom-white h-[1.5px]`
        : `from-orange-200 to-custom-white h-[1.5px]`;

  const title = row === 1 ? "This Week" : row === 2 ? "Last Week" : "Last Year";

  const noData =
    sub.total_sales === 0 && sub.net_sales === 0 && sub.qty === 0
      ? "No Data"
      : "";

  const dateRange = () => {
    if (selectedStore.sale_date.length) {
      const date = selectedStore.sale_date.split("T")[0];
      const dow = new Date(selectedStore.sale_date).toLocaleDateString("en-US", {
        weekday: "short",
      });

      if (row === 1) {
        return `${dow}, ${formatDate(date)}`;
      } else if (row === 2) {
        const lw = setDates(new Date(date), 7);
        return `${dow}, ${formatDate(lw)}`;
      } else {
        const ly = sameWeekDayLastYear(date);
        const formatted = formatDate(ly.date);
        return `${dow}, ${formatted}`;
      }
    }
    return dates;
  };

  const cpns = [
    sub.digital_coupons,
    sub.store_coupon,
    sub.elec_store_coupons,
    sub.elec_instore_coupons,
  ];

  return (
    <div className={`p-1 rounded-lg shadow-md border ${borderColor} text-[11px]`}>
      <div className="font-medium text-content/60 flex justify-between pb-0.5">
        <div>{title}</div>
        <div className="font-bold">{noData.length ? noData : dateRange()}</div>
      </div>

      <div className="grid grid-cols-2 mb-1">
        <div className={`bg-gradient-to-r ${gradient}`}></div>
        <div className={`bg-gradient-to-l ${gradient}`}></div>
      </div>

      {/* First metrics row (Sales / Net / Qty / Cpn %) */}
      <div className="grid grid-cols-4 gap-1">
        <div className="min-w-0">
          <div className="text-content/60">Sales</div>
          <div className="font-medium">{formatCurrency2(sub.total_sales)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-content/60">Net</div>
          <div className="font-medium">{formatCurrency2(sub.net_sales)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-content/60">Qty</div>
          <div className="font-medium">{formatBigNumber(sub.qty, 0)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-content/60 text-[10.5px]">Cpn %</div>
          <div className="font-medium">{couponSalePct(cpns, sub.total_sales)}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 my-1">
        <div className={`bg-gradient-to-r ${gradient}`}></div>
        <div className={`bg-gradient-to-l ${gradient}`}></div>
      </div>

      <div className="grid grid-cols-4 gap-1 text-[10.5px]">
        <div className="min-w-0">
          <div className="text-content/60">Digital Cpn</div>
          <div className="font-medium">
            {formatCurrency2(sub.digital_coupons)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-content/60">Store Cpn</div>
          <div className="font-medium">{formatCurrency2(sub.store_coupon)}</div>
        </div>
        <div className="min-w-0">
          <div className="text-content/60">E. Store Cpn</div>
          <div className="font-medium">
            {formatCurrency2(sub.elec_store_coupons)}
          </div>
        </div>
        <div className="min-w-0">
          <div className="text-content/60">E. Instore Cpn</div>
          <div className="font-medium">
            {formatCurrency2(sub.elec_instore_coupons)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubTrendCard;
