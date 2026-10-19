import type { GradingMetric } from "../../../../features/dev/devSalesLedgerSlice";
import type { LedgerRowData } from "../components/LedgerRow";

/**
 * One store's share of the group, day by day.
 *
 * The week's share says a store gave ground; this says *when*. A store that
 * held its usual share Monday to Wednesday and fell away on the group's
 * biggest day has a different problem from one that was light all week, and
 * the two read identically in a single weekly figure.
 *
 * Pure arithmetic over the ledger rows the panel already holds — no fetch,
 * and the same day totals the day cards above are drawn from.
 */

/** Co-located stores share one storeid, so neither half of this identifies a
 *  store on its own. */
export const storeKeyOf = (r: { storeid: number; store_number: string }) =>
  `${r.storeid}__${r.store_number}`;

export interface ShareDay {
  /** Bare YYYY-MM-DD, matching the day strip's selection. */
  date: string;
  /** Mon, Tue, … */
  label: string;
  /** The store's share of the group that day, as a percentage. Null when the
   *  group rang nothing — a day with no denominator has no share, which is
   *  not the same as a share of nought. */
  sharePct: number | null;
  /** `sharePct` less the share the store usually takes, in points. */
  changePct: number | null;
  /** That change priced at the day's group total: what the day was worth. */
  money: number | null;
  storeValue: number;
  groupValue: number;
}

/**
 * The week, in order, for one store.
 *
 * `counted` is the set of stores the weekly share was worked out over. The
 * denominator has to be the same set or the day shares will not sit around
 * the weekly one — a store left out of the week's totals must stay out of
 * every day's.
 */
export const shareDaysOf = (
  rows: LedgerRowData[],
  counted: ReadonlySet<string>,
  storeKey: string,
  usualPct: number,
  metric: GradingMetric,
): ShareDay[] => {
  const byDate = new Map<string, { group: number; store: number }>();

  for (const row of rows) {
    const key = storeKeyOf(row);
    if (!counted.has(key)) continue;
    const mine = key === storeKey;
    for (const d of row.days) {
      const date = d.sale_date.split("T")[0];
      const value = metric === "qty" ? d.twQty : d.twNet;
      const at = byDate.get(date) ?? { group: 0, store: 0 };
      at.group += value;
      if (mine) at.store += value;
      byDate.set(date, at);
    }
  }

  return [...byDate.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, { group, store }]) => {
      const sharePct = group > 0 ? (store / group) * 100 : null;
      const changePct = sharePct === null ? null : sharePct - usualPct;
      return {
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        sharePct,
        changePct,
        // group × (share − usual) is the day's own gap in money, the same
        // identity the weekly figure is built on one level up.
        money: changePct === null ? null : group * (changePct / 100),
        storeValue: store,
        groupValue: group,
      };
    });
};

export interface ShareDayNote {
  /** The day that gave up the most money, if any day did. */
  worst: ShareDay | null;
  /** The first day of the unbroken run of below-usual days that ends the
   *  week. Null when the week does not end on one — "light since Thursday"
   *  is a finding, "light on Tuesday and again on Saturday" is not. */
  runFrom: ShareDay | null;
  /** How many days of the week sat below the usual share. */
  below: number;
  /** The week's gap as the days add it up. Not quite the weekly figure when
   *  some days have no counterpart in the period being compared — that one
   *  is matched days only. */
  weekMoney: number;
  /** True when `worst` is also the group's biggest day by sales. Losing
   *  ground on the week's biggest day costs more than losing it on a Tuesday,
   *  and that is the part worth saying. */
  worstIsBiggestDay: boolean;
}

export const shareDayNoteOf = (days: ShareDay[]): ShareDayNote => {
  const priced = days.filter((d) => d.money !== null);
  const under = priced.filter((d) => (d.money as number) < 0);

  const worst = under.length
    ? under.reduce((w, d) =>
        (d.money as number) < (w.money as number) ? d : w,
      )
    : null;

  // Walk back from the last day while the days keep coming up short.
  let runFrom: ShareDay | null = null;
  for (let i = priced.length - 1; i >= 0; i -= 1) {
    if ((priced[i].money as number) >= 0) break;
    runFrom = priced[i];
  }

  const biggest = priced.length
    ? priced.reduce((b, d) => (d.groupValue > b.groupValue ? d : b))
    : null;

  return {
    worst,
    runFrom,
    below: under.length,
    weekMoney: priced.reduce((n, d) => n + (d.money as number), 0),
    worstIsBiggestDay: worst !== null && biggest !== null && worst.date === biggest.date,
  };
};
