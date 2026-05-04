import type { SubGridRow, SubSale } from "../../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../../utils";
import type { TopSub } from "../../components";
import { useMobileSalesCtx } from "../hooks";
import {
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import { setSelectedSubDept } from "../../../../features/salesMobileSlice";
import MobileSubTrendCard from "./MobileSubTrendCard";
// import SingleSelect from "../../../../components/SingleSelect";

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

const SubsView = () => {
  const ctx = useMobileSalesCtx();

  const formatCardData = (cardData: SubSale[]) => {
    if (!ctx.selectedSubDept) return defaultSub;
    const selectedDow = ctx.selectedStore.sale_date
      ? new Date(ctx.selectedStore.sale_date).toDateString().split(" ")[0]
      : "";

    const subId = ctx.selectedSubDept;
    const filtered = cardData.filter((s) => {
      const currentDow = new Date(s.sale_date).toDateString().split(" ")[0];
      const matchesDow = selectedDow ? currentDow === selectedDow : true;
      // console.log(matchesDow, selectedDow, currentDow, s);
      const matchesSub = s.sub_department === subId;
      const matchesStoreId = ctx.selectedStore.storeid
        ? s.storeid === ctx.selectedStore.storeid
        : true;

      return matchesSub && matchesStoreId && matchesDow;
    });

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

  const tw = formatCardData(ctx.subSales);
  const lw = formatCardData(ctx.subSalesWk2);
  const ly = formatCardData(ctx.subSalesWk3);

  const twDates = ctx.subSales.length
    ? Array.from(
        new Set(ctx.subSales.map((s) => s.sale_date.split("T")[0])),
      ).sort()
    : [];
  const lwDates = ctx.subSalesWk2.length
    ? Array.from(
        new Set(ctx.subSalesWk2.map((s) => s.sale_date.split("T")[0])),
      ).sort()
    : [];
  const lyDates = ctx.subSalesWk3.length
    ? Array.from(
        new Set(ctx.subSalesWk3.map((s) => s.sale_date.split("T")[0])),
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

  const trendIcon = (trend: number, period: "this" | "last") => {
    // For no data being found
    if (
      (period === "last" && ly.total_sales === 0) ||
      (period === "this" && lw.total_sales === 0)
    ) {
      return <div className="flex items-center font-bold">N/A</div>;
    }

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

  const sub = ctx.selectedSubDept
    ? ctx.subSales.filter((s) => s.sub_department === ctx.selectedSubDept)[0]
        .sub_department_description
    : "";

  const getLastYrSales = (subDeptId: number) => {
    return ctx.subSalesWk3
      .filter((s) => {
        const matchesSubId = s.sub_department === subDeptId;
        const matchesStoreId = ctx.selectedStore.storeid
          ? s.storeid === ctx.selectedStore.storeid
          : true;
        const matchesDow = ctx.selectedStore.sale_date
          ? new Date(s.sale_date).toDateString().split(" ")[0] ===
            new Date(ctx.selectedStore.sale_date).toDateString().split(" ")[0]
          : true;
        return matchesSubId && matchesStoreId && matchesDow;
      })
      .reduce(
        (acc: number, curr) => (acc += curr.total_sales - curr.total_tax),
        0,
      );
  };

  const filteredSubs = (): SubGridRow[] => {
    const thisWeek = [...ctx.subSales]
      .filter((s) => {
        const matchesStoreId = ctx.selectedStore.storeid
          ? s.storeid === ctx.selectedStore.storeid
          : true;

        const matchesDow = ctx.selectedStore.sale_date
          ? new Date(s.sale_date).toDateString().split(" ")[0] ===
            new Date(ctx.selectedStore.sale_date).toDateString().split(" ")[0]
          : true;
        return matchesStoreId && matchesDow;
      })
      .map((s) => ({ ...s, lastYrSales: getLastYrSales(s.sub_department) }));

    const result = [...thisWeek].reduce((acc: SubGridRow[], curr) => {
      const found = acc.find(a => a.sub_department === curr.sub_department);
      if (found){
        found.total_sales += curr.total_sales;
        found.total_tax += curr.total_tax;
        found.qty += curr.qty;
      } else {
        acc.push(curr);
      }
      return acc;
    }, [])
    return result;
  };

  const subs = filteredSubs();
  const handleRowClick = (subDeptId: number) => {
    ctx.dispatch(setSelectedSubDept(subDeptId));
  };

  const selectedRow = (id: number) => {
    if (id === ctx.selectedSubDept) return "bg-orange-200 font-medium";
    return "even:bg-blue-200/50";
  };

  return (
    <div className="p-2 space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="bg-custom-white rounded-lg shadow-lg">
        <div className="grid grid-cols-[1fr_0.5fr_0.5fr_0.4fr] px-2 py-0.5 text-content/60 text-[11px] font-medium">
          <div>Sub Dept</div>
          <div>This Yr $</div>
          <div>Last Yr $</div>
          <div>Qty</div>
        </div>
        <div className="grid grid-cols-2 mb-1">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
        </div>

        <div className="max-h-[180px] overflow-y-auto text-[11px]">
          {subs.map((s, i) => (
            <div
              key={i}
              className={`${selectedRow(s.sub_department)} px-2 py-1 border-t border-content/10 first:border-t-0`}
              onClick={() => handleRowClick(s.sub_department)}
            >
              <div className="grid grid-cols-[1fr_0.5fr_0.5fr_0.4fr]">
                <div className="truncate">{s.sub_department_description}</div>
                <div className="font-medium">
                  {formatCurrency2(s.total_sales - s.total_tax)}
                </div>
                <div className="font-medium">
                  {formatCurrency2(s.lastYrSales)}
                </div>
                <div className="font-medium">
                  {formatBigNumber(s.qty, 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-custom-white rounded-lg px-2 py-1 shadow-lg text-[12px]">
        <div className="font-medium">{sub} Trends</div>

        <div className="grid grid-cols-2">
          <div className="bg-gradient-to-r from-emerald-200 to-blue-200 h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-orange-200 to-blue-200 h-[1.5px]"></div>
        </div>

        <div className="flex justify-between items-center text-[11.5px] mt-1">
          <div className="flex items-center gap-1">
            <div className="text-content/60">Last Week</div>
            {trendIcon(weekTrend, "this")}
          </div>
          <div className="flex items-center gap-1">
            <div className="text-content/60">Last Year</div>
            <div>{trendIcon(yearTrend, "last")}</div>
          </div>
        </div>

        <div className="grid gap-3 py-1 text-[11px]">
          <MobileSubTrendCard sub={tw} row={1} dates={twDateRange} />
          <MobileSubTrendCard sub={lw} row={2} dates={lwDateRange} />
          <MobileSubTrendCard sub={ly} row={3} dates={lyDateRange} />
        </div>
      </div>
    </div>
  );

  // Once we have both data sets, show the comparisons (final step)
  return (
    <div className="p-2 space-y-2 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="bg-custom-white rounded-lg shadow-lg">
        <div className="grid grid-cols-[30%_1fr_1fr_0.5fr] px-2 py-0.5 text-content/60 font-medium">
          <div>Sub Dept</div>
          <div>This Yr $</div>
          <div>Last Yr $</div>
          <div>Qty</div>
        </div>
        <div className="grid grid-cols-2 mb-1">
          <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
        </div>
        <div className="max-h-[180px] overflow-y-auto">
          {subs.map((s, i) => (
            <div
              key={i}
              className={`${selectedRow(s.sub_department)} transition-all duration-200 px-2 py-1`}
              onClick={() => handleRowClick(s.sub_department)}
            >
              <div></div>
              <div className="grid grid-cols-[30%_1fr_1fr_0.5fr]">
                <div>{s.sub_department_description}</div>
                <div>
                  <div>{formatCurrency2(s.total_sales - s.total_tax)}</div>
                </div>
                <div>
                  <div>{formatCurrency2(s.lastYrSales)}</div>
                </div>
                <div>
                  <div>{formatBigNumber(s.qty, 0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-custom-white rounded-lg px-2 py-1 shadow-lg text-[13.5px]">
        <div className="font-medium grid grid-cols-3">
          <div className="">{sub} Trends</div>
        </div>
        <div className="grid grid-cols-2">
          <div className="bg-gradient-to-r from-emerald-200 from-[20%] to-blue-200 h-[1.5px]"></div>
          <div className="bg-gradient-to-l from-orange-200 from-[20%] to-blue-200 h-[1.5px]"></div>
        </div>

        <div className="flex justify-between text-[12.5px]">
          <div className="flex gap-1">
            <div className="text-content/60">Last Week</div>
            <div>{trendIcon(weekTrend, "this")}</div>
          </div>
          <div className="flex gap-1">
            <div className="text-content/60">Last Year</div>
            <div>{trendIcon(yearTrend, "last")}</div>
          </div>
        </div>
        <div className="grid gap-4 text-[11px] py-1">
          <MobileSubTrendCard sub={tw} row={1} dates={twDateRange} />
          <MobileSubTrendCard sub={lw} row={2} dates={lwDateRange} />
          <MobileSubTrendCard sub={ly} row={3} dates={lyDateRange} />
        </div>
      </div>
    </div>
  );
};

export default SubsView;
