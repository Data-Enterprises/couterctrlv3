import { useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { SubSale } from "../../../interfaces";
import { formatBigNumber, formatCurrency2 } from "../../../utils";
import {
  setLyCollapsedSubSales,
  setLyWeekCards,
  setTyCollapsedSubSales,
  setTyWeekCards,
} from "../../../features/salesSlice";
import { chunkData } from ".";

const WeekCards = () => {
  const dispatch = useAppDispatch();
  const sales = useAppSelector((state) => state.sales);
  const { lastGroup } = useAppSelector((state) => state.search);
  const { groups } = useAppSelector((state) => state.group);

  useEffect(() => {
    if (
      sales.thisYrSubTracker.length > 0 &&
      sales.lastYrSubTracker.length > 0
    ) {
      const justTyDates = Array.from(
        new Set(
          sales.thisYrSubTracker.map((sale) => sale.sale_date.split("T")[0]),
        ),
      );

      const justLyDates = Array.from(
        new Set(
          sales.lastYrSubTracker.map((sale) => sale.sale_date.split("T")[0]),
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

        // dispatch the reduces sales/collapsed sales to the store
        if (whichYear === "ty") {
          dispatch(setTyWeekCards(result));
          dispatch(setTyCollapsedSubSales(collapsedSales));
        } else {
          dispatch(setLyWeekCards(result));
          dispatch(setLyCollapsedSubSales(collapsedSales));
        }

        return result;
      };

      formatCards(sales.thisYrSubTracker, tyDateRanges, "ty");
      formatCards(sales.lastYrSubTracker, lyDateRanges, "ly");
    }
  }, [sales.thisYrSubTracker, sales.lastYrSubTracker]);

  const formatDate = (date: string) => {
    const [year, month, day] = date.split("-");
    return `${month}/${day}/${year}`;
  };

  const formatWeight = (weight: number) => {
    const formatted = new Intl.NumberFormat("en-us", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(weight);

    return formatted;
  };

  return (
    <div className="space-y-2 max-h-[calc(100vh-376px)] overflow-y-scroll no-scrollbar mt-2 pb-2">
      {sales.tyWeekCards.map((sale, idx) => {
        const lyCard = sales.lyWeekCards[idx];

        return (
          <div
            key={idx}
            className="text-[12px] p-2 rounded-lg bg-custom-white shadow-lg"
          >
            <div className="flex justify-between font-medium">
              <div>{sale.store_name}</div>
              <div>
                {formatDate(sale.sale_date.split(" - ")[0])} -{" "}
                {formatDate(sale.sale_date.split(" - ")[1])}
              </div>
            </div>
            <div className="grid grid-cols-2 col-span-2">
              <div className="bg-gradient-to-r from-blue-200 to-custom-white h-[1.5px]"></div>
              <div className="bg-gradient-to-l from-blue-200 to-custom-white h-[1.5px]"></div>
            </div>
            <div className="grid grid-cols-3 mt-1 gap-y-1">
              <div>
                <div>TY Sales</div>
                <div className="font-medium">
                  {formatCurrency2(sale.total_sales - sale.total_tax)}
                </div>
              </div>

              <div className="text-center">
                <div>TY Qty</div>
                <div className="font-medium">
                  {formatBigNumber(sale.qty, 0)}
                </div>
              </div>

              <div className="text-right">
                <div>TY Weight</div>
                <div className="font-medium">{formatWeight(sale.weight)}</div>
              </div>

              <div>
                <div>LY Sales</div>
                <div className="font-medium">
                  {formatCurrency2(lyCard.total_sales - lyCard.total_tax)}
                </div>
              </div>

              <div className="text-center">
                <div>LY Qty</div>
                <div className="font-medium">
                  {formatBigNumber(lyCard.qty, 0)}
                </div>
              </div>

              <div className="text-right">
                <div>LY Weight</div>
                <div className="font-medium">{formatWeight(lyCard.weight)}</div>
              </div>

              {/* Changes */}
              {/* <div>
                <div>Change</div>
                <div className="font-medium">
                  {formatCurrency2(
                    sale.total_sales -
                      sale.total_tax -
                      (lyCard.total_sales - lyCard.total_tax),
                  )}
                </div>
              </div>

              <div className="text-center">
                <div>LY Qty</div>
                <div className="font-medium">
                  {formatBigNumber(lyCard.qty, 0)}
                </div>
              </div>

              <div className="text-right">
                <div>LY Weight</div>
                <div className="font-medium">{formatWeight(lyCard.weight)}</div>
              </div> */}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WeekCards;
