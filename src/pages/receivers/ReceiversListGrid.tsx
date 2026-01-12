import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import type {
  JsonError,
  ReceiverDetailsResponse,
  ReceiverListItem,
} from "../../interfaces";
import { AgGridReact } from "ag-grid-react";
import { cols, theme } from ".";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { getReceiverDetails } from "../../api/receivers";
import { setReceiverDetails, setTotals } from "../../features/receiversSlice";
import { formatDate } from "../../utils";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
ModuleRegistry.registerModules([AllCommunityModule]);

const ReceiversListGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.receivers);
  const [filtered, setFiltered] = useState<ReceiverListItem[]>([]);

  useEffect(() => {
    if (state.list.length === 0) return;

    if (state.filterListGrid) {
      const filteredData = state.list.filter((item) => {
        const idMatch = state.vendorIdFilter.toLowerCase();
        const nameMatch = state.vendorNameFilter.toLowerCase();
        const invoiceMatch = state.invoiceIdFilter;

        return (
          item.vendorid.toString().toLowerCase().includes(idMatch) &&
          item.vendor_name.toLowerCase().includes(nameMatch.toLowerCase()) &&
          item.reference_number.toString().includes(invoiceMatch)
        );
      });
      setFiltered(filteredData);
    } else {
      setFiltered(state.list);
    }
  }, [state.filterListGrid, state.list]);

  const getSelectedDetails = (invoiceid: number, transDate: string) => {
    getReceiverDetails(url, token, state.storeid, invoiceid, transDate)
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error == 0) {
          dispatch(setReceiverDetails(j.records));
          dispatch(setTotals(j.totals));
        }
      })
      .catch((err: JsonError) => toast.error(err.message));
  };

  return (
    <div
      className={` ${
        (filtered.length === 0 && "hidden")
      } bg-custom-white rounded-lg shadow-lg w-1/2 p-2`}
    >
      <div className="text-sm font-medium pl-0.5">Select Receiver</div>
      <div className="h-[90%]">
        {filtered.length ? (
          <AgGridReact
            rowData={filtered}
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
        ) : null}
      </div>
    </div>
  );
};

export default ReceiversListGrid;
