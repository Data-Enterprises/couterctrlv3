import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";
import type {
  ExceptionType,
  JsonError,
  TransactionListItem,
  TransactionOverview,
} from "../../../interfaces";
import {
  formatBigNumber,
  formatCurrency2,
  formatGoliathDate,
} from "../../../utils";
import {
  setDataView,
  setFetchingTransactions,
  setNoRowsFound,
  setSelectedSaleType,
  setTransactionLoadingMessage,
  setTransList,
  setTransOverviews,
} from "../../../features/cashiersSlice";

interface ExceptionInnerCardProps {
  type: ExceptionType;
  col2: number;
  col3: number;
  col4: number;
  col5: number;
  bgColor?: string;
  storeid: number;
  cashierNumber?: number;
}

const ExceptionRow = ({
  type,
  col2,
  col3,
  col4,
  col5,
  bgColor = "bg-custom-white",
  storeid,
  cashierNumber = 0,
}: ExceptionInnerCardProps) => {
  const ctx = useCashierCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();

  const handleTransactionCall = () => {
    dispatch(setTransList([]));
    dispatch(setTransactionLoadingMessage("Loading Cashiers..."));
    dispatch(setDataView("transactions"));
    dispatch(setNoRowsFound(false));
    dispatch(setSelectedSaleType(type));
    dispatch(setFetchingTransactions(true));
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);
    getCashierTable(ctx.url, ctx.token, start, end, 0, storeid, 1, [type], 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const allTrans = [...j.transactions].filter((t) =>
            cashierNumber === 0
              ? true
              : t.cashier_number === cashierNumber && t.sale_type === type,
          );
          // const trans = [...j.transactions].filter((t) =>
          //   cashierNumber === 0 ? true : t.cashier_number === cashierNumber,
          // );
          // const uniqueSaleIds = trans.map((t) => t.sale_id);
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) {
              pages.push({ page, fetched: false });
            }

            for (let page = 2; page <= j.total_pages; page++) {
              getCashierTable(
                ctx.url,
                ctx.token,
                start,
                end,
                0,
                storeid,
                1,
                [type],
                page,
              ).then((resp) => {
                const j = resp.data;
                if (j.error === 0) {
                  allTrans.push(
                    ...j.transactions.filter((t: any) =>
                      cashierNumber === 0
                        ? true
                        : t.cashier_number === cashierNumber &&
                          t.sale_type === type,
                    ),
                  );
                  pages.find((p) => p.page === page)!.fetched = true;

                  if (pages.every((p) => p.fetched)) {
                    const saleIds = Array.from(
                      new Set(allTrans.map((t) => t.sale_id)),
                    );
                    dispatch(
                      setTransactionLoadingMessage("Loading Transactions..."),
                    );
                    getTransactionList(ctx.url, ctx.token, saleIds, 1, type)
                      .then((resp) => {
                        const j = resp.data;
                        if (j.error === 0) {
                          if (!j.transactions.length) {
                            dispatch(setNoRowsFound(true));
                            return;
                          }
                          const formatted = [...j.transactions].map((item) => ({
                            ...item,
                            transaction_id: item.sale_id.split("-")[1],
                          }));
                          const filtered = formatted.filter((trans) => {
                            return cashierNumber
                              ? trans.cashier_number === cashierNumber &&
                                  trans.sale_type === type
                              : trans.sale_type === type;
                          });

                          const overviews: TransactionOverview[] = [
                            ...formatted,
                          ].reduce(
                            (
                              acc: TransactionOverview[],
                              curr: TransactionListItem,
                            ) => {
                              const found = acc.find(
                                (item) =>
                                  item.transaction_id === curr.transaction_id,
                              );

                              if (!found) {
                                acc.push({
                                  transaction_id: curr.transaction_id,
                                  sale_date: curr.sale_date,
                                  sale_type: curr.sale_type,
                                  store_number: curr.store_number,
                                  cashier_name: curr.cashier_name,
                                  cashier_number: curr.cashier_number,
                                  qty: curr.qty ? curr.qty : 0,
                                  total_sales: curr.net_sales,
                                  sale_id: curr.sale_id,
                                  storeid: curr.storeid,
                                });
                              } else {
                                found.qty += curr.qty ? curr.qty : 0;
                                found.total_sales += curr.net_sales;
                              }
                              return acc;
                            },
                            [],
                          );
                          dispatch(setTransList(filtered));
                          dispatch(setTransOverviews(overviews));
                        }
                      })
                      .catch((err: JsonError) => toast.error(err.message))
                      .finally(() => {
                        dispatch(setFetchingTransactions(false));
                        dispatch(setTransactionLoadingMessage("Loading Cashiers..."));
                      });
                  }
                }
              });
            }
          } else {
            const saleIds = Array.from(new Set(allTrans.map((t) => t.sale_id)));
            dispatch(setTransactionLoadingMessage("Loading Transactions..."));
            getTransactionList(ctx.url, ctx.token, saleIds, 1, type)
              .then((resp) => {
                const j = resp.data;
                if (j.error === 0) {
                  if (!j.transactions.length) {
                    dispatch(setNoRowsFound(true));
                    return;
                  }
                  const formatted = [...j.transactions].map((item) => ({
                    ...item,
                    transaction_id: item.sale_id.split("-")[1],
                  }));
                  const filtered = formatted.filter((trans) => {
                    return cashierNumber
                      ? trans.cashier_number === cashierNumber &&
                          trans.sale_type === type
                      : trans.sale_type === type;
                  });

                  const overviews: TransactionOverview[] = [
                    ...formatted,
                  ].reduce(
                    (acc: TransactionOverview[], curr: TransactionListItem) => {
                      const found = acc.find(
                        (item) => item.transaction_id === curr.transaction_id,
                      );

                      if (!found) {
                        acc.push({
                          transaction_id: curr.transaction_id,
                          sale_date: curr.sale_date,
                          sale_type: curr.sale_type,
                          store_number: curr.store_number,
                          cashier_name: curr.cashier_name,
                          cashier_number: curr.cashier_number,
                          qty: curr.qty ? curr.qty : 0,
                          total_sales: curr.total_sales,
                          sale_id: curr.sale_id,
                          storeid: curr.storeid,
                        });
                      } else {
                        found.qty += curr.qty ? curr.qty : 0;
                        found.total_sales += curr.total_sales;
                      }
                      return acc;
                    },
                    [],
                  );
                  dispatch(setTransList(filtered));
                  dispatch(setTransOverviews(overviews));
                }
              })
              .catch((err: JsonError) => toast.error(err.message))
              .finally(() => {
                dispatch(setFetchingTransactions(false));
                dispatch(setTransactionLoadingMessage("Loading Cashiers..."));
              })
          }
        } else {
          dispatch(setNoRowsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
  };

  return (
    <div
      className={`grid grid-cols-[26%_24%_18%_15%_19%] text-[12px] py-0.5 ${bgColor} hover:bg-orange-200 transtion-all duration-200 cursor-pointer`}
      onClick={handleTransactionCall}
    >
      <div className="font-medium text-content/60">{type}</div>
      <div className="font-medium">{formatCurrency2(col2)}</div>
      <div className="font-medium">{formatBigNumber(col3, 0)}</div>
      <div className="font-medium">{formatBigNumber(col4, 0)}</div>
      <div className="font-medium">{formatBigNumber(col5, 2)}%</div>
    </div>
  );
};

export default ExceptionRow;
