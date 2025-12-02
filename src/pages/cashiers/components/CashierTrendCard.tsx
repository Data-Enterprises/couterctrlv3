import { useAppSelector, useAppDispatch } from "../../../hooks";
import {
  setSelectedStoreId,
  setSelectedCashier,
  setCashiers,
  setFetchingCashierTransactions,
  setSelectedSaleIds,
  setTransList,
} from "../../../features/cashierSlice";
import { formatCurrency2 } from "../../../utils";
import type {
  CashierDetails,
  CashierTrend,
  JsonError,
  UniqueCashier,
} from "../../../interfaces";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";
import { getTransactionList } from "../../../api/cashiers";
import { filterData } from "..";
import { useToast } from "../../../components/toasts/hooks/useToast";

interface CashierTrendCardProps {
  s: CashierDetails;
}

const CashierTrendCard = ({ s }: CashierTrendCardProps) => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);
  const activePanelStyle = (s: number) => {
    if (s === cashier.selectedStoreId) {
      return "shadow-inner border-2 border-content/70 rounded-xl";
    } else {
      return "shadow-lg";
    }
  };

  const handlePanelClick = (storeid: number) => {
    if (!context.isDesktop) return;
    dispatch(setSelectedStoreId(storeid));
    dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
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
    key2: keyof CashierTrend
  ) => {
    const trends = cashier.cashierTrends;
    const exists = trends.find((t) => t.storeid === row.storeid);
    if (!exists) return null;

    // Otherwise return the icon
    return renderIcon(row[key] as number, exists[key2] as number);
  };

  const titleStyle = "cursor-default pl-2 rounded-xl flex justify-between";

  const defaultTrend = (row: CashierDetails) => {
    const trends = cashier.cashierTrends;
    const exists = trends.find((t) => t.storeid === row.storeid);
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

  const showTrans = (option: string, storeNumber: string) => {
    if (!context.isDesktop) return;
    if (option === "sale_id") {
      const filtered = filterData(
        cashier.cashierTransactions,
        cashier.selectedSaleType,
        storeNumber
      );

      const saleIds = filtered.map((item) => item.sale_id);
      dispatch(setSelectedSaleIds(saleIds));
      dispatch(setTransList([]));
      dispatch(setFetchingCashierTransactions(true));

      // call the api
      getTransactionList(context.url, context.token, saleIds, 1)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setTransList(j.transactions));
          }
        })
        .catch((err: JsonError) =>
          toast.error("Error fetching transactions: " + err.message)
        )
        .finally(() => {
          dispatch(setFetchingCashierTransactions(false));
        });

      const uniqueCashiers = [...filtered].reduce(
        (acc: UniqueCashier[], current) => {
          const cashier = acc.find(
            (item) => item.cashier_number === current.cashier_number
          );
          if (!cashier) {
            acc.push({
              cashier_name: current.cashier_name,
              cashier_number: current.cashier_number,
              total_sales: current.total_sales,
              transaction_count: 1,
              store_number: current.store_number,
            });
            return acc;
          } else {
            cashier.total_sales += current.total_sales;
            cashier.transaction_count += 1;
            return acc;
          }
        },
        []
      );
      dispatch(setCashiers(uniqueCashiers));
    }
  };

  const clickStyle = context.isDesktop
    ? "hover:text-blue-500 hover:font-medium underline cursor-pointer"
    : "";

  return (
    <div
      className={`bg-custom-white rounded-lg ${activePanelStyle(s.storeid)}`}
      onClick={() => handlePanelClick(s.storeid)}
    >
      <div className="text-center font-medium bg-blue-500 text-custom-white py-0.5 mb-1 rounded-t-lg flex px-4 justify-between">
        <div>{s.store_name}</div>
        <div>{s.sale_type}</div>
      </div>
      <div className="grid grid-cols-[45%_27%_33%] py-2 text-sm">
        <div className="px-2">
          <div className="font-medium pl-2">Comparison</div>
          <div
            className={`${titleStyle} ${clickStyle}`}
            onClick={() => showTrans("sale_id", s.store_number)}
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
          <div>{defaultTrend(s).avg_item_qty.toFixed(2)}</div>
          <div>{defaultTrend(s).cashier_count}</div>
        </div>
      </div>
    </div>
  );
};

export default CashierTrendCard;
