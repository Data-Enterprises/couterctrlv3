// Hooks
import { Fragment, useState } from "react";
import { useForecastCtx } from "../hooks";
import { useForecastGrid } from "./hooks";

// Redux
import {
  setSelectedUpc,
  setBatchAdDaysRows,
  setBatchPriceRows,
  setBatchNotesRows,
  toggleTierFilter,
  clearTierFilter,
  resetRowValues,
} from "../../../../features/dev/devForecastDevSlice";

// Utils
import { exceptionsFor } from "../utils/forecastRanking";

// Interfaces
import type { Tier } from "../interfaces";

// Components
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import RowsKpiStrip from "./components/RowsKpiStrip";
import BandChips from "./components/BandChips";
import BatchToolbar from "./components/BatchToolbar";
import NotFoundBanner from "./components/NotFoundBanner";
import GridHead from "./components/GridHead";
import BandHeader from "./components/BandHeader";
import ForecastRow from "./components/ForecastRow";

interface ForecastRowsTableProps {
  onExportClick: () => void;
}

/**
 * The forecast grid: a CSS grid on a shared column template, with one
 * tri-state sort (`useTriStateSort`). Detail is in the calculator popup on
 * double-click. Notes are set in bulk from the toolbar, or per item in the
 * popup.
 */
const ForecastRowsTable = ({ onExportClick }: ForecastRowsTableProps) => {
  const ctx = useForecastCtx();
  const {
    dispatch,
    isLoadingMore,
    notFoundUpcs,
    adListRows,
    forecastResults,
    tierFilter,
    search,
  } = ctx;
  const g = useForecastGrid(ctx);
  // Kept here, not in the banner: the banner leaves the screen while more
  // items load, and its open state should be waiting when it comes back.
  const [notFoundOpen, setNotFoundOpen] = useState<boolean>(false);
  /** Collapsed bands are pure presentation, so they stay local. */
  const [collapsed, setCollapsed] = useState<Set<Tier>>(() => new Set());

  /**
   * Writes to the rows on screen, after the tier chips and column filters, not
   * the whole ticked selection. Single-price rows are excluded from price and ad
   * days, as in legacy.
   */
  const handleSetBatch = (
    batchAdDays: string,
    batchPrice: string,
    batchNotes: string,
  ) => {
    const upcs = g.searched.filter((r) => !r.singlePrice).map((r) => r.upc);
    if (!upcs.length) return;
    const days = parseInt(batchAdDays);
    const price = parseFloat(batchPrice);
    if (!isNaN(days) && days > 0)
      dispatch(setBatchAdDaysRows({ upcs, adDays: days }));
    if (!isNaN(price) && price > 0)
      dispatch(setBatchPriceRows({ upcs, price }));
    // Notes go to every ticked row, single-price included — see the reducer.
    if (batchNotes.trim())
      dispatch(
        setBatchNotesRows({
          upcs: g.searched.map((r) => r.upc),
          notes: batchNotes.trim(),
        }),
      );
  };

  const toggleBand = (band: Tier) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });

  return (
    <div className="flex-1 min-w-0 shadow-lg">
      <div className="cc-panel h-full">
        {/* 1-row navy header */}
        <div className="flex-shrink-0 px-4 py-3 flex items-center justify-between bg-brand_navy">
          <div className="text-[13px] cc-navy-title leading-tight">
            Last 90 days ending {search.singleDate}
          </div>
          <button
            className="text-custom-white transition-colors"
            onClick={onExportClick}
            title="Export"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
        </div>

        <RowsKpiStrip itemCount={g.rows.length} totals={g.totals} />

        <BandChips
          counts={g.counts}
          tierFilter={tierFilter}
          onToggle={(tier) => dispatch(toggleTierFilter(tier))}
          onClear={() => dispatch(clearTierFilter())}
          coverage={g.coverage}
        />

        <BatchToolbar
          shownCount={g.searched.length}
          isWholeSelection={g.searched.length === g.rows.length}
          isEdited={g.isEdited}
          hasNotes={g.hasNotes}
          onApply={handleSetBatch}
          onReset={() => dispatch(resetRowValues(g.searched.map((r) => r.upc)))}
          onClearNotes={() =>
            dispatch(
              setBatchNotesRows({
                upcs: g.searched.map((r) => r.upc),
                notes: "",
              }),
            )
          }
        />

        {isLoadingMore && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand_navy/[0.06] border-b border-brand_navy/15 flex-shrink-0">
            <div className="w-3 h-3 rounded-full border-2 border-brand_navy/40 border-t-transparent animate-spin shrink-0" />
            <span className="text-[11px] text-brand_navy font-medium">
              Loading more items…
            </span>
          </div>
        )}

        {notFoundUpcs.length > 0 && !isLoadingMore && (
          <NotFoundBanner
            upcs={notFoundUpcs}
            adListRows={adListRows}
            open={notFoundOpen}
            onToggle={() => setNotFoundOpen((o) => !o)}
          />
        )}

        {/* rows */}
        <div data-help="grid" className="cc-scroll">
          <GridHead
            sort={g.sort}
            onSort={g.handleSort}
            draftUpc={g.draftUpc}
            setDraftUpc={g.setDraftUpc}
            appliedUpc={g.appliedUpc}
            setAppliedUpc={g.setAppliedUpc}
            draftDesc={g.draftDesc}
            setDraftDesc={g.setDraftDesc}
            appliedDesc={g.appliedDesc}
            setAppliedDesc={g.setAppliedDesc}
          />

          {g.sorted.length === 0 ? (
            <div className="text-[12px] text-content/95 py-6 text-center">
              {g.rows.length === 0
                ? "Nothing selected — tick items in the list on the left."
                : "No items match the current band or search filters."}
            </div>
          ) : (
            g.sorted.map((row) => {
              const entry = g.ranks.get(row.upc);
              const band = g.bandStarts.get(row.upc);
              // A collapsed band keeps its header and drops its rows.
              const isHidden = entry ? collapsed.has(entry.tier) : false;
              return (
                <Fragment key={row.upc}>
                  {band && (
                    <BandHeader
                      band={band}
                      collapsed={collapsed.has(band)}
                      summary={g.summary[band]}
                      onToggle={() => toggleBand(band)}
                    />
                  )}
                  {!isHidden && (
                    <ForecastRow
                      row={row}
                      entry={entry}
                      flags={exceptionsFor(
                        row,
                        entry,
                        forecastResults.find((r) => r.upc === row.upc),
                        g.customPriced.has(row.upc),
                      )}
                      customPriced={g.customPriced.has(row.upc)}
                      onOpen={() =>
                        !row.singlePrice && dispatch(setSelectedUpc(row.upc))
                      }
                    />
                  )}
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ForecastRowsTable;
