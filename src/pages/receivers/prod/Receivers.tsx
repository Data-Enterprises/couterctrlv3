// Hooks
import { useEffect, useState } from "react";
import { useAppDispatch } from "../../../hooks";
import {
  useReceiversCtx,
  useReceiversSearch,
  useReceiversState,
} from "./hooks";

// Redux
import {
  setReceiverDetails,
  setStoreId,
} from "../../../features/receiversSlice";

// Components
import DatePickers from "../../../components/datePickers/DatePickers";
import SingleStoreSearchCard from "../../../components/SingleStoreSearchCard";
import ReceiverListPanel from "./components/list/ReceiverListPanel";
import ReceiverDetailPanel from "./components/detail/ReceiverDetailPanel";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import SearchPopup from "../../../components/SearchPopup";
import ReceiversMobile from "./mobile/ReceiversMobile";

/** The Receivers page: a store and date search card, then the receiver list beside its detail panel.
 *  Shows a loading state, a no-results card, and the phone view on mobile. */
const Receivers = () => {
  const dispatch = useAppDispatch();
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const state = useReceiversState();
  const { isMobile, assignedStores } = useReceiversCtx();

  useEffect(() => {
    if (state.listGridData.length === 0) {
      dispatch(setReceiverDetails([]));
    }
  }, [state.listGridData]);

  const getReceivers = useReceiversSearch();

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
          onSearch={getReceivers}
          datePicker={
            <DatePickers showBtn={false} handleQuery={getReceivers} />
          }
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
          datePicker={
            <DatePickers showBtn={false} handleQuery={getReceivers} />
          }
        />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <SingleStoreSearchCard
            title="Receivers"
            description="Select a store and date range to load receiving history."
            buttonLabel="Load Receivers"
            stores={assignedStores}
            selectedStoreId={state.storeid}
            onStoreSelect={setSelectedStore}
            onSearch={() => {
              setSearchModalOpen(false);
              getReceivers();
            }}
            loading={state.isFetchingList}
            loadingMessage="Finding receivers..."
            datePicker={
              <DatePickers
                showBtn={false}
                handleQuery={() => {
                  setSearchModalOpen(false);
                  getReceivers();
                }}
              />
            }
          />
        </SearchPopup>
      )}
      <ReceiverListPanel onOpenSearch={() => setSearchModalOpen(true)} />
      <ReceiverDetailPanel />
    </div>
  );
};

export default Receivers;
