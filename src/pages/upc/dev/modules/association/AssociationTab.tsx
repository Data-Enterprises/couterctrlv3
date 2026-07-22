import { useEffect, useMemo, useRef, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  setDevAllSelectedUpcs,
  toggleDevSelectedUpc,
  setDevUpcItems,
  setDevAssociationSeedKey,
  setDevAssociationSeedLoaded,
  setDevAssociationSeedLoading,
  setDevAssociationSeedData,
  setDevAssociationRerootUpc,
  setDevAssociationRerootLoading,
  setDevAssociationRerootCacheEntry,
  clearDevAssociationRerootCache,
  setDevAssociationPrevSeedData,
  setDevAssociationSeedChangeNote,
  type AssociationItem,
  type AssociationResult,
} from "../../../../../features/upcDevSlice";
import { getItemAssociation } from "../../../../../api/upc";
import { excludeCurrentUpc, computeAttachRateDeltas, disappearedItems } from "./associationStats";
import AssociationLeftPanel from "./AssociationLeftPanel";
import AssociationDetailPanel, { type AssociationDeltaContext } from "./AssociationDetailPanel";
import UpcContextMenu from "../../../../../components/UpcContextMenu";

const LIMIT = 20;

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
  const upcItemsMap = useMemo(
    () => new Map(ctx.upcItems.map((i) => [i.product_code, i.description])),
    [ctx.upcItems],
  );

  const seedUpcs = ctx.selectedUpcs.length > 0 ? ctx.selectedUpcs : ctx.upcs;
  const prevSeedUpcsRef = useRef<string[]>([]);

  const rememberDescriptions = (items: AssociationItem[]) => {
    dispatch(setDevUpcItems(items.map((i) => ({ product_code: i.product_code, description: i.product_description }))));
  };

  const fetchSeed = async (upcsToQuery: string[]) => {
    dispatch(setDevAssociationSeedLoading(true));
    try {
      const res = await getItemAssociation(
        ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
        storeidsArr, upcsToQuery, LIMIT, "top",
      );
      if (res.data.error === 0) {
        const items: AssociationItem[] = res.data.items ?? [];
        rememberDescriptions(items);
        dispatch(setDevAssociationSeedData({ totalBaskets: res.data.total_baskets, items }));
      }
    } finally {
      dispatch(setDevAssociationSeedLoading(false));
      dispatch(setDevAssociationSeedLoaded(true));
    }
  };

  // Materializes selectedUpcs to the full list on first entry (so every
  // checkbox toggle afterward is a simple, unambiguous membership change),
  // then fetches whenever the effective seed set actually changes — content,
  // not just length, is what buildSeedKey compares against
  // associationSeedKey below, so an unrelated re-render never refetches.
  useEffect(() => {
    if (!ctx.upcs.length || !ctx.storeids) return;
    if (ctx.selectedUpcs.length === 0) {
      dispatch(setDevAllSelectedUpcs(ctx.upcs));
      return;
    }

    const key = buildSeedKey(seedUpcs);
    if (ctx.associationSeedLoaded && key === ctx.associationSeedKey) return;

    const isChange = ctx.associationSeedLoaded && ctx.associationSeedData !== null;
    if (isChange) {
      const prevUpcs = prevSeedUpcsRef.current;
      const removed = prevUpcs.filter((u) => !seedUpcs.includes(u));
      const added = seedUpcs.filter((u) => !prevUpcs.includes(u));
      const describe = (u: string) => upcItemsMap.get(u) ?? u;
      const note = removed.length
        ? `You removed ${describe(removed[0])}${removed.length > 1 ? ` (+${removed.length - 1} more)` : ""} from your seed set`
        : added.length
          ? `You added ${describe(added[0])}${added.length > 1 ? ` (+${added.length - 1} more)` : ""} to your seed set`
          : "Your seed set changed";
      dispatch(setDevAssociationPrevSeedData(ctx.associationSeedData));
      dispatch(setDevAssociationSeedChangeNote(note));
    } else {
      dispatch(setDevAssociationPrevSeedData(null));
      dispatch(setDevAssociationSeedChangeNote(null));
    }

    prevSeedUpcsRef.current = seedUpcs;
    dispatch(setDevAssociationSeedKey(key));
    dispatch(setDevAssociationRerootUpc(null));
    dispatch(clearDevAssociationRerootCache());
    fetchSeed(seedUpcs);
    // ctx.searchVersion: a re-search with the exact same UPCs/store wouldn't
    // otherwise change buildSeedKey's output, so it's needed to force a
    // refetch the same way every other tab's initial-fetch effect does.
  }, [ctx.upcs.length, ctx.selectedUpcs.length, ctx.storeids, ctx.searchVersion]);

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
        rememberDescriptions(items);
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

  const activeResult: AssociationResult | null = rerootUpc
    ? rerootResult
      ? { totalBaskets: rerootResult.totalBaskets, items: excludeCurrentUpc(rerootResult.items, rerootUpc) }
      : null
    : ctx.associationSeedData;

  const deltaContext: AssociationDeltaContext | null =
    !rerootUpc && ctx.associationPrevSeedData && ctx.associationSeedChangeNote
      ? {
          prevSeedCount: prevSeedUpcsRef.current.length,
          changeNote: ctx.associationSeedChangeNote,
          deltas: computeAttachRateDeltas(ctx.associationPrevSeedData.items, ctx.associationSeedData.items),
          disappeared: disappearedItems(ctx.associationPrevSeedData.items, ctx.associationSeedData.items),
        }
      : null;

  const allVisibleUpcs = [
    ...ctx.upcs,
    ...(ctx.associationSeedData?.items.map((i) => i.product_code) ?? []),
  ];

  return (
    <div className="flex-1 overflow-hidden flex min-h-0">
      <AssociationLeftPanel
        upcs={ctx.upcs}
        selectedUpcs={ctx.selectedUpcs}
        upcItemsMap={upcItemsMap}
        rerootUpc={rerootUpc}
        rerootDescription={rerootUpc ? (upcItemsMap.get(rerootUpc) ?? rerootUpc) : ""}
        onToggleUpc={(code) => dispatch(toggleDevSelectedUpc(code))}
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
          prevTotalBaskets={rerootUpc ? ctx.associationSeedData?.totalBaskets : undefined}
          deltaContext={deltaContext}
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
