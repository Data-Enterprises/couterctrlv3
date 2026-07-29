import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { useToast } from "../../components/toasts/hooks/useToast";
import { getCoupons } from "../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../api/groups";
import { formatDateSimple } from "../../utils";
import { setSelectedGroupStores } from "../../features/userSlice";
import {
  setCouponSalesData,
  setCouponSalesFetching,
  setCouponSalesHasSearched,
  setNoCouponSalesFound,
  reQueryCouponSales,
  COUPON_THRESHOLD_DEFAULT,
  COUPON_TREND_THRESHOLD_DEFAULT,
  setCouponBaseline,
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
  const { singleDate, type, lastStore, lastGroup } = useAppSelector(
    (s) => s.search,
  );

  // One week-ending date drives both windows, matching LP: the searched week
  // is end-6..end and the baseline is the two weeks before it, end-20..end-7.
  const { weekStart, weekEnd, baseStart, baseEnd } = useMemo(() => {
    const [m, d, y] = singleDate.split("/").map(Number);
    const pad = (dt: Date) =>
      `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    return {
      weekEnd: pad(new Date(y, m - 1, d)),
      weekStart: pad(new Date(y, m - 1, d - 6)),
      baseEnd: pad(new Date(y, m - 1, d - 7)),
      baseStart: pad(new Date(y, m - 1, d - 20)),
    };
  }, [singleDate]);
  const {
    coupons,
    baselineCoupons,
    isFetching,
    hasSearched,
    noCouponsFound,
    threshold,
    trendThreshold,
    metric,
    selectedStoreKey,
    exportOpen,
  } = useAppSelector((s) => s.couponSales);

  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Grading holds the last valid amount while the numeric input is empty, so
  // clearing it never reshuffles the list out from under the user.
  const activeThreshold = threshold ?? COUPON_THRESHOLD_DEFAULT;
  const activeTrendThreshold = trendThreshold ?? COUPON_TREND_THRESHOLD_DEFAULT;

  // One object so every builder grades identically — see couponGrading.
  const grading = useMemo(
    () => ({
      metric,
      threshold: activeThreshold,
      trendThreshold: activeTrendThreshold,
      baseline: baselineCoupons,
    }),
    [metric, activeThreshold, activeTrendThreshold, baselineCoupons],
  );

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

    getCoupons(url, token, weekStart, weekEnd, useGroups, singleStore, searchValue)
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

    // Baseline. Deliberately not awaited alongside the week — the page is
    // usable the moment the week lands, and rows simply grade as ungraded
    // until this arrives. A baseline failure is non-fatal for the same reason.
    dispatch(setCouponBaseline([]));
    getCoupons(url, token, baseStart, baseEnd, useGroups, singleStore, searchValue)
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error === 0) dispatch(setCouponBaseline(j.records));
      })
      .catch(() => {});
  };

  const storeRows = useMemo(
    () =>
      buildStoreRows(coupons, grading, assignedStores, selectedGroupStores),
    [coupons, grading, assignedStores, selectedGroupStores],
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

  // The detail panel grades sub depts, cashiers and dates WITHIN one store, so
  // its baseline has to be that store's slice of the baseline window — the
  // whole-search baseline would compare one store against every store.
  const storeGrading = useMemo(
    () => ({
      ...grading,
      baseline:
        selectedStoreKey === null
          ? []
          : baselineCoupons.filter((c) => storeKeyOf(c) === selectedStoreKey),
    }),
    [grading, baselineCoupons, selectedStoreKey],
  );

  // MM/DD/YYYY, zero-padded — normalised through the same value sent to the
  // API so the label can't drift from what was actually queried.
  const rangeLabel = `${formatDateSimple(weekStart)} – ${formatDateSimple(weekEnd)}`;

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
          description="Select a store or group and a week ending date. Coupons are graded against the same store's prior two weeks."
          singleDate
          buttonLabel="Load Coupon Sales"
          onSearch={getData}
          loading={isFetching}
          loadingMessage="Finding coupon sales..."
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
              description="Select a store or group and a week ending date. Coupons are graded against the same store's prior two weeks."
          singleDate
              buttonLabel="Load Coupon Sales"
              onSearch={() => {
                setSearchModalOpen(false);
                getData();
              }}
              loading={isFetching}
              loadingMessage="Finding coupon sales..."
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
          grading={storeGrading}
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
