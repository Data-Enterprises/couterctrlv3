import { useCouponContext } from ".";
import { useAppDispatch } from "../../hooks";
import { cols, theme } from ".";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type RowClickedEvent,
} from "ag-grid-community";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCashierTransaction } from "../../api/lossPrevention";
import {
  setTransactionDrillDown,
  setTransModalOpen,
} from "../../features/lossPreventionSlice";
import type { JsonError, TransactionListItem } from "../../interfaces";
ModuleRegistry.registerModules([AllCommunityModule]);

const CouponsGrid = () => {
  const context = useCouponContext();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const onRowClicked = (e: RowClickedEvent) => {
    const saleId = e.data.sale_id;
    const saleDate = e.data.sale_date.split("T")[0];
    const storeid = e.data.storeid;

    const term = context.coupons.find((c) => c.sale_id === saleId)!.terminal;
    const splitDate = saleDate.split("-");
    const joinedSaleId = `${storeid}-${saleId}-${term}-${parseInt(splitDate[1])}-${parseInt(splitDate[2])}-${splitDate[0]}`;

    dispatch(setTransactionDrillDown([]));
    dispatch(setTransModalOpen(true));
    getCashierTransaction(
      context.url,
      context.token,
      saleDate,
      joinedSaleId,
      storeid,
    )
      .then((resp) => {
        const j = resp.data;
        if (j.error === 0) {
          const transactions: TransactionListItem[] = [...j.transaction].map(
            (item) => ({
              ...item,
              transaction_id: item.sale_id.split("-")[1],
              qty: item.qty ? item.qty : 0,
            }),
          );
          const reducedTransactions: TransactionListItem[] =
            transactions.reduce((acc: TransactionListItem[], curr) => {
              const found = acc.find(
                (item) =>
                  item.storeid === curr.storeid &&
                  item.sale_type === curr.sale_type &&
                  item.product_code === curr.product_code &&
                  item.product_description === curr.product_description,
              );
              if (found) {
                found.qty! += curr.qty!;
                found.total_sales += curr.total_sales;
                found.net_sales += curr.net_sales;
              } else {
                acc.push({ ...curr, qty: curr.qty });
              }
              return acc;
            }, []);
          dispatch(setTransactionDrillDown([reducedTransactions]));
        }
      })
      .catch((err: JsonError) => {
        dispatch(setTransModalOpen(false));
        toast.error("Error fetching transactions: " + err.message);
      });
  };

  return (
    <div className={`bg-custom-white w-full h-[87%] rounded-lg shadow-lg p-2`}>
      <AgGridReact
        rowData={context.gridCoupons}
        columnDefs={cols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
        onRowClicked={onRowClicked}
      />
    </div>
  );
};

export default CouponsGrid;
