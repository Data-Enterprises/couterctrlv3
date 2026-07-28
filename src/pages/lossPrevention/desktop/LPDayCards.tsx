import { useMemo } from "react";
import { StarIcon } from "@heroicons/react/20/solid";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import { getHolidayName } from "../../../utils/holidays";
import type { TransactionOverview } from "../../../interfaces";

/**
 * Day-of-week cards for the selected store — same treatment as Sales'
 * PopupDaySidebar and Sub Dept Margins' MarginPerfDaySidebar: an "All Week"
 * card followed by one card per day, on a gray tray.
 *
 * Needs no fetches. transOverviews is already one row per transaction with a
 * sale_date, and baselineOverviews holds the prior two weeks for the same
 * store, so each day is graded against the same weekday in those two weeks —
 * a Tuesday only ever compared with Tuesdays.
 *
 * One deliberate divergence from the other two pages: here an INCREASE is the
 * bad direction. More exceptions than the baseline is worse, so the arrow
 * follows the real direction while the colour follows severity.
 */
interface LPDayCardsProps {
  /** This week's transactions for the selected store. */
  overviews: TransactionOverview[];
  /** The prior two weeks, for the day-matched baseline. */
  baseline: TransactionOverview[];
  /** Currently filtered day (YYYY-MM-DD), or "" for all days. */
  selectedDate: string;
  onSelect: (date: string) => void;
  /** False for exception types with no dollar amount — grade on count. */
  hasAmount: boolean;
}

const fmtPct = (pct: number) => `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;

const shiftDays = (iso: string, delta: number) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const dayOf = (rows: TransactionOverview[], iso: string) =>
  rows.filter((r) => r.sale_date.split("T")[0] === iso);

const totals = (rows: TransactionOverview[]) => ({
  count: rows.length,
  amount: rows.reduce((s, r) => s + Math.abs(r.total_sales), 0),
});

const LPDayCards = ({
  overviews,
  baseline,
  selectedDate,
  onSelect,
  hasAmount,
}: LPDayCardsProps) => {
  const { days, week } = useMemo(() => {
    const dates = [
      ...new Set(overviews.map((o) => o.sale_date.split("T")[0])),
    ].sort();

    const value = (t: { count: number; amount: number }) =>
      hasAmount ? t.amount : t.count;

    const built = dates.map((iso) => {
      const tw = totals(dayOf(overviews, iso));

      // Same weekday, both baseline weeks, averaged. Only weeks that actually
      // returned rows count — dividing by a fixed 2 when one week is missing
      // would halve the baseline and read as a spike that isn't there.
      const refWeeks = [shiftDays(iso, -7), shiftDays(iso, -14)]
        .map((d) => dayOf(baseline, d))
        .filter((r) => r.length > 0)
        .map(totals);
      const ref = refWeeks.length
        ? refWeeks.reduce((s, r) => s + value(r), 0) / refWeeks.length
        : null;

      const cur = value(tw);
      return {
        iso,
        tw,
        delta: ref !== null && ref !== 0 ? ((cur - ref) / ref) * 100 : null,
      };
    });

    const twWeek = totals(overviews);
    // The week is compared against the baseline halved — two weeks of baseline
    // against one week now, matching how the store rows are graded.
    const blWeek = totals(baseline);
    const refWeek = value(blWeek) / 2;
    return {
      days: built,
      week: {
        tw: twWeek,
        delta:
          refWeek !== 0 ? ((value(twWeek) - refWeek) / refWeek) * 100 : null,
      },
    };
  }, [overviews, baseline, hasAmount]);

  if (days.length === 0) return null;

  const display = (t: { count: number; amount: number }) =>
    hasAmount ? formatCurrency2(t.amount) : formatBigNumber(t.count, 0);

  // Up is worse here — more exceptions than the matched baseline.
  const deltaClass = (delta: number | null) =>
    delta === null
      ? "text-content"
      : delta > 0
        ? "text-severity_critical_text"
        : "text-severity_healthy_text";

  const deltaText = (delta: number | null) =>
    delta === null ? "—" : `${delta > 0 ? "▲" : "▼"} ${fmtPct(delta)} BL`;

  const allSelected = selectedDate === "";
  const weekRange =
    days.length > 0
      ? `${new Date(days[0].iso + "T12:00:00").getMonth() + 1}/${new Date(days[0].iso + "T12:00:00").getDate()} – ${new Date(days[days.length - 1].iso + "T12:00:00").getMonth() + 1}/${new Date(days[days.length - 1].iso + "T12:00:00").getDate()}`
      : "";

  return (
    <div className="flex-shrink-0 flex gap-1.5 p-1.5 border-b border-gray-100 bg-gray-50">
      {/* All week card */}
      <button
        onClick={() => onSelect("")}
        className={`flex flex-col rounded-md overflow-hidden flex-[1.3] border transition-colors ${
          allSelected
            ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
          <div className="text-[9px] font-bold uppercase tracking-wide text-content">
            All Week
          </div>
          <div className="text-[12px] font-bold text-content leading-none">
            {weekRange}
          </div>
          <div className="text-[12px] font-bold text-content mt-1">
            {display(week.tw)}
          </div>
          <div className={`text-[11px] font-semibold ${deltaClass(week.delta)}`}>
            {deltaText(week.delta)}
          </div>
        </div>
      </button>

      {/* Day cards */}
      {days.map(({ iso, tw, delta }) => {
        const date = new Date(iso + "T12:00:00");
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const dateNum = `${date.getMonth() + 1}/${date.getDate()}`;
        const isSelected = selectedDate === iso;
        const holidayName = getHolidayName(iso);

        return (
          <button
            key={iso}
            onClick={() => onSelect(isSelected ? "" : iso)}
            className={`relative flex flex-col rounded-md overflow-hidden flex-1 border transition-colors ${
              isSelected
                ? "border-[#1e2a4a] ring-2 ring-[#1e2a4a]/30"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            {holidayName && (
              <span title={holidayName} className="absolute top-1 right-1 z-10">
                <StarIcon className="w-2.5 h-2.5 text-amber-500" />
              </span>
            )}
            <div className="flex flex-col items-center justify-center gap-0.5 py-2 px-1 bg-custom-white">
              <div className="text-[9px] font-bold uppercase tracking-wide text-content">
                {dayName}
              </div>
              <div className="text-[12px] font-bold text-content leading-none">
                {dateNum}
              </div>
              <div className="text-[12px] font-bold text-content mt-1">
                {display(tw)}
              </div>
              <div className={`text-[11px] font-semibold ${deltaClass(delta)}`}>
                {deltaText(delta)}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default LPDayCards;
