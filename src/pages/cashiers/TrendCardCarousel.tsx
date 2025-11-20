import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { handleRipple, formatCurrency2 } from "../../utils";
import { filterData } from ".";

import Carousel from "../../components/Carousel";
import type { JsonError, UniqueCashier } from "../../interfaces";
import {
  setCashiers,
  setFilteredTableData,
  setSelectedCashier,
  setSelectedSaleIds,
  setTransList,
} from "../../features/cashierSlice";
import { getTransactionList } from "../../api/cashiers";
import type React from "react";

const TrendCardCarousel = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);

  // Filter transactions based on option
  const filterTransactions = (option: string, storeNumber: string) => {
    if (option === "sale_id") {
      const filtered = filterData(
        cashier.cashierTransactions,
        cashier.selectedSaleType,
        storeNumber
      );

      const saleIds = filtered.map((item) => item.sale_id);
      dispatch(setSelectedSaleIds(saleIds));

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
        );

      dispatch(setFilteredTableData(filtered));

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

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    handleRipple(e);
    dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
  };

  return (
    <Carousel className="h-[260px]">
      {cashier.chunkedSales.map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 pb-4">
          {cashier.chunkedSales[i].map((s, idx) => (
            <div
              key={idx}
              className="bg-custom-white pb-4 rounded-lg shadow-lg ripple-button"
              onClick={handlePanelClick}
            >
              <div className="text-center font-medium bg-blue-500 text-custom-white py-1 mb-2 rounded-t-lg flex px-4 justify-between">
                <div>{s.store_name}</div>
                <div>{s.sale_type}</div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="pr-4 pl-2">
                  <div className="opacity-0">t</div>
                  <div
                    className="cursor-pointer pl-2 rounded-xl hover:text-custom-white hover:bg-blue-500 transition-all duration-200"
                    onClick={() =>
                      filterTransactions("sale_id", s.store_number)
                    }
                  >
                    Transactions
                  </div>
                  <div className="cursor-pointer pl-2 rounded-xl hover:text-custom-white hover:bg-blue-500 transition-all duration-200">
                    Total Items
                  </div>
                  <div className="cursor-pointer pl-2 rounded-xl hover:text-custom-white hover:bg-blue-500 transition-all duration-200">
                    Cashiers
                  </div>
                  <div className="cursor-pointer pl-2 rounded-xl hover:text-custom-white hover:bg-blue-500 transition-all duration-200">
                    Total Dollars
                  </div>
                  <div className="cursor-pointer pl-2 rounded-xl hover:text-custom-white hover:bg-blue-500 transition-all duration-200">
                    Avg Dollars
                  </div>
                  <div className="cursor-pointer pl-2 rounded-xl hover:text-custom-white hover:bg-blue-500 transition-all duration-200">
                    Avg Quantity
                  </div>
                </div>

                <div className="px-4">
                  <div className="font-medium">Totals</div>
                  <div className="flex gap-1">
                    <div>{s.transaction_count}</div>
                  </div>

                  <div className="flex gap-1">
                    <div>{s.total_items}</div>
                  </div>

                  <div className="flex gap-1">
                    <div>{s.cashier_count}</div>
                  </div>
                  <div className="flex gap-1">
                    <div>{formatCurrency2(s.amount)}</div>
                  </div>
                  <div className="flex gap-1">
                    <div>{formatCurrency2(s.average_dollars)}</div>
                  </div>
                  <div className="flex gap-1">
                    <div>{s.average_qty.toFixed(2)}</div>
                  </div>
                </div>

                <div className="px-4">
                  <div className="font-medium">Trend</div>
                  <div>{cashier.chunkedTrends[i][idx].transaction_count}</div>
                  <div>{cashier.chunkedTrends[i][idx].total_items}</div>
                  <div>{cashier.chunkedTrends[i][idx].cashier_count}</div>
                  <div>
                    {formatCurrency2(cashier.chunkedTrends[i][idx].amount)}
                  </div>
                  <div>
                    {formatCurrency2(
                      cashier.chunkedTrends[i][idx].average_dollars
                    )}
                  </div>
                  <div>
                    {cashier.chunkedTrends[i][idx].average_qty.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </Carousel>
  );
};

export default TrendCardCarousel;
