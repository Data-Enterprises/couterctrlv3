import { useMobileSalesCtx } from "../hooks";
import type { AggTotals } from "../../../../interfaces";
import type { PieData } from "..";
import { ResponsivePie } from "@nivo/pie";

import { formatCurrency2 } from "../../../../utils";
import {
  setHourlyKey,
  setSelectedStore,
  setSortedSalesViewTopTen,
} from "../../../../features/salesMobileSlice";

const colors = [
  "#00CC55",
  "#0099AA",
  // "#0066FF",
  "#3b82f6",
  "#6688FF",
  "#FF9900",
  "#CC8844",
];

interface StoresHeaderProps {
  totals: AggTotals;
  coupons: PieData[];
}

const StoresHeader = ({ totals, coupons }: StoresHeaderProps) => {
  const ctx = useMobileSalesCtx();

  const formatDate = (dateStr: string) => {
    const split = dateStr.split("T")[0].split("-");
    return `${split[1]}/${split[2]}/${split[0].slice(2)}`;
  };

  const displayName = () => {
    if (ctx.selectedStore.store_name.length > 0) {
      return ctx.selectedStore.store_name;
    }

    // If in the general view, either the single store name or group name will render
    if (ctx.type === "Store") {
      const selectedCheck = ctx.selectedStore.store_name.length > 0;
      return selectedCheck
        ? ctx.selectedStore.store_name
        : ctx.assignedStores.filter((s) => s.storeid === ctx.searchValue)[0]
            .store_name;
    } else {
      // type is Group
      const groupName = ctx.groups.filter((g) => g.id === ctx.searchValue)[0]
        .group_name;
      return groupName;
    }
  };

  const dteStr = () => {
    if (ctx.selectedStore.sale_date.length) {
      return formatDate(ctx.selectedStore.sale_date);
    }
    return `${formatDate(ctx.startDate)} - ${formatDate(ctx.endDate)}`;
  };

  const totalCpns = coupons.reduce((acc, curr) => acc + curr.value, 0);

  const handleHeaderClick = () => {
    ctx.dispatch(
      setSelectedStore({ storeid: 0, store_name: "", sale_date: "" }),
    );
    ctx.dispatch(setHourlyKey("sale_date"));
    ctx.dispatch(setSortedSalesViewTopTen({ topTen: [], isResetting: true }));
  };

  // For the component's footer for displaying the coupon types
  const titles = ["Digital", "Store", "E. In-Store", "E. Store"];
  const getData = (id: string) => {
    const filtered = coupons.filter((c) => c.id.split(" Coupons")[0] === id);
    return filtered.length > 0 ? filtered[0].value : 0;
  };

  return (
    <div
      className="bg-custom-white rounded-lg shadow-md px-2 py-1 grid grid-cols-2"
      onClick={handleHeaderClick}
    >
      <div className="col-span-2 flex justify-between">
        <div className="font-medium text-nowrap truncate">{displayName()}</div>
        <div className="font-medium">{dteStr()}</div>
      </div>
      <div className="grid grid-cols-[55%_45%]">
        <div>
          <div className="text-content/60">Sales</div>
          <span className="font-medium">
            {totals.total_sales.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
        <div>
          <div className="text-content/60">Trans</div>
          <span className="font-medium">
            {totals.transactions.toLocaleString("en-US")}
          </span>
        </div>
        <div>
          <div className="text-content/60">Avg Basket</div>
          <span className="font-medium">
            {totals.avg_basket_amount.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
        <div>
          <div className="text-content/60">Tax</div>
          <span className="font-medium">
            {totals.total_tax.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </span>
        </div>
      </div>
      <div>
        <div style={{ height: 78 }} className="relative">
          <ResponsivePie
            data={coupons}
            animate={true}
            startAngle={-90}
            endAngle={90}
            innerRadius={0.53}
            enableArcLabels={false}
            enableArcLinkLabels={false}
            colors={colors}
          />
          <div className="font-bold absolute left-1/2 top-1/2 transform -translate-x-1/2">
            <div className="text-center font-medium">Cpn</div>
            {formatCurrency2(totalCpns)}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 col-span-2 gap-x-4 border-t">
        {titles.map((c, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex gap-1 items-center">
              <div
                className={`h-3 w-3 mt-[2px] rounded-full`}
                style={{ backgroundColor: colors[i] }}
              ></div>
              <div>{c}</div>
            </div>
            <div className="font-medium">{formatCurrency2(getData(c))}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoresHeader;
