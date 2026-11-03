import type { DayDot, HourlySale, SubSale } from "../../../../../interfaces";
import { countedRows } from "../../../../../utils/hashSubs";
import { hoursForDay } from "./recapHours";
import type { RecapDay, RecapWeek } from "./recapTypes";

const dayOf = (saleDate: string) => saleDate.split("T")[0];

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
      hours: hoursForDay(hourly, date),
      hasSales: !!dot,
    };
  });
};

/** The week's headline figures: the days summed, and its single busiest hour. */
export const buildRecapWeek = (days: RecapDay[]): RecapWeek => {
  let peak: { date: string; hour: number; net: number } | null = null;
  for (const d of days) {
    const p = d.hours.peak;
    if (p && (!peak || p.net > peak.net)) peak = { date: d.date, hour: p.hour, net: p.net };
  }
  return {
    net: days.reduce((t, d) => t + d.net, 0),
    units: days.reduce((t, d) => t + d.units, 0),
    pounds: days.reduce((t, d) => t + d.pounds, 0),
    transactions: days.reduce((t, d) => t + d.transactions, 0),
    tradingDays: days.filter((d) => d.hasSales).length,
    peak: peak && { date: peak.date, hour: peak.hour },
  };
};

/** Net sales per basket, or null with no baskets to divide by. */
export const avgBasket = (net: number, transactions: number) =>
  transactions > 0 ? net / transactions : null;

/** Units per basket, or null with no baskets. */
export const itemsPerBasket = (units: number, transactions: number) =>
  transactions > 0 ? units / transactions : null;

/** Net sales per unit, or null with no units. */
export const avgItemPrice = (net: number, units: number) =>
  units !== 0 ? net / units : null;

/** How many hours the day traded, first sale's hour to last, or 0. */
export const tradingHours = (day: RecapDay) =>
  day.hours.first !== null && day.hours.last !== null
    ? day.hours.last - day.hours.first + 1
    : 0;

/** A figure spread over the hours the day traded, or null with none. */
export const perTradingHour = (value: number, day: RecapDay) => {
  const hours = tradingHours(day);
  return hours > 0 ? value / hours : null;
};

/**
 * Whether the store sells anything by weight this week.
 *
 * Pounds is shown only when it does, so a store with no scale does not carry
 * a column of zeros.
 */
export const sellsByWeight = (subs: SubSale[]) =>
  countedRows(subs).some((s) => (s.weight || 0) > 0);
