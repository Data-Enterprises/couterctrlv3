import { useState } from "react";
import { useAppSelector } from "../../../hooks";
import SearchCard from "../../../components/SearchCard";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import type { CouponItem } from "../../../interfaces";
import type { CouponRow, GradingOptions } from "../shared/couponGrading";
import CpnStoreListMobile from "./CpnStoreListMobile";
import CpnBreakdownMobile from "./CpnBreakdownMobile";
import CpnTransactionsMobile from "./CpnTransactionsMobile";

/**
 * Coupon Sales on a phone — a three-screen stack, modelled on Loss Prevention
 * rather than on the other Performance pages.
 *
 * The reason is the grading, not the layout. Sub Dept Margins, Vendors and
 * Categories compare this week against last week and last year, which is what
 * their KPI strip and day cards exist to show. Coupon Sales compares each
 * store against its own prior two weeks — LP's model — so it inherits LP's
 * shape: a graded list, a drill-in, and the receipts at the bottom.
 *
 * Fetching stays in the desktop container, which owns the search and the
 * baseline; this file only routes between screens and owns the entry card, the
 * same split LpMobile uses.
 */
type Screen = "stores" | "breakdown" | "transactions";

interface Props {
  /** Graded store rows, already built by the page container. */
  storeRows: CouponRow[];
  /** Coupon lines for the selected store — empty until one is picked. */
  storeCoupons: CouponItem[];
  storeLabel: string;
  rangeLabel: string;
  /** Grading scoped to the selected store's own baseline slice. */
  storeGrading: GradingOptions;
  onSearch: () => void;
}

const CouponSalesMobile = ({
  storeRows,
  storeCoupons,
  storeLabel,
  rangeLabel,
  storeGrading,
  onSearch,
}: Props) => {
  const { coupons, isFetching, hasSearched, noCouponsFound } = useAppSelector(
    (s) => s.couponSales,
  );
  const [screen, setScreen] = useState<Screen>("stores");
  const [showSearch, setShowSearch] = useState(false);

  const hasData = coupons.length > 0;

  // Checked before the entry card: a re-search keeps the previous week in
  // state while the new one loads, so without this the stale list would sit
  // there looking interactive.
  if (isFetching) {
    return (
      <div className="h-[calc(100dvh-3rem)] relative bg-custom-white">
        <LoadingIndicator message="Loading coupon activity..." />
      </div>
    );
  }

  // Entry screen — full-page SearchCard until a week has loaded. Re-opening it
  // from the header does not clear what's already loaded, so a mistaken tap
  // can be backed out of without paying for another fetch.
  if (!hasData || showSearch) {
    return (
      <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-custom-white">
        <SearchCard
          top
          title="Coupon Sales"
          description="Select a store or group and a week ending date. Coupons are graded against the same store's prior two weeks."
          singleDate
          buttonLabel="Load Coupon Sales"
          onSearch={() => {
            setScreen("stores");
            setShowSearch(false);
            onSearch();
          }}
          loading={isFetching}
          loadingMessage="Finding coupon sales..."
          onBack={hasData ? () => setShowSearch(false) : undefined}
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
    <div className="h-[calc(100dvh-3rem)] overflow-hidden flex flex-col bg-custom-white">
      <div className="flex-1 overflow-hidden">
        {screen === "transactions" ? (
          <CpnTransactionsMobile
            storeCoupons={storeCoupons}
            storeLabel={storeLabel}
            rangeLabel={rangeLabel}
            onBack={() => setScreen("breakdown")}
          />
        ) : screen === "breakdown" ? (
          <CpnBreakdownMobile
            storeCoupons={storeCoupons}
            storeLabel={storeLabel}
            rangeLabel={rangeLabel}
            grading={storeGrading}
            onBack={() => setScreen("stores")}
            onSectionSelected={() => setScreen("transactions")}
          />
        ) : (
          <CpnStoreListMobile
            rows={storeRows}
            rangeLabel={rangeLabel}
            onOpenSearch={() => setShowSearch(true)}
            onStoreSelected={() => setScreen("breakdown")}
          />
        )}
      </div>
    </div>
  );
};

export default CouponSalesMobile;
