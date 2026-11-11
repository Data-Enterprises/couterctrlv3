// Hooks
import { useState, memo } from "react";
import { useAppDispatch } from "../../../../hooks";
import { useSalesCtx } from "../hooks";
import {
  useDateLabels,
  useDayScopedSales,
  useStoreNames,
  useStorePanelFetch,
  useWeekWindow,
} from "./hooks";

// Redux
import { setCounterpart } from "../../../../features/dev/devSalesLedgerSlice";

// Utils
import { sameWeekDayLastYear } from "../../../../utils";
import { shiftIsoDay } from "../../../../utils/dates";
import { buildHeaderTotals } from "./utils";

// Interfaces
import type { StoreSelection } from "../../../../interfaces";
import type { LedgerRowData } from "../interfaces";

// Components
import LoadingIndicator from "../../../../components-dev/loading/LoadingIndicator";
import PopupDaySidebar from "../components/PopupDaySidebar";
import SalesExportModal from "./export/SalesExportModal";
import PopupTopItems from "./top200/PopupTopItems";
import TopItemsReport from "./top200/components/TopItemsReport";
import DailyRecap from "./summary/DailyRecap";
import PopupComparisonList from "./compare/PopupComparisonList";
import DeptReport from "./subDepts/components/DeptReport";
import HourlySideBySide from "./hourly/components/HourlySideBySide";
import PopupSubDeptList from "./subDepts/PopupSubDeptList";
import PopupHourlyView from "./hourly/PopupHourlyView";
import StorePopupHeader from "./components/StorePopupHeader";
import StoreKpiStrip from "./components/StoreKpiStrip";
import StorePopupTabs from "./components/StorePopupTabs";

interface StoreDetailPopupProps {
  selection: StoreSelection;
  onClose: () => void;
  /** Every store in the current search, so this one can be placed among them.
   *  Absent on a single-store search, where there is no reference set. */
  groupRows?: LedgerRowData[];
}

/** The open store's panel: title bar, KPI strip, day cards, tabs and the open
 *  tab's content. */
const StoreDetailPopup = ({ selection, groupRows }: StoreDetailPopupProps) => {
  // A search of one store has no reference set, so there is nothing to
  // compare against and the tab is never offered.
  const hasGroup = !!groupRows && groupRows.length > 1;
  const dispatch = useAppDispatch();
  const {
    searchedGroup,
    tab,
    selectedDate,
    gradingMetric,
    counterpart,
    itemThreshold: rawItemThreshold,
  } = useSalesCtx();
  const itemThreshold = rawItemThreshold ?? 9;
  const [exportOpen, setExportOpen] = useState(false);

  const loading = useStorePanelFetch(selection);
  useDayScopedSales();
  const {
    twStart,
    twEnd,
    lwStart,
    lwEnd,
    twRealDates,
    lyWeekDates,
    lyStart,
    lyEnd,
    lwWeekDates,
    staticTwDate,
  } = useWeekWindow();
  const { twDateLabel, lwDateLabel, lyDateLabel } = useDateLabels();
  const { headerStoreName } = useStoreNames(selection);
  const { activeDay, weekTotals } = buildHeaderTotals(
    selection.days,
    selectedDate,
    gradingMetric,
  );

  return (
    <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      <StorePopupHeader
        selection={selection}
        loading={loading}
        onExport={() => setExportOpen(true)}
      />

      {exportOpen && (
        <SalesExportModal
          onClose={() => setExportOpen(false)}
          storeName={selection.storeName}
          dateLabel={staticTwDate}
          days={selection.days}
          storeId={selection.storeId}
          storeNumber={selection.storeNumber}
          startDate={twStart}
          endDate={twEnd}
          // Only when the ledger actually searched a group. Financials is the
          // one export that can answer wider than this popup, and the endpoint
          // needs a groupid to do it.
          group={searchedGroup}
          stores={groupRows}
        />
      )}

      <StoreKpiStrip days={selection.days} />

      <div className="flex-shrink-0">
        <PopupDaySidebar days={selection.days} />
      </div>

      <StorePopupTabs hasGroup={hasGroup} />

      {/* Content — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="relative h-full">
            <LoadingIndicator message="Loading store detail" />
          </div>
        ) : tab === "comparison" ? (
          hasGroup ? (
            <PopupComparisonList
              rows={groupRows as LedgerRowData[]}
              storeid={selection.storeId}
              storeNumber={selection.storeNumber}
              threshold={itemThreshold}
              openStoreName={headerStoreName}
            />
          ) : null
        ) : tab === "dailyrecap" ? (
          /* Always the open store, counterpart or not: a recap is a summary
             of one store's week, not a comparison. Keyed on the store so its
             open rows and its read items start again with a new one. */
          <DailyRecap
            key={`${selection.storeId}__${selection.storeNumber}`}
            storeId={selection.storeId}
            storeNumber={selection.storeNumber}
            dates={twRealDates}
            days={selection.days}
            selectedDate={selectedDate}
          />
        ) : tab === "topitems" ? (
          /* Same rule as Sub depts above: with a counterpart chosen in
             Stores, this tab IS the comparison. Without one it is the
             store's own top 200, graded, exactly as it has always been --
             the single-store tab is not touched by any of this. */
          counterpart ? (
            <TopItemsReport
              openStoreName={headerStoreName}
              openStoreId={selection.storeId}
              compareStoreId={counterpart.storeid}
              compareStoreName={counterpart.storeName}
              twStart={twStart}
              twEnd={twEnd}
              onBack={() => dispatch(setCounterpart(null))}
            />
          ) : (
          <PopupTopItems
            storeId={selection.storeId}
            locations={selection.storeNumbersForId}
            /* The Top 200 follows the day cards, like the other tabs: a
               picked day is that day, against the same weekday last week and
               last year, and its share is of that day's net sales. It used to
               stay on the week whatever was picked. Dollars always, whatever
               the Sales/Qty toggle: a share of net sales is a share of money. */
            netSales={
              activeDay
                ? {
                    ty: activeDay.twNet,
                    lw: activeDay.lwNet !== null && activeDay.lwNet > 0 ? activeDay.lwNet : null,
                    ly: activeDay.lyNet !== null && activeDay.lyNet > 0 ? activeDay.lyNet : null,
                  }
                : {
                    ty: weekTotals.twTotal,
                    lw: weekTotals.hasLW ? weekTotals.lwTotal : null,
                    ly: weekTotals.hasLY ? weekTotals.lyTotal : null,
                  }
            }
            start={selectedDate ?? twStart}
            end={selectedDate ?? twEnd}
            lwStart={selectedDate ? shiftIsoDay(selectedDate, -7) : lwStart}
            lwEnd={selectedDate ? shiftIsoDay(selectedDate, -7) : lwEnd}
            lyStart={selectedDate ? sameWeekDayLastYear(selectedDate).date : lyStart}
            lyEnd={selectedDate ? sameWeekDayLastYear(selectedDate).date : lyEnd}
          />
          )
        ) : tab === "subdept" ? (
          /* With a counterpart chosen in Stores, this tab IS the comparison;
             without one it is the store's own departments, graded, exactly as
             a single-store search has always had it. The counterpart is page
             state, so Hourly will answer to the same choice once it can.

             With one, it is a report rather than a list: a list ordered by
             department size put the biggest departments at the top, which
             are the ones most likely to be level, so the only way to find
             the problem was to click around until you hit it. */
          counterpart ? (
            <DeptReport
              openStoreName={headerStoreName}
              openStoreId={selection.storeId}
              openStoreNumber={selection.storeNumber}
              compareStoreId={counterpart.storeid}
              compareStoreNumber={counterpart.storeNumber}
              compareStoreName={counterpart.storeName}
              twStart={twStart}
              twEnd={twEnd}
              lwStart={lwStart}
              lwEnd={lwEnd}
              lyStart={lyStart}
              lyEnd={lyEnd}
              lwWeekDates={lwWeekDates}
              lyWeekDates={lyWeekDates}
              onBack={() => dispatch(setCounterpart(null))}
            />
          ) : (
            <PopupSubDeptList
              twDateLabel={twDateLabel}
              lwDateLabel={lwDateLabel}
              lyDateLabel={lyDateLabel}
              storeId={selection.storeId}
              storeNumber={selection.storeNumber}
              twRealDates={twRealDates}
            />
          )
        ) : counterpart ? (
          /* Hourly answers to the same counterpart as Sub depts: one choice,
             every tab that can compare. */
          <HourlySideBySide
            openStoreName={headerStoreName}
            openStoreNumber={selection.storeNumber}
            compareStoreId={counterpart.storeid}
            compareStoreNumber={counterpart.storeNumber}
            compareStoreName={counterpart.storeName}
            twStart={twStart}
            twEnd={twEnd}
            lwStart={lwStart}
            lwEnd={lwEnd}
            lyStart={lyStart}
            lyEnd={lyEnd}
            lwWeekDates={lwWeekDates}
            lyWeekDates={lyWeekDates}
            onBack={() => dispatch(setCounterpart(null))}
          />
        ) : (
          <PopupHourlyView
            twDateLabel={twDateLabel}
            lwDateLabel={lwDateLabel}
            lyDateLabel={lyDateLabel}
          />
        )}
      </div>
    </div>
  );
};

// This panel grades off its own thresholds (subDept/item/hourly/category), not
// the store-row threshold in the header, so it has no reason to re-render when
// that one changes. Without this it re-rendered on every drag frame purely
// because SalesLedger re-rendered above it.
export default memo(StoreDetailPopup);
