import { useMemo, useState } from "react";
import { MagnifyingGlassIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useSuggestedCtx } from "./hooks";
import {
  setStoreSearch,
  toggleExpandedStore,
  type SheetKey,
} from "../../features/suggestedSlice";
import { deptLabel, fmtLb0, rollupByStore } from ".";
import { getStoreName } from "../../utils";
import { isGroupSearch } from "../../features/searchSlice";
import PanelFrame from "./PanelFrame";
import FilterBar from "../../components/filters/FilterBar";
import TextFilter from "../../components/filters/TextFilter";
import InfoButton from "../../components/InfoButton";
import SuggestedHelpModal from "./SuggestedHelpModal";
import { StoreListSkeleton } from "./Skeletons";

/** Header and rows share these, so a column cannot drift from its label. */
const STORE_COLS = "grid-cols-[1fr_56px_72px_32px]";
const DEPT_COLS = "grid-cols-[1fr_56px_72px]";

/**
 * Store, then department, then the sheet.
 *
 * The tree is the fetch boundary as much as a layout: the group call answers
 * store x department, and items need the single-store call, so opening a
 * department is what triggers the second request. That keeps the page at one
 * call on load rather than one per store.
 */
const StoreTreePanel = ({
  onSelectDepartment,
  onOpenStore,
  onOpenSearch,
}: {
  onSelectDepartment: (key: SheetKey) => void;
  onOpenStore: (storeid: number, storeLabel: string) => void;
  onOpenSearch: () => void;
}) => {
  const ctx = useSuggestedCtx();
  const [infoOpen, setInfoOpen] = useState(false);

  // Store names come from assignedStores, never the payload — the response
  // returns a null store_name on rows whose department resolved fine, so the
  // same store arrives both named and unnamed in one response.
  const rollups = useMemo(
    () =>
      rollupByStore(ctx.groupRows, (storeid, fallback) =>
        getStoreName(ctx.assignedStores, storeid, fallback ?? String(storeid)),
      ),
    [ctx.groupRows, ctx.assignedStores],
  );

  const shown = useMemo(() => {
    const q = ctx.storeSearch.trim().toLowerCase();
    if (!q) return rollups;
    return rollups.filter(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        (s.storeNumber ?? "").toLowerCase().includes(q),
    );
  }, [rollups, ctx.storeSearch]);

  const total = rollups.reduce((sum, s) => sum + s.suggested, 0);
  /** A past `asOf` makes this a comparison: the endpoint strips
   *  `suggested_weight`, so every order figure here would sum to a confident 0. */
  const isHistorical = ctx.parameters?.is_historical === true;
  const orderLb = (n: number | null | undefined) =>
    isHistorical ? "—" : fmtLb0(n);
  /**
   * Why this column is not "Order lb".
   *
   * The tree is fetched without the ordering half — it spans twenty stores and
   * the sheet spans one, so that is where the cost lands. But the on-hand
   * subtraction rides on the same flag: these pounds are demand plus waste,
   * with nothing taken off for stock already in the case, while the sheet's
   * are the same figure net of it.
   *
   * So the two do not add up, and the honest fix is to stop claiming they do.
   * This column ranks stores and departments by size, which is all it was ever
   * read for; the number you order is the one on the sheet.
   */
  const PRE_STOCK_TITLE =
    "Demand plus waste for this window, before stock on hand comes off. The sheet's Order lb is this figure net of what is already in the case, so it will be the lower of the two.";

  const cover = ctx.parameters?.cover_window;
  // Bare, the way Receivers prints its range — no leading label, month/day on
  // the first part and the year only on the last. Split by string surgery: the
  // window arrives as yyyy-mm-dd, and putting that through `new Date` lands a
  // day early on a local clock behind UTC.
  const fmtIso = (iso: string, withYear = false) => {
    const [y, m, d] = iso.split("-");
    return withYear ? `${+m}/${+d}/${y}` : `${+m}/${+d}`;
  };
  const coverLabel = cover
    ? `${fmtIso(cover.start)} – ${fmtIso(cover.end, true)}`
    : "";
  // What was searched, not what came back — a group that lost two stores should
  // still say which group it was, and then say it lost them. The endpoint omits
  // a store that returned nothing without naming it, so the count is the only
  // way a buyer can tell "no scale items" from "that store failed".
  const answered = rollups.length;
  const requested = ctx.requestedStoreIds.length;
  const scopeName = isGroupSearch(ctx.type)
    ? (ctx.selectedGroup?.group_name ?? "")
    : (ctx.selectedStore?.store_name ?? "");
  // "0 of 20 stores" while the call is still running reads as twenty stores
  // that failed. The count only means anything once there is a result to count.
  const scopeLabel =
    !ctx.loadingGroup && requested > answered
      ? `${scopeName} · ${answered} of ${requested} stores`
      : scopeName;

  const isOpen = (storeid: number) => ctx.expandedStores.includes(storeid);
  const isSelected = (storeid: number, sub: number | null) =>
    ctx.sheetKey?.storeid === storeid && ctx.sheetKey?.sub_department === sub;

  return (
    <PanelFrame
      title="Stores"
      // Row 1 carries the window and the total, row 2 the re-search and the
      // scope — the same split Receivers and Coupons use, where the subtitle is
      // the date range and the second row names the store.
      subtitle={coverLabel}
      headerRight={
        rollups.length > 0 ? (
          <div className="flex items-baseline gap-1 flex-shrink-0">
            <span className="text-custom-white text-[10px] font-semibold uppercase tracking-wide">
              Total
            </span>
            <span className="text-[13px] font-medium text-custom-white tabular-nums">
              {isHistorical ? "—" : `${fmtLb0(total)} lb`}
            </span>
          </div>
        ) : undefined
      }
      className="flex-shrink-0"
      // Percentage, not a fixed width: Orders (25%), Receivers (26%) and
      // Coupons (22%) all size the list panel against the viewport so the
      // detail side keeps its proportion on a wide monitor. Wider than those
      // three because this list carries three columns and a chevron where
      // Receivers carries one and a count.
      style={{ width: "31%" }}
      secondRow={
        <>
          <button
            onClick={onOpenSearch}
            aria-label="New search"
            className="w-[22px] h-[22px] flex items-center justify-center rounded border border-custom-white/20 text-custom-white/85 hover:text-custom-white hover:border-custom-white/40 transition-colors flex-shrink-0"
          >
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-custom-white truncate">
            {scopeLabel}
          </span>
          <div className="flex-1" />
          <div className="flex-shrink-0">
            <InfoButton
              title="How this page works"
              onClick={() => setInfoOpen((v) => !v)}
            />
            {infoOpen && (
              <SuggestedHelpModal onClose={() => setInfoOpen(false)} />
            )}
          </div>
        </>
      }
    >
      <FilterBar>
        <TextFilter
          value={ctx.storeSearch}
          onChange={(v) => ctx.dispatch(setStoreSearch(v))}
          placeholder="Filter stores…"
        />
      </FilterBar>

      {/* Collapsible tree: Store -> Department.
          Grid columns rather than flex, with the chevron trailing and
          right-aligned, matching Receivers and Coupons — a Data page's list is
          a table people scan down a column, not a stack of cards. */}
      <div className="flex-1 overflow-y-auto thin-scrollbar flex flex-col">
        {ctx.loadingGroup ? (
          <StoreListSkeleton />
        ) : shown.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[11px] text-content/85">
            No stores match filters
          </div>
        ) : (
          <>
            <div className={`grid ${STORE_COLS} gap-2 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-content/85 flex-shrink-0`}>
              <div>Store</div>
              <div className="text-center">Items</div>
              <div className="text-right" title={PRE_STOCK_TITLE}>
                Needs lb
              </div>
              <div></div>
            </div>

            <div className="divide-y divide-[#1e2a4a]/25">
              {shown.map((store) => {
                const open = isOpen(store.storeid);
                return (
                  <div key={store.storeid}>
                    <button
                      onClick={() => {
                        // A store that is not the one loaded always opens and
                        // becomes active — collapsing it instead would leave the
                        // buyer looking at another store's sheet with no way to
                        // tell. Only the active store toggles shut.
                        if (ctx.activeStoreId !== store.storeid) {
                          if (!open) {
                            ctx.dispatch(toggleExpandedStore(store.storeid));
                          }
                          onOpenStore(store.storeid, store.label);
                        } else {
                          ctx.dispatch(toggleExpandedStore(store.storeid));
                        }
                      }}
                      className={`w-full grid ${STORE_COLS} items-center gap-2 px-3 py-3 text-left transition-colors ${
                        ctx.activeStoreId === store.storeid && !ctx.sheetKey
                          ? "bg-custom-white"
                          : "hover:bg-gray-50"
                      }`}
                      style={
                        ctx.activeStoreId === store.storeid && !ctx.sheetKey
                          ? { boxShadow: "inset 0 0 8px rgba(37,99,235,0.22)" }
                          : undefined
                      }
                    >
                      <span className="text-[12px] font-medium text-content text-left truncate">
                        {store.label}
                      </span>
                      <span className="text-[12px] text-content flex-shrink-0 text-center font-medium">
                        {store.items.toLocaleString()}
                      </span>
                      <span className="text-[12px] text-content text-right tabular-nums font-medium">
                        {orderLb(store.suggested)}
                      </span>
                      <ChevronRightIcon
                        className="w-3 h-3 text-content/85 flex-shrink-0 justify-self-end transition-transform"
                        style={{
                          transform: open ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      />
                    </button>

                    {open && (
                      <div>
                        <div className={`grid ${DEPT_COLS} gap-2 pl-6 pr-3 py-1.5 bg-gray-50 text-[9.5px] font-bold uppercase tracking-wide text-content/85`}>
                          <div>Department</div>
                          <div className="text-center">Items</div>
                          <div className="text-right" title={PRE_STOCK_TITLE}>
                            Needs lb
                          </div>
                        </div>
                        <div className="divide-y divide-[#1e2a4a]/15">
                          {store.departments.map((d) => {
                            const sel = isSelected(
                              store.storeid,
                              d.sub_department,
                            );
                            return (
                              <button
                                key={`${store.storeid}-${d.sub_department ?? "none"}`}
                                onClick={() =>
                                  onSelectDepartment({
                                    storeid: store.storeid,
                                    storeLabel: store.label,
                                    sub_department: d.sub_department,
                                    sub_department_description:
                                      d.sub_department_description,
                                  })
                                }
                                className={`w-full grid ${DEPT_COLS} items-center gap-2 pl-6 pr-3 py-2 text-left transition-colors ${
                                  sel ? "bg-custom-white" : "hover:bg-gray-50"
                                }`}
                                style={
                                  sel
                                    ? {
                                        boxShadow:
                                          "inset 0 0 8px rgba(37,99,235,0.22)",
                                      }
                                    : undefined
                                }
                              >
                                <span
                                  className={`text-[12px] truncate ${
                                    d.sub_department === null
                                      ? "text-severity_watch_text font-medium"
                                      : "text-content"
                                  }`}
                                >
                                  {deptLabel(d.sub_department_description)}
                                  {d.items_clamped > 0 && (
                                    <span className="text-severity_watch_text">
                                      {" "}
                                      · {d.items_clamped} capped
                                    </span>
                                  )}
                                </span>
                                <span className="text-[12px] text-content text-center">
                                  {d.item_count.toLocaleString()}
                                </span>
                                <span className="text-[12px] text-content text-right tabular-nums">
                                  {orderLb(d.suggested_weight)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </PanelFrame>
  );
};

export default StoreTreePanel;
