import { getReceiverDetails } from "../../../api/receivers";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  reQuery,
  setDetailsDate,
  setIsFetchingDetails,
  setReceiverDetails,
  setRecMobileStage,
  setSelectedInvoice,
  setSelectedOperator,
  setTotals,
} from "../../../features/receiversSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, ReceiverDetailsResponse } from "../../../interfaces";
import SingleSelect from "../../../components/SingleSelect";

const ReceiverSelect = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.receivers);

  const handleRefresh = () => {
    dispatch(reQuery());
  };

  const handleOperatorSelect = (cashId: string | number) => {
    const operator = state.operatorsList.find(
      (o) => o.cashier_number.toString() === cashId.toString(),
    );
    if (operator) {
      dispatch(setSelectedOperator(operator));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dow = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${dow}, ${date.toLocaleDateString()}`;
  };

  const handleTransactionSelect = (date: string, invoiceid: number) => {
    const formattedDate = formatDate(date).split(", ")[1];
    dispatch(setIsFetchingDetails(true));
    dispatch(setSelectedInvoice(invoiceid.toString()));
    getReceiverDetails(url, token, state.storeid, invoiceid, formattedDate)
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error == 0) {
          dispatch(setReceiverDetails(j.records));
          dispatch(setTotals(j.totals));
          dispatch(setRecMobileStage(3));
          dispatch(setDetailsDate(formattedDate));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingDetails(false)));
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-y-auto">
      <div className="grid p-2">
        <button className="btn-themeBlue px-0" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
      <div className="px-2 pb-2">
        <SingleSelect
          label="Select Receiver"
          data={state.operatorsList}
          displayKey="cashier_name"
          valueKey="cashier_number"
          onSelect={handleOperatorSelect}
        />
      </div>
      <div className="flex flex-col gap-2 p-2 text-sm max-h-[calc(100vh-11.1rem)] overflow-y-auto">
        {state.filteredListDataMobile.map((rec, i) => (
          <div
            key={i}
            className="bg-custom-white rounded-lg shadow-md p-2 flex justify-between"
            onClick={() =>
              handleTransactionSelect(rec.invoice_date, rec.invoiceid)
            }
          >
            <div>
              <div className="flex gap-1">
                <div className="font-medium underline">Date:</div>
                <div>{formatDate(rec.invoice_date)}</div>
              </div>
              <div className="flex gap-1">
                <div className="font-medium underline">Vendor:</div>
                <div>{rec.vendor_name}</div>
              </div>
            </div>
            <div className="text-right">
              {/* rec.invoideid => used for the details endpoint */}
              <div className="flex gap-1 justify-end">
                <div className="font-medium underline">Trans:</div>
                <div>{rec.invoiceid}</div>
              </div>
              <div className="flex gap-1 justify-end">
                <div className="font-medium underline">Invoice:</div>
                <div>{rec.reference_number}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReceiverSelect;
