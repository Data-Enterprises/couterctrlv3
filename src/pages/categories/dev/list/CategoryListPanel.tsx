// Hooks
import { useCallback } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useCategoriesCtx } from "../hooks";
import { useCategoryList } from "./hooks";

// Redux
import {
  setTextFilter,
  setTierFilter,
  setSelectedCategory,
  setMetric,
  setThreshold,
} from "../../../../features/dev/devCategoriesSlice";

// Utils
import {
  applyStoreNumberToName,
  combinedStoreName,
} from "../../../../utils/storeIdentity";
import { fmtCompactRange } from "../../../../utils/dateLabels";
import { headerDeltaPill } from "../../../../utils/severity";
import { comparedBasis, fmtHeaderValue, fmtValue, pillTitle } from "./utils";

// Components
import LocationTabs from "../../../../components-dev/filters/LocationTabs";
import ListTotalsRow from "./components/ListTotalsRow";
import HeaderDeltaPill from "./components/HeaderDeltaPill";
import ListControlsRow from "./components/ListControlsRow";
import ListFilterRow from "./components/ListFilterRow";
import UncategorizedNote from "./components/UncategorizedNote";
import ListColumnHead from "./components/ListColumnHead";
import CategoryRow from "./components/CategoryRow";

interface CategoryListPanelProps {
  onSearchOpen: () => void;
  /** Re-presents the cached search as one co-located location, or all of
   *  them combined. No refetch — see useCategoryData. */
  onStoreNumberChange: (storeNumber: string | null) => void;
}

/** The Categories list panel: header with the store's week total and its change, location tabs, threshold and text filters,
 *  an uncategorized line, and category rows sortable by TY, vs LW and vs LY. */
const CategoryListPanel = ({
  onSearchOpen,
  onStoreNumberChange,
}: CategoryListPanelProps) => {
  const dispatch = useAppDispatch();
  const cats = useCategoriesCtx();
  const { sort, handleSort, graded, counts, visible, totals, uncategorized } =
    useCategoryList(cats);
  const { rows, metric, threshold, tierFilter, textFilter, selectedCategory } =
    cats;

  // Stable identity — a fresh closure per render would break every row's memo.
  const handleSelect = useCallback(
    (category: number, isSelected: boolean) =>
      dispatch(setSelectedCategory(isSelected ? null : category)),
    [dispatch],
  );

  /**
   * The name says which location is on screen.
   *
   * `storeName` is resolved from the assignedStores record, which is keyed on
   * storeid, so a co-located pair embeds only one of its two numbers -- the
   * tabs would move every figure on the page while the header still named the
   * other store. Same helper Sales, Sub Dept Margins and Vendors use, so all
   * four label these stores identically.
   */
  const locationName = cats.selectedStoreNumber
    ? applyStoreNumberToName(
        cats.storeName,
        cats.selectedStoreNumber,
        cats.availableStoreNumbers,
      )
    : // No location picked is the combined tab, which is both of them. Falling
      // through to the stored name put one store's number over a figure that is
      // the pair's -- 369 $303.2K, 370 $121.2K, Both $424.4K under "369".
      combinedStoreName(cats.storeName, cats.availableStoreNumbers);

  // Store-level, so every category row carries the same coverage.
  const headerCov = rows[0]?.coverage ?? {
    dayCount: 0,
    lwDayCount: 0,
    lyDayCount: 0,
  };

  /** Built once each rather than three times inline, as the Sales header does. */
  const lwPill = headerDeltaPill(
    totals.lwPct ?? 0,
    headerCov.lwDayCount,
    headerCov.dayCount,
    "last week",
  );
  const lyPill = headerDeltaPill(
    totals.lyPct ?? 0,
    headerCov.lyDayCount,
    headerCov.dayCount,
    "last year",
  );

  const dateRange =
    cats.twStart && cats.twEnd ? fmtCompactRange(cats.twStart, cats.twEnd) : "";

  return (
    <div
      className="flex flex-col min-w-0 shadow-lg"
      style={{ flexBasis: "35%", flexShrink: 0 }}
    >
      {/* Navy header — 2-row canonical pattern */}
      <div className="cc-navy-panel-header flex flex-col gap-0">
        <ListTotalsRow
          dateRange={dateRange}
          total={graded.length > 0 ? fmtHeaderValue(metric, totals.tw) : null}
        >
          {totals.lwPct !== null && (
            <HeaderDeltaPill
              label="LW"
              pct={totals.lwPct}
              cls={lwPill.cls}
              note={lwPill.note}
              title={pillTitle(
                comparedBasis(
                  metric,
                  totals.tw,
                  totals.twForLW,
                  totals.lwPaired,
                  "last week",
                ),
                lwPill.title,
              )}
            />
          )}
          {totals.lyPct !== null && (
            <HeaderDeltaPill
              label="LY"
              pct={totals.lyPct}
              cls={lyPill.cls}
              note={lyPill.note}
              title={pillTitle(
                comparedBasis(
                  metric,
                  totals.tw,
                  totals.twForLY,
                  totals.lyPaired,
                  "last year",
                ),
                lyPill.title,
              )}
            />
          )}
        </ListTotalsRow>

        <ListControlsRow
          locationName={locationName}
          metric={metric}
          onMetric={(key) => dispatch(setMetric(key))}
          threshold={threshold}
          onThreshold={(v) => dispatch(setThreshold(v))}
          onSearchOpen={onSearchOpen}
        />
      </div>

      {/* Renders nothing unless this storeid covers two locations, so an
          ordinary store sees no change to the layout. */}
      <LocationTabs
        numbers={cats.availableStoreNumbers}
        selected={cats.selectedStoreNumber}
        onChange={onStoreNumberChange}
      />

      <ListFilterRow
        counts={counts}
        tierFilter={tierFilter}
        onTier={(t) => dispatch(setTierFilter(t))}
        textFilter={textFilter}
        onText={(v) => dispatch(setTextFilter(v))}
      />

      {uncategorized.count > 0 && (
        <UncategorizedNote
          value={fmtValue(metric, uncategorized.value)}
          count={uncategorized.count}
        />
      )}

      <div className="flex-1 min-h-0 flex flex-col bg-custom-white border-x border-b border-line_hair rounded-b-xl overflow-hidden">
        <ListColumnHead sort={sort} onSort={handleSort} />

        <div data-help="list" className="flex-1 overflow-y-auto thin-scrollbar">
          {visible.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-[11px] text-content/95">
              None this week
            </div>
          ) : (
            visible.map((g) => (
              <CategoryRow
                key={g.category}
                category={g.category}
                label={g.label}
                twText={g.twText}
                lwText={g.lwText}
                lyText={g.lyText}
                lwPctText={g.lwPctText}
                lyPctText={g.lyPctText}
                dotClass={g.dotClass}
                lwPillClass={g.lwPillClass}
                lyPillClass={g.lyPillClass}
                isSelected={selectedCategory === g.category}
                onSelect={handleSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryListPanel;
