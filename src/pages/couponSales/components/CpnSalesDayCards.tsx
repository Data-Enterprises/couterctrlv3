import { useMemo } from "react";
import { formatCurrency2 } from "../../../utils";
import DayCardStrip, { type DayCardEntry } from "../../../components/DayCardStrip";
import { avgCouponAmount, sumCouponAmount } from "../shared/couponGrading";
import type { CouponItem } from "../../../interfaces";

/**
 * Day-of-week cards for the selected store, matching the strip on Sales, Sub
 * Dept Margins and LP. Rendering lives in DayCardStrip; this decides what
 * Coupon Sales' number is.
 *
 * The metric is the same one the page grades on — average value of a single
 * coupon — and each day is compared against the SAME WEEKDAY in the two
 * baseline weeks, so a Tuesday is only ever measured against Tuesdays.
 *
 * No halving anywhere here, unlike LP's card: an average is already normalised
 * per coupon, so however many coupons sit behind each side, the two averages
 * compare directly.
 */
interface CpnSalesDayCardsProps {
  /** This week's coupons for the selected store. */
  coupons: CouponItem[];
  /** The prior two weeks for the same store. */
  baseline: CouponItem[];
  /** "" means all week. */
  selectedDay: string;
  onSelect: (iso: string) => void;
}

const isoOf = (c: CouponItem) => c.sale_date.split("T")[0];
const weekdayOf = (iso: string) => new Date(iso + "T12:00:00").getDay();

const avgOf = (rows: CouponItem[]): number | null =>
  rows.length === 0 ? null : avgCouponAmount(sumCouponAmount(rows), rows.length);

const CpnSalesDayCards = ({
  coupons,
  baseline,
  selectedDay,
  onSelect,
}: CpnSalesDayCardsProps) => {
  const { days, weekValue, weekDelta } = useMemo(() => {
    // Baseline bucketed by weekday, so a current day looks up its counterparts
    // in one hit. Both baseline occurrences of that weekday pool together —
    // averaging the pooled coupons rather than averaging two averages, so a
    // thin week doesn't get equal weight with a busy one.
    const baselineByWeekday = new Map<number, CouponItem[]>();
    for (const c of baseline) {
      const wd = weekdayOf(isoOf(c));
      const bucket = baselineByWeekday.get(wd);
      if (bucket) bucket.push(c);
      else baselineByWeekday.set(wd, [c]);
    }

    const byDay = new Map<string, CouponItem[]>();
    for (const c of coupons) {
      const iso = isoOf(c);
      const bucket = byDay.get(iso);
      if (bucket) bucket.push(c);
      else byDay.set(iso, [c]);
    }

    const entries: DayCardEntry[] = [...byDay.keys()].sort().map((iso) => {
      const cur = avgOf(byDay.get(iso)!) ?? 0;
      const ref = avgOf(baselineByWeekday.get(weekdayOf(iso)) ?? []);
      return {
        iso,
        value: formatCurrency2(cur),
        delta: ref !== null && ref !== 0 ? ((cur - ref) / ref) * 100 : null,
        deltaTitle:
          ref === null
            ? "No coupons on this weekday in the baseline weeks"
            : `Baseline average ${formatCurrency2(ref)}`,
      };
    });

    const curWeek = avgOf(coupons) ?? 0;
    const refWeek = avgOf(baseline);
    return {
      days: entries,
      weekValue: formatCurrency2(curWeek),
      weekDelta:
        refWeek !== null && refWeek !== 0
          ? ((curWeek - refWeek) / refWeek) * 100
          : null,
    };
  }, [coupons, baseline]);

  return (
    <DayCardStrip
      days={days}
      weekValue={weekValue}
      weekDelta={weekDelta}
      selected={selectedDay}
      onSelect={onSelect}
      // Coupons getting larger than the store's own norm is the bad direction.
      higherIsWorse
    />
  );
};

export default CpnSalesDayCards;
