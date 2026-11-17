// Hooks
import { useState } from "react";
import { useCouponContext, useCouponSearch } from "./hooks";

// Redux
import {
  setCouponSelectedKey,
  setCouponSortMetric,
} from "../../../features/dev/devCouponSlice";

// Components
import SearchCard from "../../../components-dev/SearchCard";
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import SearchPopup from "../../../components-dev/SearchPopup";
import CouponsMobile from "./mobile/CouponsMobile";
import CouponListPanel from "./listPanel/CouponListPanel";
import CouponDetailPanel from "./detailPanel/CouponDetailPanel";

/** The Coupons page: a search card to load coupon activity for a store or group and date range, then a store list
 *  beside the detail panel. Phones get the mobile screens instead. */
const Coupons = () => {
  const context = useCouponContext();
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const { runSearch } = useCouponSearch(context);

  // The picked store and the sort live in the slice, so coming back to the
  // page lands where it was left; a new search starts from all stores.
  const setSelectedKey = (key: string) =>
    context.dispatch(setCouponSelectedKey(key));

  const getData = () => {
    setSelectedKey("");
    runSearch();
  };

  // This page only ever rendered with devMode on, so phones already got the
  // newer mobile view (was devMobile/CouponsMobileDev); the old one is gone.
  if (context.isMobile) return <CouponsMobile />;

  // Loading
  if (context.isFetching) {
    return (
      <div className="w-full h-[calc(100vh-3rem)] relative">
        <LoadingIndicator message="Loading coupons..." />
      </div>
    );
  }

  // Initial search card / no results for the last search
  if (context.coupons.length === 0) {
    return (
      <div className="h-[calc(100vh-3rem)] flex items-center justify-center mx-4 pb-12">
        <SearchCard
          title="Coupons"
          description="Select a store and date range to load coupon activity."
          buttonLabel="Load Coupons"
          onSearch={getData}
          loading={context.isFetching}
          loadingMessage="Finding coupons..."
          notice={
            context.noCouponsFound
              ? "No coupons came back for this search."
              : undefined
          }
        />
      </div>
    );
  }

  // Two-panel layout
  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4 flex gap-4">
      {searchModalOpen && (
        <SearchPopup onClose={() => setSearchModalOpen(false)}>
          <SearchCard
            title="Coupons"
            description="Select a store or group and date range to load coupon activity."
            buttonLabel="Load Coupons"
            onSearch={() => {
              setSearchModalOpen(false);
              getData();
            }}
            loading={context.isFetching}
            loadingMessage="Finding coupons..."
          />
        </SearchPopup>
      )}
      <CouponListPanel
        selectedKey={context.selectedKey}
        onSelect={setSelectedKey}
        sortMetric={context.sortMetric}
        onSortMetric={(m) => context.dispatch(setCouponSortMetric(m))}
        onOpenSearch={() => setSearchModalOpen(true)}
      />
      <CouponDetailPanel
        selectedKey={context.selectedKey}
        sortMetric={context.sortMetric}
      />
    </div>
  );
};

export default Coupons;
