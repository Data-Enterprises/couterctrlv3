import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { getSubs, getHourly } from "../../../api/sales";
import {
  setSubSales,
  setHourlySales,
  setHourlySalesLastWeek,
  setHourlySalesLastYear,
  setPeriodSubSales,
} from "../../../features/salesSlice";
import { addDays, formatGoliathDate, sameWeekDayLastYear, formatCurrency2 } from "../../../utils";
import { XMarkIcon } from "@heroicons/react/20/solid";
import PopupDaySidebar from "./PopupDaySidebar";
import PopupSubDeptList from "./PopupSubDeptList";
import PopupHourlyView from "./PopupHourlyView";
import LoadingIndicator from "../../../components/loading/LoadingIndicator";
import type { StoreSelection } from "./LedgerRow";
import type { SubSale, HourlySale } from "../../../interfaces";

interface StoreDetailPopupProps {
  selection: StoreSelection;
  onClose: () => void;
}

type PopupTab = "subdept" | "hourly";

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

const StoreDetailPopup = ({ selection, onClose }: StoreDetailPopupProps) => {
  const dispatch = useAppDispatch();
  const context = useAppSelector((state) => state.app);
  const search = useAppSelector((state) => state.search);

  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<PopupTab>("subdept");
  const [selectedDate, setSelectedDate] = useState<string | null>(
    selection.mode === "daily" ? selection.start : null,
  );

  const [rawSubs, setRawSubs] = useState<SubSale[]>([]);
  const [rawLWSubs, setRawLWSubs] = useState<SubSale[]>([]);
  const [rawLYSubs, setRawLYSubs] = useState<SubSale[]>([]);
  const [rawHourly, setRawHourly] = useState<HourlySale[]>([]);
  const [rawLWHourly, setRawLWHourly] = useState<HourlySale[]>([]);
  const [rawLYHourly, setRawLYHourly] = useState<HourlySale[]>([]);

  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const twEnd = formatGoliathDate(search.singleDate);
  const lwStart = addDays(search.singleDate, -13).toISOString().split("T")[0];
  const lwEnd = addDays(search.singleDate, -7).toISOString().split("T")[0];
  const lyStart = sameWeekDayLastYear(twStart).date;
  const lyEnd = sameWeekDayLastYear(twEnd).date;

  // Static full-week totals for the header — never change with day selection
  const headerTwTotal = selection.days.reduce((acc, d) => acc + d.twNet, 0);
  const headerLwTotal = selection.days.reduce((acc, d) => acc + d.lwNet, 0);
  const headerLyTotal = selection.days.reduce((acc, d) => acc + d.lyNet, 0);
  const headerVsLWPct = headerLwTotal > 0 ? ((headerTwTotal - headerLwTotal) / headerLwTotal) * 100 : null;
  const headerVsLYPct = headerLyTotal > 0 ? ((headerTwTotal - headerLyTotal) / headerLyTotal) * 100 : null;

  const twYear = new Date(twEnd + "T12:00:00").getFullYear();
  const lyYear = new Date(lyEnd + "T12:00:00").getFullYear();
  const staticTwDate = `${fmtDate(twStart)} – ${fmtDate(twEnd)}, ${twYear}`;
  const staticLwDate = `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}, ${twYear}`;
  const staticLyDate = `${fmtDate(lyStart)} – ${fmtDate(lyEnd)}, ${lyYear}`;

  // Dynamic date labels passed to sub-panels — update with day selection
  const twDateLabel = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : `${fmtDate(twStart)} – ${fmtDate(twEnd)}`;

  const lwDateLabel = selectedDate
    ? new Date(
        addDays(new Date(selectedDate), -7).toISOString().split("T")[0] + "T12:00:00",
      ).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : `${fmtDate(lwStart)} – ${fmtDate(lwEnd)}`;

  const lyDateLabel = selectedDate
    ? new Date(
        sameWeekDayLastYear(selectedDate).date + "T12:00:00",
      ).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
    : `${fmtDate(lyStart)} – ${fmtDate(lyEnd)}`;

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [subsResp, lwSubsResp, lySubsResp, hourlyResp, lwHourlyResp, lyHourlyResp] =
          await Promise.all([
            getSubs(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
            getSubs(context.url, context.token, lwStart, lwEnd, 0, selection.storeId, 1),
            getSubs(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
            getHourly(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
            getHourly(context.url, context.token, lwStart, lwEnd, 0, selection.storeId, 1),
            getHourly(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
          ]);
        if (subsResp.data.error === 0) setRawSubs(subsResp.data.subs);
        if (lwSubsResp.data.error === 0) setRawLWSubs(lwSubsResp.data.subs);
        if (lySubsResp.data.error === 0) setRawLYSubs(lySubsResp.data.subs);
        if (hourlyResp.data.error === 0) setRawHourly(hourlyResp.data.subs);
        if (lwHourlyResp.data.error === 0) setRawLWHourly(lwHourlyResp.data.subs);
        if (lyHourlyResp.data.error === 0) setRawLYHourly(lyHourlyResp.data.subs);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selection.storeId]);

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
      dispatch(setSubSales(rawSubs.filter((s) => s.sale_date.startsWith(selectedDate))));
      const lwDay = addDays(new Date(selectedDate), -7).toISOString().split("T")[0];
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
      dispatch(setHourlySales(rawHourly.filter((h) => h.sale_date.startsWith(selectedDate))));
      dispatch(setHourlySalesLastWeek(rawLWHourly.filter((h) => h.sale_date.startsWith(lwDay))));
      dispatch(setHourlySalesLastYear(rawLYHourly.filter((h) => h.sale_date.startsWith(lyDay))));
    }
  }, [selectedDate, rawSubs, rawLWSubs, rawLYSubs, rawHourly, rawLWHourly, rawLYHourly]);

  const formatPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

  return (
    <div className="bg-custom-white rounded-xl shadow-sm overflow-hidden flex flex-col h-full">
      {/* Navy title bar */}
      <div className="flex items-start justify-between px-4 py-3 bg-[#1e2a4a] flex-shrink-0">
        <div>
          <p className="text-white text-[13px] font-semibold leading-tight">
            {selection.storeNumber} · {selection.storeName}
          </p>
          <span className="text-white/40 text-[10px]">Weekly Sales Report · {staticTwDate}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white/50 hover:text-white transition-colors mt-0.5"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Static metric summary row */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
        <div className="px-4 py-3">
          <div className="text-[9px] font-medium uppercase tracking-wide text-content/40">
            TY Net Sales
          </div>
          <div className="text-[8px] text-content/30 italic mb-1">{staticTwDate}</div>
          <div className="text-[13px] font-semibold text-content">
            {formatCurrency2(headerTwTotal)}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[9px] font-medium uppercase tracking-wide text-content/40">
            vs Last Week
          </div>
          <div className="text-[8px] text-content/30 italic mb-1">{staticLwDate}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-content">
              {formatCurrency2(headerLwTotal)}
            </span>
            {headerVsLWPct !== null && (
              <span
                className={`text-[11px] font-semibold ${
                  headerVsLWPct >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {formatPct(headerVsLWPct)}
              </span>
            )}
          </div>
        </div>
        <div className="px-4 py-3">
          <div className="text-[9px] font-medium uppercase tracking-wide text-content/40">
            vs Last Year
          </div>
          <div className="text-[8px] text-content/30 italic mb-1">{staticLyDate}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-content">
              {formatCurrency2(headerLyTotal)}
            </span>
            {headerVsLYPct !== null && (
              <span
                className={`text-[11px] font-semibold ${
                  headerVsLYPct >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {formatPct(headerVsLYPct)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-3 flex-shrink-0">
        {(["subdept", "hourly"] as PopupTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content/40 hover:text-content/60"
            }`}
          >
            {t === "subdept" ? "Sub dept" : "Hourly"}
          </button>
        ))}
      </div>

      {/* Day strip */}
      <div className="flex-shrink-0">
        <PopupDaySidebar
          days={selection.days}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
        />
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
        )}
      </div>
    </div>
  );
};

export default StoreDetailPopup;
