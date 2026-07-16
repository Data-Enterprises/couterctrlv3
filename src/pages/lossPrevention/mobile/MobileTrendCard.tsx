import { useAppDispatch } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import type { CashierDetails } from "../../../interfaces";

import {
  ArrowRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";
import { useLPState } from "../hooks/useLPState";
import { useLPActions } from "../hooks/useLPActions";
import { useEffect } from "react";
import { defaultCashierTrend, findTrendDirection } from "../cashierSales";

const MobileTrendCard = () => {
  const dispatch = useAppDispatch();
  const {
    cashierTrends,
    selectedCashierDetails,
    selectedSaleType,
    cashierDetailsTrendDirection,
  } = useLPState();
  const actions = useLPActions();

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
        <HandThumbUpIcon className="h-4 w-4 stroke-emerald-500 stroke-2 inline-block" />
      );
    } else if (cashierDetailsTrendDirection < 0) {
      return (
        <HandThumbDownIcon className="h-4 w-4 stroke-orange-500 stroke-2 inline-block" />
      );
    } else {
      return (
        <ArrowRightIcon className="h-4 w-4 stroke-content stroke-2 inline-block" />
      );
    }
  };

  const individualTrend = (num1: number, num2: number) => {
    if (num2 === 0) return <div>N/A</div>;

    const trend = findTrendDirection(num1, num2);
    if (trend > 0) {
      return (
        <HandThumbUpIcon className="h-4 w-4 stroke-emerald-500 stroke-2 inline-block" />
      );
    } else if (trend < 0) {
      return (
        <HandThumbDownIcon className="h-4 w-4 stroke-orange-500 stroke-2 inline-block" />
      );
    } else {
      return (
        <ArrowRightIcon className="h-4 w-4 stroke-content stroke-2 inline-block" />
      );
    }
  };

  const handleViewChange = () => {
    dispatch(actions.setViewTransactionsMobile(true));
  };

  return (
    <div className="bg-custom-white rounded-lg h-full select-none shadow-md overflow-hidden">
      {/* Header */}
      <div className="font-medium flex items-center justify-between px-2 py-0.5">
        <div>
          {selectedCashierDetails!.store_name} -{" "}
          {selectedCashierDetails!.sale_type}
        </div>
        <div className="font-medium">Overall {overallTrendLine()}</div>
      </div>

      <div className="grid grid-cols-2 h-[1.5px] px-2">
        <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
        <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
      </div>

      {/* Metrics blocks */}
      <div className="overflow-y-auto p-2 text-[11px]">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-1.5 bg-blue-200/50 rounded-lg shadow-md leading-tight">
            <div className="font-medium mb-1 text-content/85 col-span-2 flex justify-between items-start">
              <div>Transactions</div>
              {individualTrend(
                selectedCashierDetails!.transaction_count,
                defaultTrend(selectedCashierDetails!).transaction_count,
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Total
                </div>
                <div className="font-medium text-nowrap truncate">
                  {selectedCashierDetails!.transaction_count}
                </div>
              </div>
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Trend
                </div>
                <div className="font-medium text-nowrap truncate">
                  {defaultTrend(selectedCashierDetails!).transaction_count}
                </div>
              </div>
            </div>
          </div>

          <div className="p-1.5 bg-blue-200/50 rounded-lg shadow-md leading-tight">
            <div className="font-medium mb-1 text-content/85 col-span-2 flex justify-between items-start">
              <div>Total Items</div>
              {individualTrend(
                selectedCashierDetails!.total_items,
                defaultTrend(selectedCashierDetails!).total_items,
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Total
                </div>
                <div className="font-medium text-nowrap truncate">
                  {selectedCashierDetails!.total_items}
                </div>
              </div>
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Trend
                </div>
                <div className="font-medium text-nowrap truncate">
                  {defaultTrend(selectedCashierDetails!).total_items}
                </div>
              </div>
            </div>
          </div>

          <div className="p-1.5 bg-blue-200/50 rounded-lg shadow-md leading-tight">
            <div className="font-medium mb-1 text-content/85 col-span-2 flex justify-between items-start">
              <div>Total Dollars</div>
              {individualTrend(
                selectedCashierDetails!.amount,
                defaultTrend(selectedCashierDetails!).amount,
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Total
                </div>
                <div className="font-medium text-nowrap truncate">
                  {formatCurrency2(selectedCashierDetails!.amount)}
                </div>
              </div>
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
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

          <div className="p-1.5 bg-blue-200/50 rounded-lg shadow-md leading-tight">
            <div className="font-medium mb-1 text-content/85 col-span-2 flex justify-between items-start">
              <div>Avg Dollars</div>
              {individualTrend(
                selectedCashierDetails!.average_dollars,
                defaultTrend(selectedCashierDetails!).average_dollars,
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Total
                </div>
                <div className="font-medium text-nowrap truncate">
                  {formatCurrency2(selectedCashierDetails!.average_dollars)}
                </div>
              </div>
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
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

          <div className="p-1.5 bg-blue-200/50 rounded-lg shadow-md leading-tight">
            <div className="font-medium mb-1 text-content/85 col-span-2 flex justify-between items-start">
              <div>Avg Quantity</div>
              {individualTrend(
                selectedCashierDetails!.average_qty,
                defaultTrend(selectedCashierDetails!).average_qty,
              )}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Total
                </div>
                <div className="font-medium text-nowrap truncate">
                  {selectedCashierDetails!.average_qty.toFixed(2)}
                </div>
              </div>
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Trend
                </div>
                <div className="font-medium text-nowrap truncate">
                  {defaultTrend(selectedCashierDetails!).average_qty.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-1.5 bg-blue-200/50 rounded-lg shadow-md leading-tight">
            <div className="font-medium mb-2 text-content/85 col-span-2">
              Cashiers
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Total
                </div>
                <div className="font-medium text-nowrap truncate">
                  {selectedCashierDetails!.cashier_count}
                </div>
              </div>
              <div className="text-center bg-custom-white rounded-lg p-1.5">
                <div className="text-content/85 font-medium">
                  Trend
                </div>
                <div className="font-medium text-nowrap truncate">
                  {defaultTrend(selectedCashierDetails!).cashier_count}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button className="btn-themeBlue text-[13px] px-0 w-full py-1 mt-2" onClick={handleViewChange}>View Transactions</button>
      </div>
    </div>
  );
};

export default MobileTrendCard;
