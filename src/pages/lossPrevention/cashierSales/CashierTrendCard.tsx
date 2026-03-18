import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import type { CashierDetails, CashierTrend } from "../../../interfaces";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";
import { setCashierDetailsTrendDirection } from "../../../features/cashierSlice";
import { useEffect } from "react";

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

        if (
          selectedCashierDetails.transaction_count < exists.transaction_count
        ) {
          trendDirection += 1;
        } else if (
          selectedCashierDetails.transaction_count > exists.transaction_count
        ) {
          trendDirection -= 1;
        }

        if (selectedCashierDetails.total_items < exists.total_items) {
          trendDirection += 1;
        } else if (selectedCashierDetails.total_items > exists.total_items) {
          trendDirection -= 1;
        }

        if (selectedCashierDetails.amount >= 0) {
          if (selectedCashierDetails.amount < exists.amount) {
            trendDirection += 1;
          } else if (selectedCashierDetails.amount > exists.amount) {
            trendDirection -= 1;
          }
        }

        if (selectedCashierDetails.amount < 0 && exists.amount < 0) {
          if (selectedCashierDetails.amount > exists.amount) {
            trendDirection += 1;
          } else if (selectedCashierDetails.amount < exists.amount) {
            trendDirection -= 1;
          }
        }

        if (selectedCashierDetails.avg_item_amount >= 0) {
          if (selectedCashierDetails.average_dollars < exists.average_dollars) {
            trendDirection += 1;
          } else if (
            selectedCashierDetails.average_dollars > exists.average_dollars
          ) {
            trendDirection -= 1;
          }
        }

        if (
          selectedCashierDetails.average_dollars < 0 &&
          exists.average_dollars < 0
        ) {
          if (selectedCashierDetails.average_dollars > exists.average_dollars) {
            trendDirection += 1;
          } else if (
            selectedCashierDetails.average_dollars < exists.average_dollars
          ) {
            trendDirection -= 1;
          }
        }

        if (selectedCashierDetails.average_qty >= 0) {
          if (selectedCashierDetails.average_qty < exists.average_qty) {
            trendDirection += 1;
          } else if (selectedCashierDetails.average_qty > exists.average_qty) {
            trendDirection -= 1;
          }
        }

        if (selectedCashierDetails.average_qty < 0 && exists.average_qty < 0) {
          if (selectedCashierDetails.average_qty > exists.average_qty) {
            trendDirection += 1;
          } else if (selectedCashierDetails.average_qty < exists.average_qty) {
            trendDirection -= 1;
          }
        }

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
      return {
        transaction_count: 0,
        total_items: 0,
        amount: 0,
        qty: 0,
        avg_item_amount: 0,
        avg_item_qty: 0,
        weight: 0,
        sale_type: row.sale_type,
        storeid: row.storeid,
        cashier_count: 0,
        average_dollars: 0,
        average_qty: 0,
      };
    }

    return exists;
  };

  const overallTrendLine = () => {
    if (cashierDetailsTrendDirection > 0) {
      // green arrow
      return <ArrowUpCircleIcon className="h-5 w-5 stroke-green-500 stroke-2 inline-block ml-1" />;
    } else if (cashierDetailsTrendDirection < 0) {
      // orange arrow
      return <ArrowDownCircleIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block ml-1" />;
    } else {
      // neutral arrow
      return <ArrowRightCircleIcon className="h-5 w-5 stroke-content stroke-2 inline-block ml-1" />;
    }
  };

  return (
    <div className={`bg-custom-white rounded-lg`}>
      <div className="text-center font-medium bg-blue-500 text-custom-white py-0.5 mb-1 rounded-t-lg flex px-2 justify-between">
        <div>{selectedCashierDetails!.store_name}</div>
        <div>{selectedCashierDetails!.sale_type}</div>
      </div>
      <div className="grid grid-cols-[43%_28%_34%] py-2 text-sm">
        <div className="pr-1">
          <div className="font-medium pl-2 mb-1 flex justify-between">
            Overall Trend {overallTrendLine()}
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

        <div>
          <div className="font-medium mb-1 underline">Totals</div>
          <div>{selectedCashierDetails!.transaction_count}</div>
          <div>{selectedCashierDetails!.total_items}</div>
          <div>{formatCurrency2(selectedCashierDetails!.amount)}</div>
          <div>{formatCurrency2(selectedCashierDetails!.average_dollars)}</div>
          <div>{selectedCashierDetails!.average_qty.toFixed(2)}</div>
          <div>{selectedCashierDetails!.cashier_count}</div>
        </div>

        <div>
          <div className="font-medium mb-1 underline">Trend</div>
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
