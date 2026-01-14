import { useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type {
  JsonError,
  ReceiverDetailsResponse,
  // ReceiverListItem,
} from "../../interfaces";
import { AgGridReact } from "ag-grid-react";
import { cols, theme } from ".";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { getReceiverDetails } from "../../api/receivers";
import {
  setIsFetchingDetails,
  setReceiverDetails,
  setTotals,
} from "../../features/receiversSlice";
import { formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
ModuleRegistry.registerModules([AllCommunityModule]);

const ReceiversListGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.receivers);
  const gridRef = useRef<AgGridReact>(null);

  // Use this for deselecting rows when details are cleared (like on refresh or new filter)
  useEffect(() => {
    // need another check probably to handle this when the Receiver list grid is filtered
    if (state.details.length === 0) {
      gridRef.current?.api.deselectAll();
    }
  }, [state.details, state.listGridData]);

  useEffect(() => {
    gridRef.current?.api.deselectAll();
    // maybe reset the details as well here?
  }, [state.listGridData]);

  const getSelectedDetails = (invoiceid: number, transDate: string) => {
    dispatch(setIsFetchingDetails(true));
    getReceiverDetails(url, token, state.storeid, invoiceid, transDate)
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error == 0) {
          dispatch(setReceiverDetails(j.records));
          dispatch(setTotals(j.totals));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingDetails(false)));
  };

  return (
    <div
      className={` ${
        state.list.length === 0 && !state.isFetchingList ? "hidden" : ""
      } ${
        state.isFetchingList ? "bg-transparent" : "bg-custom-white shadow-lg"
      } rounded-lg w-[60%] p-2`}
    >
      <div
        className={`${
          state.isFetchingList && "hidden"
        } text-sm font-medium pl-0.5`}
      >
        Select Receiver
      </div>
      <div className="h-[93%]">
        {!state.isFetchingList ? (
          <AgGridReact
            ref={gridRef}
            rowData={state.listGridData}
            columnDefs={cols}
            theme={theme}
            pagination={true}
            paginationAutoPageSize={true}
            onRowClicked={(params) => {
              if (params.data) {
                const invoiceDate = formatDate(params.data.invoice_date);
                getSelectedDetails(params.data.invoiceid, invoiceDate);
              }
            }}
            rowSelection="single"
          />
        ) : state.isFetchingList ? (
          <div className="relative w-full h-full">
            <LoadingIndicator />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ReceiversListGrid;
