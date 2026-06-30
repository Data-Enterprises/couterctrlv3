import { useAppSelector, useAppDispatch } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getReceiversList } from "../../api/receivers";
import type { JsonError, ReceiverListResponse } from "../../interfaces";
import {
  reQuery,
  resetReceiverSlice,
  setIsFetchingList,
  setListGridData,
  setNoReceivers,
  setReceiverDetails,
  setReceiversList,
  setRecMobileStage,
  setReducedVendors,
  setStoreId,
  type ReducedVendor,
} from "../../features/receiversSlice";

import DatePickers from "../../components/datePickers/DatePickers";
import SingleSelect from "../../components/SingleSelect";
import ReceiverListPanel from "./ReceiverListPanel";
import ReceiverDetailPanel from "./ReceiverDetailPanel";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { useEffect, useState } from "react";
import ReceiversMobileView from "./mobile/ReceiversMobileView";
import ReceiversTablet from "./tablet/ReceiversTablet";

const Receivers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const state = useAppSelector((state) => state.receivers);
  const { url, token, isMobile, isTablet } = useAppSelector((state) => state.app);
  const { assignedStores } = useAppSelector((state) => state.user);
  const { startDate, endDate } = useAppSelector((state) => state.search);
  useEffect(() => {
    if (state.listGridData.length === 0) {
      dispatch(setReceiverDetails([]));
    }
  }, [state.listGridData]);

  const getReceivers = () => {
    if (!state.storeid) {
      toast.warn("Please select a store");
      return;
    }
    dispatch(reQuery());
    dispatch(setIsFetchingList(true));
    getReceiversList(url, token, state.storeid, startDate, endDate)
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error == 0 && j.recievers.length > 0) {
          dispatch(setReceiversList(j.recievers));
          dispatch(setListGridData(j.recievers));

          if (isMobile) {
            dispatch(setRecMobileStage(2));
            const reducedVendors: ReducedVendor[] = [...j.recievers].reduce(
              (acc: ReducedVendor[], curr) => {
                const found = acc.find((o) => o.vendorid === curr.vendorid);
                if (!found) {
                  acc.push({
                    vendorid: curr.vendorid,
                    vendor_name: curr.vendor_name,
                    items: curr.items,
                    cashiers: [curr.cashier_number],
                    store_number: curr.store_number,
                  });
                } else {
                  found.items += curr.items;
                  if (!found.cashiers.includes(curr.cashier_number)) {
                    found.cashiers.push(curr.cashier_number);
                  }
                }
                return acc;
              },
              [],
            );
            dispatch(setReducedVendors(reducedVendors));
          }
        } else {
          dispatch(setNoReceivers(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingList(false)));
  };

  const setSelectedStore = (storeid: string | number) => {
    dispatch(setStoreId(storeid as number));
  };

  if (isMobile) {
    return (
      <ReceiversMobileView
        getReceivers={getReceivers}
        setSelectedStore={setSelectedStore}
      />
    );
  }

  if (isTablet) {
    return <ReceiversTablet getData={getReceivers} />;
  }


  // Loading
  if (state.isFetchingList) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">

        <LoadingIndicator message="Loading receivers" />
      </div>
    );
  }

  // No results
  if (state.noReceivers) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center">

        <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-content">No receivers found</h2>
            <p className="text-[12px] text-content/50 mt-1">
              No receiving records matched the selected store and date range.
            </p>
          </div>
          <button
            onClick={() => dispatch(resetReceiverSlice())}
            className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors"
          >
            Search again
          </button>
        </div>
      </div>
    );
  }

  // Initial search card
  if (state.list.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">

        <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-content">Receivers</h2>
            <p className="text-[12px] text-content/50 mt-1">
              Select a store and date range to load receiving history.
            </p>
          </div>
          <SingleSelect
            label="Select Store"
            data={assignedStores}
            displayKey="store_name"
            valueKey="storeid"
            onSelect={setSelectedStore}
            innerClass="text-[13px] py-1"
          />
          <DatePickers showBtn={false} handleQuery={getReceivers} />
          <button
            onClick={getReceivers}
            className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none"
          >
            Load Receivers
          </button>
        </div>
      </div>
    );
  }

  // Two-panel layout
  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4 bg-custom-white rounded-2xl shadow-xl p-6 flex flex-col gap-3" onClick={(e) => e.stopPropagation()}>
            <div>
              <h2 className="text-base font-semibold text-content">Receivers</h2>
              <p className="text-[12px] text-content/50 mt-1">Select a store and date range to load receiving history.</p>
            </div>
            <SingleSelect
              label="Select Store"
              data={assignedStores}
              displayKey="store_name"
              valueKey="storeid"
              onSelect={setSelectedStore}
              innerClass="text-[13px] py-1"
            />
            <DatePickers showBtn={false} handleQuery={() => { setSearchModalOpen(false); getReceivers(); }} />
            <button
              onClick={() => { setSearchModalOpen(false); getReceivers(); }}
              className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none"
            >
              Load Receivers
            </button>
          </div>
        </div>
      )}
      <ReceiverListPanel onOpenSearch={() => setSearchModalOpen(true)} />
      <ReceiverDetailPanel />
    </div>
  );
};

export default Receivers;
