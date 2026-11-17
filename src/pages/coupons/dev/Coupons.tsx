// Hooks
import { useState } from "react";
import { useCouponContext, useCouponSearch } from "./hooks";

// Components
import SearchCard from "../../../components-dev/SearchCard";
import LoadingIndicator from "../../../components-dev/loading/LoadingIndicator";
import SearchPopup from "../../../components-dev/SearchPopup";
import CouponsMobile from "./mobile/CouponsMobile";
import CouponListPanel from "./components/CouponListPanel";
import CouponDetailPanel from "./components/detailPanel/CouponDetailPanel";

/** The Coupons page: a search card to load coupon activity for a store or group and date range, then a store list
 *  beside the detail panel. Phones get the mobile screens instead. */
const Coupons = () => {
  const context = useCouponContext();
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [sortMetric, setSortMetric] = useState<"amount" | "qty">("amount");
  const [searchModalOpen, setSearchModalOpen] = useState<boolean>(false);
  const { runSearch } = useCouponSearch(context);

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
