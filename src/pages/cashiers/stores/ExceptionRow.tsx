import { useCashierCtx } from "..";
import { useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  getCashierTable,
  getTransactionList,
} from "../../../api/lossPrevention";
import type { ExceptionType, JsonError, TransactionListItem, TransactionOverview } from "../../../interfaces";
import { formatBigNumber, formatCurrency2, formatGoliathDate } from "../../../utils";
import { useCashiersActions } from "../hooks/useCashiersActions";

interface Props {
  type: ExceptionType;
  col2: number;
  col3: number;
  col4: number;
  col5: number;
  storeid: number;
  cashierNumber?: number;
  striped?: boolean;
}

const ExceptionRow = ({ type, col2, col3, col4, col5, storeid, cashierNumber = 0, striped = false }: Props) => {
  const ctx = useCashierCtx();
  const toast = useToast();
  const dispatch = useAppDispatch();
  const actions = useCashiersActions();

  const handleTransactionCall = () => {
    dispatch(actions.setTransList([]));
    dispatch(actions.setTransactionLoadingMessage("Loading cashiers…"));
    dispatch(actions.setDataView("transactions"));
    dispatch(actions.setNoRowsFound(false));
    dispatch(actions.setSelectedSaleType(type));
    dispatch(actions.setFetchingTransactions(true));

    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    const processTransactions = (allTrans: any[]) => {
      const saleIds = Array.from(new Set(allTrans.map((t) => t.sale_id)));
      dispatch(actions.setTransactionLoadingMessage("Loading transactions…"));
      getTransactionList(ctx.url, ctx.token, saleIds, 1, type)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0) {
            if (!j.transactions.length) { dispatch(actions.setNoRowsFound(true)); return; }
            const formatted = [...j.transactions].map((item) => ({
              ...item,
              transaction_id: item.sale_id.split("-")[1],
            }));
            const filtered = formatted.filter((trans: TransactionListItem) =>
              cashierNumber ? trans.cashier_number === cashierNumber && trans.sale_type === type : trans.sale_type === type
            );
            const overviews: TransactionOverview[] = formatted.reduce((acc: TransactionOverview[], curr: TransactionListItem) => {
              const found = acc.find((item) => item.transaction_id === curr.transaction_id);
              if (!found) {
                acc.push({
                  transaction_id: curr.transaction_id,
                  sale_date: curr.sale_date,
                  sale_type: curr.sale_type,
                  store_number: curr.store_number,
                  cashier_name: curr.cashier_name,
                  cashier_number: curr.cashier_number,
                  qty: curr.qty ?? 0,
                  total_sales: curr.total_sales,
                  sale_id: curr.sale_id,
                  storeid: curr.storeid,
                });
              } else {
                found.qty += curr.qty ?? 0;
                found.total_sales += curr.total_sales;
              }
              return acc;
            }, []);
            dispatch(actions.setTransList(filtered));
            dispatch(actions.setTransOverviews(overviews));
          }
        })
        .catch((err: JsonError) => toast.error(err.message))
        .finally(() => {
          dispatch(actions.setFetchingTransactions(false));
          dispatch(actions.setTransactionLoadingMessage(""));
        });
    };

    getCashierTable(ctx.url, ctx.token, start, end, 0, storeid, 1, [type], 1)
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const allTrans = [...j.transactions].filter((t) =>
            cashierNumber === 0 ? true : t.cashier_number === cashierNumber && t.sale_type === type
          );
          if (j.total_pages > 1) {
            const pages: { page: number; fetched: boolean }[] = [];
            for (let page = 2; page <= j.total_pages; page++) pages.push({ page, fetched: false });
            for (let page = 2; page <= j.total_pages; page++) {
              getCashierTable(ctx.url, ctx.token, start, end, 0, storeid, 1, [type], page)
                .then((resp) => {
                  const j = resp.data;
                  if (j.error === 0) {
                    allTrans.push(...j.transactions.filter((t: any) =>
                      cashierNumber === 0 ? true : t.cashier_number === cashierNumber && t.sale_type === type
                    ));
                    pages.find((p) => p.page === page)!.fetched = true;
                    if (pages.every((p) => p.fetched)) processTransactions(allTrans);
                  }
                });
            }
          } else {
            processTransactions(allTrans);
          }
        } else {
          dispatch(actions.setNoRowsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  const isNoSale = type === "No Sale";

  return (
    <div
      className="grid px-4 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
      style={{ gridTemplateColumns: "1.5fr 1fr 0.7fr 0.7fr 0.7fr", background: striped ? "rgba(30,42,74,0.015)" : undefined }}
      onClick={handleTransactionCall}
    >
      <div className="text-[10px] text-content">{type}</div>
      <div className="text-[10px] text-right font-medium" style={{ color: isNoSale ? "rgba(30,42,74,0.4)" : "#1e2a4a", textDecoration: isNoSale ? "none" : "underline", textUnderlineOffset: 2 }}>
        {isNoSale ? "—" : formatCurrency2(col2)}
      </div>
      <div className="text-[10px] text-content/65 text-right">{formatBigNumber(col3, 0)}</div>
      <div className="text-[10px] text-content/65 text-right">{formatBigNumber(col4, 0)}</div>
      <div className="text-[10px] text-content/65 text-right">{formatBigNumber(col5, 2)}%</div>
    </div>
  );
};

export default ExceptionRow;
