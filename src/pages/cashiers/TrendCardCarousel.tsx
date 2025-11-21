import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { formatCurrency2 } from "../../utils";
import { filterData } from ".";
import type { JsonError, UniqueCashier } from "../../interfaces";
import {
  setCashiers,
  setSelectedCashier,
  setSelectedSaleIds,
  setTransList,
} from "../../features/cashierSlice";
import { getTransactionList } from "../../api/cashiers";
import Carousel from "../../components/Carousel";

import {
  ArrowUpCircleIcon,
  ArrowDownCircleIcon,
} from "@heroicons/react/24/outline";

const TrendCardCarousel = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const cashier = useAppSelector((state) => state.cashier);

  // Filter transactions based on option and store number
  const showTrans = (option: string, storeNumber: string) => {
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

  const handlePanelClick = () => {
    dispatch(setSelectedCashier({ cashier_number: 0, store_number: "" }));
  };

  const titleStyle = "cursor-pointer pl-2 rounded-xl flex justify-between";

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

  return (
    <Carousel className="h-[215px]">
      {cashier.chunkedSales.map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-3 pb-2">
          {cashier.chunkedSales[i].map((s, idx) => (
            <div
              key={idx}
              className="bg-custom-white pb-2 rounded-lg shadow-lg ripple-button"
              onClick={handlePanelClick}
            >
              <div className="text-center font-medium bg-blue-500 text-custom-white py-0.5 mb-1 rounded-t-lg flex px-4 justify-between">
                <div>{s.store_name}</div>
                <div>{s.sale_type}</div>
              </div>
              <div className="grid grid-cols-[45%_27%_33%] gap- text-sm">
                <div className="px-2">
                  <div className="font-medium pl-2">Comparison</div>
                  <div
                    className={`${titleStyle} hover:text-blue-500 hover:font-medium hover:underline`}
                    onClick={() => showTrans("sale_id", s.store_number)}
                  >
                    Transactions
                    {renderIcon(
                      s.transaction_count,
                      cashier.chunkedTrends[i][idx].transaction_count
                    )}
                  </div>
                  <div
                    className={`${titleStyle} hover:text-blue-500 hover:font-medium hover:underline`}
                  >
                    Total Items
                    {renderIcon(
                      s.total_items,
                      cashier.chunkedTrends[i][idx].total_items
                    )}
                  </div>
                  <div className={titleStyle}>
                    Total Dollars{" "}
                    {renderIcon(s.amount, cashier.chunkedTrends[i][idx].amount)}
                  </div>
                  <div className={titleStyle}>
                    Avg Dollars{" "}
                    {renderIcon(
                      s.average_dollars,
                      cashier.chunkedTrends[i][idx].average_dollars
                    )}
                  </div>
                  <div className={titleStyle}>
                    Avg Quantity{" "}
                    {renderIcon(
                      s.average_qty,
                      cashier.chunkedTrends[i][idx].average_qty
                    )}
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
                  <div>{cashier.chunkedTrends[i][idx].transaction_count}</div>
                  <div>{cashier.chunkedTrends[i][idx].total_items}</div>
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
                  <div>{cashier.chunkedTrends[i][idx].cashier_count}</div>
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
