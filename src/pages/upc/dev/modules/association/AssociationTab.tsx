// Hooks
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch } from "../../../../../hooks";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAbandonedRetry } from "../../hooks/useAbandonedRetry";

// Redux
import {
  setDevAssociationSeedKey,
  setDevAssociationSeedLoaded,
  setDevAssociationSeedLoading,
  setDevAssociationSeedResult,
  clearDevAssociationSeedError,
  setDevAssociationRerootUpc,
  setDevAssociationRerootLoading,
  dropDevAssociationReroot,
  setDevAssociationRerootCacheEntry,
  clearDevAssociationRerootCache,
  type AssociationItem,
  type AssociationResult,
} from "../../../../../features/dev/devUpcDevSlice";

// API
import { getItemAssociation } from "../../../../../api/upc";

// Utils
import { upcQueue } from "../../upcQueue";
import { failureReason } from "../../utils";
import { buildSeedKey, seedDataFor } from "./associationStats";
import { fmtDate, LIMIT, SEED_DEBOUNCE_MS } from "./utils";

// Interfaces
import type { ContextMenuState } from "./interfaces";

// Components
import UpcContextMenu from "../../../../../components-dev/UpcContextMenu";
import AssociationLeftPanel from "./components/AssociationLeftPanel";
import AssociationDetailPanel from "./components/AssociationDetailPanel";

/** The UPC List's Association tab: fetches the items bought in the same baskets as the
 *  selected seed UPCs, lists them by attach rate, and re-roots on a clicked companion. */
const AssociationTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [retryTick, retry] = useAbandonedRetry();
  /** Why the last re-root didn't load, shown over the seed view it fell back
   *  to. Cleared by the next re-root or Dismiss. */
  const [rerootNote, setRerootNote] = useState<string | null>(null);

  const storeidsArr = useMemo(() => ctx.storeids.split(",").map(Number).filter(Boolean), [ctx.storeids]);

  // Local-only description lookup, never dispatched into ctx.upcItems:
  // companions are basket-discovered, and writing them there would leak them
  // into the left panel's UPC list. Covers naming the re-root target.
  const upcItemsMap = useMemo(() => {
    const map = new Map(ctx.upcItems.map((i) => [i.product_code, i.description]));
    for (const item of ctx.associationSeedData?.items ?? []) {
      map.set(item.product_code, item.product_description);
    }
    for (const cached of Object.values(ctx.associationRerootCache)) {
      for (const item of cached.items) map.set(item.product_code, item.product_description);
    }
    return map;
  }, [ctx.upcItems, ctx.associationSeedData, ctx.associationRerootCache]);

  // The seed items' own records, from the fetch's is_seed rows, so the left
  // panel can show each seed's revenue and sub department like the other tabs.
  const seedItemsMap = useMemo(() => {
    const map = new Map<string, AssociationItem>();
    for (const item of ctx.associationSeedData?.items ?? []) {
      if (item.is_seed) map.set(item.product_code, item);
    }
    return map;
  }, [ctx.associationSeedData]);

  const hasSelection = ctx.selectedUpcs.length > 0;
  const seedUpcs = ctx.selectedUpcs;

  const fetchSeed = async (upcsToQuery: string[]) => {
    const key = buildSeedKey(upcsToQuery);
    dispatch(setDevAssociationSeedLoading(true));
    try {
      const res = await upcQueue.enqueue(`assoc:seed:${buildSeedKey(upcsToQuery)}`, (signal) =>
        getItemAssociation(
          ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
          storeidsArr, upcsToQuery, LIMIT, "top", signal,
        ),
      );
      // Superseded by a newer search: marked unloaded (not left loaded from
      // the previous seed) and looked at again against the current search.
      if (!res) {
        dispatch(setDevAssociationSeedLoading(false));
        dispatch(setDevAssociationSeedLoaded(false));
        retry();
        return;
      }
      // A failed answer is recorded as one, with its reason.
      if (res.data.error === 0) {
        const items: AssociationItem[] = res.data.items ?? [];
        const result = { totalBaskets: res.data.total_baskets, items };
        dispatch(setDevAssociationSeedResult({ key, result, error: null }));
      } else {
        const error = res.data.msg || "the association lookup failed";
        dispatch(setDevAssociationSeedResult({ key, result: null, error }));
      }
      // The result settles loading and loaded itself, and only for the seed
      // set on screen: an answer for a set since left is dropped.
    } catch (err) {
      dispatch(setDevAssociationSeedResult({ key, result: null, error: failureReason(err) }));
    }
  };

  /** Ask again for the seed set that failed. */
  const retrySeed = () => {
    dispatch(clearDevAssociationSeedError());
    dispatch(setDevAssociationSeedLoaded(false));
    retry();
  };

  // Fetches when the seed set's content changes (buildSeedKey). Unlike the
  // other tabs it never defaults to the full upcs list: it stays idle until
  // the user picks seed items (hasSelection).
  const seedKey = buildSeedKey(seedUpcs);

  useEffect(() => {
    if (ctx.activeTab !== "association") return;
    if (!hasSelection || !ctx.storeids) return;
    if (ctx.associationSeedLoaded && seedKey === ctx.associationSeedKey) return;

    // Debounced: the cleanup cancels the pending timer on every seed change,
    // so only the last click in a run fires.
    const timer = setTimeout(() => {
      dispatch(setDevAssociationSeedKey(seedKey));
      dispatch(setDevAssociationRerootUpc(null));
      dispatch(clearDevAssociationRerootCache());
      fetchSeed(seedUpcs);
    }, SEED_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // seedKey, not the count: swapping one UPC for another keeps the count.
    // ctx.activeTab: waits for an actual visit (see PriceOptTab).
    // ctx.searchVersion: forces a refetch on a same-UPC re-search.
  }, [ctx.activeTab, hasSelection, seedKey, ctx.storeids, ctx.searchVersion, retryTick]);

  const rerootTo = async (upc: string) => {
    setRerootNote(null);
    dispatch(setDevAssociationRerootUpc(upc));
    if (ctx.associationRerootCache[upc]) return;
    dispatch(setDevAssociationRerootLoading(true));
    // A re-root that can't load goes back to the seed view and says why.
    const fail = (why: string) => {
      dispatch(dropDevAssociationReroot(upc));
      setRerootNote(`Couldn't load associations for ${upcItemsMap.get(upc) ?? upc}: ${why}.`);
    };
    try {
      const res = await upcQueue.enqueue(`assoc:reroot:${upc}`, (signal) =>
        getItemAssociation(
          ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
          storeidsArr, [upc], LIMIT, "top", signal,
        ),
      );
      // Superseded by a newer search: back to the seed view quietly, since
      // nothing failed.
      if (!res) {
        dispatch(dropDevAssociationReroot(upc));
        return;
      }
      if (res.data.error === 0) {
        const items: AssociationItem[] = res.data.items ?? [];
        const result: AssociationResult = { totalBaskets: res.data.total_baskets, items };
        dispatch(setDevAssociationRerootCacheEntry({ upc, result }));
      } else {
        fail(res.data.msg || "the association lookup failed");
      }
    } catch (err) {
      fail(failureReason(err));
    } finally {
      dispatch(setDevAssociationRerootLoading(false));
    }
  };

  const backToSeed = () => dispatch(setDevAssociationRerootUpc(null));

  const openContextMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, upc });
  };

  if (!ctx.searchedUpcs.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/95">
        Add UPCs to see associations
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/95">
        Select UPCs to see associations
      </div>
    );
  }

  if (ctx.associationSeedError && ctx.associationSeedKey === seedKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full text-[11px] text-content/95">
        <span>Associations didn't load: {ctx.associationSeedError}.</span>
        <button
          type="button"
          onClick={retrySeed}
          className="text-[12px] font-semibold text-brand_navy_hover underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  // Only the answer for the UPCs ticked now; until it lands, the tab says
  // it's loading.
  const seedData = seedDataFor(
    ctx.selectedUpcs,
    ctx.associationSeedData,
    ctx.associationSeedDataKey,
  );
  if (!seedData) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/95">
        Loading associations…
      </div>
    );
  }

  const rerootUpc = ctx.associationRerootUpc;
  const rerootResult = rerootUpc ? ctx.associationRerootCache[rerootUpc] : null;

  const activeResult: AssociationResult | null = rerootUpc ? rerootResult : seedData;

  const allVisibleUpcs = [
    ...ctx.searchedUpcs,
    ...seedData.items.map((i) => i.product_code),
  ];

  return (
    <div className="flex-1 overflow-hidden flex min-h-0">
      <AssociationLeftPanel
        selectedUpcs={ctx.selectedUpcs}
        upcItemsMap={upcItemsMap}
        seedItemsMap={seedItemsMap}
        rerootUpc={rerootUpc}
        rerootDescription={rerootUpc ? (upcItemsMap.get(rerootUpc) ?? rerootUpc) : ""}
        onBackToSeed={backToSeed}
      />

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        {rerootNote && !rerootUpc && (
          <div className="flex items-center justify-between gap-3 px-4 py-1.5 border-b border-gray-100 flex-shrink-0 text-[11px] text-content/95">
            <span>{rerootNote}</span>
            <button
              type="button"
              onClick={() => setRerootNote(null)}
              className="font-semibold text-brand_navy_hover underline underline-offset-2 flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* A re-root with no answer yet is loading, whatever the shared
            loading flag says; a failed or cancelled one leaves the re-root. */}
        {rerootUpc && !rerootResult ? (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/95">
            Loading {upcItemsMap.get(rerootUpc) ?? rerootUpc}’s associations…
          </div>
        ) : activeResult ? (
          <AssociationDetailPanel
            result={activeResult}
            title={rerootUpc ? (upcItemsMap.get(rerootUpc) ?? rerootUpc) : `${seedUpcs.length} seed items`}
            isReroot={Boolean(rerootUpc)}
            rerootUpc={rerootUpc}
            prevTotalBaskets={rerootUpc ? seedData.totalBaskets : undefined}
            onReroot={rerootTo}
            onContextMenu={openContextMenu}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[11px] text-content/95">No associations found</div>
        )}
      </div>

      {contextMenu && (
        <UpcContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          upc={contextMenu.upc}
          allUpcs={allVisibleUpcs}
          extraActions={[{ label: "Look up associations", onClick: () => rerootTo(contextMenu.upc) }]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default AssociationTab;
