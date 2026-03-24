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
import type { JsonError } from "../../interfaces";
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
          dispatch(setTransactionDrillDown([j.transaction]));
        }
      })
      .catch((err: JsonError) => {
        dispatch(setTransModalOpen(false));
        toast.error("Error fetching transactions: " + err.message);
      });
  };

  return (
    <div className={`bg-custom-white w-full h-[90%] rounded-lg shadow-lg p-2`}>
      <AgGridReact
        rowData={context.gridCoupons}
        columnDefs={cols}
        theme={theme}
        pagination={true}
        paginationAutoPageSize={true}
        onRowClicked={onRowClicked}
        // rowSelection="single" // => this may need to come back in but for now we just want to open the modal on row click
      />
    </div>
  );
};

export default CouponsGrid;
