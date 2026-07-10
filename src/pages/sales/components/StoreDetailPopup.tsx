import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
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
import { ArrowDownTrayIcon } from "@heroicons/react/20/solid";
import PopupDaySidebar from "./PopupDaySidebar";
import PopupSubDeptList from "./PopupSubDeptList";
import PopupHourlyView from "./PopupHourlyView";
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

  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
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
  const lyStart = sameWeekDayLastYear(twStart).date;
  const lyEnd = sameWeekDayLastYear(twEnd).date;

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
  const headerTwTotal = activeDay
    ? activeDay.twNet
    : sortedDays.reduce((acc, d) => acc + d.twNet, 0);
  const headerLwTotal = activeDay
    ? activeDay.lwNet
    : sortedDays.reduce((acc, d) => acc + d.lwNet, 0);
  const headerLyTotal = activeDay
    ? activeDay.lyNet
    : sortedDays.reduce((acc, d) => acc + d.lyNet, 0);
  const headerVsLWPct =
    headerLwTotal > 0
      ? ((headerTwTotal - headerLwTotal) / headerLwTotal) * 100
      : null;
  const headerVsLYPct =
    headerLyTotal > 0
      ? ((headerTwTotal - headerLyTotal) / headerLyTotal) * 100
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
      dispatch(setSubSales(rawSubs));
      dispatch(setPeriodSubSales({ subs: rawLWSubs, period: 2 }));
      dispatch(setPeriodSubSales({ subs: rawLYSubs, period: 3 }));
      dispatch(setHourlySales(rawHourly));
      dispatch(setHourlySalesLastWeek(rawLWHourly));
      dispatch(setHourlySalesLastYear(rawLYHourly));
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
        <div className="flex items-center gap-2 justify-self-end">
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
              {formatCurrency2(headerLwTotal)}
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
              {formatCurrency2(headerLyTotal)}
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
