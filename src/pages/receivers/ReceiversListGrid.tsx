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
    if (
      gridRef.current &&
      gridRef.current.api &&
      !state.details.length &&
      !state.transIDFilter &&
      !state.invoiceIdFilter &&
      !state.vendorIdFilter &&
      !state.vendorNameFilter
    ) {
      gridRef.current.api.deselectAll();
    }

    return () => {
      // Cleanup if needed when component unmounts
      if (
        gridRef.current &&
        gridRef.current.api &&
        state.details.length === 0
      ) {
        gridRef.current.api.deselectAll();
      }
    };
  }, [
    state.details,
    state.transIDFilter,
    state.invoiceIdFilter,
    state.vendorIdFilter,
    state.vendorNameFilter,
  ]);

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
    <>
      {!state.noReceivers ? (
        <div
          className={` ${
            state.list.length === 0 && !state.isFetchingList ? "hidden" : ""
          } ${
            state.isFetchingList
              ? "bg-transparent"
              : "bg-custom-white shadow-lg"
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
            ) : (
              <div className="relative w-full h-full">
                <LoadingIndicator />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-custom-white rounded-lg w-[60%] shadow-lg">
          No receivers found
        </div>
      )}
    </>
  );
};

export default ReceiversListGrid;
