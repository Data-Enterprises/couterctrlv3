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

  const titleStyle = "cursor-pointer pl-2 rounded-xl";

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
              <div className="grid grid-cols-[40%_27%_33%] gap-4 text-sm">
                <div className="pr-4 pl-2">
                  <div className="font-medium pl-2">Comparison</div>
                  <div
                    className={`${titleStyle} hover:text-blue-500 hover:font-medium hover:underline`}
                    onClick={() => showTrans("sale_id", s.store_number)}
                  >
                    Transactions
                  </div>
                  <div className={titleStyle}>Total Items</div>
                  <div className={titleStyle}>Cashiers</div>
                  <div className={titleStyle}>Total Dollars</div>
                  <div className={titleStyle}>Avg Dollars</div>
                  <div className={titleStyle}>Avg Quantity</div>
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
