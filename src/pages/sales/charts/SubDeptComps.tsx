
import { useAppSelector } from "../../../hooks";
import type { SubSale } from "../../../interfaces";
import { formatCurrency2 } from "../../../utils";
import type { TopSub } from "../components";
import SubTrendCard from "./SubTrendCard";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";

const defaultSub: TopSub = {
  sub_department: 0,
  sub_department_description: "",
  total_sales: 0,
  net_sales: 0,
  qty: 0,
  digital_coupons: 0,
  elec_instore_coupons: 0,
  elec_store_coupons: 0,
  store_coupon: 0,
  total_tax: 0,
};

const SubDeptComps = () => {
  const sales = useAppSelector((state) => state.sales);
  const isMobile = useAppSelector((state) => state.app.isMobile);

  const formatCardData = (cardData: SubSale[]) => {
    if (!sales.selectedSubDept) return defaultSub;

    const subId = sales.selectedSubDept.sub_department;
    const filtered = cardData.filter((s) => s.sub_department === subId);

    return filtered.reduce(
      (acc: TopSub, curr: SubSale) => {
        acc.sub_department = curr.sub_department;
        acc.sub_department_description = curr.sub_department_description;
        acc.total_sales += curr.total_sales - curr.total_tax;
        acc.net_sales += curr.net_sales;
        acc.qty += curr.qty;
        acc.digital_coupons += curr.digital_coupons;
        acc.elec_instore_coupons += curr.elec_instore_coupons;
        acc.elec_store_coupons += curr.elec_store_coupons;
        acc.store_coupon += curr.store_coupon;
        acc.total_tax += curr.total_tax;

        return acc;
      },
      { ...defaultSub },
    );
  };

  const tw = formatCardData(sales.subSales);
  const lw = formatCardData(sales.subSalesWk2);
  const ly = formatCardData(sales.subSalesWk3);

  const twDates = sales.subSales.length
    ? Array.from(
        new Set(sales.subSales.map((s) => s.sale_date.split("T")[0])),
      ).sort()
    : [];
  const lwDates = sales.subSalesWk2.length
    ? Array.from(
        new Set(sales.subSalesWk2.map((s) => s.sale_date.split("T")[0])),
      ).sort()
    : [];
  const lyDates = sales.subSalesWk3.length
    ? Array.from(
        new Set(sales.subSalesWk3.map((s) => s.sale_date.split("T")[0])),
      ).sort()
    : [];

  const formatDate = (dte: string) => {
    const split = dte.split("-");
    return `${split[1]}/${split[2]}/${split[0]}`;
  };

  const twDateRange = twDates.length
    ? `${formatDate(twDates[0])} - ${formatDate(twDates[twDates.length - 1])}`
    : "";
  const lwDateRange = lwDates.length
    ? `${formatDate(lwDates[0])} - ${formatDate(lwDates[lwDates.length - 1])}`
    : "";
  const lyDateRange = lyDates.length
    ? `${formatDate(lyDates[0])} - ${formatDate(lyDates[lyDates.length - 1])}`
    : "";

  const weekTrend = tw.total_sales - lw.total_sales;
  const yearTrend = tw.total_sales - ly.total_sales;

  const trendIcon = (trend: number) => {
    if (trend > 0) {
      return (
        <div className="flex items-center text-emerald-500 font-bold">
          <HandThumbUpIcon className="h-4 w-4 mr-0.5 stroke-2" />
          {formatCurrency2(trend)}
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-orange-500 font-bold">
          <HandThumbDownIcon className="h-4 w-4 mr-0.5 stroke-2" />
          {formatCurrency2(Math.abs(trend))}
        </div>
      );
    }

    return null;
  };

  const sub = sales.selectedSubDept
    ? sales.selectedSubDept.sub_department_description
    : "";

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="bg-custom-white rounded-lg px-2 py-1 shadow-lg text-[13.5px]">
      <div className="font-medium grid grid-cols-3">
        <div className="">{sub} Trends</div>
        {!isMobile ? (
          <>
            <div className="flex gap-1 ml-2">
              <div className="text-content/60">vs Last Week</div>
              <div>{trendIcon(weekTrend)}</div>
            </div>
            <div className="flex gap-1 ml-2">
              <div className="text-content/60">vs Last Year</div>
              <div>{trendIcon(yearTrend)}</div>
            </div>
          </>
        ) : null}
      </div>
      <div className="grid grid-cols-2">
        <div className="bg-gradient-to-r from-emerald-200 from-[20%] to-blue-200 h-[1.5px]"></div>
        <div className="bg-gradient-to-l from-orange-200 from-[20%] to-blue-200 h-[1.5px]"></div>
      </div>
      <div className="flex justify-between text-[12.5px]">
        <div className="flex gap-1">
          <div className="text-content/60">Last Week</div>
          <div>{trendIcon(weekTrend)}</div>
        </div>
        <div className="flex gap-1">
          <div className="text-content/60">Last Year</div>
          <div>{trendIcon(yearTrend)}</div>
        </div>
      </div>
      <div className="grid md:grid-cols-3 text-[12.5px] py-1 gap-1">
        <SubTrendCard sub={tw} row={1} dates={twDateRange} />
        <SubTrendCard sub={lw} row={2} dates={lwDateRange} />
        <SubTrendCard sub={ly} row={3} dates={lyDateRange} />
      </div>
    </div>
  );
};

export default SubDeptComps;
