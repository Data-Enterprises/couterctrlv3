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
import { formatCurrency2 } from "../../utils";
import { formatDate } from "../sales/tracker";
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

  // if (context.isTablet) {
  //   return (
  //     <div className="bg-custom-white p-2 rounded-xl shadow-lg">
  //       <div className="grid grid-cols-8 font-medium border-b border-content/60">
  //         <div>Store</div>
  //         <div>Date</div>
  //         <div>Trans</div>
  //         <div>Cpm Amt</div>
  //         <div>UPC</div>
  //         <div>Cashier</div>
  //         <div>Customer ID</div>
  //         <div>Sub Dept</div>
  //       </div>
  //       <div className="max-h-[85vh] overflow-y-auto">
  //         {context.gridCoupons.map((c, i) => (
  //           <div
  //             key={i}
  //             className="grid grid-cols-8 border-b last:border-0 py-1"
  //           >
  //             <div>{c.store_name}</div>
  //             <div>{formatDate(c.sale_date)}</div>
  //             <div>{c.sale_id}</div>
  //             <div className="text-right">{formatCurrency2(c.coupon_amount)}</div>
  //             <div>{c.product_code}</div>
  //             <div>{c.cashier_name}</div>
  //             <div>{c.customer_id}</div>
  //             <div className="text-right">{c.sub_department}</div>
  //           </div>
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }

  if (context.isTablet) {
    return (
      <div className="bg-custom-white p-2 rounded-xl shadow-lg h-[92%] flex flex-col">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_0.5fr_1.2fr_1fr_1.2fr_0.8fr] gap-2 px-2 pb-1.5 font-semibold border-b border-content/60 sticky top-0 bg-custom-white z-10">
          <div>Store</div>
          <div>Date</div>
          <div>Trans</div>
          <div className="text-right pr-1">Cpn $</div>
          <div>UPC</div>
          <div>Cashier</div>
          <div>Customer ID</div>
          <div className="text-right">Sub Dept</div>
        </div>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {context.gridCoupons.map((c, i) => (
            <div
              key={i}
              className="grid grid-cols-[1.3fr_1fr_1fr_0.5fr_1.3fr_1.1fr_1.3fr_0.7fr] gap-2 px-2 py-2 text-[13.5px] border-b border-content/20"
            >
              <div className="truncate">{c.store_name}</div>
              <div className="truncate">{formatDate(c.sale_date)}</div>
              <div className="truncate">{c.sale_id}</div>
              <div className="text-right tabular-nums pr-1">
                {formatCurrency2(c.coupon_amount)}
              </div>
              <div className="truncate">{c.product_code ? c.product_code.split(".")[0] : ""}</div>
              <div className="truncate">{c.cashier_name}</div>
              <div className="truncate">{c.customer_id ? c.customer_id.split(".")[0] : "No Customer"}</div>
              <div className="truncate text-right">{c.sub_department}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

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
