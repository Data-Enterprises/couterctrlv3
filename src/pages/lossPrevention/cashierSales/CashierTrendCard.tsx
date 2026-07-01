import { useAppSelector, useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import type { CashierDetails, CashierTrend } from "../../../interfaces";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";
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
  } = useLPState();
  const actions = useLPActions();
  const isTablet = useAppSelector((state) => state.app.isTablet);

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
        dispatch(actions.setCashierDetailsTrendDirection(trendDirection));
      }
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
        <HandThumbUpIcon className="h-5 w-5 stroke-emerald-500 stroke-2 inline-block ml-1" />
      );
    } else if (cashierDetailsTrendDirection < 0) {
      return (
        <HandThumbDownIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block ml-1" />
      );
    } else {
      return (
        <ArrowRightIcon className="h-5 w-5 stroke-content stroke-2 inline-block ml-1" />
      );
    }
  };

  const individualTrend = (num1: number, num2: number) => {
    if (num2 === 0) return <div>N/A</div>;

    const trend = findTrendDirection(num1, num2);
    if (trend > 0) {
      return (
        <HandThumbUpIcon className="h-5 w-5 stroke-emerald-500 stroke-2 inline-block ml-1" />
      );
    } else if (trend < 0) {
      return (
        <HandThumbDownIcon className="h-5 w-5 stroke-orange-500 stroke-2 inline-block ml-1" />
      );
    } else {
      return (
        <ArrowRightIcon className="h-5 w-5 stroke-content stroke-2 inline-block ml-1" />
      );
    }
  };

  if (isTablet) {
    return (
      <div className="bg-custom-white rounded-lg h-full select-none shadow-md overflow-hidden">
        {/* Header */}
        <div className="font-medium flex items-center justify-between px-3 py-0.5">
          <div>
            {selectedCashierDetails!.store_name} -{" "}
            {selectedCashierDetails!.sale_type}
          </div>
          <div className="font-medium">Overall Trend {overallTrendLine()}</div>
        </div>

        <div className="grid grid-cols-2 h-[1.5px] px-3">
          <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
          <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
        </div>

        {/* Metrics blocks */}
        <div className="overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-bkg rounded-lg shadow-md leading-tight">
              <div className="font-medium text-sm md:text-sm mb-1 text-content/80 col-span-2 flex justify-between">
                <div>Transactions</div>
                {individualTrend(
                  selectedCashierDetails!.transaction_count,
                  defaultTrend(selectedCashierDetails!).transaction_count,
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Total
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {selectedCashierDetails!.transaction_count}
                  </div>
                </div>
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Trend
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {defaultTrend(selectedCashierDetails!).transaction_count}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 bg-bkg rounded-lg shadow-md leading-tight">
              <div className="font-medium text-sm md:text-sm mb-1 text-content/80 col-span-2 flex justify-between">
                <div>Total Items</div>
                {individualTrend(
                  selectedCashierDetails!.total_items,
                  defaultTrend(selectedCashierDetails!).total_items,
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Total
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {selectedCashierDetails!.total_items}
                  </div>
                </div>
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Trend
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {defaultTrend(selectedCashierDetails!).total_items}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 bg-bkg rounded-lg shadow-md leading-tight">
              <div className="font-medium text-sm md:text-sm mb-1 text-content/80 col-span-2 flex justify-between">
                <div>Total Dollars</div>
                {individualTrend(
                  selectedCashierDetails!.amount,
                  defaultTrend(selectedCashierDetails!).amount,
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Total
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {formatCurrency2(selectedCashierDetails!.amount)}
                  </div>
                </div>
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Trend
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {formatCurrency2(
                      defaultTrend(selectedCashierDetails!).amount,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 bg-bkg rounded-lg shadow-md leading-tight">
              <div className="font-medium text-sm md:text-sm mb-2 text-content/80 col-span-2 flex justify-between">
                <div>Avg Dollars</div>
                {individualTrend(
                  selectedCashierDetails!.average_dollars,
                  defaultTrend(selectedCashierDetails!).average_dollars,
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Total
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {formatCurrency2(selectedCashierDetails!.average_dollars)}
                  </div>
                </div>
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Trend
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {formatCurrency2(
                      defaultTrend(selectedCashierDetails!).average_dollars,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 bg-bkg rounded-lg shadow-md leading-tight">
              <div className="font-medium text-sm md:text-sm mb-2 text-content/80 col-span-2 flex justify-between">
                <div>Avg Quantity</div>
                {individualTrend(
                  selectedCashierDetails!.average_qty,
                  defaultTrend(selectedCashierDetails!).average_qty,
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Total
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {selectedCashierDetails!.average_qty.toFixed(2)}
                  </div>
                </div>
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Trend
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {defaultTrend(selectedCashierDetails!).average_qty.toFixed(
                      2,
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-2 bg-bkg rounded-lg shadow-md leading-tight">
              <div className="font-medium text-sm mb-2 text-content/80 col-span-2">
                Cashiers
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Total
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {selectedCashierDetails!.cashier_count}
                  </div>
                </div>
                <div className="text-right md:text-left bg-custom-white rounded-lg p-2">
                  <div className="text-xs md:text-sm text-content/60 font-medium">
                    Trend
                  </div>
                  <div className="font-medium text-nowrap truncate">
                    {defaultTrend(selectedCashierDetails!).cashier_count}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-custom-white rounded-lg h-full select-none`}>
      <div className="text-center font-medium bg-blue-500 text-sm text-custom-white py-1 rounded-t-lg flex px-2 justify-between">
        <div>{selectedCashierDetails!.store_name}</div>
        <div>{selectedCashierDetails!.sale_type}</div>
      </div>
      <div className="flex items-center justify-center font-medium text-nowrap truncate">
        Overall Trend {overallTrendLine()}
      </div>
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
