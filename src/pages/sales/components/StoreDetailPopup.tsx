import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "../../../hooks";
import { getSubs, getHourly } from "../../../api/sales";
import {
  setSubSales,
  setHourlySales,
  setHourlySalesLastYear,
  setPeriodSubSales,
} from "../../../features/salesSlice";
import { addDays, formatGoliathDate, sameWeekDayLastYear } from "../../../utils";
import DraggablePopup from "../../../components/DraggablePopup";
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
  const [rawLYSubs, setRawLYSubs] = useState<SubSale[]>([]);
  const [rawHourly, setRawHourly] = useState<HourlySale[]>([]);
  const [rawLYHourly, setRawLYHourly] = useState<HourlySale[]>([]);

  const twStart = addDays(search.singleDate, -6).toISOString().split("T")[0];
  const twEnd = formatGoliathDate(search.singleDate);
  const lyStart = sameWeekDayLastYear(twStart).date;
  const lyEnd = sameWeekDayLastYear(twEnd).date;

  // Fetch full week once on open
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [subsResp, lySubsResp, hourlyResp, lyHourlyResp] = await Promise.all([
          getSubs(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
          getSubs(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
          getHourly(context.url, context.token, twStart, twEnd, 0, selection.storeId, 1),
          getHourly(context.url, context.token, lyStart, lyEnd, 0, selection.storeId, 1),
        ]);
        if (subsResp.data.error === 0) setRawSubs(subsResp.data.subs);
        if (lySubsResp.data.error === 0) setRawLYSubs(lySubsResp.data.subs);
        if (hourlyResp.data.error === 0) setRawHourly(hourlyResp.data.subs);
        if (lyHourlyResp.data.error === 0) setRawLYHourly(lyHourlyResp.data.subs);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [selection.storeId]);

  // Dispatch filtered data to Redux whenever selectedDate or raw data changes
  useEffect(() => {
    if (!rawSubs.length && !rawHourly.length) return;

    if (selectedDate === null) {
      dispatch(setSubSales(rawSubs));
      dispatch(setPeriodSubSales({ subs: rawLYSubs, period: 3 }));
      dispatch(setHourlySales(rawHourly));
      dispatch(setHourlySalesLastYear(rawLYHourly));
    } else {
      dispatch(setSubSales(rawSubs.filter((s) => s.sale_date.startsWith(selectedDate))));
      const lyDay = sameWeekDayLastYear(selectedDate).date;
      dispatch(setPeriodSubSales({
        subs: rawLYSubs.filter((s) => s.sale_date.startsWith(lyDay)),
        period: 3,
      }));
      dispatch(setHourlySales(rawHourly.filter((h) => h.sale_date.startsWith(selectedDate))));
      dispatch(setHourlySalesLastYear(rawLYHourly.filter((h) => h.sale_date.startsWith(lyDay))));
    }
  }, [selectedDate, rawSubs, rawLYSubs, rawHourly, rawLYHourly]);

  const subtitle = selectedDate
    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "long", month: "short", day: "numeric",
      })
    : `${twStart} – ${twEnd}`;

  return (
    <DraggablePopup
      title={selection.storeName}
      subtitle={subtitle}
      onClose={onClose}
      width={610}
    >
      {/* Day strip */}
      <PopupDaySidebar
        days={selection.days}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-100 px-3 pt-2">
        {(["subdept", "hourly"] as PopupTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-[#1e2a4a] text-content"
                : "border-transparent text-content/40 hover:text-content/60"
            }`}
          >
            {t === "subdept" ? "Sub dept" : "Hourly"}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="relative min-h-[200px]">
          <LoadingIndicator message="Loading store detail" />
        </div>
      ) : tab === "subdept" ? (
        <PopupSubDeptList />
      ) : (
        <PopupHourlyView />
      )}
    </DraggablePopup>
  );
};

export default StoreDetailPopup;
