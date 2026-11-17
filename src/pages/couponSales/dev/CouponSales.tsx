// Hooks
import { useState } from "react";
import {
  useCouponSalesCtx,
  useCouponSalesGrading,
  useCouponSalesSearch,
} from "./hooks";
import { useApiContext } from "../../../hooks/useApiContext";

// Redux
import { setCouponMobileLines } from "../../../features/dev/devCouponSalesSlice";

// API
import {
  couponReceipt,
  fetchCouponEvents,
} from "../../../api/eventPerf/couponAdapter";

// Utils
import { formatDateSimple } from "../../../utils";
import { weekWindow } from "./utils";

// Components
import SearchCard from "../../../components-dev/SearchCard";
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import EmptyPrompt from "../../../components-dev/EmptyPrompt";
import EventPerfMobile from "../../../components-dev/eventPerf/EventPerfMobile";
import SearchPopup from "../../../components-dev/SearchPopup";
import CpnSalesStorePanel from "./storePanel/CpnSalesStorePanel";
import CpnSalesDetailPanel from "./detail/CpnSalesDetailPanel";
import CpnSalesExportModal from "./export/CpnSalesExportModal";

/** The Coupon Sales page: loads a week's coupons plus the two-week baseline for a store or
 *  group, then shows the graded store list on the left and the picked store's breakdown on
 *  the right. Phones get the shared event-performance screens instead. */
const CouponSales = () => {
  const ctx = useCouponSalesCtx();
  const api = useApiContext();
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const { getData } = useCouponSalesSearch(ctx);
  const {
    activeThreshold,
    storeRows,
    totals,
    storeCoupons,
    selectedStore,
    storeGrading,
  } = useCouponSalesGrading(ctx);
  const {
    dispatch,
    isMobile,
    coupons,
    isFetching,
    hasSearched,
    noCouponsFound,
    exportOpen,
    mobileLines,
    searchedDate,
    singleDate,
    assignedStores,
    groupStores,
  } = ctx;

  // MM/DD/YYYY, zero-padded — normalised through the same value sent to the
  // API so the label can't drift from what was actually queried.
  const shown = weekWindow(searchedDate ?? singleDate);
  const rangeLabel = `${formatDateSimple(shown.weekStart)} – ${formatDateSimple(shown.weekEnd)}`;

  // Mobile gets its own three-screen stack rather than a squeezed two-panel
  // layout. Fetching, the baseline and every grading input stay here so the
  // two form factors can never grade the same week differently.
  // Mobile shares one ungraded screen with Loss Prevention — same shell, same
  // three tabs, coupon type where LP has exception type. It owns its own fetch,
  // so none of the grading above runs on this path.
  if (isMobile) {
    return (
      <EventPerfMobile
        pageKey="couponSales"
        start={api.lpStart}
        end={api.lpEnd}
        title="Coupon sales"
        description="Select a store or group and a week ending date."
        buttonLabel="Load coupons"
        allLabel="All coupons"
        measure="amount"
        load={async (start, end, onProgress) => {
          const result = await fetchCouponEvents(
            {
              url: api.url,
              token: api.token,
              start,
              end,
              baseStart: api.lpBaseStart,
              baseEnd: api.lpBaseEnd,
              useGroups: api.useGroups,
              searchValue: api.searchValue,
              singleStore: api.singleStore,
              assignedStores,
              groupStores,
            },
            onProgress,
          );
          // The week's every line, for the receipt sheet. Kept beside the
          // rest of this page's state so it lasts exactly as long: through
          // leaving the page and back, and not past sign-out.
          dispatch(setCouponMobileLines(result.items));
          return result;
        }}
        helpPage="coupon-sales"
        loadReceipt={async (saleId) => couponReceipt(mobileLines, saleId)}
      />
    );
  }

  // The entry card and the re-search pop-up are the same card.
  const searchCardProps = {
    title: "Coupon Sales",
    description:
      "Select a store or group and a week ending date. Coupons are graded against the same store's prior two weeks.",
    singleDate: true,
    buttonLabel: "Load Coupon Sales",
    loading: isFetching,
    loadingMessage: "Finding coupon sales...",
  };

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
          {...searchCardProps}
          onSearch={getData}
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
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <SearchCard
            {...searchCardProps}
            onSearch={() => {
              setSearchModalOpen(false);
              getData();
            }}
          />
        </SearchPopup>
      )}

      <div className="flex gap-4 h-[calc(100vh-5rem)]">
        {/* Left: graded store list */}
        <div
          className="flex flex-col min-w-0"
          style={{ flexBasis: "40%", flexShrink: 0 }}
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
