import { useSalesState } from "../hooks/useSalesState";
import type { SubSale } from "../../../interfaces";
import type { TopSub } from "../components";
import SubTrendCardTablet from "./SubTrendCardTablet";

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

const TabletSubComps = () => {
  const sales = useSalesState();

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

  const sub = sales.selectedSubDept
    ? sales.selectedSubDept.sub_department_description
    : "";

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="text-[13.5px]">
      <div className="grid grid-cols-1 gap-2 py-2">
        <SubTrendCardTablet
          title="This Week vs Last Week"
          leftLabel="This Week"
          rightLabel="Last Week"
          leftSub={tw}
          rightSub={lw}
          leftTone="emerald"
          rightTone="blue"
          datesLeft={twDateRange}
          datesRight={lwDateRange}
          sub={sub}
        />

        <SubTrendCardTablet
          title="This Week vs Last Year"
          leftLabel="This Week"
          rightLabel="Last Year"
          leftSub={tw}
          rightSub={ly}
          leftTone="emerald"
          rightTone="orange"
          datesLeft={twDateRange}
          datesRight={lyDateRange}
          sub={sub}
        />
      </div>
    </div>
  );
};

export default TabletSubComps;
