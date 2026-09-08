import type { CaseType, TypeFacts } from "./caseModel";
import { isAll } from "./caseModel";
import type { StoreShare } from "./storeShare";
import type { ItemRow } from "./itemMovement";
import type { HourProfile } from "./hourProfile";
import { formatDateSimple } from "../../../utils";
import { hourLabel } from "./chartTheme";

/**
 * The sentences the case is written from.
 *
 * Kept out of the component because every one of them is a claim about a
 * person, and a claim needs a rule with a floor under it — the same discipline
 * the ledger applies to `MIN_LATEST`, applied to prose. A line that cannot be
 * supported returns null and simply does not appear, rather than hedging.
 */
const money = (n: number) => `$${n.toFixed(2)}`;

export const findingLine = (type: CaseType, facts: TypeFacts): string => {
  const spread =
    facts.days.length === 1
      ? "all on one day"
      : facts.days.length === 2
        ? "on two days"
        : `across ${facts.days.length} days`;
  const against =
    type.multiplier === null
      ? "None in the weeks before it."
      : `Their average is ${type.baseline.toFixed(1)}/week.`;
  return `${facts.occurrences} this week, worth ${money(facts.value)}, ${spread}. ${against}`;
};

/** Only claims a concentration when the hours actually cluster. */
export const hourLine = (
  profile: HourProfile,
  saleType: string,
  facts: TypeFacts,
): string | null => {
  const mine = profile.byType.get(saleType);
  if (!mine) return null;
  const active = mine
    .map((n, h) => ({ n, h }))
    .filter((b) => b.n > 0)
    .map((b) => b.h);
  if (active.length === 0) return null;

  const span = active[active.length - 1] - active[0] + 1;
  // Four hours or fewer out of a trading day is a window; wider than that is
  // simply when the store is open, and saying otherwise would invent a pattern.
  if (span > 4) return null;

  const others = [...profile.byType.entries()].filter(([t]) => t !== saleType);
  const otherHours = others.flatMap(([, buckets]) =>
    buckets.map((n, h) => (n > 0 ? h : -1)).filter((h) => h >= 0),
  );
  const otherSpread =
    otherHours.length > 0 &&
    Math.max(...otherHours) - Math.min(...otherHours) > span + 3;

  const window =
    active.length === 1
      ? `at ${hourLabel(active[0])}`
      : `between ${hourLabel(active[0])} and ${hourLabel(active[active.length - 1] + 1)}`;

  const days = facts.days.map((d) => formatDateSimple(d)).join(" and ");

  /**
   * Receipts, because that is what the hour profile counts.
   *
   * `buildHourProfile` folds a basket to one entry — forty cancelled lines on
   * one receipt happened at a single instant, not spread across an hour — so
   * quoting `facts.occurrences` here put a LINE count inside a sentence about
   * a RECEIPT-derived window. On screen it read "All 80 fell at 6p" two inches
   * under a KPI saying "peak hour 6p · 2", which is the same fact stated in
   * two units and looks like one of them is wrong.
   */
  const baskets = mine.reduce((acc, n) => acc + n, 0);
  const what =
    baskets === facts.occurrences
      ? `All ${baskets}`
      : `All ${baskets} ${baskets === 1 ? "receipt" : "receipts"} — ${facts.occurrences} ${facts.occurrences === 1 ? "line" : "lines"} —`;

  return otherSpread
    ? `${what} fell ${window} on ${days}. This cashier's other exceptions the same week ran across the trading day, so this is not simply when they work.`
    : `${what} fell ${window} on ${days}.`;
};

export const storeLine = (
  share: StoreShare,
  saleType: string,
): string | null => {
  if (share.storeIncrease <= 0) return null;
  const solo =
    share.otherMovers === 0
      ? "; no other cashier moved"
      : `, alongside ${share.otherMovers} other ${share.otherMovers === 1 ? "cashier" : "cashiers"} who also rose`;
  const what = isAll(saleType) ? "exceptions" : saleType.toLowerCase();
  return `Store ${what} rose by ${share.storeIncrease} this week. They account for ${share.herIncrease} of that${solo}.`;
};

export const itemLine = (items: ItemRow[], facts: TypeFacts): string | null => {
  const movers = items.filter(
    (i) => i.move === "new" || i.move === "increased",
  );
  if (movers.length === 0) return null;
  const top = movers.slice(0, 3);
  /**
   * The union, not the sum.
   *
   * Summing each item's receipt count double-counts every basket that carried
   * more than one of them, and the result is not bounded by the denominator —
   * three items on two receipts printed "6 of the 2 receipts", which is the
   * kind of arithmetic that costs a reader their trust in every other figure
   * on the page.
   */
  const covered = new Set(top.flatMap((i) => i.receiptIds)).size;
  if (covered === 0) return null;
  const allNew = top.every((i) => i.move === "new");
  return `${top.length === 1 ? "One item carries" : `${top.length} items carry`} ${covered} of the ${facts.receipts} receipts${allNew ? ", none of them seen in the weeks before" : ""}. Average ${money(facts.average)}, largest ${money(facts.largest)}.`;
};

/** What else would produce this. Always present — a case that never names an
 *  innocent reading is an accusation, and the boring explanation is usually
 *  the true one. */
export const cautionLine = (items: ItemRow[], facts: TypeFacts): string => {
  const parts = [
    facts.days.length <= 2
      ? "A promotion or price change ending that week would produce this too."
      : "A change in policy or prompts at the register would produce this too.",
  ];
  if (items.some((i) => i.move === "stopped"))
    parts.push(
      "An item that stopped can be delisted or out of stock as easily as it can be a change in behaviour.",
    );
  return parts.join(" ");
};
