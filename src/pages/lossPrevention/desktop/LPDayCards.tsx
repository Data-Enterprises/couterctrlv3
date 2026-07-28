import { useMemo } from "react";
import { formatCurrency2, formatBigNumber } from "../../../utils";
import DayCardStrip, { type DayCardEntry } from "../../../components/DayCardStrip";
import type { TransactionOverview } from "../../../interfaces";

/**
 * Day-of-week cards for the selected store. Rendering lives in DayCardStrip;
 * this only decides what LP's numbers are.
 *
 * Needs no fetches: transOverviews is already one row per transaction with a
 * sale_date, and baselineOverviews holds the prior two weeks for the same
 * store. Each day is graded against the same weekday in those two weeks — a
 * Tuesday only ever compared with Tuesdays.
 */
interface LPDayCardsProps {
  overviews: TransactionOverview[];
  baseline: TransactionOverview[];
  selectedDate: string;
  onSelect: (date: string) => void;
  /** False for exception types with no dollar amount — grade on count. */
  hasAmount: boolean;
}

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
  const { days, weekValue, weekDelta } = useMemo(() => {
    const value = (t: { count: number; amount: number }) =>
      hasAmount ? t.amount : t.count;
    const display = (t: { count: number; amount: number }) =>
      hasAmount ? formatCurrency2(t.amount) : formatBigNumber(t.count, 0);

    const dates = [
      ...new Set(overviews.map((o) => o.sale_date.split("T")[0])),
    ].sort();

    const entries: DayCardEntry[] = dates.map((iso) => {
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
        value: display(tw),
        delta: ref !== null && ref !== 0 ? ((cur - ref) / ref) * 100 : null,
        deltaTitle:
          ref === null
            ? "No activity on this weekday in the baseline weeks"
            : `Baseline ${hasAmount ? formatCurrency2(ref) : formatBigNumber(ref, 0)}`,
      };
    });

    const twWeek = totals(overviews);
    // The week is compared against the baseline halved — two weeks of baseline
    // against one week now, matching how the store rows are graded.
    const refWeek = value(totals(baseline)) / 2;
    return {
      days: entries,
      weekValue: display(twWeek),
      weekDelta:
        refWeek !== 0 ? ((value(twWeek) - refWeek) / refWeek) * 100 : null,
    };
  }, [overviews, baseline, hasAmount]);

  return (
    <DayCardStrip
      days={days}
      weekValue={weekValue}
      weekDelta={weekDelta}
      selected={selectedDate}
      onSelect={onSelect}
      // More exceptions than the matched baseline is the bad direction — the
      // opposite of Sales.
      higherIsWorse
    />
  );
};

export default LPDayCards;
