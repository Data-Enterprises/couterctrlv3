import { AgGridReact } from "ag-grid-react";
import { useCashierCtx } from "..";
import {
  AllCommunityModule,
  ModuleRegistry,
  type CellClickedEvent,
} from "ag-grid-community";
import { colDefs, theme } from ".";
import {
  setExportModalOpen,
  setNoTransactions,
  setTransDrillDown,
  setTransModalOpen,
} from "../../../features/cashiersSlice";
import { getCashierTransaction } from "../../../api/lossPrevention";
import type { JsonError, TransactionListItem } from "../../../interfaces";
import { useToast } from "../../../components/toasts/hooks/useToast";

ModuleRegistry.registerModules([AllCommunityModule]);
const TransactionsView = () => {
  const ctx = useCashierCtx();
  const toast = useToast();

  const handleCellClicked = (event: CellClickedEvent) => {
    if (event.colDef.field === "sale_id") {
      const saleId = event.value;
      const saleDate = event.data.sale_date.split("T")[0];
      const storeid = event.data.storeid;
      ctx.dispatch(setTransDrillDown([]));
      ctx.dispatch(setTransModalOpen(true));
      getCashierTransaction(ctx.url, ctx.token, saleDate, saleId, storeid)
        .then((resp) => {
          const j = resp.data;
          if (j.error === 0 && j.transaction.length > 0) {
            ctx.dispatch(setTransDrillDown([j.transaction]));
          } else {
            ctx.dispatch(setNoTransactions(true));
          }
        })
        .catch((err: JsonError) => {
          ctx.dispatch(setTransModalOpen(false));
          toast.error("Error fetching transactions: " + err.message);
        });
    }
  };

  const handleShowAll = () => {
    const chunked: TransactionListItem[][] = [];
    let result: TransactionListItem[] = [];
    [...ctx.transList].forEach((item, i) => {
      // if starting a new chunk or every item shares the same sale_id
      if (
        result.length === 0 ||
        result.every((res) => res.sale_id === item.sale_id)
      ) {
        result.push(item);

        // if at the end, then push the final chunk otherwise, it gets left out
        if (i === ctx.transList.length - 1) {
          chunked.push(result);
        }
      } else {
        // if this new sale_id is different, push the current chunk and start a new one
        chunked.push(result);
        result = [];
        result.push(item);
      }
    });

    ctx.dispatch(setTransDrillDown(chunked));
    ctx.dispatch(setTransModalOpen(true));
  };

  return (
    <div
      className={`bg-custom-white h-full w-full space-y-2 p-2 rounded-lg shadow-lg`}
    >
      <div className="h-[94%]">
        <AgGridReact
          rowData={ctx.transList}
          columnDefs={colDefs}
          onCellClicked={handleCellClicked}
          theme={theme}
        />
      </div>
      <div className="flex gap-2">
        <button className="btn-themeGreen py-1" onClick={handleShowAll}>
          Show All
        </button>
        <button className="btn-themeGreen py-1" onClick={() => ctx.dispatch(setExportModalOpen(true))}>Export</button>
      </div>
    </div>
  );
};

export default TransactionsView;
