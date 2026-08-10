import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useCouponContext } from "../..";
import { useCouponActions } from "../../hooks/useCouponActions";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getCoupons } from "../../../../api/coupons";
import { getStoresAssignedToUserGroup } from "../../../../api/groups";
import { setSelectedGroupStores } from "../../../../features/userSlice";
import { formatGoliathDate, resolveStoreName } from "../../../../utils";
import { applyStoreNumberToName } from "../../../../utils/storeIdentity";
import type {
  CouponsResponse,
  CouponItem,
  JsonError,
} from "../../../../interfaces";
import StorePicker from "../../../../components/storePicker/StorePicker";
import DatePickers from "../../../../components/datePickers/DatePickers";
import CpnStoreList from "./CpnStoreList";
import CpnOverview from "./CpnOverview";
import CpnSectionDetail from "./CpnSectionDetail";

export type GroupTab = "subdept" | "date" | "cashier";

type Screen = "entry" | "stores" | "overview" | "detail";

const fmtSearchDate = (mdy: string) => {
  const [m, d, y] = mdy.split("/");
  return new Date(
    `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00`,
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const CouponsMobileDev = () => {
  const ctx = useCouponContext();
  const dispatch = useAppDispatch();
  const actions = useCouponActions();
  const toast = useToast();
  const selectedGroup = useAppSelector((s) => s.search.selectedGroup);
  const userid = useAppSelector((s) => s.user.userid);
  const assignedStores = useAppSelector((s) => s.user.assignedStores);
  const groupStores = useAppSelector((s) => s.user.selectedGroupStores);

  const [screen, setScreen] = useState<Screen>("entry");
  // null in group mode means "All stores" — the whole group, unscoped.
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  // Co-located stores share a storeid — the number is what picks the location.
  const [selectedStoreNumber, setSelectedStoreNumber] = useState<string | null>(
    null,
  );
  const [selectedTab, setSelectedTab] = useState<GroupTab>("subdept");
  const [selectedSection, setSelectedSection] = useState<{
    key: string;
    label: string;
  } | null>(null);
  const [sortMetric, setSortMetric] = useState<"amount" | "qty">("amount");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const isGroup = ctx.type === "Group";

  const dateRangeLabel =
    ctx.startDate && ctx.endDate
      ? `${fmtSearchDate(ctx.startDate)} – ${fmtSearchDate(ctx.endDate)}, ${ctx.endDate.split("/")[2]}`
      : "";

  const getData = () => {
    dispatch(actions.setCoupons([]));
    dispatch(actions.setIsFetching(true));
    dispatch(actions.setNoCouponsFound(false));
    // A group search can return stores this user isn't personally assigned to.
    // Desktop loads them here so store names resolve for those rows; without
    // it mobile fell back to the coupon payload's own store_name.
    if (ctx.type === "Group") {
      getStoresAssignedToUserGroup(ctx.url, ctx.token, userid, ctx.lastGroup)
        .then((resp) => {
          if (resp.data.error === 0) {
            dispatch(
              setSelectedGroupStores(
                resp.data.stores.filter((s: { active: boolean }) => s.active),
              ),
            );
          } else {
            toast.warn(resp.data.msg);
          }
        })
        .catch(() => {});
    }
    const useGroups = ctx.type === "Group" ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore;
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    getCoupons(
      ctx.url,
      ctx.token,
      start,
      end,
      useGroups,
      singleStore,
      searchValue,
    )
      .then((resp) => {
        const j: CouponsResponse = resp.data;
        if (j.error !== 0) {
          toast.warn(j.msg ?? "Failed to load coupons");
        } else if (j.records.length > 0) {
          dispatch(actions.setCoupons(j.records));
          setScreen(isGroup ? "stores" : "overview");
        } else {
          dispatch(actions.setNoCouponsFound(true));
        }
      })
      .catch((err: JsonError) => toast.error(err.message))
      .finally(() => dispatch(actions.setIsFetching(false)));
  };

  const handleReset = () => {
    dispatch(actions.resetCoupons());
    setScreen("entry");
    setSelectedStoreId(null);
    setSelectedStoreNumber(null);
    setSelectedSection(null);
    setSelectedTab("subdept");
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

  // Names come from assignedStores/groupStores, never the coupon payload, then
  // get the on-screen location's number written back in — co-located stores
  // share one storeid and therefore one assignedStores record.
  const storeName = useMemo(() => {
    // Group mode with nothing picked is the "All stores" view, so the group is
    // the subject. A single-store search has no store list to pick from, so the
    // scope is whatever was searched.
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
        onSelect={(storeId, storeNumber) => {
          setSelectedStoreId(storeId);
          setSelectedStoreNumber(storeNumber);
          setScreen("overview");
        }}
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
        onSectionSelect={(key, label) => {
          setSelectedSection({ key, label });
          setScreen("detail");
        }}
        onBack={
          isGroup
            ? () => {
                setSelectedStoreId(null);
                setScreen("stores");
              }
            : handleReset
        }
        onSearch={handleReset}
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
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-gray-50">
      <div className="mx-4 pt-4 pb-2">
        <div className="bg-custom-white rounded-2xl shadow-lg p-4 flex flex-col gap-3">
          <div>
            <div className="text-[15px] font-bold text-content">Coupons</div>
            <div className="text-[10px] text-content/85 mt-1">
              Select a store or group and date range to load coupon activity.
            </div>
          </div>
          {ctx.noCouponsFound && (
            <div className="px-2.5 py-2 rounded-lg bg-amber-50 text-[11.5px] text-amber-900 leading-snug">
              No coupons came back for this search.
            </div>
          )}
          <StorePicker />
          <DatePickers showBtn={false} handleQuery={getData} />
          <button
            onClick={getData}
            disabled={ctx.isFetching}
            className="w-full py-2.5 text-[12px] font-semibold text-custom-white rounded-xl bg-[#1e2a4a] hover:bg-[#2a3a63] disabled:opacity-60 transition-colors"
          >
            {ctx.isFetching ? "Loading…" : "Load Coupons"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponsMobileDev;
