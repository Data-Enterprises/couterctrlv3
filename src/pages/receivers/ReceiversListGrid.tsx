import { useRef, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type { JsonError, ReceiverDetailsResponse } from "../../interfaces";
import { AgGridReact } from "ag-grid-react";
import { cols, theme } from ".";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { getReceiverDetails } from "../../api/receivers";
import {
  setIsFetchingDetails,
  setReceiverDetails,
  setSelectedInvoice,
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

  // Deselect rows when details are cleared => From refresh or filter reset
  useEffect(() => {
    if (gridRef.current && gridRef.current.api && state.details.length === 0) {
      gridRef.current.api.deselectAll();
    }
  }, [state.details]);

  const handleGridReady = () => {
    if (
      gridRef.current &&
      gridRef.current.api &&
      state.details.length &&
      state.selectedInvoice
    ) {
      gridRef.current.api.forEachNode((node) => {
        if (
          node.data &&
          node.data.invoiceid.toString() === state.selectedInvoice
        ) {
          node.setSelected(true); // set the row to selected

          // Using setTimeout to ensure the grid finishes rendering the pages before finding the selected row
          setTimeout(() => {
            if (gridRef.current && gridRef.current.api) {
              const api = gridRef.current.api;
              const pageSize = api.paginationGetPageSize();
              const rowIndex = node.rowIndex!;
              const pageNumber = Math.floor(rowIndex / pageSize);
              api.paginationGoToPage(pageNumber);
            }
          }, 100);
        }
      });
    }
  };

  const getSelectedDetails = (invoiceid: number, transDate: string) => {
    dispatch(setIsFetchingDetails(true));
    dispatch(setSelectedInvoice(invoiceid.toString()));
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
                data-testid="receivers-list-grid"
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
                onGridReady={handleGridReady}
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
