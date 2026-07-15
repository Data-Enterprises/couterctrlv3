import { getReceiverDetails } from "../../../api/receivers";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { type ReducedVendor } from "../../../features/receiversSlice";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { useReceiversState } from "../hooks/useReceiversState";
import { useReceiversActions } from "../hooks/useReceiversActions";
import type { JsonError, ReceiverDetailsResponse } from "../../../interfaces";

import { ArrowPathIcon, DocumentCheckIcon } from "@heroicons/react/24/solid";

const VendorSelect = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token } = useAppSelector((state) => state.app);
  const state = useReceiversState();
  const actions = useReceiversActions();
  const { assignedStores } = useAppSelector((state) => state.user);

  const handleRefresh = () => {
    dispatch(actions.reQuery());
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
    trasnaction_num: string,
  ) => {
    const formattedDate = formatDate(date).split(", ")[1];
    dispatch(actions.setSelectedOperator({ cashier_name, cashier_number }));
    dispatch(actions.setIsFetchingDetails(true));
    dispatch(actions.setSelectedTransNum(trasnaction_num));
    dispatch(actions.setSelectedInvoice(invoiceid.toString()));
    getReceiverDetails(url, token, state.storeid, invoiceid, formattedDate)
      .then((resp) => {
        const j: ReceiverDetailsResponse = resp.data;
        if (j.error == 0) {
          dispatch(actions.setReceiverDetails(j.records));
          dispatch(actions.setTotals(j.totals));
          dispatch(actions.setRecMobileStage(3));
          dispatch(actions.setDetailsDate(formattedDate));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setIsFetchingDetails(false)));
  };

  const totalItems = state.selectedVendor
    ? state.selectedVendor.items
    : state.reducedVendors.reduce((acc, v) => acc + v.items, 0);
  const totalCashiers = state.selectedVendor
    ? state.selectedVendor.cashiers.length
    : state.reducedVendors.reduce((acc, v) => acc + v.cashiers.length, 0);
  const totalVendors = state.selectedVendor ? 1 : state.reducedVendors.length;

  const handleVendorSelect = (v: ReducedVendor) => {
    dispatch(actions.setSelectedVendor(v));
    dispatch(actions.setViewAllVendors(false));
    dispatch(actions.setVendorView(2));
  };

  const handleVendorsClick = () => {
    if (state.vendorView === 1) {
      dispatch(actions.setSelectedVendor(null));
      dispatch(actions.setViewAllVendors(true));
      dispatch(actions.setVendorView(2));
    } else {
      dispatch(actions.setSelectedVendor(null));
      dispatch(actions.setViewAllVendors(false));
      dispatch(actions.setVendorView(1));
    }
  };

  const storeName = assignedStores.find(
    (s) => s.storeid === state.storeid,
  )?.store_name;

  return (
    <div className="min-h-[calc(100vh-3rem)] max-h-[calc(100vh-3rem)] overflow-hidden text-[12px]">
      <div className="grid grid-cols-2 mb-3">
        <div
          className="bg-custom-white flex gap-2 justify-center items-center py-2 border-r border-content/15"
          onClick={handleRefresh}
        >
          <ArrowPathIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/85">Refresh</div>
        </div>
        <div
          className="bg-custom-white flex gap-2 justify-center items-center py-2"
          onClick={handleVendorsClick}
        >
          <DocumentCheckIcon className="w-6 h-6 transition-all duration-200" />
          <div className="text-content/85">
            {state.vendorView === 1 ? "Received" : "Vendors"}
          </div>
        </div>
      </div>
      <div className="bg-custom-white rounded-lg px-2 pb-2 mx-2 mb-3 shadow-md">
        <div className="flex justify-between font-medium text-[12px]">
          <div className="">
            {state.selectedVendor
              ? state.selectedVendor?.vendor_name
              : "All Vendors "}
          </div>
          <div className="">{storeName}</div>
        </div>
        <div className="grid grid-cols-2 h-[1.5px]">
          <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
          <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
        </div>

        <div className="grid grid-cols-3 gap-2 px-1 text-[12px] mt-2">
          <div className="flex flex-col py-1 leading-tight justify-center items-center rounded-md bg-slate-100 shadow-md">
            <div className="text-content/85">Vendors:</div>
            <div className="font-medium">{totalVendors}</div>
          </div>
          <div className="flex flex-col py-1 leading-tight justify-center items-center rounded-md bg-slate-100 shadow-md">
            <div className="text-content/85">Operators:</div>
            <div className="font-medium">{totalCashiers}</div>
          </div>
          <div className="flex flex-col py-1 leading-tight justify-center items-center rounded-md bg-slate-100 shadow-md">
            <div className="text-content/85">Items:</div>
            <div className="font-medium">{totalItems}</div>
          </div>
        </div>
      </div>
      {state.vendorView === 1 ? (
        <div className="bg-custom-white mx-2 px-2 mb-2 pt-2 pb-2 grid grid-cols-2 gap-2 max-h-[calc(100vh-12.3rem)] rounded-lg overflow-y-auto">
          {state.reducedVendors.map((v, i) => (
            <div
              key={i}
              className="bg-blue-200/50 rounded-lg shadow-md text-[11px] leading-tight"
              onClick={() => handleVendorSelect(v)}
            >
              <div className="font-medium rounded-t-lg px-2 py-0.5 flex justify-between">
                <div className="text-nowrap truncate">{v.vendor_name}</div>
                <div className="">{v.vendorid}</div>
              </div>
              <div className="grid grid-cols-2 h-[1.5px] text-[12px]">
                <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
                <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
              </div>
              <div className="px-2 py-1.5 grid grid-cols-2 gap-3 text-[10.5px]">
                <div className="py-1 flex flex-col justify-center items-center rounded-md bg-custom-white shadow-md">
                  <div>Items</div>
                  <div>{v.items}</div>
                </div>
                <div className="py-1 flex flex-col justify-center items-center rounded-md bg-custom-white shadow-md">
                  <div>Operators</div>
                  <div>{v.cashiers.length}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-custom-white grid grid-cols-2 gap-2 mx-2 px-2 pt-2 rounded-lg shadow-lg pb-2 text-[11px] max-h-[calc(100vh-12.3rem)] overflow-y-auto">
          {state.filteredListDataMobile.map((rec, i) => (
            <div
              key={i}
              className="bg-blue-200/50 rounded-lg shadow-md px-2 py-1"
              onClick={() =>
                handleTransactionSelect(
                  rec.invoice_date,
                  rec.invoiceid,
                  rec.cashier_name,
                  rec.cashier_number,
                  rec.reference_number,
                )
              }
            >
              <div className="font-medium">
                <div>{formatDate(rec.invoice_date)}</div>
              </div>
              <div className="grid grid-cols-2 h-[1.5px] text-[12px] mb-1">
                <div className="bg-gradient-to-r from-content/60 to-custom-white"></div>
                <div className="bg-gradient-to-l from-content/60 to-custom-white"></div>
              </div>
              <div className="bg-custom-white p-1 rounded-md shadow-md">
                <div className="flex justify-between leading-tight">
                  <div className="text-content/85">Trans #:</div>
                  <div>{rec.invoiceid}</div>
                </div>
                <div className="flex justify-between leading-tight">
                  <div className="text-content/85">Operator:</div>
                  <div>{rec.cashier_name}</div>
                </div>
                <div className="flex justify-between leading-tight">
                  <div className="text-content/85">Invoice:</div>
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
