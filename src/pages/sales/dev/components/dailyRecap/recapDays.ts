import type { DayDot, HourlySale, SubSale } from "../../../../../interfaces";
import { countedRows } from "../../../../../utils/hashSubs";
import type { RecapDay, RecapWeek } from "./recapTypes";

const dayOf = (saleDate: string) => saleDate.split("T")[0];

/** Net sales by hour for one day, from the Hourly rows. */
const netByHour = (hourly: HourlySale[], date: string) => {
  const byHour = new Map<number, number>();
  for (const h of hourly) {
    if (dayOf(h.sale_date) !== date) continue;
    byHour.set(h.hour, (byHour.get(h.hour) ?? 0) + h.total_sales - h.total_tax);
  }
  return byHour;
};

/** The hour with the most net sales; the earlier hour wins a tie. */
const busiest = (byHour: Map<number, number>) => {
  let best: { hour: number; net: number } | null = null;
  for (const [hour, net] of [...byHour].sort((a, b) => a[0] - b[0])) {
    if (!best || net > best.net) best = { hour, net };
  }
  return best;
};

/**
 * One row per day of the week, all seven of them.
 *
 * Net sales and units are the day card's own (`selection.days`), not a sum of
 * sub depts, so the row and the card above it cannot disagree. A day the card
 * list has no row for still gets one, at zero, rather than vanishing from the
 * week.
 *
 * Transactions are summed across the day's hours, the way Hourly counts them,
 * and never across sub depts: one basket touches several sub depts and would
 * be counted once in each.
 */
export const buildRecapDays = (
  dates: string[],
  dayDots: DayDot[],
  subs: SubSale[],
  hourly: HourlySale[],
): RecapDay[] => {
  const counted = countedRows(subs);
  return dates.map((date) => {
    const dot = dayDots.find((d) => dayOf(d.sale_date) === date);
    const pounds = counted
      .filter((s) => dayOf(s.sale_date) === date)
      .reduce((t, s) => t + (s.weight || 0), 0);
    const transactions = hourly
      .filter((h) => dayOf(h.sale_date) === date)
      .reduce((t, h) => t + (h.transactions || 0), 0);
    return {
      date,
      net: dot?.twNet ?? 0,
      units: dot?.twQty ?? 0,
      pounds,
      transactions,
      peakHour: busiest(netByHour(hourly, date))?.hour ?? null,
      hasSales: !!dot,
    };
  });
};

/** The week row: the days summed, and the week's single busiest hour. */
export const buildRecapWeek = (
  days: RecapDay[],
  hourly: HourlySale[],
): RecapWeek => {
  let peak: { date: string; hour: number; net: number } | null = null;
  for (const d of days) {
    const best = busiest(netByHour(hourly, d.date));
    if (best && (!peak || best.net > peak.net)) {
      peak = { date: d.date, hour: best.hour, net: best.net };
    }
  }
  return {
    net: days.reduce((t, d) => t + d.net, 0),
    units: days.reduce((t, d) => t + d.units, 0),
    pounds: days.reduce((t, d) => t + d.pounds, 0),
    transactions: days.reduce((t, d) => t + d.transactions, 0),
    peak: peak && { date: peak.date, hour: peak.hour },
  };
};

/** Net sales per basket, or null with no baskets to divide by. */
export const avgBasket = (net: number, transactions: number) =>
  transactions > 0 ? net / transactions : null;

/**
 * Whether the store sells anything by weight this week.
 *
 * The Pounds column is shown only when it is, so a store with no scale does
 * not carry a column of zeros.
 */
export const sellsByWeight = (subs: SubSale[]) =>
  countedRows(subs).some((s) => (s.weight || 0) > 0);
