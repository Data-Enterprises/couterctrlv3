import { NO_EXCEPTIONS, byTypeOrder } from "./recapExceptions";
import type { DayMixState, RecapExceptions, RecapExceptionType, RecapMix } from "./recapTypes";

/**
 * Several days' mixes as one, so the week's cards read exactly as a day's.
 *
 * Money by price type and refunds are summed. Items is the days' codes
 * merged, so an item sold on five days counts once for the week, the way a
 * day counts an item rung up five times once.
 *
 * Ready only when every day is: a week missing a day would show a smaller
 * figure as if it were the whole. Any day that failed makes the whole an
 * error; otherwise any day still out keeps it loading.
 */
export const combineMix = (states: DayMixState[]): DayMixState => {
  if (states.some((s) => s.status === "error")) return { status: "error" };
  const ready = states.filter(
    (s): s is { status: "ready"; mix: RecapMix } => s.status === "ready",
  );
  if (ready.length < states.length || !ready.length) return { status: "loading" };
  const codes = new Set<string>();
  const mix: RecapMix = {
    items: 0,
    codes: [],
    refunds: { units: 0, net: 0 },
    regular: 0,
    promo: 0,
    unknown: 0,
  };
  for (const { mix: m } of ready) {
    for (const c of m.codes) codes.add(c);
    mix.refunds.units += m.refunds.units;
    mix.refunds.net += m.refunds.net;
    mix.regular += m.regular;
    mix.promo += m.promo;
    mix.unknown += m.unknown;
  }
  mix.codes = [...codes];
  mix.items = codes.size;
  return { status: "ready", mix };
};

/**
 * Several days' exceptions as one.
 *
 * A receipt belongs to one day, so the days' distinct receipts add up to the
 * period's without counting any twice. Each type's figures are summed and
 * listed in the card's usual order; a type that rings nothing (No Sale) keeps
 * its null qty and amount.
 */
export const combineExceptions = (
  byDay: Record<string, RecapExceptions>,
  dates: string[],
): RecapExceptions => {
  const days = dates.map((d) => byDay[d] ?? NO_EXCEPTIONS);
  if (days.length === 1) return days[0];
  const types = new Map<string, RecapExceptionType>();
  for (const day of days) {
    for (const t of day.types) {
      const held = types.get(t.type);
      if (!held) {
        types.set(t.type, { ...t });
        continue;
      }
      held.transactions += t.transactions;
      if (held.qty !== null) held.qty += t.qty ?? 0;
      if (held.amount !== null) held.amount += t.amount ?? 0;
    }
  }
  return {
    transactions: days.reduce((n, d) => n + d.transactions, 0),
    amount: days.reduce((n, d) => n + d.amount, 0),
    types: [...types.values()].sort(byTypeOrder),
  };
};
