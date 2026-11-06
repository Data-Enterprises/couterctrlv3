// Utils
import { shiftIso } from "../../../../utils/grading";
import { pricedUnits as unitsOrWeight, isWeighted } from "../../../../utils/pricedUnits";
import { MIN_ERA_DAYS, round2, round1 } from "./metrics";

// Interfaces
import type { ServerPricePoint } from "../../../../api/pricePoints";
import type { SubsPricePoint } from "../../../../interfaces";
import type { ReceiptLine } from "./index";
import type { ReportItem, PriceEra, MergedPrice } from "../interfaces";

const costOn = (date: string, receipts: ReceiptLine[]): number | null => {
  for (const r of receipts) {
    if (r.date.slice(0, 10) <= date && r.unitCost > 0) return r.unitCost;
  }
  return null;
};

/**
 * Eras straight from the actual price points.
 *
 * A point already IS an era: one price, the days it ran, the units it moved.
 * The series walk below had to infer them by watching a daily average change,
 * which invented a boundary whenever a day happened to blend two prices and
 * missed one whenever two different prices averaged to the same number.
 *
 * `days_sold` is what makes the run contiguous-aware: a promotion that lapsed
 * and came back is two eras here, where first_sold/last_sold alone would report
 * one long one.
 */
const erasFromPoints = (points: SubsPricePoint[]): PriceEra[] => {
  const eras: PriceEra[] = [];

  for (const pp of points) {
    const days = [...(pp.days_sold ?? [])].sort();
    if (days.length === 0) continue;

    // Pounds where the item is weighed. `units` on a price point is a ring
    // count, and on a variable-weight item that is a different quantity from
    // the one the rest of the panel shows -- Fam Pak Breast Tenders read 97
    // here beside a header of 180.7 lb and a transactions table of 180.68,
    // all three in one panel, the middle one in packages (finding AS).
    const measure = unitsOrWeight(pp.units, pp.weight);

    // Only known for the point as a whole, so a point that ran in two
    // stretches splits it by how many days each stretch holds. It is an
    // apportionment rather than a measurement, which is why it is not used to
    // decide anything — only shown.
    const perDay = measure / days.length;

    let start = days[0];
    let run = 1;
    for (let i = 1; i <= days.length; i++) {
      const prev = days[i - 1];
      const contiguous = i < days.length && shiftIso(prev, 1) === days[i];
      if (contiguous) {
        run += 1;
        continue;
      }
      eras.push({
        price: round2(pp.price),
        start,
        end: prev,
        days: run,
        units: round1(perDay * run),
        weighed: isWeighted(pp.weight),
        unitsPerDay: 0,
        unitCost: null,
        marginPct: null,
      });
      if (i < days.length) {
        start = days[i];
        run = 1;
      }
    }
  }

  return eras.sort((a, b) => a.start.localeCompare(b.start));
};

export const buildPriceEras = (
  item: ReportItem,
  receipts: ReceiptLine[],
): PriceEra[] => {
  const eras: PriceEra[] =
    item.points.length > 0 ? erasFromPoints(item.points) : [];
  if (eras.length > 0) return withEraCost(eras, item, receipts);

  // The day walk already counts in pounds -- `item.series` is summed through
  // the same rule -- so only the label has to be worked out here.
  const weighed = item.rows.some((r) => isWeighted(r.weight));

  // No points for this code — the day walk, which is what every era was built
  // from before the endpoint returned real ones.
  for (const day of item.series) {
    const last = eras[eras.length - 1];
    if (last && last.price === day.price) {
      last.end = day.date;
      last.days += 1;
      last.units += day.units;
    } else {
      eras.push({
        price: day.price,
        start: day.date,
        end: day.date,
        days: 1,
        units: day.units,
        weighed,
        unitsPerDay: 0,
        unitCost: null,
        marginPct: null,
      });
    }
  }
  return withEraCost(eras, item, receipts);
};

/** Cost and margin onto eras, from the receipt ruling on the day each began. */
const withEraCost = (
  eras: PriceEra[],
  item: ReportItem,
  receipts: ReceiptLine[],
): PriceEra[] =>
  eras.map((e) => {
    const unitCost = costOn(e.start, receipts) ?? item.unitCost;
    return {
      ...e,
      unitsPerDay: e.days > 0 ? round1(e.units / e.days) : 0,
      unitCost,
      marginPct:
        unitCost === null || e.price <= 0
          ? null
          : round1(((e.price - unitCost) / e.price) * 100),
    };
  });

export const comparableEras = (
  eras: PriceEra[],
): { prior: PriceEra; current: PriceEra } | null => {
  const held = eras.filter((e) => e.days >= MIN_ERA_DAYS);
  if (held.length < 2) return null;
  return { prior: held[held.length - 2], current: held[held.length - 1] };
};

/* ---------------------------------------------------------------- actions */

export const mergePricePoints = (rows: ServerPricePoint[]): MergedPrice[] => {
  const byPrice = new Map<number, MergedPrice>();
  for (const r of rows) {
    const amount = r.weighed ? r.weight : r.units;
    const found = byPrice.get(r.unit_price);
    if (found) {
      found.qty += amount;
      // Summed across the price types sharing a price. The server counts
      // distinct receipts per row, so a receipt holding the item at one price
      // under two price types counts twice here -- rare enough to be worth
      // saying rather than worth another read of every receipt.
      found.receipts += r.receipts;
      found.weighed = found.weighed || r.weighed;
    } else {
      byPrice.set(r.unit_price, {
        price: r.unit_price,
        qty: amount,
        receipts: r.receipts,
        weighed: r.weighed,
      });
    }
  }
  return [...byPrice.values()].sort((a, b) => b.qty - a.qty);
};
