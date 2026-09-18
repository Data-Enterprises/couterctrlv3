import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useUpcDevCtx } from "./hooks/useUpcDevCtx";
import { useToast } from "../../../components/toasts/hooks/useToast";
import {
  setDevDataLoaded,
  seedDevUpcItems,
  setDevStoreids,
  setDevSearchSnapshot,
  removeDevUpcs,
  clearDevUpcData,
  setUpcDevEnv,
} from "../../../features/upcDevSlice";
import { getStoresAssignedToUserGroup } from "../../../api/groups";
import { upcQueue } from "./upcQueue";

import UpcSearchCard from "./components/UpcSearchCard";
import UpcLeftPanel from "./components/UpcLeftPanel";
import UpcRightPanel from "./components/UpcRightPanel";

/** Everything except the UPC list that decides whether loaded data is still
 *  valid. Two searches with the same scope key differ only in their UPCs, which
 *  is the case a pure removal can be answered from state. Built from the search
 *  *selection* rather than resolved storeids so the check costs nothing — a
 *  group's store list is fetched, and a pure removal shouldn't pay even for
 *  that. */
const buildScopeKey = (
  type: string,
  storeid: number | string | undefined,
  groupId: number | string | undefined,
  startDate: string,
  endDate: string,
) => [type, type === "Store" ? storeid ?? "" : groupId ?? "", startDate, endDate].join("|");

const UpcList = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const searchState = useAppSelector((s) => s.search);
  const [reSearchOpen, setReSearchOpen] = useState(false);

  /**
   * Keep the data pointed at the backend the session is pointed at.
   *
   * Written as "do these two disagree" rather than "did apiEnv just change",
   * so it covers the switch made while this page is open AND the switch made
   * somewhere else before navigating here — a ref comparing against the
   * previous render would miss the second, because this component was not
   * mounted for it.
   *
   * The queue is aborted before the swap, in that order and synchronously:
   * `startRun` abandons in-flight jobs and resolves them null, so the `if
   * (!res) return` in every tab bails instead of merging the outgoing
   * backend's answer into the incoming environment's rows.
   */
  const envMismatch = ctx.env !== ctx.apiEnv;
  useEffect(() => {
    if (!envMismatch) return;
    upcQueue.startRun();
    dispatch(setUpcDevEnv(ctx.apiEnv));
  }, [envMismatch, ctx.apiEnv]);

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

    const scopeKey = buildScopeKey(
      searchState.type,
      searchState.selectedStore?.storeid,
      searchState.selectedGroup?.id,
      ctx.startDate,
      ctx.endDate,
    );
    const removed = ctx.searchedUpcs.filter((u) => !ctx.upcs.includes(u));
    const added = ctx.upcs.filter((u) => !ctx.searchedUpcs.includes(u));

    // A search that only took UPCs away asks for a strict subset of what's
    // already loaded, so it can be answered by arithmetic instead of three
    // heavy calls. Every module's rows are keyed on product_code and carry
    // only that UPC's own numbers, so pruning them lands on exactly the state
    // a re-fetch would have produced.
    //
    // Conditions are deliberately narrow: same store/group, same dates, and
    // nothing added. Any of those changing means the loaded rows are answers
    // to a different question and have to be re-fetched.
    if (ctx.dataLoaded && scopeKey === ctx.searchedScopeKey && removed.length && !added.length) {
      // Anything still loading is fetching the pre-prune UPC set, and every
      // module setter replaces its whole array — so that response would put
      // the removed UPC straight back a second after it disappeared. Aborting
      // leaves that module unloaded, and the version bump inside removeDevUpcs
      // sends it back for the reduced set when the user next looks at it.
      upcQueue.startRun();
      dispatch(removeDevUpcs(removed));
      setReSearchOpen(false);
      toast.success(
        `Removed ${removed.length} UPC${removed.length === 1 ? "" : "s"}`,
      );
      return;
    }

    const storeids = await resolveStoreids();
    if (!storeids) return;

    setReSearchOpen(false);

    // Past this point the previous run's results are unwanted: its queued jobs
    // are dropped before they reach the network and its in-flight ones are
    // aborted. Deliberately below resolveStoreids, which can bail out (no store
    // picked, group lookup failed) and leave the page on its existing data —
    // killing that data's in-flight refreshes for a search that never happened
    // would strand it half-loaded.
    upcQueue.startRun();

    // Two shapes of search, and the difference is the whole point of the
    // coverage model:
    //
    //  - Same store, same dates, UPCs added: the loaded rows are still true
    //    answers, they just don't cover the new UPCs. Nothing is wiped; each
    //    module's coverage stays as it was, so its next fetch asks only for
    //    what it's missing. Adding one UPC to a nine-UPC search costs one
    //    one-UPC call per module the user actually opens.
    //
    //  - Anything else (different store, different dates, first search): the
    //    loaded rows answer a different question, so everything goes.
    const incremental = ctx.dataLoaded && scopeKey === ctx.searchedScopeKey;
    if (incremental) {
      if (removed.length) dispatch(removeDevUpcs(removed));
    } else {
      dispatch(clearDevUpcData());
      dispatch(setDevStoreids(storeids));
    }

    // The roster is the searched UPC list, not whatever an endpoint returned,
    // so the left panel is complete and stable from the moment the search
    // commits. Descriptions arrive as modules respond.
    dispatch(seedDevUpcItems(ctx.upcs));
    dispatch(setDevSearchSnapshot({ upcs: ctx.upcs, scopeKey }));
    dispatch(setDevDataLoaded(true));
    // No fetch here. Every module — Sales Comp included — asks for its own
    // delta when the user actually opens it. A search costs zero calls on its
    // own; the tab you land on makes exactly one.
  };

  // One render can fall between the environment changing and the effect above
  // swapping the data, and `ctx.fixes` has already flipped by then — so this
  // would otherwise paint one frame of the other environment's rows read under
  // this one's rules. Nothing is cheaper to show than the wrong numbers.
  if (envMismatch) return null;

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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setReSearchOpen(false)}
        >
          {/* Wrapper only shrink-wraps the card — the backdrop does the
              centering. If this spanned the viewport its stopPropagation
              would eat every backdrop click. Matches SmDevSearchOverlay. */}
          <div className="mx-4" onClick={(e) => e.stopPropagation()}>
            <UpcSearchCard
              onSearch={handleSearch}
              onClose={() => setReSearchOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcList;
