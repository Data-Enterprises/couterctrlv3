import { useEffect, useMemo, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevAssociationSeedKey,
  setDevAssociationSeedLoaded,
  setDevAssociationSeedLoading,
  setDevAssociationSeedData,
  setDevAssociationRerootUpc,
  setDevAssociationRerootLoading,
  setDevAssociationRerootCacheEntry,
  clearDevAssociationRerootCache,
  type AssociationItem,
  type AssociationResult,
} from "../../../../../features/upcDevSlice";
import { getItemAssociation } from "../../../../../api/upc";
import AssociationLeftPanel from "./AssociationLeftPanel";
import AssociationDetailPanel from "./AssociationDetailPanel";
import UpcContextMenu from "../../../../../components/UpcContextMenu";

const LIMIT = 25;

const fmtDate = (d: string) => {
  const [m, day, y] = d.split("/");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

const buildSeedKey = (upcs: string[]) => [...upcs].sort().join(",");

type ContextMenuState = { x: number; y: number; upc: string };

const AssociationTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

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
    dispatch(setDevAssociationSeedLoading(true));
    try {
      const res = await getItemAssociation(
        ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
        storeidsArr, upcsToQuery, LIMIT, "top",
      );
      if (res.data.error === 0) {
        const items: AssociationItem[] = res.data.items ?? [];
        dispatch(setDevAssociationSeedData({ totalBaskets: res.data.total_baskets, items }));
      }
    } finally {
      dispatch(setDevAssociationSeedLoading(false));
      dispatch(setDevAssociationSeedLoaded(true));
    }
  };

  // Fetches whenever the effective seed set actually changes — content, not
  // just length, is what buildSeedKey compares against associationSeedKey
  // below, so an unrelated re-render never refetches. Unlike every other
  // tab, Association never falls back to the full upcs list as an implicit
  // default seed: showing KPIs/CTA copy framed around "your seed items"
  // before the user has actually picked any doesn't read sensibly, so this
  // stays idle until hasSelection is true — the user picks what to check.
  useEffect(() => {
    if (!hasSelection || !ctx.storeids) return;

    const key = buildSeedKey(seedUpcs);
    if (ctx.associationSeedLoaded && key === ctx.associationSeedKey) return;

    dispatch(setDevAssociationSeedKey(key));
    dispatch(setDevAssociationRerootUpc(null));
    dispatch(clearDevAssociationRerootCache());
    fetchSeed(seedUpcs);
    // ctx.searchVersion: a re-search with the exact same UPCs/store wouldn't
    // otherwise change buildSeedKey's output, so it's needed to force a
    // refetch the same way every other tab's initial-fetch effect does.
  }, [hasSelection, ctx.selectedUpcs.length, ctx.storeids, ctx.searchVersion]);

  const rerootTo = async (upc: string) => {
    dispatch(setDevAssociationRerootUpc(upc));
    if (ctx.associationRerootCache[upc]) return;
    dispatch(setDevAssociationRerootLoading(true));
    try {
      const res = await getItemAssociation(
        ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
        storeidsArr, [upc], LIMIT, "top",
      );
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

  if (!ctx.upcs.length) {
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

  if (ctx.associationSeedLoading && !ctx.associationSeedLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Loading associations…
      </div>
    );
  }

  if (!ctx.associationSeedLoaded || !ctx.associationSeedData) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Navigate here to load associations
      </div>
    );
  }

  const rerootUpc = ctx.associationRerootUpc;
  const rerootResult = rerootUpc ? ctx.associationRerootCache[rerootUpc] : null;

  const activeResult: AssociationResult | null = rerootUpc ? rerootResult : ctx.associationSeedData;

  const allVisibleUpcs = [
    ...ctx.upcs,
    ...(ctx.associationSeedData?.items.map((i) => i.product_code) ?? []),
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
          prevTotalBaskets={rerootUpc ? ctx.associationSeedData?.totalBaskets : undefined}
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
