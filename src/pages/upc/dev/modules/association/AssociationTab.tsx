import { useEffect, useMemo, useRef, useState } from "react";
import { useUpcDevCtx } from "../../hooks/useUpcDevCtx";
import { useAppDispatch } from "../../../../../hooks";
import {
  toggleDevSelectedUpc,
  setDevAssociationLoaded,
  setDevLevel1Items,
  setDevLevel1Loading,
  toggleDevLevel1Selected,
  setDevLevel2Items,
  setDevLevel2Loading,
  toggleDevLevel2Selected,
  setDevLevel3Items,
  setDevLevel3Loading,
  resetDevAssociationLevels1To3,
  resetDevAssociationLevels2To3,
  setDevSingleSearchUpc,
  setDevSingleSearchItems,
  setDevSingleSearchLoading,
} from "../../../../../features/upcDevSlice";
import { getItemAssociation } from "../../../../../api/upc";
import { dedupeAssociations, excludeUpcs } from "./associationStats";
import UpcContextMenu from "../../../../../components/UpcContextMenu";

const DEBOUNCE_MS = 400;
const LIMIT = 20;

const fmtDate = (d: string) => {
  const [m, day, y] = d.split("/");
  return `${y}-${m.padStart(2, "0")}-${day.padStart(2, "0")}`;
};

type ColumnItem = { code: string; desc: string; qty?: number };
type ContextMenuState = { x: number; y: number; upc: string };

function LevelColumn({
  title,
  sub,
  items,
  loading,
  selectable,
  selected,
  onToggle,
  onContextMenu,
  emptyMessage,
  showRank,
}: {
  title: string;
  sub?: string;
  items: ColumnItem[];
  loading: boolean;
  selectable: boolean;
  selected?: string[];
  onToggle?: (code: string) => void;
  onContextMenu: (e: React.MouseEvent, upc: string) => void;
  emptyMessage: string;
  showRank?: boolean;
}) {
  return (
    <div className="flex flex-col min-h-0 min-w-0 border-r border-gray-100">
      <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1e2a4a]">{title}</span>
        {loading && <span className="text-[10px] text-content/85">Loading…</span>}
      </div>
      {sub && <div className="px-2.5 py-1 text-[10px] text-content/85 border-b border-gray-50">{sub}</div>}
      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {items.length === 0 ? (
          <div className="px-2.5 py-3 text-[10px] text-content/85 italic">{emptyMessage}</div>
        ) : (
          items.map((item, i) => {
            const isSelected = selected?.includes(item.code) ?? false;
            return (
              <div
                key={item.code}
                onClick={() => selectable && onToggle?.(item.code)}
                onContextMenu={(e) => onContextMenu(e, item.code)}
                style={isSelected ? { background: "#e6f1fb", borderLeft: "3px solid #1e2a4a" } : undefined}
                className={`flex items-center gap-1.5 py-1.5 border-b border-gray-50 transition-colors ${
                  isSelected ? "pl-[7px] pr-2.5" : "px-2.5"
                } ${selectable && !isSelected ? "cursor-pointer hover:bg-blue-50/50" : selectable ? "cursor-pointer" : ""}`}
              >
                {selectable && (
                  <div
                    className={`w-3 h-3 rounded flex-shrink-0 ${isSelected ? "bg-[#1e2a4a]" : "border border-gray-300"}`}
                  />
                )}
                {showRank && <span className="text-[10px] text-content/85 w-3 flex-shrink-0">{i + 1}</span>}
                <div className="min-w-0 flex-1">
                  <div className={`text-[10px] text-content truncate ${isSelected ? "font-semibold" : ""}`}>{item.desc}</div>
                  <div className="text-[10px] text-content/85 font-mono">{item.code}</div>
                </div>
                {item.qty !== undefined && (
                  <span className="text-[10px] font-semibold text-content/85 flex-shrink-0">{item.qty}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const AssociationTab = () => {
  const ctx = useUpcDevCtx();
  const dispatch = useAppDispatch();
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const storeidsArr = useMemo(
    () => ctx.storeids.split(",").map(Number).filter(Boolean),
    [ctx.storeids],
  );
  const mainUpcs = useMemo(
    () => (ctx.selectedUpcs.length > 0 ? ctx.selectedUpcs : ctx.upcs),
    [ctx.selectedUpcs, ctx.upcs],
  );
  const mainKey = mainUpcs.join(",");
  const level1SelectedKey = ctx.level1Selected.join(",");
  const level2SelectedKey = ctx.level2Selected.join(",");

  const upcItemsMap = useMemo(
    () => new Map(ctx.upcItems.map((i) => [i.product_code, i.description])),
    [ctx.upcItems],
  );

  const level1RequestId = useRef(0);
  const level2RequestId = useRef(0);
  const level3RequestId = useRef(0);
  const searchRequestId = useRef(0);

  // Main changed — level 1 refetches itself, everything downstream is invalid.
  useEffect(() => {
    if (!mainUpcs.length || !ctx.storeids) return;
    dispatch(resetDevAssociationLevels1To3());

    const timer = setTimeout(async () => {
      const requestId = ++level1RequestId.current;
      dispatch(setDevLevel1Loading(true));
      try {
        const res = await getItemAssociation(
          ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
          storeidsArr, mainUpcs, LIMIT, "top",
        );
        if (requestId !== level1RequestId.current) return;
        const items = res.data.error
          ? []
          : dedupeAssociations(excludeUpcs(res.data.items ?? [], mainUpcs));
        dispatch(setDevLevel1Items(items));
      } finally {
        if (requestId === level1RequestId.current) {
          dispatch(setDevLevel1Loading(false));
          dispatch(setDevAssociationLoaded(true));
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // ctx.searchVersion: covers a re-search with the exact same UPCs/store,
    // where mainKey/storeids alone wouldn't otherwise change.
  }, [mainKey, ctx.storeids, ctx.searchVersion]);

  // Level 1 selection changed — level 2 refetches itself, level 3 is invalid.
  useEffect(() => {
    dispatch(resetDevAssociationLevels2To3());
    if (!ctx.level1Selected.length) return;

    const timer = setTimeout(async () => {
      const requestId = ++level2RequestId.current;
      dispatch(setDevLevel2Loading(true));
      try {
        const exclude = [...mainUpcs, ...ctx.level1Selected];
        const res = await getItemAssociation(
          ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
          storeidsArr, ctx.level1Selected, LIMIT, "top",
        );
        if (requestId !== level2RequestId.current) return;
        const items = res.data.error
          ? []
          : dedupeAssociations(excludeUpcs(res.data.items ?? [], exclude));
        dispatch(setDevLevel2Items(items));
      } finally {
        if (requestId === level2RequestId.current) dispatch(setDevLevel2Loading(false));
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [level1SelectedKey]);

  // Level 2 selection changed — level 3 refetches itself (terminal, nothing further).
  useEffect(() => {
    dispatch(setDevLevel3Items([]));
    if (!ctx.level2Selected.length) return;

    const timer = setTimeout(async () => {
      const requestId = ++level3RequestId.current;
      dispatch(setDevLevel3Loading(true));
      try {
        const exclude = [...mainUpcs, ...ctx.level1Selected, ...ctx.level2Selected];
        const res = await getItemAssociation(
          ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
          storeidsArr, ctx.level2Selected, LIMIT, "top",
        );
        if (requestId !== level3RequestId.current) return;
        const items = res.data.error
          ? []
          : dedupeAssociations(excludeUpcs(res.data.items ?? [], exclude));
        dispatch(setDevLevel3Items(items));
      } finally {
        if (requestId === level3RequestId.current) dispatch(setDevLevel3Loading(false));
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [level2SelectedKey]);

  // Single-UPC search — fired by the search box or the "Look up associations"
  // right-click action on any item in any level. Not debounced (only ever
  // triggered by a single discrete action), but still guarded against races.
  const runSingleSearch = async (upc: string) => {
    if (!upc) return;
    dispatch(setDevSingleSearchUpc(upc));
    const requestId = ++searchRequestId.current;
    dispatch(setDevSingleSearchLoading(true));
    try {
      const res = await getItemAssociation(
        ctx.url, ctx.token, fmtDate(ctx.startDate), fmtDate(ctx.endDate),
        storeidsArr, [upc], LIMIT, "top",
      );
      if (requestId !== searchRequestId.current) return;
      const items = res.data.error ? [] : dedupeAssociations(res.data.items ?? []);
      dispatch(setDevSingleSearchItems(items));
    } finally {
      if (requestId === searchRequestId.current) dispatch(setDevSingleSearchLoading(false));
    }
  };

  const handleClearSearch = () => {
    setSearchInput("");
    dispatch(setDevSingleSearchUpc(""));
    dispatch(setDevSingleSearchItems([]));
  };

  const openContextMenu = (e: React.MouseEvent, upc: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, upc });
  };

  const allVisibleUpcs = useMemo(
    () => [
      ...mainUpcs,
      ...ctx.level1Items.map((i) => i.product_code),
      ...ctx.level2Items.map((i) => i.product_code),
      ...ctx.level3Items.map((i) => i.product_code),
    ],
    [mainUpcs, ctx.level1Items, ctx.level2Items, ctx.level3Items],
  );

  if (!ctx.upcs.length) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Add UPCs to see associations
      </div>
    );
  }

  if (!ctx.associationLoaded && !ctx.level1Loading) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Navigate here to load associations
      </div>
    );
  }

  if (ctx.level1Loading && !ctx.associationLoaded) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-content/85">
        Loading associations…
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0">
      <div className="grid h-full" style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}>
        <LevelColumn
          title="Main"
          sub="Workbook UPCs"
          items={mainUpcs.map((code) => ({ code, desc: upcItemsMap.get(code) ?? code }))}
          loading={false}
          selectable
          selected={ctx.selectedUpcs}
          onToggle={(code) => dispatch(toggleDevSelectedUpc(code))}
          onContextMenu={openContextMenu}
          emptyMessage="No UPCs in workbook"
        />
        <LevelColumn
          title="Level 1"
          sub="Basket co-purchases"
          items={ctx.level1Items.map((i) => ({ code: i.product_code, desc: i.product_description, qty: i.qty }))}
          loading={ctx.level1Loading}
          selectable
          selected={ctx.level1Selected}
          onToggle={(code) => dispatch(toggleDevLevel1Selected(code))}
          onContextMenu={openContextMenu}
          emptyMessage="No associations found"
          showRank
        />
        <LevelColumn
          title="Level 2"
          items={ctx.level2Items.map((i) => ({ code: i.product_code, desc: i.product_description, qty: i.qty }))}
          loading={ctx.level2Loading}
          selectable
          selected={ctx.level2Selected}
          onToggle={(code) => dispatch(toggleDevLevel2Selected(code))}
          onContextMenu={openContextMenu}
          emptyMessage={ctx.level1Selected.length ? "No associations found" : "Select an item in Level 1"}
          showRank
        />
        <LevelColumn
          title="Level 3"
          items={ctx.level3Items.map((i) => ({ code: i.product_code, desc: i.product_description, qty: i.qty }))}
          loading={ctx.level3Loading}
          selectable={false}
          onContextMenu={openContextMenu}
          emptyMessage={ctx.level2Selected.length ? "No associations found" : "Select an item in Level 2"}
          showRank
        />

        <div className="flex flex-col min-h-0 min-w-0">
          <div className="px-2.5 py-1.5 bg-gray-50 border-b border-gray-100 flex-shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1e2a4a]">UPC Search</span>
          </div>
          <div className="p-2 flex flex-col gap-1.5 flex-shrink-0 border-b border-gray-100">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSingleSearch(searchInput.trim())}
              placeholder="Enter UPC…"
              className="text-[10px] rounded px-2 py-1 border border-gray-200 bg-gray-50"
              style={{ outline: "none", WebkitAppearance: "none", boxShadow: "none" }}
            />
            <div className="flex gap-1.5">
              <button
                onClick={() => runSingleSearch(searchInput.trim())}
                className="px-2 py-1 text-[10px] font-medium rounded text-custom-white"
                style={{ background: "#1e2a4a" }}
              >
                Search
              </button>
              <button
                onClick={handleClearSearch}
                className="px-2 py-1 text-[10px] font-medium rounded border border-gray-200 text-content/85 hover:text-content"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto thin-scrollbar">
            {ctx.singleSearchLoading ? (
              <div className="px-2.5 py-3 text-[10px] text-content/85 italic">Searching…</div>
            ) : ctx.singleSearchUpc ? (
              ctx.singleSearchItems.length === 0 ? (
                <div className="px-2.5 py-3 text-[10px] text-content/85 italic">No associations for {ctx.singleSearchUpc}</div>
              ) : (
                ctx.singleSearchItems.map((item, i) => (
                  <div
                    key={item.product_code}
                    onContextMenu={(e) => openContextMenu(e, item.product_code)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-gray-50"
                  >
                    <span className="text-[10px] text-content/85 w-3 flex-shrink-0">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] text-content truncate">{item.product_description}</div>
                      <div className="text-[10px] text-content/85 font-mono">{item.product_code}</div>
                    </div>
                    <span className="text-[10px] font-semibold text-content/85 flex-shrink-0">{item.qty}</span>
                  </div>
                ))
              )
            ) : (
              <div className="px-2.5 py-3 text-[10px] text-content/85 italic">
                Right-click any item to look up its associations here
              </div>
            )}
          </div>
        </div>
      </div>

      {contextMenu && (
        <UpcContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          upc={contextMenu.upc}
          allUpcs={allVisibleUpcs}
          extraActions={[
            { label: "Look up associations", onClick: () => runSingleSearch(contextMenu.upc) },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
};

export default AssociationTab;
