import type { HourlySale } from "../../../../../interfaces";
import type { RecapDayHours, RecapHour } from "./recapTypes";

/**
 * One day's shape by hour, from the Hourly rows the popup already holds.
 *
 * The hours run from the first that took money to the last, with any hour in
 * between that sold nothing filled in at zero, so the chart has no holes that
 * read as missing data.
 *
 * The busiest hour is the one with the most net sales; the earlier hour wins a
 * tie. The slowest is the slowest FULL hour: the first and last trading hours
 * are opening and closing part-hours, and naming one of them as the slowest
 * would be true every day and say nothing.
 */
export const hoursForDay = (hourly: HourlySale[], date: string): RecapDayHours => {
  const byHour = new Map<number, RecapHour>();
  for (const h of hourly) {
    if (h.sale_date.split("T")[0] !== date) continue;
    const held = byHour.get(h.hour) ?? { hour: h.hour, net: 0, transactions: 0, qty: 0 };
    held.net += h.total_sales - h.total_tax;
    held.transactions += h.transactions || 0;
    held.qty += h.qty || 0;
    byHour.set(h.hour, held);
  }
  const traded = [...byHour.values()].filter((h) => h.net !== 0).map((h) => h.hour);
  if (!traded.length) {
    return { hours: [], peak: null, slowest: null, first: null, last: null };
  }
  const first = Math.min(...traded);
  const last = Math.max(...traded);
  const hours: RecapHour[] = [];
  for (let hour = first; hour <= last; hour++) {
    hours.push(byHour.get(hour) ?? { hour, net: 0, transactions: 0, qty: 0 });
  }

  let peak: RecapHour | null = null;
  for (const h of hours) if (!peak || h.net > peak.net) peak = h;

  let slowest: RecapHour | null = null;
  for (const h of hours.slice(1, -1)) if (!slowest || h.net < slowest.net) slowest = h;

  return { hours, peak, slowest, first, last };
};
