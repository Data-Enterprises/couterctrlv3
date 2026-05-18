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
  setSelectedVendor,
  setTotals,
  setVendorView,
  setViewAllVendors,
  type ReducedVendor,
} from "../../../features/receiversSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import type { JsonError, ReceiverDetailsResponse } from "../../../interfaces";

import { ArrowPathIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";

const VendorSelect = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const state = useAppSelector((state) => state.receivers);

  const handleRefresh = () => {
    dispatch(reQuery());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dow = date.toLocaleDateString("en-US", { weekday: "short" });
    return `${dow}, ${date.toLocaleDateString()}`;
  };

  const handleTransactionSelect = (
    date: string,
    invoiceid: number,
    cashier_name: string,
    cashier_number: number,
  ) => {
    const formattedDate = formatDate(date).split(", ")[1];
    dispatch(setSelectedOperator({ cashier_name, cashier_number }));
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

  const totalItems = state.selectedVendor
    ? state.selectedVendor.items
    : state.reducedVendors.reduce((acc, v) => acc + v.items, 0);
  const totalCashiers = state.selectedVendor
    ? state.selectedVendor.cashiers.length
    : state.reducedVendors.reduce((acc, v) => acc + v.cashiers.length, 0);
  const totalVendors = state.selectedVendor ? 1 : state.reducedVendors.length;

  const handleVendorSelect = (v: ReducedVendor) => {
    dispatch(setSelectedVendor(v));
    dispatch(setViewAllVendors(false));
    dispatch(setVendorView(2));
  };

  const handleVendorsClick = () => {
    if (state.vendorView === 1) {
      dispatch(setSelectedVendor(null));
      dispatch(setViewAllVendors(true));
      dispatch(setVendorView(2));
    } else {
      dispatch(setSelectedVendor(null));
      dispatch(setViewAllVendors(false));
      dispatch(setVendorView(1));
    }
  };

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden text-[12px]">
      <div className="grid grid-cols-2 mb-3">
        <div
          className="bg-custom-white flex gap-2 justify-center items-center py-2 border-r border-content/15"
          onClick={handleRefresh}
        >
          <ArrowPathIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/60">Refresh</div>
        </div>
        <div
          className="bg-custom-white flex gap-2 justify-center items-center py-2"
          onClick={handleVendorsClick}
        >
          <DocumentCheckIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/60">{state.vendorView === 1 ? "Received" : "Vendors"}</div>
        </div>
      </div>
      <div className="bg-custom-white rounded-lg p-2 mx-2 mb-2 shadow-md">
        <div className="font-medium underline text-center">
          {state.selectedVendor
            ? state.selectedVendor?.vendor_name
            : "All Vendors "}
        </div>
        <div className="flex justify-between px-1 text-[12px]">
          <div className="flex gap-1">
            <div className="text-content/60">Vendors:</div>
            <div className="font-medium">{totalVendors}</div>
          </div>
          <div className="flex gap-1">
            <div className="text-content/60">Cashiers:</div>
            <div className="font-medium">{totalCashiers}</div>
          </div>
          <div className="flex gap-1">
            <div className="text-content/60">Items:</div>
            <div className="font-medium">{totalItems}</div>
          </div>
        </div>
      </div>
      {state.vendorView === 1 ? (
        <div className="px-2 pb-2 grid grid-cols-2 gap-2 max-h-[calc(100vh-10.5rem)] rounded-lg overflow-y-auto">
          {state.reducedVendors.map((v, i) => (
            <div
              key={i}
              className="bg-custom-white rounded-lg shadow-md text-[11px] leading-tight"
              onClick={() => handleVendorSelect(v)}
            >
              <div className="font-medium rounded-t-lg px-2 py-0.5 flex justify-between">
                <div className="text-nowrap truncate">{v.vendor_name}</div>
                <div className="">{v.vendorid}</div>
              </div>
              <div className="grid grid-cols-2 h-[1.5px]">
                <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
                <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
              </div>
              <div className="px-2 py-1.5 grid grid-cols-2 gap-3 text-[10.5px]">
                <div className="py-1 flex flex-col justify-center items-center rounded-md bg-slate-100 shadow-md">
                  <div>Items</div>
                  <div>{v.items}</div>
                </div>
                <div className="py-1 flex flex-col justify-center items-center rounded-md bg-slate-100 shadow-md">
                  <div>Operators</div>
                  <div>{v.cashiers.length}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2 p-2 text-sm max-h-[calc(100vh-11.1rem)] overflow-y-auto">
          {state.filteredListDataMobile.map((rec, i) => (
            <div
              key={i}
              className="bg-custom-white rounded-lg shadow-md p-2 flex justify-between"
              onClick={() =>
                handleTransactionSelect(
                  rec.invoice_date,
                  rec.invoiceid,
                  rec.cashier_name,
                  rec.cashier_number,
                )
              }
            >
              <div>
                <div className="flex gap-1">
                  <div className="font-medium underline">Date:</div>
                  <div>{formatDate(rec.invoice_date)}</div>
                </div>
                <div className="flex gap-1">
                  <div className="font-medium underline">Trans #:</div>
                  <div>{rec.invoiceid}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex gap-1">
                  <div className="font-medium underline">Operator:</div>
                  <div>{rec.cashier_name}</div>
                </div>
                <div className="flex gap-1 justify-end">
                  <div className="font-medium underline">Invoice:</div>
                  <div>{rec.reference_number}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorSelect;
