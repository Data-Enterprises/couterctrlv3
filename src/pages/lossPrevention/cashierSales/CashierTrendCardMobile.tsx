import { useAppSelector } from "../../../hooks";
import { formatCurrency2 } from "../../../utils";
import type { CashierDetails, CashierTrend } from "../../../interfaces";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
  ArrowRightIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
} from "@heroicons/react/24/outline";

import { findTrendDirection } from ".";

interface CashierTrendCardProps {
  s: CashierDetails;
  idx: number;
}

const CashierTrendCardMobile = ({ s, idx }: CashierTrendCardProps) => {
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.lossPrevention);

  const renderOverallTrend = () => {
    const trends = cashier.cashierTrends;
    const exists = trends.find((t) => {
      if (cashier.selectedSaleType === "Description") {
        return t.storeid === s.storeid && t.sale_type === s.sale_type;
      } else {
        return t.storeid === s.storeid;
      }
    });

    let direction = 0;
    if (exists) {
      direction += findTrendDirection(
        s.transaction_count,
        exists.transaction_count,
      );
      direction += findTrendDirection(s.total_items, exists.total_items);
      direction += findTrendDirection(s.amount, exists.amount);
      direction += findTrendDirection(
        s.average_dollars,
        exists.average_dollars,
      );
      direction += findTrendDirection(s.average_qty, exists.average_qty);
    }

    if (direction > 0) {
      return (
        <HandThumbUpIcon className="h-6 w-6 stroke-emerald-500 stroke-2 inline-block ml-1" />
      );
    } else if (direction < 0) {
      return (
        <HandThumbDownIcon className="h-6 w-6 stroke-orange-500 stroke-2 inline-block ml-1" />
      );
    } else {
      return (
        <ArrowRightIcon className="h-6 w-6 stroke-content stroke-2 inline-block ml-1" />
      );
    }
  };

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
    const trends = cashier.cashierTrends;
    const exists = trends.find(
      (t) => t.storeid === row.storeid && t.sale_type === row.sale_type,
    );
    if (!exists) return null;

    // Otherwise return the icon
    return renderIcon(row[key] as number, exists[key2] as number);
  };

  const titleStyle = "cursor-default pl-2 rounded-xl flex justify-between";

  const defaultTrend = (row: CashierDetails) => {
    const trends = cashier.cashierTrends;
    const exists = trends.find(
      (t) => t.storeid === row.storeid && t.sale_type === row.sale_type,
    );
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

  const clickStyle = context.isDesktop
    ? "hover:text-blue-500 hover:font-medium underline cursor-pointer"
    : "";

  return (
    <div className={`bg-custom-white rounded-lg`}>
      <div className="text-center font-medium bg-blue-500 text-custom-white py-0.5 mb-1 rounded-t-lg flex px-4 justify-between">
        <div>{s.store_name}</div>
        <div>{s.sale_type}</div>
      </div>
      <div className="flex items-center justify-center font-bold">
        Overall {renderOverallTrend()}
      </div>
      <div className="grid grid-cols-[45%_27%_33%] py-2 text-sm">
        <div className="px-2">
          <div className="font-medium pl-2">Comparison</div>
          <div
            data-testid={`cashier-trend-card-${idx}-${s.storeid}`}
            className={`${titleStyle} ${clickStyle}`}
          >
            Transactions
            {findTrend(s, "transaction_count", "transaction_count")}
          </div>
          <div className={`${titleStyle}`}>
            Total Items
            {findTrend(s, "total_items", "total_items")}
          </div>
          <div className={titleStyle}>
            Total Dollars {findTrend(s, "amount", "amount")}
          </div>
          <div className={titleStyle}>
            Avg Dollars {findTrend(s, "average_dollars", "average_dollars")}
          </div>
          <div className={titleStyle}>
            Avg Quantity {findTrend(s, "average_qty", "average_qty")}
          </div>
          <div className={titleStyle}>Cashiers</div>
        </div>

        <div>
          <div className="font-medium">Totals</div>
          <div>{s.transaction_count}</div>
          <div>{s.total_items}</div>
          <div>{formatCurrency2(s.amount)}</div>
          <div>{formatCurrency2(s.average_dollars)}</div>
          <div>{s.average_qty.toFixed(2)}</div>
          <div>{s.cashier_count}</div>
        </div>

        <div>
          <div className="font-medium">Trend</div>
          <div>{defaultTrend(s).transaction_count}</div>
          <div>{defaultTrend(s).total_items}</div>
          <div>{formatCurrency2(defaultTrend(s).amount)}</div>
          <div>{formatCurrency2(defaultTrend(s).average_dollars)}</div>
          <div>{defaultTrend(s).average_qty.toFixed(2)}</div>
          <div>{defaultTrend(s).cashier_count}</div>
        </div>
      </div>
    </div>
  );
};

export default CashierTrendCardMobile;
