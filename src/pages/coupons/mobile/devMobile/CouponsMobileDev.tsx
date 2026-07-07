import { useEffect, useState, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../../../hooks";
import { useCouponContext } from "../..";
import { useCouponActions } from "../../hooks/useCouponActions";
import { useToast } from "../../../../components/toasts/hooks/useToast";
import { getCoupons } from "../../../../api/coupons";
import { formatGoliathDate } from "../../../../utils";
import type { CouponsResponse, CouponItem, JsonError } from "../../../../interfaces";
import StorePicker from "../../../../components/storePicker/StorePicker";
import DatePickers from "../../../../components/datePickers/DatePickers";
import CpnStoreList from "./CpnStoreList";
import CpnOverview from "./CpnOverview";
import CpnSectionDetail from "./CpnSectionDetail";

export type GroupTab = "subdept" | "date" | "cashier";

type Screen = "entry" | "stores" | "overview" | "detail";

const fmtSearchDate = (mdy: string) => {
  const [m, d, y] = mdy.split("/");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00`).toLocaleDateString("en-US", {
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

  const [screen, setScreen] = useState<Screen>("entry");
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<GroupTab>("subdept");
  const [selectedSection, setSelectedSection] = useState<{ key: string; label: string } | null>(null);
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
    const useGroups = ctx.type === "Group" ? 1 : 0;
    const singleStore = ctx.type === "Store" ? 1 : 0;
    const searchValue = ctx.type === "Group" ? ctx.lastGroup : ctx.lastStore;
    const start = formatGoliathDate(ctx.startDate);
    const end = formatGoliathDate(ctx.endDate);

    getCoupons(ctx.url, ctx.token, start, end, useGroups, singleStore, searchValue)
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
    setSelectedSection(null);
    setSelectedTab("subdept");
  };

  const filteredCoupons = useMemo<CouponItem[]>(() => {
    if (selectedStoreId === null) return ctx.coupons;
    return ctx.coupons.filter((c) => c.storeid === selectedStoreId);
  }, [ctx.coupons, selectedStoreId]);

  const sectionCoupons = useMemo<CouponItem[]>(() => {
    if (!selectedSection) return filteredCoupons;
    if (selectedTab === "subdept")
      return filteredCoupons.filter((c) => c.sub_department_description === selectedSection.key);
    if (selectedTab === "date")
      return filteredCoupons.filter((c) => c.sale_date.split("T")[0] === selectedSection.key);
    if (selectedTab === "cashier")
      return filteredCoupons.filter((c) => (c.cashier_name || "unknown") === selectedSection.key);
    return filteredCoupons;
  }, [filteredCoupons, selectedSection, selectedTab]);

  const storeName = useMemo(() => {
    if (isGroup) {
      if (selectedStoreId !== null) {
        return ctx.coupons.find((c) => c.storeid === selectedStoreId)?.store_name ?? String(selectedStoreId);
      }
      return (selectedGroup as any)?.group_name ?? "Group";
    }
    return ctx.coupons[0]?.store_name ?? "";
  }, [ctx.coupons, selectedStoreId, isGroup, selectedGroup]);

  const sectionSub = useMemo(() => {
    const tabLabel = selectedTab === "subdept" ? "Sub dept" : selectedTab === "date" ? "Date" : "Cashier";
    return `${tabLabel} · ${dateRangeLabel}`;
  }, [selectedTab, dateRangeLabel]);

  if (screen === "stores") {
    return (
      <CpnStoreList
        coupons={ctx.coupons}
        groupName={(selectedGroup as any)?.group_name ?? "Group"}
        dateRangeLabel={dateRangeLabel}
        sortMetric={sortMetric}
        onSortMetric={setSortMetric}
        onSelect={(storeId) => {
          setSelectedStoreId(storeId);
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
        sectionSub={sectionSub}
        sortMetric={sortMetric}
        onBack={() => setScreen("overview")}
      />
    );
  }

  // Entry screen
  return (
    <div className="h-[calc(100dvh-3rem)] overflow-y-auto bg-gray-50">
      <div className="mx-4 pt-4 pb-2">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col gap-3">
          <div>
            <div className="text-[15px] font-bold text-content">Coupons</div>
            <div className="text-[10px] text-content/50 mt-1">
              Select a store or group and date range to load coupon activity.
            </div>
          </div>
          <StorePicker />
          <DatePickers showBtn={false} handleQuery={getData} />
          {ctx.noCouponsFound && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800">
              No coupons found for the selected store and date range.
            </div>
          )}
          <button
            onClick={getData}
            disabled={ctx.isFetching}
            className="w-full py-2.5 text-[12px] font-semibold text-white rounded-xl bg-[#1e2a4a] hover:bg-[#2a3a63] disabled:opacity-60 transition-colors"
          >
            {ctx.isFetching ? "Loading…" : "Load Coupons"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CouponsMobileDev;
