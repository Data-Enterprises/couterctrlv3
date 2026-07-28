import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCoupons } from "../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import { formatDateSimple, formatGoliathDate } from "../../utils";
import { setSelectedGroupStores } from "../../features/userSlice";
import {
  setCouponSalesData,
  setCouponSalesFetching,
  setCouponSalesHasSearched,
  setNoCouponSalesFound,
  reQueryCouponSales,
  COUPON_THRESHOLD_DEFAULT,
} from "../../features/couponSalesSlice";
import type { CouponsResponse, JsonError } from "../../interfaces";
import SearchCard from "../../components/SearchCard";
import LoadingIndicator from "../../components/loading/LoadingIndicator";
import EmptyPrompt from "../../components/EmptyPrompt";
import CpnSalesStorePanel from "./components/CpnSalesStorePanel";
import CpnSalesDetailPanel from "./components/CpnSalesDetailPanel";
import CpnSalesExportModal from "./components/CpnSalesExportModal";
import { buildStoreRows, storeKeyOf, totalsFor } from "./shared/couponGrading";

const CouponSales = () => {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const { url, token, isMobile } = useAppSelector((s) => s.app);
  const { userid, assignedStores, selectedGroupStores } = useAppSelector(
    (s) => s.user,
  );
  const { startDate, endDate, type, lastStore, lastGroup } = useAppSelector(
    (s) => s.search,
  );
  const {
    coupons,
    isFetching,
    hasSearched,
    noCouponsFound,
    threshold,
    selectedStoreKey,
    exportOpen,
  } = useAppSelector((s) => s.couponSales);

  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Grading holds the last valid amount while the numeric input is empty, so
  // clearing it never reshuffles the list out from under the user.
  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;

  const getData = () => {
    dispatch(reQueryCouponSales());
    dispatch(setCouponSalesHasSearched(true));
    dispatch(setCouponSalesFetching(true));

    if (type === "Group") {
      getStoresAssignedToUserGroup(url, token, userid, lastGroup)
        .then((resp) => {
          if (resp.data.error === 0) {
            dispatch(
              setSelectedGroupStores(
                resp.data.stores.filter((s: { active: boolean }) => s.active),
              ),
            );
          }
        })
        .catch(() => {});
    }

    const useGroups = type === "Group" ? 1 : 0;
    const singleStore = type === "Store" ? 1 : 0;
    const searchValue = type === "Group" ? lastGroup : lastStore;

    getCoupons(
      url,
      token,
      formatGoliathDate(startDate),
      formatGoliathDate(endDate),
      useGroups,
      singleStore,
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load coupons");
        } else if (j.records.length > 0) {
          dispatch(setCouponSalesData(j.records));
        } else {
          dispatch(setNoCouponSalesFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(setCouponSalesFetching(false)));
  };

  const storeRows = useMemo(
    () =>
      buildStoreRows(coupons, activeThreshold, assignedStores, selectedGroupStores),
    [coupons, activeThreshold, assignedStores, selectedGroupStores],
  );

  const totals = useMemo(() => totalsFor(coupons), [coupons]);

  const storeCoupons = useMemo(
    () =>
      selectedStoreKey === null
        ? []
        : coupons.filter((c) => storeKeyOf(c) === selectedStoreKey),
    [coupons, selectedStoreKey],
  );

  const selectedStore = storeRows.find((r) => r.key === selectedStoreKey);

  // MM/DD/YYYY, zero-padded — normalised through the same value sent to the
  // API so the label can't drift from what was actually queried.
  const rangeLabel = `${formatDateSimple(formatGoliathDate(startDate))} – ${formatDateSimple(formatGoliathDate(endDate))}`;

  if (isMobile) {
    return (
      <div className="w-full min-h-[calc(100vh-3rem)] p-4">
        <EmptyPrompt
          title="Coupon Sales is desktop only for now"
          description="Use the Coupons page on mobile."
        />
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading coupon activity..." />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <SearchCard
          title="Coupon Sales"
          description="Select a store or group and date range to grade coupon activity."
          buttonLabel="Load Coupon Sales"
          onSearch={getData}
          loading={isFetching}
          notice={
            hasSearched && noCouponsFound
              ? "No coupons came back for this search."
              : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="w-full p-4 select-none h-[calc(100vh-3rem)] overflow-hidden">
      {exportOpen && <CpnSalesExportModal storeCoupons={storeCoupons} />}

      {searchModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSearchModalOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <SearchCard
              title="Coupon Sales"
              description="Select a store or group and date range to grade coupon activity."
              buttonLabel="Load Coupon Sales"
              onSearch={() => {
                setSearchModalOpen(false);
                getData();
              }}
              loading={isFetching}
            />
          </div>
        </div>
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        {/* Left: graded store list */}
        <div
          className="flex flex-col min-w-0"
          style={{ flexBasis: "38%", flexShrink: 0 }}
        >
          <CpnSalesStorePanel
            rows={storeRows}
            totals={totals}
            rangeLabel={rangeLabel}
            onOpenSearch={() => setSearchModalOpen(true)}
          />
        </div>

        {/* Right: breakdown + transactions */}
        <div className="flex-1 min-w-0">
          {selectedStore ? (
            <CpnSalesDetailPanel
              storeCoupons={storeCoupons}
              storeLabel={selectedStore.label}
              storeTier={selectedStore.tier}
              rangeLabel={rangeLabel}
              threshold={activeThreshold}
            />
          ) : (
            <EmptyPrompt
              title="Select a store"
              description="Pick a store on the left to break its coupons down by sub department, date, or cashier."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default CouponSales;
