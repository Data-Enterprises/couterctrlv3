import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useUpcDevCtx } from "./hooks/useUpcDevCtx";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setDevIsLoading,
  setDevDataLoaded,
  setDevSalesComp,
  setDevSalesCompLoaded,
  setDevUpcItems,
  setDevUpcCount,
  setDevStoreids,
} from "../../../features/upcDevSlice";
import { getSalesComp } from "../../../api/upc";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
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
    dispatch(setDevStoreids(storeids));
    dispatch(setDevIsLoading(true));

    const upcParam = ctx.upcs.join(",");
    const upcItemsMap = new Map<string, UpcItem>();

    try {
      const res = await getSalesComp(ctx.url, ctx.token, storeids, ctx.startDate, ctx.endDate, upcParam);
      const j = res.data;
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load sales comp";
      toast.error(msg);
      dispatch(setDevIsLoading(false));
      return;
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
