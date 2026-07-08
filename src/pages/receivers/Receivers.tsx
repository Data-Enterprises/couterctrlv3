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
import SingleStoreSearchCard from "../../components/SingleStoreSearchCard";
import ReceiverListPanel from "./ReceiverListPanel";
import ReceiverDetailPanel from "./ReceiverDetailPanel";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import { useEffect, useState } from "react";
import ReceiversMobileView from "./mobile/ReceiversMobileView";
import ReceiversMobileDev from "./mobile/devMobile";
import ReceiversTablet from "./tablet/ReceiversTablet";

const Receivers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const state = useAppSelector((state) => state.receivers);
  const { url, token, isMobile, isTablet, devMode } = useAppSelector((state) => state.app);
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
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load receivers");
        } else if (j.recievers.length > 0) {
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
          toast.warn("No receivers came back for this search.");
          dispatch(setNoReceivers(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetchingList(false)));
  };

  const setSelectedStore = (id: number) => {
    dispatch(setStoreId(id));
  };

  if (isMobile && devMode) return <ReceiversMobileDev />;

  if (isMobile) {
    return (
      <ReceiversMobileView
        getReceivers={getReceivers}
        setSelectedStore={(id) => setSelectedStore(id as number)}
      />
    );
  }

  if (isTablet) {
    return <ReceiversTablet getData={getReceivers} />;
  }

  if (state.isFetchingList) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading receivers" />
      </div>
    );
  }

  if (state.noReceivers) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <SingleStoreSearchCard
          title="No receivers found"
          description="No receiving records matched the selected store and date range."
          buttonLabel="Search again"
          stores={assignedStores}
          selectedStoreId={state.storeid}
          onStoreSelect={setSelectedStore}
          onSearch={() => { dispatch(resetReceiverSlice()); }}
          datePicker={<DatePickers showBtn={false} handleQuery={getReceivers} />}
        />
      </div>
    );
  }

  if (state.list.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <SingleStoreSearchCard
          title="Receivers"
          description="Select a store and date range to load receiving history."
          buttonLabel="Load Receivers"
          stores={assignedStores}
          selectedStoreId={state.storeid}
          onStoreSelect={setSelectedStore}
          onSearch={getReceivers}
          datePicker={<DatePickers showBtn={false} handleQuery={getReceivers} />}
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="mx-4" onClick={(e) => e.stopPropagation()}>
            <SingleStoreSearchCard
              title="Receivers"
              description="Select a store and date range to load receiving history."
              buttonLabel="Load Receivers"
              stores={assignedStores}
              selectedStoreId={state.storeid}
              onStoreSelect={setSelectedStore}
              onSearch={() => { setSearchModalOpen(false); getReceivers(); }}
              datePicker={<DatePickers showBtn={false} handleQuery={() => { setSearchModalOpen(false); getReceivers(); }} />}
            />
          </div>
        </div>
      )}
      <ReceiverListPanel onOpenSearch={() => setSearchModalOpen(true)} />
      <ReceiverDetailPanel />
    </div>
  );
};

export default Receivers;
