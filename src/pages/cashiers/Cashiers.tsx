import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import { getCashierDetails, getSaleTypes } from "../../api/cashiers";
import { formatGoliathDate, formatCurrency2, handleRipple } from "../../utils";
import {
  setSaleTypes,
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
  setSelectedSaleTypes,
  setSelectedSaleType,
  setFilteredTableData,
  setCashiers,
} from "../../features/cashierSlice";
import type {
  CashierDetails,
  CashierTransaction,
  CashierTrend,
  JsonError,
} from "../../interfaces";

// components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import Carousel from "../../components/Carousel";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "./TransactionModal";
import CashiersTable from "./CashiersTable";
import UniqueCashiersTable from "./UniqueCashiersTable";

type UniqueCashier = {
  cashier_name: string;
  cashier_number: number;
  total_sales: number;
  transaction_count: number;
};

const Cashiers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const cashier = useAppSelector((state) => state.cashier);

  const [chunkedSales, setChunkedSales] = useState<CashierDetails[][]>([]);
  const [chunkedTrends, setChunkedTrends] = useState<CashierTrend[][]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getSaleTypesData = () => {
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
    getSaleTypes(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setSaleTypes(j.sale_types));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching sale types: " + err.message)
      );
  };

  const handlePanelClick = (e: React.MouseEvent<HTMLDivElement>) => {
    dispatch(setSelectedSaleTypes(e.currentTarget.innerText));
    dispatch(setSelectedSaleType(e.currentTarget.innerText));
    handleRipple(e);

    setChunkedSales([]);
    setChunkedTrends([]);
    setLoading(true);

    const saleType = e.currentTarget.innerText;
    const start = formatGoliathDate(search.startDate);
    const end = formatGoliathDate(search.endDate);
    const useGroups = search.type === "Group" ? 1 : 0;
    const singleStore = search.type === "Store" ? 1 : 0;
    const searchValue =
      search.type === "Group" ? search.lastGroup : search.lastStore;
    getCashierDetails(
      context.url,
      context.token,
      start,
      end,
      useGroups,
      searchValue,
      singleStore,
      [saleType]
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          dispatch(setCashierDetails(j.sales));
          dispatch(setCashierTrends(j.trend));
          dispatch(setCashierTransactions(j.transactions));

          setChunkedSales(chunkData(j.sales));
          setChunkedTrends(chunkData(j.trend));
          // setChunkedTransactions(chunkData(j.transactions, 9));
        }
      })
      .catch((err: JsonError) =>
        toast.error("Error fetching cashier details: " + err.message)
      )
      .finally(() => setLoading(false));
  };

  const chunkData = (arr: any[], chunkSize: number = 3) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
      chunks.push(arr.slice(i, i + chunkSize));
    }
    return chunks;
  };

  const activePanelStyle = (type: string) => {
    if (cashier.selectedSaleType === type) {
      return "bg-blue-200 text-content shadow-inner";
    } else {
      return "bg-custom-white";
    }
  };

  const filterTransactions = (option: string) => {
    if (option === "sale_id") {
      const filtered = [...cashier.cashierTransactions]
        .filter((t) => {
          return t.sale_type === cashier.selectedSaleType;
        })
        .reduce((acc: CashierTransaction[], current: CashierTransaction) => {
          const x = acc.find((item) => item.sale_id === current.sale_id);
          if (!x) {
            return acc.concat([current]);
          } else {
            return acc;
          }
        }, []);

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
    } else if (option === "store_name") {
      //
    }
  };

  return (
    <div
      data-testid="cashiers-page"
      className="w-full h-[calc(100vh-3rem)] p-4 flex gap-4"
    >
      <TransactionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className="w-[23%]">
        <div className="bg-custom-white px-4 py-2.5 rounded-lg shadow-lg">
          <StorePicker />
          <DatePickers handleQuery={getSaleTypesData} />
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          {cashier.saleTypes.map((st, i) => (
            <div
              key={i}
              className={`${activePanelStyle(
                st.sale_type
              )} py-3 rounded-lg text-center shadow-lg hover:bg-panel_active/75 
                cursor-pointer transition-all duration-200 ripple-button`}
              onClick={handlePanelClick}
            >
              <span className="">{st.sale_type}</span>
            </div>
          ))}
        </div>

        <UniqueCashiersTable />
      </div>

      <div className="w-[77%]">
        {chunkedSales.length > 0 ? (
          <div className="w-full ">
            <Carousel className="h-[260px]">
              {chunkedSales.map((_, i) => (
                <div key={i} className="grid grid-cols-3 gap-4 pb-4">
                  {chunkedSales[i].map((s, idx) => (
                    <div
                      key={idx}
                      className="bg-custom-white pb-4 rounded-lg shadow-lg ripple-button"
                      onClick={handleRipple}
                    >
                      <div className="text-center font-medium bg-blue-500 text-custom-white py-1 mb-2 rounded-t-lg flex px-4 justify-between">
                        <div>{s.store_name}</div>
                        <div>{s.sale_type}</div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="px-4">
                          <div className="opacity-0">t</div>
                          <div onClick={() => filterTransactions("sale_id")}>
                            Transactions
                          </div>
                          <div>Total Items</div>
                          <div>Cashiers</div>
                          <div>Total Dollars</div>
                          <div>Avg Dollars</div>
                          <div>Avg Quantity</div>
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
                          <div>{chunkedTrends[i][idx].transaction_count}</div>
                          <div>{chunkedTrends[i][idx].total_items}</div>
                          <div>{chunkedTrends[i][idx].cashier_count}</div>
                          <div>
                            {formatCurrency2(chunkedTrends[i][idx].amount)}
                          </div>
                          <div>
                            {formatCurrency2(
                              chunkedTrends[i][idx].average_dollars
                            )}
                          </div>
                          <div>
                            {chunkedTrends[i][idx].average_qty.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </Carousel>
          </div>
        ) : null}

        {loading ? (
          <div className="w-full h-64 relative">
            <LoadingIndicator
              className="text-sm"
              message={`Loading data for ${cashier.selectedSaleType}`}
            />
          </div>
        ) : null}

        <CashiersTable />
      </div>
    </div>
  );
};

export default Cashiers;
