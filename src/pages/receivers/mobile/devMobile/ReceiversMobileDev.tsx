import { useEffect, useMemo, useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { useAppDispatch, useAppSelector, useStoreName } from "../../../../hooks";
import { useReceiversState } from "../../hooks/useReceiversState";
import { useReceiversActions } from "../../hooks/useReceiversActions";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getReceiversList } from "../../../../api/receivers";
import type { ReceiverListResponse, JsonError } from "../../../../interfaces";
import SingleStoreSearchCard from "../../../../components/SingleStoreSearchCard";
import DatePickers from "../../../../components/datePickers/DatePickers";
import RcvVendorList from "./RcvVendorList";
import RcvReceiverList from "./RcvReceiverList";

type Screen = "entry" | "vendors" | "receivers";

const fmtSearchDate = (mdy: string) => {
  const [m, d, y] = mdy.split("/");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00`)
    .toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const ReceiversMobileDev = () => {
  const dispatch = useAppDispatch();
  const rcv = useReceiversState();
  const actions = useReceiversActions();
  const toast = useToast();
  const { url, token } = useAppSelector((s) => s.app);
  const { assignedStores } = useAppSelector((s) => s.user);
  const { startDate, endDate } = useAppSelector((s) => s.search);

  const [screen, setScreen] = useState<Screen>("entry");
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

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

  const storeName = useStoreName(rcv.storeid, "");

  const handleSearch = () => {
    if (!rcv.storeid) {
      toast.warn("Please select a store");
      return;
    }
    dispatch(actions.reQuery());
    dispatch(actions.setIsFetchingList(true));
    getReceiversList(url, token, rcv.storeid, startDate, endDate)
      .then((resp) => {
        const j: ReceiverListResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load receivers");
        } else if (j.recievers.length > 0) {
          dispatch(actions.setReceiversList(j.recievers));
          dispatch(actions.setListGridData(j.recievers));
          setScreen("vendors");
        } else {
          dispatch(actions.setNoReceivers(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setIsFetchingList(false)));
  };

  // Re-open the search card without clearing already-loaded data — the
  // "already loaded" shortcut button lets the user jump straight back
  // instead of forcing a re-fetch if this was tapped by accident.
  const handleOpenSearch = () => {
    setScreen("entry");
  };

  const hasData = rcv.list.length > 0;

  const handleBackToResults = () => {
    setSelectedVendorId(null);
    setScreen("vendors");
  };

  const vendorReceivers = useMemo(
    () => rcv.list.filter((r) => r.vendorid === selectedVendorId),
    [rcv.list, selectedVendorId],
  );

  const selectedVendorName = useMemo(
    () => rcv.list.find((r) => r.vendorid === selectedVendorId)?.vendor_name ?? "",
    [rcv.list, selectedVendorId],
  );

  if (screen === "vendors") {
    return (
      <RcvVendorList
        list={rcv.list}
        storeName={storeName}
        dateRangeLabel={dateRangeLabel}
        onSelect={(vendorId) => {
          setSelectedVendorId(vendorId);
          setScreen("receivers");
        }}
        onSearch={handleOpenSearch}
      />
    );
  }

  if (screen === "receivers") {
    return (
      <RcvReceiverList
        receivers={vendorReceivers}
        vendorName={selectedVendorName}
        storeName={storeName}
        dateRangeLabel={dateRangeLabel}
        storeid={rcv.storeid}
        onBack={() => {
          setSelectedVendorId(null);
          setScreen("vendors");
        }}
        onSearch={handleOpenSearch}
      />
    );
  }

  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-gray-50">
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
          datePicker={<DatePickers showBtn={false} handleQuery={handleSearch} />}
          notice={
            rcv.noReceivers
              ? "No receivers came back for this search."
              : undefined
          }
        >
          {hasData && (
            <button
              onClick={handleBackToResults}
              className="w-full py-2.5 flex items-center justify-center gap-1.5 transition-colors"
              style={{ background: "rgba(30,42,74,0.07)", borderRadius: 10 }}
            >
              <ArrowLeftIcon className="w-4 h-4 text-[#1e2a4a]" />
              <span className="text-[#1e2a4a] font-semibold text-[13px] underline underline-offset-2">
                Back to results
              </span>
            </button>
          )}
        </SingleStoreSearchCard>
      </div>
    </div>
  );
};

export default ReceiversMobileDev;
