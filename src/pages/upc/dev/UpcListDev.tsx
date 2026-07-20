import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useUpcDevCtx } from "./hooks/useUpcDevCtx";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setDevIsLoading,
  setDevDataLoaded,
  setDevSalesComp,
  setDevSalesCompLY,
  setDevSalesCompLoaded,
  setDevUpcItems,
  setDevUpcCount,
  setDevStoreids,
  clearDevUpcData,
} from "../../../features/upcDevSlice";
import { getSalesComp } from "../../../api/upc";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { sameWeekDayLastYear } from "../../../utils";
import type { UpcItem, UpcSalesComp } from "../../../interfaces";

import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import UpcSearchCard from "./components/UpcSearchCard";
import UpcLeftPanel from "./components/UpcLeftPanel";
import UpcRightPanel from "./components/UpcRightPanel";

const UpcListDev = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const searchState = useAppSelector((s) => s.search);
  const [reSearchOpen, setReSearchOpen] = useState(false);

  const resolveStoreids = async (): Promise<string | null> => {
    if (searchState.type === "Store") {
      if (!searchState.selectedStore?.storeid) {
        toast.warn("Select a store before running");
        return null;
      }
      return String(searchState.selectedStore.storeid);
    } else {
      if (!searchState.selectedGroup?.id) {
        toast.warn("Select a group before running");
        return null;
      }
      try {
        const res = await getStoresAssignedToUserGroup(
          ctx.url,
          ctx.token,
          searchState.selectedGroup.userid,
          searchState.selectedGroup.id,
        );
        const stores = (res.data?.stores ?? []).filter((s: { active: number }) => s.active === 1);
        if (!stores.length) {
          toast.warn("No active stores in this group");
          return null;
        }
        return stores.map((s: { storeid: number }) => s.storeid).join(",");
      } catch {
        toast.error("Failed to load group stores");
        return null;
      }
    }
  };

  const handleSearch = async () => {
    if (!ctx.upcs.length) {
      toast.warn("Add at least one UPC before running");
      return;
    }

    const storeids = await resolveStoreids();
    if (!storeids) return;

    setReSearchOpen(false);
    // Wipe every tab's fetched/derived state before the new search's results
    // start coming in — otherwise a re-search leaves stale selections and
    // stale tab data (Price Opt/Trend/Association) sitting around mixed in
    // with the new UPC list.
    dispatch(clearDevUpcData());
    dispatch(setDevStoreids(storeids));
    dispatch(setDevIsLoading(true));

    const upcParam = ctx.upcs.join(",");
    const upcItemsMap = new Map<string, UpcItem>();
    // sameWeekDayLastYear returns ISO (YYYY-MM-DD); the API rejects that
    // with a 400 ("Please use mm/dd/yyyy") — reformat to match ctx.startDate/
    // endDate's own m/d/yyyy format. Plain string split, not `new Date(iso)`
    // + getMonth/getDate — that round-trip parses as UTC midnight and can
    // roll back a day in any negative-UTC-offset timezone (all of the US).
    const isoToMdy = (iso: string) => {
      const [y, m, d] = iso.split("-");
      return `${Number(m)}/${Number(d)}/${y}`;
    };
    const lyStartDate = isoToMdy(sameWeekDayLastYear(ctx.startDate).date);
    const lyEndDate = isoToMdy(sameWeekDayLastYear(ctx.endDate).date);

    // LY is a supplementary comparison — fetched alongside TY, but a failed
    // or empty LY response shouldn't block the search the way a failed TY
    // fetch does.
    const [tyResult, lyResult] = await Promise.allSettled([
      getSalesComp(ctx.url, ctx.token, storeids, ctx.startDate, ctx.endDate, upcParam),
      getSalesComp(ctx.url, ctx.token, storeids, lyStartDate, lyEndDate, upcParam),
    ]);

    if (tyResult.status === "rejected") {
      const msg = tyResult.reason instanceof Error ? tyResult.reason.message : "Failed to load sales comp";
      toast.error(msg);
      dispatch(setDevIsLoading(false));
      return;
    }

    const j = tyResult.value.data;
    if (j.error === 0 && j.daily?.length > 0) {
      dispatch(setDevSalesComp(j.daily));
      dispatch(setDevUpcCount(j.upc_count ?? j.daily.length));
      for (const row of j.daily as UpcSalesComp[]) {
        if (!upcItemsMap.has(row.product_code)) {
          upcItemsMap.set(row.product_code, {
            product_code: row.product_code,
            description: row.description,
          });
        }
      }
    }

    if (lyResult.status === "fulfilled") {
      const lyJ = lyResult.value.data;
      if (lyJ.error === 0 && lyJ.daily?.length > 0) {
        dispatch(setDevSalesCompLY(lyJ.daily));
      }
    }

    if (!upcItemsMap.size) {
      toast.warn("No sales comp data found");
      dispatch(setDevIsLoading(false));
      return;
    }

    dispatch(setDevUpcItems(Array.from(upcItemsMap.values())));
    dispatch(setDevSalesCompLoaded(true));
    dispatch(setDevDataLoaded(true));
    dispatch(setDevIsLoading(false));
  };

  if (ctx.isLoading) {
    return (
      <div className="h-[calc(100vh-3rem)] overflow-hidden relative">
        <LoadingIndicator message="Loading sales comp…" />
      </div>
    );
  }

  if (!ctx.dataLoaded) {
    return <UpcSearchCard onSearch={handleSearch} />;
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4">
      <div className="flex gap-3 h-full">
        <UpcLeftPanel onReSearch={() => setReSearchOpen(true)} />
        <UpcRightPanel />
      </div>

      {reSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setReSearchOpen(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <UpcSearchCard onSearch={handleSearch} />
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcListDev;
