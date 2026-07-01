import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import type { JsonError, ReceiverDetailsResponse } from "../../../interfaces";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { getReceiverDetails } from "../../../api/receivers";
import { useReceiversState } from "../hooks/useReceiversState";
import { useReceiversActions } from "../hooks/useReceiversActions";
import { formatDate } from "../../../utils";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
ModuleRegistry.registerModules([AllCommunityModule]);

const ReceiversGrid = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const state = useReceiversState();
  const actions = useReceiversActions();

  const getSelectedDetails = (invoiceid: number, transDate: string) => {
    dispatch(actions.setIsFetchingDetails(true));
    dispatch(actions.setSelectedInvoice(invoiceid.toString()));
    getReceiverDetails(url, token, state.storeid, invoiceid, transDate)
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error == 0) {
          dispatch(actions.setReceiverDetails(j.records));
          dispatch(actions.setTotals(j.totals));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setIsFetchingDetails(false)));
  };

  return (
    <>
      {!state.noReceivers ? (
        <div
          className={`${
            state.list.length === 0 && !state.isFetchingList ? "hidden" : ""
          } ${
            state.isFetchingList
              ? "bg-transparent"
              : "bg-custom-white shadow-lg"
          } rounded-lg p-3`}
        >
          <div
            className={`${
              state.isFetchingList && "hidden"
            } text-sm font-semibold pl-1 pt-1 pb-1`}
          >
            Select Receiver ({state.listGridData.length})
          </div>
          <div className="text-[13px]">
            {/* Tablet-optimized 8-column grid */}
            <div className="grid grid-cols-[10%_10%_10%_10%_17%_16%_9%_18%] font-semibold bg-bkg rounded">
              <div className="px-2 py-2">Date</div>
              <div className="px-2 py-2 text-right">Store</div>
              <div className="px-2 py-2">Trans</div>
              <div className="px-2 py-2">Ven ID</div>
              <div className="px-2 py-2">Ven Name</div>
              <div className="px-2 py-2">Invoice</div>
              <div className="px-2 py-2 text-right">Items</div>
              <div className="px-2 py-2">Operator</div>
            </div>
            {!state.isFetchingList ? (
              <div className="max-h-[40.5vh] overflow-y-auto">
                {state.listGridData.map((rec, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[10%_10%_10%_10%_17%_16%_9%_18%] hover:bg-gray-100 active:bg-gray-200"
                    onClick={() =>
                      getSelectedDetails(
                        rec.invoiceid,
                        formatDate(rec.invoice_date),
                      )
                    }
                  >
                    <div className="px-2 py-1.5 border-b border-gray-100">
                      {formatDate(rec.invoice_date)}
                    </div>
                    <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                      {rec.store_number}
                    </div>
                    <div className="px-2 py-1.5 border-b border-gray-100">
                      {rec.invoiceid}
                    </div>
                    <div className="px-2 py-1.5 border-b border-gray-100">
                      {rec.vendorid}
                    </div>
                    <div
                      className="px-2 py-1.5 border-b border-gray-100 truncate"
                      title={rec.vendor_name}
                    >
                      {rec.vendor_name}
                    </div>
                    <div className="px-2 py-1.5 border-b border-gray-100">
                      {rec.reference_number}
                    </div>
                    <div className="px-2 py-1.5 border-b border-gray-100 text-right">
                      {rec.items}
                    </div>
                    <div className="px-2 py-1.5 border-b border-gray-100">
                      {rec.cashier_name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="relative w-full h-[40.5vh]">
                <LoadingIndicator />
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center bg-custom-white rounded-lg w-[60%] shadow-lg text-base">
          No receivers found
        </div>
      )}
    </>
  );
};

export default ReceiversGrid;
