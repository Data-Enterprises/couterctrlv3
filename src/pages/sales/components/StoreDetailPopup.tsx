import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
// import { useSalesState } from "../hooks/useSalesState";
import { getSubs, getHourly /* , getCats */ } from "../../../api/sales";
import SalesExportModal from "./SalesExportModal";
import {
  setSubSales,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  setPeriodSubSales,
} from "../../../features/salesSlice";
import {
  setLedgerTab,
  setLedgerSelectedDate,
  setRawSubs,
  setRawLWSubs,
  setRawLYSubs,
  setRawHourly,
  setRawLWHourly,
  setRawLYHourly,
  // setRawCats,
  // setRawLWCats,
  // setRawLYCats,
  // setCategoryThreshold,
  setLastFetchedStoreId,
  clearPopupSelections,
} from "../../../features/salesLedgerSlice";
import {
  addDays,
  formatGoliathDate,
  sameWeekDayLastYear,
  formatCurrency2,
} from "../../../utils";
import { computeDayMatchedTotals /*, getWeeklyDataGaps, getWeeklyGapCount */ } from "../shared/ledgerUtils";
import { ArrowDownTrayIcon /*, ExclamationTriangleIcon */ } from "@heroicons/react/20/solid";
import PopupDaySidebar from "./PopupDaySidebar";
import PopupSubDeptList from "./PopupSubDeptList";
import PopupHourlyView from "./PopupHourlyView";
// import DataGapReport from "./DataGapReport";
// import PopupCategoryList from "./PopupCategoryList";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import type { StoreSelection } from "./LedgerRow";
import { formatPct, pillClass, severityHeaderBgClass } from "./utils";
import GhostFlames from "./GhostFlames";

interface StoreDetailPopupProps {
  selection: StoreSelection;
  onClose: () => void;
}

// Category tab (and its cat_sales fetch below) is commented out for now —
// uncomment this, the getCats-related imports above, and the marked blocks
// below to bring it back.
type PopupTab = "subdept" | "hourly" /* | "category" */;

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

const StoreDetailPopup = ({ selection }: StoreDetailPopupProps) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);
  const {
    tab,
    selectedDate,
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
    exportSubDeptItems,
    exportSubDeptName,
    lastFetchedStoreId,
  } = useAppSelector((state) => state.salesLedger);
  // const { weeklySales, weeklySalesLastWeek, weeklySalesLastYear } =
  //   useSalesState();

  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  // const [gapReportOpen, setGapReportOpen] = useState(false);
  const [showFlames, setShowFlames] = useState(false);
  // const [catLoading, setCatLoading] = useState(false);
  // const [catFetchedFor, setCatFetchedFor] = useState<number | null>(null);

  useEffect(() => {
    if (selection.severity !== "critical") {
      setShowFlames(false);
      return;
    }
    setShowFlames(true);
    const timer = setTimeout(() => setShowFlames(false), 5000);
    return () => clearTimeout(timer);
  }, [selection.storeId, selection.severity]);

  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const twEnd = formatGoliathDate(search.singleDate);
  const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
  const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
  // Checked against the raw weekly-sales fetch (not selection.days, which
  // only ever contains real TW rows) so a day missing from TW itself — not
  // just from LW/LY — actually shows up instead of being silently invisible.
  // const gaps = getWeeklyDataGaps(
  //   selection.storeId,
  //   twStart,
  //   twEnd,
  //   lwStart,
  //   lwEnd,
  //   weeklySales,
  //   weeklySalesLastWeek,
  //   weeklySalesLastYear,
  // );
  // const gapCount = getWeeklyGapCount(gaps);
  // The store's weekly-sales data (selection.days, built by buildLedgerRows)
  // is fragmented — it only has an entry for the calendar days that actually
  // have a row, not all 7 days of the week. The KPI header and left panel
  // both treat that real, possibly-sparse set of days as "this week." Basing
  // the LW/LY match set on all 7 hypothetical calendar days instead (rather
  // than the real ones) would recognize a wider set of "matched" days than
  // the store level does, so sub-dept/hourly could show real figures for a
  // day the KPI header doesn't even count as part of the week. Deriving the
  // match set from selection.days' actual dates keeps every level in sync.
  const twRealDates = selection.days.map((d) => d.sale_date.split("T")[0]);
  const lyWeekDates = twRealDates.map((d) => sameWeekDayLastYear(d).date).sort();
  const lyStart = lyWeekDates[0];
  const lyEnd = lyWeekDates[lyWeekDates.length - 1];
  const lwWeekDates = twRealDates.map(
    (d) => addDays(new Date(d), -7).toISOString().split("T")[0],
  );

  const twYear = new Date(twEnd + "T12:00:00").getFullYear();
  // const lyYear = new Date(lyEnd + "T12:00:00").getFullYear();

  // Static range strings
  const staticTwDate = `${fmtDate(twStart)} – ${fmtDate(twEnd)}, ${twYear}`;
  // const staticLwDate = `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}, ${twYear}`;
  // const staticLyDate = `${fmtDate(lyStart)} – ${fmtDate(lyEnd)}, ${lyYear}`;

  // Dynamic date labels — update when a day is selected
  const twDateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(twStart)} – ${fmtDate(twEnd)}`;
  const lwDateLabel = selectedDate
    ? new Date(
        addDays(new Date(selectedDate), -7).toISOString().split("T")[0] +
          "T12:00:00",
      ).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}`;
  const lyDateLabel = selectedDate
    ? new Date(
        sameWeekDayLastYear(selectedDate).date + "T12:00:00",
      ).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(lyStart)} – ${fmtDate(lyEnd)}`;

  // KPI strip values — full week or selected day
  const sortedDays = [...selection.days].sort((a, b) =>
    a.sale_date.localeCompare(b.sale_date),
  );
  const activeDay = selectedDate
    ? sortedDays.find((d) => d.sale_date.startsWith(selectedDate))
    : null;
  // Whole-week figures go through computeDayMatchedTotals so the header
  // agrees with the left panel and day strip — the TW side of each
  // comparison is restricted to just the days with a genuine LW/LY match,
  // same as buildLedgerRows/PopupDaySidebar. A single selected day has no
  // aggregation to do, but its lwNet/lyNet can still be null (no match).
  const weekTotals = computeDayMatchedTotals(sortedDays);
  const headerTwTotal = activeDay ? activeDay.twNet : weekTotals.twTotal;
  const headerLwTotal = activeDay ? activeDay.lwNet : weekTotals.lwTotal;
  const headerLyTotal = activeDay ? activeDay.lyNet : weekTotals.lyTotal;
  const headerHasLW = activeDay
    ? activeDay.lwNet !== null && activeDay.lwNet > 0
    : weekTotals.hasLW;
  const headerHasLY = activeDay
    ? activeDay.lyNet !== null && activeDay.lyNet > 0
    : weekTotals.hasLY;
  const headerVsLWPct = activeDay
    ? headerHasLW
      ? ((activeDay.twNet - (activeDay.lwNet as number)) /
          (activeDay.lwNet as number)) *
        100
      : null
    : weekTotals.hasLW
      ? weekTotals.vsLWPct
      : null;
  const headerVsLYPct = activeDay
    ? headerHasLY
      ? ((activeDay.twNet - (activeDay.lyNet as number)) /
          (activeDay.lyNet as number)) *
        100
      : null
    : weekTotals.hasLY
      ? weekTotals.vsLYPct
      : null;

  const THRESHOLD = 9;

  useEffect(() => {
    // Remounting with data already fetched for this exact store (e.g.
    // navigating away and back) shouldn't refire the request — Redux still
    // has it, only the component tree was torn down.
    if (lastFetchedStoreId === selection.storeId) return;
    dispatch(clearPopupSelections());
    const fetch = async () => {
      setLoading(true);
      try {
        const [
          subsResp,
          lwSubsResp,
          lySubsResp,
          hourlyResp,
          lwHourlyResp,
          lyHourlyResp,
        ] = await Promise.all([
          getSubs(
            context.url,
            context.token,
            twStart,
            twEnd,
            0,
            selection.storeId,
            1,
          ),
          getSubs(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            0,
            selection.storeId,
            1,
          ),
          getSubs(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            twStart,
            twEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            lwStart,
            lwEnd,
            0,
            selection.storeId,
            1,
          ),
          getHourly(
            context.url,
            context.token,
            lyStart,
            lyEnd,
            0,
            selection.storeId,
            1,
          ),
        ]);
        dispatch(
          setRawSubs(subsResp.data.error === 0 ? subsResp.data.subs : []),
        );
        dispatch(
          setRawLWSubs(lwSubsResp.data.error === 0 ? lwSubsResp.data.subs : []),
        );
        dispatch(
          setRawLYSubs(lySubsResp.data.error === 0 ? lySubsResp.data.subs : []),
        );
        dispatch(
          setRawHourly(hourlyResp.data.error === 0 ? hourlyResp.data.subs : []),
        );
        dispatch(
          setRawLWHourly(
            lwHourlyResp.data.error === 0 ? lwHourlyResp.data.subs : [],
          ),
        );
        dispatch(
          setRawLYHourly(
            lyHourlyResp.data.error === 0 ? lyHourlyResp.data.subs : [],
          ),
        );
        dispatch(setLastFetchedStoreId(selection.storeId));
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selection.storeId]);

  // Category tab disabled for now — cat_sales fetch commented out alongside it.
  // // Category data can run into hundreds of rows per store, so it's fetched
  // // lazily on first visit to the tab rather than eagerly alongside sub
  // // dept/hourly — avoids the extra payload for users who never open it.
  // useEffect(() => {
  //   if (tab !== "category" || catFetchedFor === selection.storeId) return;
  //   const fetchCats = async () => {
  //     setCatLoading(true);
  //     try {
  //       const [catsResp, lwCatsResp, lyCatsResp] = await Promise.all([
  //         getCats(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
  //         getCats(context.url, context.token, lwStart, lwEnd, 0, selection.storeId, 1),
  //         getCats(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
  //       ]);
  //       dispatch(setRawCats(catsResp.data.error === 0 ? catsResp.data.subs : []));
  //       dispatch(setRawLWCats(lwCatsResp.data.error === 0 ? lwCatsResp.data.subs : []));
  //       dispatch(setRawLYCats(lyCatsResp.data.error === 0 ? lyCatsResp.data.subs : []));
  //       setCatFetchedFor(selection.storeId);
  //     } finally {
  //       setCatLoading(false);
  //     }
  //   };
  //   fetchCats();
  // }, [tab, selection.storeId]);

  useEffect(() => {
    if (!rawSubs.length && !rawHourly.length) return;

    if (selectedDate === null) {
      // The raw LW/LY arrays can include days that don't actually correspond
      // to any day in this TW week (the LY range is deliberately widened
      // around holidays, and the underlying data itself is fragmented) —
      // filter down to the exact matched date set before aggregating, same
      // as buildLedgerRows already does for the store-level totals, so the
      // sub-dept/hourly figures agree with the KPI header above them.
      const lwDateSet = new Set(lwWeekDates);
      const lyDateSet = new Set(lyWeekDates);
      dispatch(setSubSales(rawSubs));
      dispatch(
        setPeriodSubSales({
          subs: rawLWSubs.filter((s) => lwDateSet.has(s.sale_date.split("T")[0])),
          period: 2,
        }),
      );
      dispatch(
        setPeriodSubSales({
          subs: rawLYSubs.filter((s) => lyDateSet.has(s.sale_date.split("T")[0])),
          period: 3,
        }),
      );
      dispatch(setHourlySales(rawHourly));
      dispatch(
        setHourlySalesLastWeek(
          rawLWHourly.filter((h) => lwDateSet.has(h.sale_date.split("T")[0])),
        ),
      );
      dispatch(
        setHourlySalesLastYear(
          rawLYHourly.filter((h) => lyDateSet.has(h.sale_date.split("T")[0])),
        ),
      );
    } else {
      dispatch(
        setSubSales(
          rawSubs.filter((s) => s.sale_date.startsWith(selectedDate)),
        ),
      );
      const lwDay = addDays(new Date(selectedDate), -7)
        .toISOString()
        .split("T")[0];
      const lyDay = sameWeekDayLastYear(selectedDate).date;
      dispatch(
        setPeriodSubSales({
          subs: rawLWSubs.filter((s) => s.sale_date.startsWith(lwDay)),
          period: 2,
        }),
      );
      dispatch(
        setPeriodSubSales({
          subs: rawLYSubs.filter((s) => s.sale_date.startsWith(lyDay)),
          period: 3,
        }),
      );
      dispatch(
        setHourlySales(
          rawHourly.filter((h) => h.sale_date.startsWith(selectedDate)),
        ),
      );
      dispatch(
        setHourlySalesLastWeek(
          rawLWHourly.filter((h) => h.sale_date.startsWith(lwDay)),
        ),
      );
      dispatch(
        setHourlySalesLastYear(
          rawLYHourly.filter((h) => h.sale_date.startsWith(lyDay)),
        ),
      );
    }
  }, [
    selectedDate,
    rawSubs,
    rawLWSubs,
    rawLYSubs,
    rawHourly,
    rawLWHourly,
    rawLYHourly,
  ]);

  return (
    <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Title bar — tinted to the selected store's severity */}
      <div className={`relative grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-3 flex-shrink-0 ${severityHeaderBgClass[selection.severity]}`}>
        {showFlames && <GhostFlames />}
        <p className="text-custom-white text-[13px] font-bold leading-tight justify-self-start">
          {selection.storeName}
        </p>
        <span className="text-custom-white text-[13px] font-bold justify-self-center">
          Weekly Sales Report · {staticTwDate}
        </span>
        <div className="flex items-center gap-3 justify-self-end">
          {/* {!loading && gapCount > 0 && (
            <button
              onClick={() => setGapReportOpen(true)}
              title={`${gapCount} day${gapCount === 1 ? "" : "s"} missing comparison data`}
              className="relative flex items-center justify-center w-[22px] h-[22px] flex-shrink-0"
            >
              <span className="relative inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-custom-white">
                <ExclamationTriangleIcon className="w-3 h-3 text-amber-600" />
              </span>
              <span className="absolute -top-1 -right-1 min-w-[13px] h-[13px] px-[3px] rounded-full bg-amber-600 text-custom-white text-[8px] font-semibold flex items-center justify-center leading-none">
                {gapCount}
              </span>
            </button>
          )} */}
          {!loading && (rawSubs.length > 0 || rawHourly.length > 0) && (
            <button
              onClick={() => setExportOpen(true)}
              title="Export CSV"
              className="text-custom-white transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* {gapReportOpen && (
        <DataGapReport
          gaps={gaps}
          storeName={selection.storeName}
          storeNumber={selection.storeNumber}
          onClose={() => setGapReportOpen(false)}
        />
      )} */}

      {exportOpen && (
        <SalesExportModal
          onClose={() => setExportOpen(false)}
          storeName={selection.storeName}
          dateLabel={staticTwDate}
          rawSubs={rawSubs}
          rawLWSubs={rawLWSubs}
          rawLYSubs={rawLYSubs}
          rawHourly={rawHourly}
          rawLWHourly={rawLWHourly}
          rawLYHourly={rawLYHourly}
          days={selection.days}
          subDeptItems={exportSubDeptItems}
          subDeptName={exportSubDeptName}
        />
      )}

      {/* KPI metric strip — values and date labels update with day selection */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="px-4 pt-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            TY Net Sales
          </div>
          <div className="text-[10px] font-bold text-content mb-0.5">{twDateLabel}</div>
          <div className="text-[14px] font-bold text-content">
            {formatCurrency2(headerTwTotal)}
          </div>
        </div>
        <div className="px-4 pt-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            vs Last Week
          </div>
          <div className="text-[10px] font-bold text-content mb-0.5">{lwDateLabel}</div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[14px] font-bold text-content">
              {headerLwTotal !== null ? formatCurrency2(headerLwTotal) : "—"}
            </span>
            {headerVsLWPct !== null && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pillClass(headerVsLWPct, THRESHOLD)}`}
              >
                {formatPct(headerVsLWPct)}
              </span>
            )}
          </div>
        </div>
        <div className="px-4 pt-2.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-content">
            vs Last Year
          </div>
          <div className="text-[10px] font-bold text-content mb-0.5">{lyDateLabel}</div>
          <div className="flex items-baseline justify-center gap-2">
            <span className="text-[14px] font-bold text-content">
              {headerLyTotal !== null ? formatCurrency2(headerLyTotal) : "—"}
            </span>
            {headerVsLYPct !== null && (
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${pillClass(headerVsLYPct, THRESHOLD)}`}
              >
                {formatPct(headerVsLYPct)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Day strip */}
      <div className="flex-shrink-0">
        <PopupDaySidebar
          days={selection.days}
          selectedDate={selectedDate}
          onSelect={(date) => dispatch(setLedgerSelectedDate(date))}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 px-3 flex-shrink-0">
        {(["subdept", "hourly"] as PopupTab[]).map((t) => (
          <button
            key={t}
            onClick={() => dispatch(setLedgerTab(t))}
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content"
            }`}
          >
            {t === "subdept" ? "Sub dept" : "Hourly"}
          </button>
        ))}
      </div>

      {/* Content — fills remaining height */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="relative h-full">
            <LoadingIndicator message="Loading store detail" />
          </div>
        ) : tab === "subdept" ? (
          <PopupSubDeptList
            twDateLabel={twDateLabel}
            lwDateLabel={lwDateLabel}
            lyDateLabel={lyDateLabel}
            storeId={selection.storeId}
            selectedDate={selectedDate}
            twRealDates={twRealDates}
          />
        ) : (
          <PopupHourlyView
            twDateLabel={twDateLabel}
            lwDateLabel={lwDateLabel}
            lyDateLabel={lyDateLabel}
          />
          // Category tab disabled for now:
          // ) : catLoading ? (
          //   <div className="relative h-full">
          //     <LoadingIndicator message="Loading category data" />
          //   </div>
          // ) : (
          //   <PopupCategoryList
          //     twDateLabel={twDateLabel}
          //     lwDateLabel={lwDateLabel}
          //     lyDateLabel={lyDateLabel}
          //     selectedDate={selectedDate}
          //   />
        )}
      </div>
    </div>
  );
};

export default StoreDetailPopup;
