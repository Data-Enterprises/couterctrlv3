// Hooks
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useCarriedScroll, useItemPerfCtx } from "../hooks";
import { useScanGun } from "../../scanner/useScanGun";

// Redux
import {
  closeScanner,
  openItemSearch,
  openScanner,
  scannedUpc,
  selectPerfItem,
  setItemQuery,
  setRecentsOpen,
} from "../../../features/dev/devItemPerfSlice";

// Utils
import { RECENTS_INLINE } from "../utils";
import { TY_COLOR } from "../../mobile/perf/perfColors";

// Components
import {
  BackspaceIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import BottomSheet from "../../BottomSheet";
import ScannerView from "../../scanner/ScannerView";
import MarginRowList from "./MarginRowList";
import RecentRow from "./RecentRow";
import ItemPerfInfoSheet from "./ItemPerfInfoSheet";

/** Find an item anywhere in the store, by name, UPC or scan. Recents until
 *  you type, then matches. */
const ItemSearchScreen = () => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const { storeName, windowLabel, query, recents, rows } = useItemPerfCtx();
  // A scan gun trigger pull does what a camera read does: the code becomes
  // the query and the camera closes.
  const searchGun = useScanGun((upc) => dispatch(scannedUpc(upc)));
  const { scroller, onScroll } = useCarriedScroll("list");

  /**
   * What the blue button does once there is something in the field.
   *
   * The list already filters as you type, so "search" is only meaningful as
   * the last step: put the keyboard away, and if the query has narrowed to a
   * single item — which typing or scanning a full UPC always does — open it.
   * Anything looser stays a list, because picking for you would be a guess.
   */
  const runSearch = () => {
    (document.activeElement as HTMLElement | null)?.blur();
    if (rows.length === 1) dispatch(selectPerfItem(rows[0].key));
  };
  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col overflow-hidden bg-bkg">
      <header className="flex-shrink-0 border-b border-gray-200 bg-custom-white px-3 pb-2.5 pt-2">
        <button
          type="button"
          onClick={() => dispatch(openItemSearch(false))}
          className="-ml-1.5 flex items-center gap-0.5 rounded-lg py-1 pr-2 text-[12.5px] font-semibold text-content active:bg-bkg"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          {storeName}
        </button>
        <p className="font-display text-[15px] font-bold text-content">
          Find an item
        </p>
        <p className="font-mono text-[11px] tracking-tight text-content/95">
          Anywhere in the store · {windowLabel}
        </p>

        {/* Pinned: the field is how you get anywhere from here, so a long
            result list must not carry it off the screen. */}
        <div className="mt-2 flex gap-2">
          <input
            id="item-perf-search"
            ref={searchGun.ref}
            value={perf.itemQuery}
            onChange={(e) => dispatch(setItemQuery(e.target.value))}
            placeholder="Item name or UPC"
            inputMode={searchGun.inputMode ?? "search"}
            enterKeyHint="search"
            className="min-w-0 flex-1 rounded-lg border-0 bg-bkg px-3 py-2.5 text-[14px] text-content placeholder:text-content/85"
            style={{
              outline: "none",
              WebkitAppearance: "none",
              boxShadow: "none",
            }}
          />
          {/* One button, two jobs — with an empty field there is nothing to
              search, and with a code in it the camera would only overwrite
              what you just typed. */}
          <button
            type="button"
            onClick={() =>
              query
                ? runSearch()
                : dispatch(perf.scannerOpen ? closeScanner() : openScanner())
            }
            aria-label={query ? "Search" : "Scan a barcode"}
            aria-pressed={!query && perf.scannerOpen}
            className="flex-none rounded-lg px-3 text-custom-white"
            style={{ background: TY_COLOR }}
          >
            {query ? (
              <MagnifyingGlassIcon className="h-[18px] w-[18px]" />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8" />
              </svg>
            )}
          </button>
          {query && (
            <button
              type="button"
              onClick={() => dispatch(setItemQuery(""))}
              aria-label="Clear"
              className="flex-none rounded-lg bg-bkg px-3 text-content/95"
            >
              <BackspaceIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </header>

      <div ref={scroller} onScroll={onScroll} className="flex-1 overflow-y-auto pb-14">
        <div className="flex flex-col gap-3 p-3">
          {perf.scannerOpen && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white p-3 shadow-md">
              <ScannerView onDetected={(upc) => dispatch(scannedUpc(upc))} />
            </section>
          )}

          {/* Recents rather than the catalogue: someone checking the same
              few items through a shift should not retype a UPC, and a list
              of every item in the store is not a useful thing to land on. */}
          {!query && recents.length > 0 && (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
              <div className="px-3.5 pb-1 pt-3 font-mono text-[9.5px] uppercase tracking-wider text-content/95">
                Recent items
              </div>
              {recents.slice(0, RECENTS_INLINE).map((r) => (
                  <RecentRow key={r.key} row={r} />
                ))}
              {recents.length > RECENTS_INLINE && (
                <button
                  type="button"
                  onClick={() => dispatch(setRecentsOpen(true))}
                  className="block w-full border-t border-brand_line py-2.5 text-center text-[12px] font-semibold active:bg-bkg"
                  style={{ color: TY_COLOR }}
                >
                  {recents.length - RECENTS_INLINE} more recent
                </button>
              )}
            </section>
          )}

          {!query ? (
            <section className="rounded-2xl border border-gray-200 bg-custom-white px-5 py-7 text-center shadow-md">
              <p className="text-[13px] font-semibold text-content">
                Search the whole store
              </p>
              <p className="mt-1 text-[12px] text-content/95">
                Type a name or UPC, or scan a barcode. Results carry the
                department they came from.
              </p>
            </section>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-custom-white shadow-md">
                <MarginRowList
                  onRow={(r) => dispatch(selectPerfItem(r.key))}
                  emptyText={`Nothing matches "${query}".`}
                />
            </section>
          )}
        </div>
      </div>

      {perf.recentsOpen && (
        <BottomSheet onClose={() => dispatch(setRecentsOpen(false))}>
          <div className="px-4 pb-1 pt-2 font-mono text-[9.5px] uppercase tracking-wider text-content/95">
            Recent items
          </div>
          {recents.map((r) => (
              <RecentRow key={r.key} row={r} />
            ))}
        </BottomSheet>
      )}
      <ItemPerfInfoSheet />
    </div>
  );
};

export default ItemSearchScreen;
