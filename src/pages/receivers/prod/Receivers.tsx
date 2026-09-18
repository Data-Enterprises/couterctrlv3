import { useAppSelector, useAppDispatch } from "../../../hooks";
import { scopeToStoreNumber, storeNumbersIn } from "../../../utils/storeIdentity";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { getReceiversList } from "../../../api/receivers";
import type { JsonError, ReceiverListResponse } from "../../../interfaces";
import {
  reQuery,
  resetReceiverSlice,
  setIsFetchingList,
  setListGridData,
  setNoReceivers,
  setReceiverDetails,
  setReceiversList,
  setAvailableStoreNumbers,
  setSelectedStoreNumber,
  setStoreId,
} from "../../../features/receiversSlice";

import DatePickers from "../../../components/datePickers/DatePickers";
import SingleStoreSearchCard from "../../../components/SingleStoreSearchCard";
import ReceiverListPanel from "./ReceiverListPanel";
import ReceiverDetailPanel from "./ReceiverDetailPanel";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import { useEffect, useState } from "react";
import ReceiversMobile from "./mobile/ReceiversMobile";

const Receivers = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const state = useAppSelector((state) => state.prod.receivers);
  const { url, token, isMobile } = useAppSelector((state) => state.app);
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
    // Cleared on every search: leaving it set means a later failure shows
    // this notice describing the *previous* search alongside the error toast.
    dispatch(setNoReceivers(false));
    getReceiversList(url, token, state.storeid, startDate, endDate)
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load receivers");
        } else if (j.recievers.length > 0) {
          // Fetched by storeid, so a co-located storeid returns both locations
          // mixed together. Discover them and default to the first, matching
          // how Sub Dept Margins presents the same situation.
          const numbers = storeNumbersIn(j.recievers);
          dispatch(setAvailableStoreNumbers(numbers));
          const scope = numbers.length > 1 ? numbers[0] : null;
          dispatch(setSelectedStoreNumber(scope));
          const rows = scope
            ? scopeToStoreNumber(j.recievers, scope)
            : j.recievers;
          dispatch(setReceiversList(j.recievers));
          dispatch(setListGridData(rows));

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

  // No tablet layout (a tablet takes the desktop page); phones get the
  // mobile view that replaced the old ReceiversMobileView.
  if (isMobile) return <ReceiversMobile />;

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
          loading={state.isFetchingList}
          loadingMessage="Finding receivers..."
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
              loading={state.isFetchingList}
              loadingMessage="Finding receivers..."
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
