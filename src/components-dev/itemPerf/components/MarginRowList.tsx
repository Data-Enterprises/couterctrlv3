// Hooks
import { useAppDispatch, useAppSelector } from "../../../hooks";
import { useItemPerfCtx } from "../hooks";
import { useScanGun } from "../../scanner/useScanGun";

// Redux
import {
  closeScanner,
  openItemSearch,
  openScanner,
  scannedUpc,
  setItemQuery,
  showMoreItems,
  ROWS_PER_PAGE,
} from "../../../features/dev/devItemPerfSlice";

// Utils
import { pct, sorts } from "../utils";

// Interfaces
import type { MarginRow } from "../utils/itemPerfData";

// Components
import {
  BackspaceIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import MobileSortChips from "../../mobile/MobileSortChips";
import ScannerView from "../../scanner/ScannerView";
import { TY_COLOR } from "../../mobile/perf/perfColors";
import RowBars from "./RowBars";

interface MarginRowListProps {
  onRow: (r: MarginRow) => void;
  emptyText: string;
  /** Item lists filter through `itemQuery`, which is what narrows the rows as
   *  they are built. The group list filters on its own field. */
  withQuery?: boolean;
}

/** A sortable list of margin rows: groups on the list screen, items below
 *  it, search results beside it. One row shape, three callers. */
const MarginRowList = ({ onRow, emptyText, withQuery = false }: MarginRowListProps) => {
  const dispatch = useAppDispatch();
  const perf = useAppSelector((s) => s.dev.itemPerf);
  const {
    sizeLabel,
    activeSort,
    activeSortDir,
    onSort,
    listPartial,
    weekMatch,
    building,
    shown,
    query,
    visibleRows,
  } = useItemPerfCtx();
  // A scan gun trigger pull does what a camera read does: the code becomes
  // the query and the camera closes.
  const listGun = useScanGun((upc) => dispatch(scannedUpc(upc)));
  return (
    <>
      {withQuery && (
        <div className="border-b border-brand_line px-3.5 py-2">
          <div className="flex items-center gap-2 rounded-lg bg-bkg px-3">
            <MagnifyingGlassIcon className="h-4 w-4 flex-none text-content/95" />
            <input
              id="item-perf-list-filter"
              ref={listGun.ref}
              value={perf.itemQuery}
              onChange={(e) => dispatch(setItemQuery(e.target.value))}
              placeholder="Description or UPC"
              inputMode={listGun.inputMode ?? "search"}
              enterKeyHint="search"
              aria-label="Filter items"
              className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-[14px] text-content placeholder:text-content/85"
              style={{
                outline: "none",
                WebkitAppearance: "none",
                boxShadow: "none",
              }}
            />
            {perf.itemQuery && (
              <button
                type="button"
                onClick={() => dispatch(setItemQuery(""))}
                aria-label="Clear filter"
                className="-mr-1 flex h-7 w-7 flex-none items-center justify-center rounded-full text-content/95 active:bg-custom-white"
              >
                <BackspaceIcon className="h-4 w-4" />
              </button>
            )}
            {/* Scanning is how you find a box you are holding, which is the
                reason to be on this screen at all with a phone in your hand. */}
            <button
              type="button"
              onClick={() =>
                dispatch(perf.scannerOpen ? closeScanner() : openScanner())
              }
              aria-label="Scan a barcode"
              aria-pressed={perf.scannerOpen}
              className="-mr-1.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg text-custom-white"
              style={{ background: TY_COLOR }}
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2M7 8v8M11 8v8M15 8v8" />
              </svg>
            </button>
          </div>
          {perf.scannerOpen && (
            <div className="pt-2">
              <ScannerView onDetected={(upc) => dispatch(scannedUpc(upc))} />
            </div>
          )}
        </div>
      )}
      <MobileSortChips
        options={sorts(sizeLabel)}
        value={activeSort?.key ?? null}
        dir={activeSortDir}
        onChange={onSort}
      />
      <p className="border-b border-brand_line px-3.5 py-1.5 cc-caps-mono text-[10px]">
        Bars: {sizeLabel.toLowerCase()}, TY vs LY and LW
      </p>
      {listPartial && (
        <p className="border-b border-brand_line bg-fill_muted px-3.5 py-2 text-[11.5px] font-semibold text-content">
          Last year: {weekMatch.lyDays} of {weekMatch.days} days matched
        </p>
      )}
      {building ? (
        // Held back 200ms by the animation delay, so the quick transitions
        // this also covers never flash a spinner.
        <div
          className="flex items-center justify-center gap-2 px-4 py-10 text-[12.5px] text-content/95"
          style={{ animation: "delayed-fade-in 140ms ease-out 200ms both" }}
        >
          <span
            className="cc-spinner"
            style={{ borderTopColor: TY_COLOR }}
          />
          Building the list...
        </div>
      ) : shown.length === 0 ? (
        <div className="px-4 py-8 text-center text-[12.5px] text-content/95">
          {emptyText}
          {/* A scan is scoped to the list it was made in, so on Vendors and
              Categories especially it can miss an item the store really does
              sell. Rather than leave that looking like "no such item", offer
              the one list that always covers it. */}
          {withQuery && query && (
            <button
              type="button"
              onClick={() => dispatch(openItemSearch(true))}
              className="mt-3 block w-full text-[12.5px] font-semibold active:opacity-70"
              style={{ color: TY_COLOR }}
            >
              Search the whole store for &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      ) : (
        <div>
          {shown.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => onRow(r)}
              className="block w-full border-t border-brand_line px-3.5 py-3 text-left first:border-t-0 active:bg-bkg"
            >
              <div className="flex items-baseline gap-2">
                <span className="min-w-0 flex-1 truncate font-display text-[13.5px] font-semibold text-content">
                  {r.label}
                </span>
                <span className="flex-none font-display text-[13px] font-bold text-content">
                  {pct(r.gpm)}
                </span>
                <ChevronRightIcon className="h-4 w-4 flex-none text-content/95" />
              </div>
              <div className="mt-0.5 truncate text-[11px] text-content/95">
                {r.sub}
              </div>
              <div className="mt-2">
                <RowBars r={r} />
              </div>
            </button>
          ))}
        </div>
      )}

      {visibleRows.length > shown.length && (
        <button
          type="button"
          onClick={() => dispatch(showMoreItems())}
          className="block w-full border-t border-brand_line py-3 text-center text-[12px] font-semibold active:bg-bkg"
          style={{ color: TY_COLOR }}
        >
          Show{" "}
          {Math.min(ROWS_PER_PAGE, visibleRows.length - shown.length).toLocaleString(
            "en-US",
          )}{" "}
          more
          <span className="text-content/95">
            {" "}
            · {(visibleRows.length - shown.length).toLocaleString("en-US")} left
          </span>
        </button>
      )}
    </>
  );
};

export default MarginRowList;
