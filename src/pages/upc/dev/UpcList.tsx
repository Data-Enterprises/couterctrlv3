// Hooks
import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useToast } from "../../../components/toasts/hooks/useToast";
import { useUpcDevCtx } from "./hooks/useUpcDevCtx";

// Redux
import {
  setDevDataLoaded,
  seedDevUpcItems,
  setDevStoreids,
  setDevSearchSnapshot,
  removeDevUpcs,
  clearDevUpcData,
} from "../../../features/dev/devUpcDevSlice";

// API
import { getStoresAssignedToUserGroup } from "../../../api/groups";

// Utils
import { upcQueue } from "./upcQueue";
import { buildScopeKey, sameStores } from "./utils";

// Components
import UpcSearchCard from "./components/UpcSearchCard";
import UpcLeftPanel from "./components/UpcLeftPanel";
import UpcRightPanel from "./components/UpcRightPanel";

/** The UPC List page: the search card until a search runs, then the UPC list on the left
 *  and the tabs on the right, with a re-search overlay. A search that only removes UPCs
 *  prunes loaded rows; one for the same store and dates fetches only what's missing. */
const UpcList = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const searchState = useAppSelector((s) => s.search);
  const [reSearchOpen, setReSearchOpen] = useState(false);
  /**
   * Which search is the newest. Each search takes a number; one whose group
   * store lookup returns after a newer search has started is dropped.
   */
  const searchSeq = useRef(0);
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (!reSearchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReSearchOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [reSearchOpen]);

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
    const seq = ++searchSeq.current;

    // The live search, not ctx: this is the one place that reads what is
    // about to be asked.
    const scopeKey = buildScopeKey(
      searchState.type,
      searchState.selectedStore?.storeid,
      searchState.selectedGroup?.id,
      searchState.startDate,
      searchState.endDate,
    );
    const removed = ctx.searchedUpcs.filter((u) => !ctx.upcs.includes(u));
    const added = ctx.upcs.filter((u) => !ctx.searchedUpcs.includes(u));

    // A search that only removed UPCs is a subset of what's loaded, so it is
    // answered by pruning rows (keyed on product_code) instead of re-fetching.
    // Only when the store/group and dates are the same and nothing was added.
    if (ctx.dataLoaded && scopeKey === ctx.searchedScopeKey && removed.length && !added.length) {
      // Anything still loading is fetching the old UPC set and would put the
      // removed UPC back; aborting leaves it unloaded, and removeDevUpcs's
      // version bump re-asks for the reduced set on the next visit.
      upcQueue.startRun();
      dispatch(removeDevUpcs(removed));
      // No lookup here, but an older search's may still be pending; it was
      // just superseded and won't clear the busy state itself.
      setLookingUp(false);
      setReSearchOpen(false);
      toast.success(
        `Removed ${removed.length} UPC${removed.length === 1 ? "" : "s"}`,
      );
      return;
    }

    setLookingUp(true);
    const storeids = await resolveStoreids();
    // A newer search has started while this one looked its stores up: that
    // one owns the page now, and its own lookup clears the busy state.
    if (seq !== searchSeq.current) return;
    setLookingUp(false);
    if (!storeids) return;

    setReSearchOpen(false);

    // From here the previous run's queued jobs are dropped and in-flight ones
    // aborted. Kept below resolveStoreids, which can bail out and leave the
    // page on its existing data.
    upcQueue.startRun();

    // Two shapes of search:
    //
    //  - Same store, same dates, UPCs added: nothing is wiped; each module's
    //    next fetch asks only for what it's missing.
    //  - Anything else: the loaded rows answer a different question, so
    //    everything goes.
    //
    // A group can hold different stores than last time, so the stores just
    // looked up are compared too, not only the group in the scope key.
    const incremental =
      ctx.dataLoaded && scopeKey === ctx.searchedScopeKey && sameStores(storeids, ctx.storeids);
    if (incremental) {
      if (removed.length) dispatch(removeDevUpcs(removed));
    } else {
      dispatch(clearDevUpcData());
      dispatch(setDevStoreids(storeids));
    }

    // The roster is the searched UPC list, so the left panel is complete from
    // the moment the search commits; descriptions arrive as modules respond.
    dispatch(seedDevUpcItems(ctx.upcs));
    dispatch(
      setDevSearchSnapshot({
        upcs: ctx.upcs,
        scopeKey,
        scope: {
          type: searchState.type,
          startDate: searchState.startDate,
          endDate: searchState.endDate,
          selectedStore: searchState.selectedStore,
          selectedGroup: searchState.selectedGroup,
        },
      }),
    );
    dispatch(setDevDataLoaded(true));
    // No fetch here: each tab asks for its own delta when opened, so a search
    // costs nothing and the tab you land on makes one call.
  };

  if (!ctx.dataLoaded) {
    return <UpcSearchCard onSearch={handleSearch} busy={lookingUp} />;
  }

  return (
    <div className="h-[calc(100vh-3rem)] overflow-hidden p-4">
      <div className="flex gap-3 h-full">
        <UpcLeftPanel onReSearch={() => setReSearchOpen(true)} />
        <UpcRightPanel />
      </div>

      {reSearchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
          onClick={() => setReSearchOpen(false)}
        >
          {/* Shrink-wraps the card; the backdrop centers. Spanning the
              viewport would swallow backdrop clicks. */}
          <div className="mx-4" onClick={(e) => e.stopPropagation()}>
            <UpcSearchCard
              onSearch={handleSearch}
              onClose={() => setReSearchOpen(false)}
              busy={lookingUp}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcList;
