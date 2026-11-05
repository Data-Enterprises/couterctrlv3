// Utils
import { countedRows } from "../../../../../../utils/hashSubs";
import { hoursForDates, hoursForDay } from "./recapHours";

// Interfaces
import type { DayDot, HourlySale, SubSale } from "../../../../../../interfaces";
import type { RecapDay, RecapDayHours } from "../interfaces/index";

const dayOf = (saleDate: string) => saleDate.split("T")[0];

/** First sale's hour to last, inclusive, or 0 with no hourly rows. */
const spanOf = (hours: RecapDayHours) =>
  hours.first !== null && hours.last !== null ? hours.last - hours.first + 1 : 0;

/**
 * Every day of the week, all seven of them.
 *
 * Net sales and units are the day card's own (`selection.days`), not a sum of
 * sub depts, so a day's Summary and the card above it cannot disagree. A day
 * the card list has no row for still gets one, at zero, rather than vanishing
 * from the week.
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
    const hours = hoursForDay(hourly, date);
    return {
      date,
      net: dot?.twNet ?? 0,
      units: dot?.twQty ?? 0,
      pounds,
      transactions,
      hours,
      tradedHours: spanOf(hours),
      hasSales: !!dot,
    };
  });
};

/**
 * The week as one period, in the same shape as a day, so every card reads it
 * exactly as it reads a picked day.
 *
 * Net sales, qty, pounds and transactions are the days summed, so the net is
 * the All week card's. The hours are each hour summed across the week (the
 * store's usual day), and the hours traded are every day's added up, so sales
 * and baskets per hour mean per hour the store was trading, not per hour of
 * the widest day.
 */
export const weekOf = (days: RecapDay[], hourly: HourlySale[]): RecapDay => ({
  date: days[0]?.date ?? "",
  net: days.reduce((t, d) => t + d.net, 0),
  units: days.reduce((t, d) => t + d.units, 0),
  pounds: days.reduce((t, d) => t + d.pounds, 0),
  transactions: days.reduce((t, d) => t + d.transactions, 0),
  hours: hoursForDates(hourly, days.map((d) => d.date)),
  tradedHours: days.reduce((t, d) => t + d.tradedHours, 0),
  hasSales: days.some((d) => d.hasSales),
});

/** Net sales per basket, or null with no baskets to divide by. */
export const avgBasket = (net: number, transactions: number) =>
  transactions > 0 ? net / transactions : null;

/** Units per basket, or null with no baskets. */
export const itemsPerBasket = (units: number, transactions: number) =>
  transactions > 0 ? units / transactions : null;

/** Net sales per unit, or null with no units. */
export const avgItemPrice = (net: number, units: number) =>
  units !== 0 ? net / units : null;

/** How many hours the period traded: a day's first sale to last, or the
 *  week's days added up. */
export const tradingHours = (day: RecapDay) => day.tradedHours;

/** A figure spread over the hours the period traded, or null with none. */
export const perTradingHour = (value: number, day: RecapDay) => {
  const hours = tradingHours(day);
  return hours > 0 ? value / hours : null;
};

/**
 * Whether the store sells anything by weight this week.
 *
 * Weight is shown only when it does, so a store with no scale does not carry
 * a line of zeros.
 */
export const sellsByWeight = (subs: SubSale[]) =>
  countedRows(subs).some((s) => (s.weight || 0) > 0);
