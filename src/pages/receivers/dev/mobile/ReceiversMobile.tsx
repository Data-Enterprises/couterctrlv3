// Hooks
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { useAppDispatch, useStoreName } from "../../../../hooks";
import { useReceiversActions, useReceiversCtx, useReceiversState } from "../hooks";

// API
import { getReceiversList } from "../../../../api/receivers";

// Utils
import {
  applyStoreNumberToName,
  scopeToStoreNumber,
  storeNumbersIn,
} from "../../../../utils/storeIdentity";
import { fmtSearchDate } from "./utils";

// Interfaces
import type { ReceiverListResponse, JsonError } from "../../../../interfaces";
import type { Screen } from "./interfaces";

// Components
import SingleStoreSearchCard from "../../../../components-dev/SingleStoreSearchCard";
import DatePickers from "../../../../components-dev/datePickers/DatePickers";
import RcvReceiverList from "./components/RcvReceiverList";

/** The phone Receivers page: a store and date search card that loads the receivers,
 *  then the receiver list, with a way back to the search and a Back to results button. */
const ReceiversMobile = () => {
  const dispatch = useAppDispatch();
  const rcv = useReceiversState();
  const actions = useReceiversActions();
  const toast = useToast();
  const { url, token, assignedStores, search } = useReceiversCtx();
  const { startDate, endDate } = search;

  const [screen, setScreen] = useState<Screen>("entry");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const dateRangeLabel = useMemo(() => {
    if (!startDate || !endDate) return "";
    return `${fmtSearchDate(startDate)} – ${fmtSearchDate(endDate)}, ${endDate.split("/")[2]}`;
  }, [startDate, endDate]);

  const resolvedStoreName = useStoreName(rcv.storeid, "");
  // Co-located stores resolve to one assignedStores record — rewrite the
  // embedded number to the location on screen. See utils/storeIdentity.
  const storeName = applyStoreNumberToName(
    resolvedStoreName,
    rcv.selectedStoreNumber ?? "",
    rcv.selectedStoreNumber ? rcv.availableStoreNumbers : [],
  );

  // Fetched by storeid, so a co-located storeid returns both locations mixed
  // together. The full response stays in rcv.list; this is what's displayed.
  const visibleReceivers = rcv.selectedStoreNumber
    ? scopeToStoreNumber(rcv.list, rcv.selectedStoreNumber)
    : rcv.list;

  const handleSearch = () => {
    if (!rcv.storeid) {
      toast.warn("Please select a store");
      return;
    }
    dispatch(actions.reQuery());
    dispatch(actions.setIsFetchingList(true));
    // Cleared on every search: leaving it set means a later failure shows
    // this notice describing the *previous* search alongside the error toast.
    dispatch(actions.setNoReceivers(false));
    getReceiversList(url, token, rcv.storeid, startDate, endDate)
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load receivers");
        } else if (j.recievers.length > 0) {
          const numbers = storeNumbersIn(j.recievers);
          dispatch(actions.setAvailableStoreNumbers(numbers));
          const scope = numbers.length > 1 ? numbers[0] : null;
          dispatch(actions.setSelectedStoreNumber(scope));
          dispatch(actions.setReceiversList(j.recievers));
          dispatch(
            actions.setListGridData(
              scope ? scopeToStoreNumber(j.recievers, scope) : j.recievers,
            ),
          );
          setScreen("list");
        } else {
          dispatch(actions.setNoReceivers(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setIsFetchingList(false)));
  };

  const handleOpenSearch = () => {
    setScreen("entry");
  };

  const hasData = rcv.list.length > 0;

  const handleBackToResults = () => {
    setScreen("list");
  };

  if (screen === "list") {
    return (
      <RcvReceiverList
        receivers={visibleReceivers}
        storeName={storeName}
        dateRangeLabel={dateRangeLabel}
        storeid={rcv.storeid}
        onSearch={handleOpenSearch}
        storeNumbers={rcv.availableStoreNumbers}
        selectedStoreNumber={rcv.selectedStoreNumber}
        onStoreNumberChange={(n) => {
          dispatch(actions.setSelectedStoreNumber(n));
          dispatch(
            actions.setListGridData(
              n ? scopeToStoreNumber(rcv.list, n) : rcv.list,
            ),
          );
        }}
      />
    );
  }

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-fill_soft">
      <div className="mx-4 pt-4 pb-2">
        <SingleStoreSearchCard
          title="Receivers"
          description="Select a store and date range to load receiving history."
          buttonLabel="Load Receivers"
          stores={assignedStores}
          selectedStoreId={rcv.storeid}
          onStoreSelect={(id) => dispatch(actions.setStoreId(id))}
          onSearch={handleSearch}
          loading={rcv.isFetchingList}
          loadingMessage="Finding receivers..."
          datePicker={
            <DatePickers showBtn={false} handleQuery={handleSearch} />
          }
          notice={
            rcv.noReceivers
              ? "No receivers came back for this search."
              : undefined
          }
          onBack={hasData ? handleBackToResults : undefined}
        />
      </div>
    </div>
  );
};

export default ReceiversMobile;
