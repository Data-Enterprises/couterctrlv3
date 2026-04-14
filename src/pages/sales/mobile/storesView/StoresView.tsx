import { useState, useEffect } from "react";
import { useMobileSalesCtx } from "../hooks";
import type { AggTotals, AggCoupons } from "../../../../interfaces";
import type { PieData } from "..";
import { defaultAggCoupons, defaultAggTotals, pieData, sortOptions } from ".";
import {
  setSPSort,
  type PanelSortOption,
} from "../../../../features/salesMobileSlice";

import StoresHeader from "./StoresHeader";
import StoreRow from "./StoreRow";
import { ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/outline";

const StoresView = () => {
  const ctx = useMobileSalesCtx();
  const [aggTotals, setAggTotals] = useState<AggTotals>(defaultAggTotals);
  const [_, setAggCoupons] = useState<AggCoupons>(defaultAggCoupons);
  const [couponPieData, setCouponPieData] = useState<PieData[]>(pieData);

  useEffect(() => {
    if (
      !ctx.hourlySales.length ||
      !ctx.salesPanels.length ||
      !ctx.subSales.length
    )
      return;

    setAggCoupons(defaultAggCoupons);
    setAggTotals(defaultAggTotals);
    setCouponPieData(pieData);

    const filtered =
      ctx.selectedStore.sale_date.length > 0
        ? [...ctx.hourlySales].filter((hs) => {
            return ctx.selectedStore.sale_date
              ? hs.sale_date.split("T")[0] === ctx.selectedStore.sale_date
              : true;
          })
        : [...ctx.hourlySales];

    // Once we have all the data  we need, process it for all/selected stores
    const totals = filtered.reduce(
      (acc: AggTotals, curr) => {
        acc.basket_size_sales += curr.basket_size_sales;
        acc.total_tax += curr.total_tax;
        acc.transactions += curr.transactions;
        return acc;
      },
      { ...defaultAggTotals },
    );

    const formatSales = () => {
      if (ctx.selectedStore.sale_date.length) {
        // find that sales panel => total sales - total tax => yyyy-mm-dd
        const panel = ctx.salesPanels.find(
          (sp) => sp.sale_date.split("T")[0] === ctx.selectedStore.sale_date,
        );

        return panel!.total_sales - panel!.total_tax;
      } else {
        // all stores
        return [...ctx.salesPanels].reduce((acc, cur) => {
          acc += cur.total_sales - cur.total_tax;
          return acc;
        }, 0);
      }
    };

    totals.total_sales = formatSales();
    totals.avg_basket_amount = totals.total_sales / totals.transactions;

    setAggTotals(totals);

    const cpns = ctx.subSales.reduce(
      (acc: AggCoupons, val) => {
        acc.digital_coupons += val.digital_coupons;
        acc.elec_instore_coupons += val.elec_instore_coupons;
        acc.elect_store_coupons += val.elec_store_coupons;
        acc.store_coupon += val.store_coupon;
        return acc;
      },
      { ...defaultAggCoupons },
    );

    const pieValues: PieData[] = [
      { id: "Digital Coupons", value: cpns.digital_coupons },
      { id: "E. In-Store Coupons", value: cpns.elec_instore_coupons },
      { id: "E. Store Coupons", value: cpns.elect_store_coupons },
      { id: "Store Coupons", value: cpns.store_coupon },
    ];
    setAggCoupons(cpns);
    setCouponPieData(pieValues.sort((a, b) => b.value - a.value));
  }, [ctx.hourlySales, ctx.salesPanels, ctx.selectedStore, ctx.subSales]);

  const currentPanelsList = () => {
    if (ctx.panelSortOption === "") return ctx.salesPanels;

    return [...ctx.salesPanels].sort((a, b) => {
      const key = ctx.panelSortOption as keyof typeof a;
      const aVal = a[key] as number;
      const bVal = b[key] as number;

      if (ctx.sortDir === "asc") {
        return aVal - bVal;
      }
      return bVal - aVal;
    });
  };

  const handleSortPress = (option: string) => {
    ctx.dispatch(setSPSort(option as PanelSortOption));
  };

  const activeSortOption = (option: PanelSortOption) => {
    if (!option.length && ctx.panelSortOption.length)
      return "bg-orange-500 text-custom-white";
    if (option.length && ctx.panelSortOption === option)
      return "bg-orange-200 font-medium";
    return "bg-custom-white";
  };

  const renderArrow = (option: PanelSortOption) => {
    if (ctx.panelSortOption !== option || option === "") return null;
    if (ctx.sortDir === "asc") {
      return <ArrowUpIcon className="h-3 w-3" />;
    } else {
      return <ArrowDownIcon className="h-3 w-3" />;
    }
  };

  return (
    <div className=" min-h-[calc(100vh-7rem)] max-h-[calc(100vh-7rem)] overflow-hidden p-2 select-none text-[13px] space-y-1.5">
      <StoresHeader totals={aggTotals} coupons={couponPieData} />
      <div className="grid grid-cols-5 gap-1">
        {sortOptions.map((so, i) => (
          <div
            key={i}
            className={`rounded-full ${activeSortOption(so.id as PanelSortOption)} bg-custom-white flex gap-1 justify-center items-center py-0.5`}
            onClick={() => handleSortPress(so.id)}
          >
            <div>{so.label}</div>
            {renderArrow(so.id as PanelSortOption)}
          </div>
        ))}
      </div>
      <div className="rounded-lg shadow-md max-h-[calc(100vh-310px)] overflow-y-auto">
        {currentPanelsList().map((sp, i) => (
          <StoreRow key={i} panel={sp} />
        ))}
      </div>
    </div>
  );
};

export default StoresView;
