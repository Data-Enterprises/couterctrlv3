// Hooks
import { useLayoutEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../../../../hooks";
import { useCarriedScroll, useItemPerfCtx } from "../hooks";

// Redux
import {
  openItemSearch,
  setItemPerfHasSearched,
  setItemPerfInfoOpen,
  setItemPerfStoreNumber,
} from "../../../../../features/dev/devItemPerfSlice";

// Utils
import { sorts } from "../utils";

// Components
import { BackspaceIcon, MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import MobileSortChips from "../../../../../components-dev/mobile/MobileSortChips";
import PerfCardHeader from "../../../../../components-dev/mobile/perf/PerfCardHeader";
import MarginSummary from "./MarginSummary";
import GroupCard from "./GroupCard";
import ItemPerfInfoSheet from "./ItemPerfInfoSheet";

/** The store's margin card, the way into search, and its departments,
 *  vendors or categories as an accordion of cards. */
const StoreGroupsScreen = () => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const {
    screen,
    storeName,
    scopeLabel,
    dayLabel,
    windowLabel,
    basis,
    activeSort,
    activeSortDir,
    onSort,
    groupFilter,
    setGroupFilter,
    listLabel,
    building,
    shown,
  } = useItemPerfCtx();

  const { scroller, onScroll } = useCarriedScroll("search");
  const openCard = useRef<HTMLDivElement>(null);

  /**
   * Opening a card brings it to the top of the screen.
   *
   * An accordion has to scroll DOWN as well as up: the card just tapped is
   * usually below the one that was open, so leaving the viewport where it is
   * opens the report off screen.
   */
  useLayoutEffect(() => {
    if (screen !== "list" || !perf.openGroup) return;
    const el = scroller.current;
    const card = openCard.current;
    if (!el || !card) return;
    const offset =
      card.getBoundingClientRect().top - el.getBoundingClientRect().top;
    el.scrollTop = Math.max(0, el.scrollTop + offset - 8);
  }, [perf.openGroup?.key, screen]);
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      {perf.storeNumbers.length > 1 && (
        <div className="flex-shrink-0 border-b border-gray-200 bg-custom-white">
          <MobileSortChips
            label="Location"
            options={perf.storeNumbers.map((n) => ({
              key: n,
              label: `Store ${n}`,
            }))}
            value={perf.storeNumber ?? ""}
            onChange={(n) => dispatch(setItemPerfStoreNumber(n))}
          />
        </div>
      )}

      {/* pb-14 clears the fixed bottom tab bar, which is outside document flow. */}
      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {/* ── the store ───────────────────────────────────────── */}
          {/* Not a card in the accordion: the store's breakdown IS the list
              under it, so there is nothing for it to open. It carries the
              page's controls because there is nowhere above it for them. */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <PerfCardHeader
              title={storeName}
              label={scopeLabel}
              when={dayLabel || windowLabel}
              onSearch={() => dispatch(setItemPerfHasSearched(false))}
              onInfo={() => dispatch(setItemPerfInfoOpen(true))}
            />
            <MarginSummary />
          </section>

          {/* Search spans every department and drives the scanner, so it is a
              place of its own rather than a level under any one group. */}
          <button
            type="button"
            onClick={() => dispatch(openItemSearch(true))}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-custom-white py-3 text-[12.5px] font-bold text-content shadow-md active:bg-bkg"
          >
            <MagnifyingGlassIcon className="h-4 w-4 text-content/95" />
            Find an item or scan
          </button>

          {/* ── the groups ──────────────────────────────────────── */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
            <MobileSortChips
              options={sorts(basis)}
              value={activeSort?.key ?? null}
              dir={activeSortDir}
              onChange={onSort}
            />
            <div className="px-3.5 py-2">
              <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
                <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/95" />
                <input
                  id="item-perf-group-filter"
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  placeholder={`Filter ${listLabel.toLowerCase()}`}
                  inputMode="search"
                  enterKeyHint="search"
                  aria-label={`Filter ${listLabel.toLowerCase()}`}
                  className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
                  style={{
                    outline: "none",
                    WebkitAppearance: "none",
                    boxShadow: "none",
                  }}
                />
                {groupFilter && (
                  <button
                    type="button"
                    onClick={() => setGroupFilter("")}
                    aria-label="Clear filter"
                    className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/95 active:bg-custom-white"
                  >
                    <BackspaceIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {building ? (
            <section
              className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-10 text-center text-[12.5px] text-content/95 shadow-md"
              style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
            >
              Building the list...
            </section>
          ) : shown.length === 0 ? (
            <section className="rounded-2xl border border-gray-200 bg-custom-white px-4 py-8 text-center text-[12.5px] text-content/95 shadow-md">
              {groupFilter.trim()
                ? `Nothing matches "${groupFilter.trim()}".`
                : "Nothing recorded for this selection."}
            </section>
          ) : (
            shown.map((r) => (
              <div key={r.key} ref={perf.openGroup?.key === r.key ? openCard : undefined}>
                <GroupCard row={r} />
              </div>
            ))
          )}
        </div>
      </div>

      <ItemPerfInfoSheet />
    </div>
  );
};

export default StoreGroupsScreen;
