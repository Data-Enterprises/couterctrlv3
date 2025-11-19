import { useState } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";

import {
  getCashierDetails,
  getSaleTypes,
  getCashierTransactions,
} from "../../api/cashiers";
import { formatGoliathDate, formatCurrency2, handleRipple } from "../../utils";
import {
  setSaleTypes,
  setCashierDetails,
  setCashierTrends,
  setCashierTransactions,
  setSelectedSaleTypes,
  setSelectedSaleType,
  setCashierTransDrillDown,
} from "../../features/cashierSlice";
import type {
  CashierDetails,
  CashierTransaction,
  CashierTrend,
  JsonError,
  TransDrillDown,
} from "../../interfaces";

// components
import DatePickers from "../../components/datePickers/DatePickers";
import StorePicker from "../../components/storePicker/StorePicker";
import Carousel from "../../components/Carousel";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import Modal from "../../components/Modal";

// For the table
import { AgGridReact } from "ag-grid-react";
import { colDefs, theme } from ".";
import type { CellClickedEvent } from "ag-grid-community";

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

  const [filteredItems, setFilteredItems] = useState<CashierTransaction[]>([]);
  const [cashiers, setCashiers] = useState<UniqueCashier[]>([]);

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

      setFilteredItems(filtered);
      /**
       * sum of total sales, number of occurrences, cashier name, cashir number
       */
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
      setCashiers(uniqueCashiers);
    } else if (option === "store_name") {
      //
    }
  };

  const onCellClicked = (e: CellClickedEvent) => {
    const col = e.column.getColId();
    if (col === "sale_id") {
      const saleId = e.value;
      const saleDate = e.data.sale_date.split("T")[0];
      const storeid = e.data.storeid;
      getCashierTransactions(
        context.url,
        context.token,
        saleDate,
        saleId,
        storeid
      )
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            dispatch(setCashierTransDrillDown(j.transaction));
          }
        })
        .catch((err: JsonError) =>
          toast.error("Error fetching transactions: " + err.message)
        )
        .finally(() => setIsModalOpen(true));
    }
  };

  const extractSaleId = (saleId: string) => {
    return saleId.split("-")[1];
  };

  const splitDate = (dateStr: string) => {
    return dateStr.split("T")[0] + " " + dateStr.split("T")[1];
  };

  const formatTime = (start: string, end: string) => {
    const str1 =
      start.slice(0, 2) + ":" + start.slice(2, 4) + ":" + start.slice(4);
    const str2 = end.slice(0, 2) + ":" + end.slice(2, 4) + ":" + end.slice(4);
    return str1 + " - " + str2;
  };

  const renderStamps = (item: TransDrillDown) => {
    const stamps = [];
    if (item.fs > 0) stamps.push("FS");
    if (item.fsa > 0) stamps.push("FSA");
    if (item.wic > 0) stamps.push("WIC");
    return stamps.join(" ");
  };

  return (
    <div
      data-testid="cashiers-page"
      className="w-full h-[calc(100vh-3rem)] p-4 flex gap-4"
    >
      <Modal
        isOpen={isModalOpen}
        modalClassName="bg-custom-white w-1/3"
        onClose={() => setIsModalOpen(false)}
      >
        {/* Header */}
        <div className="pb-2 border-b border-content">
          <div className="flex gap-1">
            <div className="font-medium">Store Name:</div>
            <div>{cashier.cashierTransDrillDown[0].store_name}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Sale ID:</div>
            <div>{extractSaleId(cashier.cashierTransDrillDown[0].sale_id)}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Date:</div>
            <div>{splitDate(cashier.cashierTransDrillDown[0].sale_date)}</div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Cashier:</div>
            <div>
              {cashier.cashierTransDrillDown[0].cashier_number}:
              {cashier.cashierTransDrillDown[0].cashier_name}
            </div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Time:</div>
            <div>
              {formatTime(
                cashier.cashierTransDrillDown[0].sale_start_time,
                cashier.cashierTransDrillDown[0].sale_end_time
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <div className="font-medium">Terminal:</div>
            <div>{cashier.cashierTransDrillDown[0].terminal}</div>
          </div>
        </div>

        <div>
          <div className="my-2 text-lg font-medium">Line Items</div>
          {/* Line Items */}
          {cashier.cashierTransDrillDown.map((item, i) => {
            return (
              <div
                key={i}
                className="grid grid-cols-[18%_40%_5%_10%_12%_1fr] gap-1 text-[13px] mt-1.5"
              >
                <div>{item.product_code}</div>
                <div>{item.product_description}</div>
                <div>0</div>
                <div>{item.net_sales}</div>
                <div>{renderStamps(item)}</div>
                <div>{item.sale_type}</div>
              </div>
            );
          })}
        </div>

        {/* Totals */}
        <div className="mt-2">
          <div className="flex gap-1">
            <div>Net Sales:</div>
            <div>
              {formatCurrency2(
                cashier.cashierTransDrillDown[
                  cashier.cashierTransDrillDown.length - 1
                ].net_sales
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <div>Total Sales:</div>
            <div>
              {formatCurrency2(
                cashier.cashierTransDrillDown[
                  cashier.cashierTransDrillDown.length - 1
                ].total_sales
              )}
            </div>
          </div>
        </div>
      </Modal>
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

        {/* This will be a table too */}
        <div className="bg-custom-white mt-4 px-4 py-2.5 rounded-lg shadow-lg">
          {cashiers.map((c, i) => (
            <div>
              <div className="flex justify-between font-medium mb-1" key={i}>
                <div>{c.cashier_name}</div>
                <div>{c.cashier_number}</div>
              </div>
              <div>Transactions: {c.transaction_count}</div>
              <div>Total Sales: {formatCurrency2(c.total_sales)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Shows the data */}
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

        <div className="w-full">
          <div style={{ height: 400 }}>
            <AgGridReact
              rowData={filteredItems}
              columnDefs={colDefs}
              theme={theme}
              // onRowClicked={(e: RowClickedEvent) => {
              //   console.log("Row clicked:", e.data);
              // }}
              onCellClicked={onCellClicked}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cashiers;
