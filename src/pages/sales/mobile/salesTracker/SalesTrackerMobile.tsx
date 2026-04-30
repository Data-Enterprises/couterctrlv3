import { useEffect } from "react";
import { useAppSelector } from "../../../../hooks";
import { useMobileSalesCtx } from "../hooks";
import {
  setLyCollapsedSubSalesMobile,
  setLyWeekCardsMobile,
  setTyCollapsedSubSalesMobile,
  setTyWeekCardsMobile,
} from "../../../../features/salesMobileSlice";
import { chunkData } from "../../tracker";

import type { SubSale } from "../../../../interfaces";

import LoadingIndicator from "../../../../components/loading/LoadingIndicator";
import SalesTrackerDays from "./SalesTrackerDays";
import SalesTrackerPeriods from "./SalesTrackerPeriods";
import SalesTrackerWeeks from "./SalesTrackerWeeks";

const SalesTrackerMobile = () => {
  const ctx = useMobileSalesCtx();
  const { groups } = useAppSelector((state) => state.group);
  const { lastGroup } = useAppSelector((state) => state.search);

  useEffect(() => {
    if (
      ctx.thisYrSubTrackerMobile.length > 0 &&
      ctx.lastYrSubTrackerMobile.length > 0
    ) {
      const justTyDates = Array.from(
        new Set(
          ctx.thisYrSubTrackerMobile.map(
            (sale) => sale.sale_date.split("T")[0],
          ),
        ),
      );

      const justLyDates = Array.from(
        new Set(
          ctx.lastYrSubTrackerMobile.map(
            (sale) => sale.sale_date.split("T")[0],
          ),
        ),
      );

      const chunkedTyDates = chunkData(justTyDates);
      const tyDateRanges = chunkedTyDates.map((chunk) => {
        return `${chunk[0]} - ${chunk[chunk.length - 1]}`;
      });

      const chunkedLyDates = chunkData(justLyDates);

      const lyDateRanges = chunkedLyDates.map((chunk) => {
        return `${chunk[0]} - ${chunk[chunk.length - 1]}`;
      });

      const formatCards = (
        data: SubSale[],
        dateRanges: string[],
        whichYear: "ty" | "ly",
      ) => {
        const result: SubSale[] = [];
        const collapsedSales: SubSale[][] = [];

        dateRanges.forEach((range) => {
          // Formatting the date checkers
          const [start, end] = range.split(" - ");
          // filtering all sub sales within the date range of the current chunk
          const matchingSales = data.filter((sale) => {
            return (
              sale.sale_date.slice(0, 10) >= start &&
              sale.sale_date.slice(0, 10) <= end
            );
          });
          collapsedSales.unshift(matchingSales);

          // reducing the matching sales to combine any with the same storeid by summing their values
          const reduced = matchingSales.reduce((acc: SubSale[], curr) => {
            const found = acc.find((s) => s.storeid === curr.storeid);

            if (found) {
              found.total_sales += curr.total_sales - curr.total_tax;
              found.digital_coupons += curr.digital_coupons;
              found.elec_instore_coupons += curr.elec_instore_coupons;
              found.elec_store_coupons += curr.elec_store_coupons;
              found.net_sales += curr.net_sales;
              found.qty += curr.qty;
              found.store_coupon += curr.store_coupon;
              found.total_tax += curr.total_tax;
              found.weight += curr.weight;
              found.transaction_count += curr.transaction_count;
            } else {
              const sale_date = range;
              const store_name = curr.store_name
                ? curr.store_name
                : groups.filter((s) => s.id === lastGroup)[0].group_name;

              acc.push({
                ...curr,
                total_sales: curr.total_sales - curr.total_tax,
                sale_date,
                store_name,
              });
            }
            return acc;
          }, []);

          // pushing the final result
          result.unshift(...reduced);
        });

        // ctx.dispatch the reduces sales/collapsed sales to the store
        if (whichYear === "ty") {
          ctx.dispatch(setTyWeekCardsMobile(result));
          ctx.dispatch(setTyCollapsedSubSalesMobile(collapsedSales));
        } else {
          ctx.dispatch(setLyWeekCardsMobile(result));
          ctx.dispatch(setLyCollapsedSubSalesMobile(collapsedSales));
        }

        return result;
      };

      formatCards(ctx.thisYrSubTrackerMobile, tyDateRanges, "ty");
      formatCards(ctx.lastYrSubTrackerMobile, lyDateRanges, "ly");
    }
  }, [ctx.thisYrSubTrackerMobile, ctx.lastYrSubTrackerMobile]);

  if (ctx.loadingLYTrackerMobile || ctx.loadingTYTrackerMobile) {
    return (
      <div className="relative min-h-[calc(100vh-88px)] max-h-[calc(100vh-88px)] overflow-hidden">
        <LoadingIndicator message="Loading tracker data" />
      </div>
    );
  }

  const renderTrackerView = () => {
    switch (ctx.salesTrackerView) {
      case "weeks":
        return <SalesTrackerWeeks />;
      case "days":
        return <SalesTrackerDays />;
      default:
        return <SalesTrackerPeriods />;
    }
  };

  return (
    <div className="min-h-[calc(100vh-88px)] max-h-[calc(100vh-88px)] overflow-hidden text-[12px]">
      {renderTrackerView()}
    </div>
  );
};

export default SalesTrackerMobile;
