import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { getCoupons } from "../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import { setSelectedGroupStores } from "../../features/userSlice";
import { useToast } from "../../components/toasts/hooks/useToast";
import { useCouponContext } from ".";
import {
  resetCoupons,
  setIsFetching,
  setNoCouponsFound,
  setCoupons,
} from "../../features/couponSlice";
import type { CouponsResponse, JsonError } from "../../interfaces";
import { formatGoliathDate } from "../../utils";

import SearchCard from "../../components/SearchCard";
import StorePicker from "../../components/storePicker/StorePicker";
import DatePickers from "../../components/datePickers/DatePickers";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import TransactionModal from "../lossPrevention/TransactionModal";
import CouponsMobile from "./mobile/CouponsMobile";
import CouponsMobileDev from "./mobile/devMobile";
import CouponListPanel from "./CouponListPanel";
import CouponDetailPanel from "./CouponDetailPanel";

const Coupons = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const context = useCouponContext();
  const devMode = useAppSelector((s) => s.app.devMode);
  const { url, token } = useAppSelector((s) => s.app);
  const { userid } = useAppSelector((s) => s.user);
  const [selectedKey, setSelectedKey] = useState("");
  const [sortMetric, setSortMetric] = useState<"amount" | "qty">("amount");
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const getData = () => {
    setSelectedKey("");
    dispatch(setCoupons([]));
    if (context.type === "Group") {
      getStoresAssignedToUserGroup(url, token, userid, context.lastGroup)
        .then((resp) => {
          if (resp.data.error === 0) {
            dispatch(setSelectedGroupStores(resp.data.stores.filter((s: any) => s.active)));
          } else {
            toast.warn(resp.data.msg);
          }
        })
        .catch(() => {});
    }
    dispatch(setIsFetching(true));
    const useGroups = context.type === "Group" ? 1 : 0;
    const singleStore = context.type === "Store" ? 1 : 0;
    const searchValue = context.type === "Group" ? context.lastGroup : context.lastStore;
    const start = formatGoliathDate(context.startDate);
    const end = formatGoliathDate(context.endDate);

    getCoupons(context.url, context.token, start, end, useGroups, singleStore, searchValue)
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load coupons");
        } else if (j.records.length > 0) {
          dispatch(setCoupons(j.records));
        } else {
          dispatch(setNoCouponsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setIsFetching(false)));
  };

  if (context.isMobile && devMode) return <CouponsMobileDev />;
  if (context.isMobile) return <CouponsMobile />;

  // Loading
  if (context.isFetching) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading coupons..." />
      </div>
    );
  }

  // No coupons found
  if (context.noCouponsFound) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center">
        <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-content">No coupons found</h2>
            <p className="text-[12px] text-content/50 mt-1">No coupon activity matched the selected store and date range.</p>
          </div>
          <button
            onClick={() => dispatch(resetCoupons())}
            className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors"
          >
            Search again
          </button>
        </div>
      </div>
    );
  }

  // Initial search card
  if (context.coupons.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <div className="bg-custom-white rounded-2xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-3">
          <div>
            <h2 className="text-base font-semibold text-content">Coupons</h2>
            <p className="text-[12px] text-content/50 mt-1">Select a store and date range to load coupon activity.</p>
          </div>
          <StorePicker />
          <DatePickers showBtn={false} handleQuery={getData} />
          <button
            onClick={getData}
            className="w-full py-2 text-sm font-semibold text-white rounded-lg bg-[#1e2a4a] hover:bg-[#2a3a63] transition-colors cursor-pointer select-none"
          >
            Load Coupons
          </button>
        </div>
      </div>
    );
  }

  // Two-panel layout
  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      <TransactionModal />
      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <SearchCard
              title="Coupons"
              description="Select a store or group and date range to load coupon activity."
              buttonLabel="Load Coupons"
              onSearch={() => { setSearchModalOpen(false); getData(); }}
              loading={context.isFetching}
            />
          </div>
        </div>
      )}
      <CouponListPanel
        selectedKey={selectedKey}
        onSelect={setSelectedKey}
        sortMetric={sortMetric}
        onSortMetric={setSortMetric}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      <CouponDetailPanel selectedKey={selectedKey} sortMetric={sortMetric} />
    </div>
  );
};

export default Coupons;
