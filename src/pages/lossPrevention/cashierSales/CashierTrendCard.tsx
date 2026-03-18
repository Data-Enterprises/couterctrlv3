import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import type { CashierDetails, CashierTrend } from "../../../interfaces";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ArrowRightIcon
} from "@heroicons/react/24/outline";
import { setCashierDetailsTrendDirection } from "../../../features/cashierSlice";
import { useEffect } from "react";
import { defaultCashierTrend, findTrendDirection } from ".";

const CashierTrendCard = () => {
  const dispatch = useAppDispatch();
  const {
    cashierTrends,
    selectedCashierDetails,
    selectedCashierDetailsIdx,
    selectedSaleType,
    cashierDetailsTrendDirection,
  } = useAppSelector((state) => state.cashier);

  useEffect(() => {
    if (selectedCashierDetails !== null) {
      const trends = cashierTrends;
      const exists = trends.find((t) => {
        if (selectedSaleType === "Description") {
          return (
            t.storeid === selectedCashierDetails.storeid &&
            t.sale_type === selectedCashierDetails.sale_type
          );
        } else {
          return t.storeid === selectedCashierDetails.storeid;
        }
      });

      if (exists) {
        let trendDirection = 0;

        trendDirection += findTrendDirection(
          selectedCashierDetails.transaction_count,
          exists.transaction_count,
        );

        trendDirection += findTrendDirection(
          selectedCashierDetails.total_items,
          exists.total_items,
        );

        trendDirection += findTrendDirection(
          selectedCashierDetails.amount,
          exists.amount,
        );

        trendDirection += findTrendDirection(
          selectedCashierDetails.average_dollars,
          exists.average_dollars,
        );

        trendDirection += findTrendDirection(
          selectedCashierDetails.average_qty,
          exists.average_qty,
        );

        // max = 5, min =-5 => this is used in the overallTrendLine to determine which icon to show
        dispatch(setCashierDetailsTrendDirection(trendDirection));
      }
    } else {
      dispatch(setCashierDetailsTrendDirection(0));
    }
  }, [selectedCashierDetails]);

  const renderIcon = (total: number, trend: number) => {
    // if both are negative
    if (total < 0 && trend < 0) {
      if (total < trend) {
        return (
          <ArrowDownCircleIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block ml-1" />
        );
      } else if (total > trend) {
        return (
          <ArrowUpCircleIcon className="h-5 w-5 stroke-green-500 stroke-2 inline-block ml-1" />
        );
      }
    }

    // default
    if (total < trend) {
      return (
        <ArrowUpCircleIcon className="h-5 w-5 stroke-green-500 stroke-2 inline-block ml-1" />
      );
    } else if (total > trend) {
      return (
        <ArrowDownCircleIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block ml-1" />
      );
    }
  };

  const findTrend = (
    row: CashierDetails,
    key: keyof CashierDetails,
    key2: keyof CashierTrend,
  ) => {
    const trends = cashierTrends;
    const exists = trends.find(
      (t) => t.storeid === row.storeid && t.sale_type === row.sale_type,
    );
    if (!exists) return null;
    return renderIcon(row[key] as number, exists[key2] as number);
  };

  const titleStyle = "cursor-default pl-2 rounded-xl flex justify-between";

  const defaultTrend = (row: CashierDetails) => {
    const trends = cashierTrends;
    const exists = trends.find((t) => {
      if (selectedSaleType === "Description") {
        return t.storeid === row.storeid && t.sale_type === row.sale_type;
      } else {
        return t.storeid === row.storeid;
      }
    });
    if (!exists) {
      return defaultCashierTrend(row);
    } else {
      return exists;
    }
  };

  const overallTrendLine = () => {
    if (cashierDetailsTrendDirection > 0) {
      return (
        <ArrowTrendingUpIcon className="h-6 w-6 stroke-emerald-500 stroke-2 inline-block ml-1" />
      );
    } else if (cashierDetailsTrendDirection < 0) {
      return (
        <ArrowTrendingDownIcon className="h-6 w-6 stroke-orange-500 stroke-2 inline-block ml-1" />
      );
    } else {
      return (
        <ArrowRightIcon className="h-6 w-6 stroke-content stroke-2 inline-block ml-1" />
      );
    }
  };

  return (
    <div className={`bg-custom-white rounded-lg h-full`}>
      <div className="text-center font-medium bg-blue-500 text-sm text-custom-white py-1 rounded-t-lg flex px-2 justify-between">
        <div>{selectedCashierDetails!.store_name}</div>
        <div>{selectedCashierDetails!.sale_type}</div>
      </div>
      <div className="flex items-center justify-center font-bold">Overall Trend {overallTrendLine()}</div>
      <div className="grid grid-cols-[43%_28%_34%] pb-2 text-sm h-[75%]">
        <div className="pr-1 grid place-items-stretch">
          <div className="font-medium pl-2 flex justify-between">
            Comparison
          </div>
          <div
            data-testid={`cashier-trend-card-${selectedCashierDetailsIdx}-${selectedCashierDetails!.storeid}`}
            className={titleStyle}
          >
            Transactions
            {findTrend(
              selectedCashierDetails!,
              "transaction_count",
              "transaction_count",
            )}
          </div>
          <div className={titleStyle}>
            Total Items
            {findTrend(selectedCashierDetails!, "total_items", "total_items")}
          </div>
          <div className={titleStyle}>
            Total Dollars{" "}
            {findTrend(selectedCashierDetails!, "amount", "amount")}
          </div>
          <div className={titleStyle}>
            Avg Dollars{" "}
            {findTrend(
              selectedCashierDetails!,
              "average_dollars",
              "average_dollars",
            )}
          </div>
          <div className={titleStyle}>
            Avg Quantity{" "}
            {findTrend(selectedCashierDetails!, "average_qty", "average_qty")}
          </div>
          <div className={titleStyle}>Cashiers</div>
        </div>

        <div className="grid place-items-stretch">
          <div className="font-medium">Totals</div>
          <div>{selectedCashierDetails!.transaction_count}</div>
          <div>{selectedCashierDetails!.total_items}</div>
          <div>{formatCurrency2(selectedCashierDetails!.amount)}</div>
          <div>{formatCurrency2(selectedCashierDetails!.average_dollars)}</div>
          <div>{selectedCashierDetails!.average_qty.toFixed(2)}</div>
          <div>{selectedCashierDetails!.cashier_count}</div>
        </div>

        <div className="grid place-items-stretch">
          <div className="font-medium">Trend</div>
          <div>{defaultTrend(selectedCashierDetails!).transaction_count}</div>
          <div>{defaultTrend(selectedCashierDetails!).total_items}</div>
          <div>
            {formatCurrency2(defaultTrend(selectedCashierDetails!).amount)}
          </div>
          <div>
            {formatCurrency2(
              defaultTrend(selectedCashierDetails!).average_dollars,
            )}
          </div>
          <div>
            {defaultTrend(selectedCashierDetails!).average_qty.toFixed(2)}
          </div>
          <div>{defaultTrend(selectedCashierDetails!).cashier_count}</div>
        </div>
      </div>
    </div>
  );
};

export default CashierTrendCard;
