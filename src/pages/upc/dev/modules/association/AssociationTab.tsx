import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevAssociationSeedKey,
  setDevAssociationSeedLoaded,
  setDevAssociationSeedLoading,
  setDevAssociationSeedResult,
  clearDevAssociationSeedError,
  setDevAssociationRerootUpc,
  setDevAssociationRerootLoading,
  setDevAssociationRerootCacheEntry,
  clearDevAssociationRerootCache,
  type AssociationItem,
  type AssociationResult,
} from "../../../../../features/dev/devUpcDevSlice";
import { getItemAssociation } from "../../../../../api/upc";
import { upcQueue } from "../../upcQueue";
import { useAbandonedRetry } from "../../hooks/useAbandonedRetry";
import { failureReason } from "../../answer";
import { buildSeedKey, seedDataFor } from "./associationStats";
import AssociationLeftPanel from "./AssociationLeftPanel";
import AssociationDetailPanel from "./AssociationDetailPanel";
import UpcContextMenu from "../../../../../components-dev/UpcContextMenu";

const LIMIT = 25;

/** The seed set changes on every checkbox click, and each change is a basket
 *  association fetch. Selecting ten UPCs one at a time used to be ten heavy
 *  calls; this collapses a run of clicks into the one that reflects where the
 *  user actually stopped. Long enough to cover deliberate clicking, short
 *  enough that it doesn't read as lag. */
const SEED_DEBOUNCE_MS = 600;

const fmtDate = (d: string) => {
  const [m, day, y] = d.split("/");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

type ContextMenuState = { x: number; y: number; upc: string };

const AssociationTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [retryTick, retry] = useAbandonedRetry();

  const storeidsArr = useMemo(() => ctx.storeids.split(",").map(Number).filter(Boolean), [ctx.storeids]);

  // Local-only description lookup — deliberately never dispatched into the
  // shared ctx.upcItems map. Association's companions are basket-discovered,
  // not part of the actual workbook search, and the page-level "UPC Upload"
  // left panel renders straight off ctx.upcItems with no cross-check against
  // ctx.upcs — writing companion descriptions there would leak them into
  // that list. Every AssociationItem already carries its own
  // product_description, so this only needs to cover the one case that
  // doesn't have one in scope on its own: naming the current re-root target.
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

  // The seed item's own record, keyed off the fetch's own is_seed rows —
  // only available once a seed fetch has actually run, same as upcItemsMap.
  // Lets the left panel show each seed UPC's own revenue and sub department,
  // matching the other 3 modules' left-column rows (a right-aligned value
  // plus a right-aligned secondary fact), and makes the CTA insight's "Same
  // as seed" breakdown checkable against something visible instead of taken
  // on faith.
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
      // Superseded by a newer search. The seed key was already moved to this
      // seed set, so a seedLoaded left true by the previous seed would let the
      // guard below take that seed's companions for this one and never ask.
      // Marked unloaded instead, and looked at again against the search as it
      // is now.
      if (!res) {
        dispatch(setDevAssociationSeedLoading(false));
        dispatch(setDevAssociationSeedLoaded(false));
        retry();
        return;
      }
      // A failed answer is recorded as one, with its reason. It used to mark
      // the seed loaded and leave the previous seed's companions in place,
      // which then showed under this seed set's title with no retry.
      if (res.data.error === 0) {
        const items: AssociationItem[] = res.data.items ?? [];
        const result = { totalBaskets: res.data.total_baskets, items };
        dispatch(setDevAssociationSeedResult({ key, result, error: null }));
      } else {
        const error = res.data.msg || "the association lookup failed";
        dispatch(setDevAssociationSeedResult({ key, result: null, error }));
      }
      dispatch(setDevAssociationSeedLoading(false));
      dispatch(setDevAssociationSeedLoaded(true));
    } catch (err) {
      dispatch(setDevAssociationSeedResult({ key, result: null, error: failureReason(err) }));
      dispatch(setDevAssociationSeedLoading(false));
      dispatch(setDevAssociationSeedLoaded(true));
    }
  };

  /** Ask again for the seed set that failed. */
  const retrySeed = () => {
    dispatch(clearDevAssociationSeedError());
    dispatch(setDevAssociationSeedLoaded(false));
    retry();
  };

  // Fetches whenever the effective seed set actually changes — content, not
  // just length, is what buildSeedKey compares against associationSeedKey
  // below, so an unrelated re-render never refetches. Unlike every other
  // tab, Association never falls back to the full upcs list as an implicit
  // default seed: showing KPIs/CTA copy framed around "your seed items"
  // before the user has actually picked any doesn't read sensibly, so this
  // stays idle until hasSelection is true — the user picks what to check.
  const seedKey = buildSeedKey(seedUpcs);

  useEffect(() => {
    if (ctx.activeTab !== "association") return;
    if (!hasSelection || !ctx.storeids) return;
    if (ctx.associationSeedLoaded && seedKey === ctx.associationSeedKey) return;

    // Debounced, so a user working down the list with the checkboxes sends one
    // fetch for where they landed rather than one per click. The cleanup
    // cancels the pending timer on every seed change, so only the last one in a
    // run of clicks survives to fire.
    const timer = setTimeout(() => {
      dispatch(setDevAssociationSeedKey(seedKey));
      dispatch(setDevAssociationRerootUpc(null));
      dispatch(clearDevAssociationRerootCache());
      fetchSeed(seedUpcs);
    }, SEED_DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // seedKey, not selectedUpcs.length: swapping one UPC for another leaves the
    // count unchanged, and keying on length meant that case silently kept the
    // previous seed's companions on screen.
    //
    // ctx.activeTab: the fetch waits for an actual visit — see PriceOptTab.
    // ctx.searchVersion: a re-search with the exact same UPCs/store wouldn't
    // otherwise change buildSeedKey's output, so it's needed to force a
    // refetch the same way every other tab's initial-fetch effect does.
  }, [ctx.activeTab, hasSelection, seedKey, ctx.storeids, ctx.searchVersion, retryTick]);

  const rerootTo = async (upc: string) => {
    dispatch(setDevAssociationRerootUpc(upc));
    if (ctx.associationRerootCache[upc]) return;
    dispatch(setDevAssociationRerootLoading(true));
    try {
      const res = await upcQueue.enqueue(`assoc:reroot:${upc}`, (signal) =>
        getItemAssociation(
          ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
          storeidsArr, [upc], LIMIT, "top", signal,
        ),
      );
      // Superseded by a newer search — the re-root cache has been cleared and
      // this companion belongs to the old seed set.
      if (!res) return;
      if (res.data.error === 0) {
        const items: AssociationItem[] = res.data.items ?? [];
        const result: AssociationResult = { totalBaskets: res.data.total_baskets, items };
        dispatch(setDevAssociationRerootCacheEntry({ upc, result }));
      }
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
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Add UPCs to see associations
      </div>
    );
  }

  if (!hasSelection) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Select UPCs to see associations
      </div>
    );
  }

  if (ctx.associationSeedError && ctx.associationSeedKey === seedKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 h-full text-[11px] text-content/85">
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

  // Only the answer for the UPCs ticked now. Between ticking a new set and its
  // answer landing -- the debounce, then the call -- the previous set's
  // companions are not this set's, so the tab says it's loading instead.
  const seedData = seedDataFor(
    ctx.selectedUpcs,
    ctx.associationSeedData,
    ctx.associationSeedDataKey,
  );
  if (!seedData) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
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

      {rerootUpc && ctx.associationRerootLoading && !rerootResult ? (
        <div className="flex-1 flex items-center justify-center text-[11px] text-content/85">
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
        <div className="flex-1 flex items-center justify-center text-[11px] text-content/85">No associations found</div>
      )}

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
