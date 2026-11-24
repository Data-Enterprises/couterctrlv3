// Hooks
import { useEffect, useMemo } from "react";
import { useAppDispatch, useSearchPick } from "../../../../hooks";
import { useCouponContext, useCouponActions, useCouponSearch } from "../hooks";

// Redux
import { isGroupSearch } from "../../../../features/searchSlice";
import {
  resetCouponMobilePlace,
  setCouponMobilePlace,
  setCouponSortMetric,
  type CouponMobilePlace,
} from "../../../../features/dev/devCouponSlice";

// Utils
import { resolveStoreName } from "../../../../utils";
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import { fmtSearchDate } from "./utils";

// Interfaces
import type { GroupTab } from "../interfaces";
import type { Screen } from "./interfaces";
import type { CouponItem } from "../../../../interfaces";

// Components
import CpnStoreList from "./CpnStoreList";
import CpnOverview from "./CpnOverview";
import CpnSectionDetail from "./CpnSectionDetail";
import CpnEntryCard from "./components/CpnEntryCard";

/** The phone Coupons page. It holds the search card, then moves through the store list (group searches only),
 *  the overview with its Sub dept/Date/Cashier tabs, and a section's product detail. */
const CouponsMobile = () => {
  const ctx = useCouponContext();
  const { nothingPicked, pickLabel } = useSearchPick();
  const dispatch = useAppDispatch();
  const actions = useCouponActions();
  const {
    selectedGroup,
    assignedStores,
    selectedGroupStores: groupStores,
  } = ctx;

  // Where the phone is lives in the slice, so leaving the page and coming back
  // lands on the same screen. With nothing loaded it is always the search card.
  const {
    storeId: selectedStoreId,
    storeNumber: selectedStoreNumber,
    tab: selectedTab,
    section: selectedSection,
  } = ctx.mobile;
  const screen: Screen = ctx.coupons.length === 0 ? "entry" : ctx.mobile.screen;
  const place = (p: Partial<CouponMobilePlace>) =>
    dispatch(setCouponMobilePlace(p));
  const setScreen = (next: Screen) => place({ screen: next });
  const setSelectedTab = (tab: GroupTab) => place({ tab });
  const sortMetric = ctx.sortMetric;
  const setSortMetric = (m: "amount" | "qty") =>
    dispatch(setCouponSortMetric(m));
  const { runSearch } = useCouponSearch(ctx);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isGroup = isGroupSearch(ctx.type);

  const dateRangeLabel =
    ctx.startDate && ctx.endDate
      ? `${fmtSearchDate(ctx.startDate)} – ${fmtSearchDate(ctx.endDate)}, ${ctx.endDate.split("/")[2]}`
      : "";

  const getData = () =>
    runSearch(() => setScreen(isGroup ? "stores" : "overview"));

  const handleReset = () => {
    dispatch(actions.resetCoupons());
    dispatch(resetCouponMobilePlace());
  };

  const filteredCoupons = useMemo<CouponItem[]>(() => {
    if (selectedStoreId === null) return ctx.coupons;
    return ctx.coupons.filter(
      (c) =>
        c.storeid === selectedStoreId &&
        (selectedStoreNumber === null ||
          c.store_number === selectedStoreNumber),
    );
  }, [ctx.coupons, selectedStoreId, selectedStoreNumber]);

  const sectionCoupons = useMemo<CouponItem[]>(() => {
    if (!selectedSection) return filteredCoupons;
    if (selectedTab === "subdept")
      return filteredCoupons.filter(
        (c) => c.sub_department_description === selectedSection.key,
      );
    if (selectedTab === "date")
      return filteredCoupons.filter(
        (c) => c.sale_date.split("T")[0] === selectedSection.key,
      );
    if (selectedTab === "cashier")
      return filteredCoupons.filter(
        (c) => (c.cashier_name || "unknown") === selectedSection.key,
      );
    return filteredCoupons;
  }, [filteredCoupons, selectedSection, selectedTab]);

  // Names come from assignedStores/groupStores, never the coupon payload, with
  // the location's number written in: co-located stores share one storeid.
  const storeName = useMemo(() => {
    // Group mode with nothing picked is "All stores", so the group is the
    // subject; a single-store search's scope is what was searched.
    const storeid = selectedStoreId ?? (isGroup ? null : Number(ctx.lastStore));
    if (storeid === null) return (selectedGroup as any)?.group_name ?? "Group";

    const resolved = resolveStoreName(assignedStores, groupStores, storeid);
    const numbers = [
      ...new Set(
        ctx.coupons
          .filter((c) => c.storeid === storeid)
          .map((c) => c.store_number),
      ),
    ];
    return applyStoreNumberToName(
      resolved,
      selectedStoreNumber ?? "",
      selectedStoreNumber ? numbers : [],
    );
  }, [
    ctx.coupons,
    ctx.lastStore,
    selectedStoreId,
    selectedStoreNumber,
    isGroup,
    selectedGroup,
    assignedStores,
    groupStores,
  ]);

  const tabLabel =
    selectedTab === "subdept"
      ? "Sub dept"
      : selectedTab === "date"
        ? "Date"
        : "Cashier";

  if (screen === "stores") {
    return (
      <CpnStoreList
        coupons={ctx.coupons}
        groupName={(selectedGroup as any)?.group_name ?? "Group"}
        dateRangeLabel={dateRangeLabel}
        sortMetric={sortMetric}
        onSortMetric={setSortMetric}
        onSelect={(storeId, storeNumber) =>
          place({ storeId, storeNumber, screen: "overview" })
        }
        onSearch={handleReset}
      />
    );
  }

  if (screen === "overview") {
    return (
      <CpnOverview
        coupons={filteredCoupons}
        storeName={storeName}
        dateRangeLabel={dateRangeLabel}
        isGroup={isGroup}
        sortMetric={sortMetric}
        onSortMetric={setSortMetric}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        onSectionSelect={(key, label) =>
          place({ section: { key, label }, screen: "detail" })
        }
        onBack={
          isGroup
            ? () => place({ storeId: null, screen: "stores" })
            : handleReset
        }
      />
    );
  }

  if (screen === "detail" && selectedSection) {
    return (
      <CpnSectionDetail
        coupons={sectionCoupons}
        sectionLabel={selectedSection.label}
        tabLabel={tabLabel}
        dateRangeLabel={dateRangeLabel}
        sortMetric={sortMetric}
        onBack={() => setScreen("overview")}
      />
    );
  }

  // Entry screen
  return (
    <CpnEntryCard
      noCouponsFound={ctx.noCouponsFound}
      loading={ctx.isFetching}
      nothingPicked={nothingPicked}
      pickLabel={pickLabel}
      onSearch={getData}
    />
  );
};

export default CouponsMobile;
