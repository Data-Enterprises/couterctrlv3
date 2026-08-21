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

/** The one line a reader would repeat to a colleague. Carries the type and the
 *  size of the move; the sentence beneath it carries the arithmetic, so the two
 *  never say the same thing twice. */
export const headlineLine = (type: CaseType, typeCount = 0): string => {
  const subject = isAll(type.saleType)
    ? `Exceptions across ${typeCount} ${typeCount === 1 ? "type" : "types"}`
    : type.saleType;
  if (type.multiplier === null) return `${subject} — new this week`;
  if (type.multiplier >= 1)
    return `${subject} ${type.multiplier >= 10 ? type.multiplier.toFixed(0) : type.multiplier.toFixed(1)}× their weekly normal`;
  return `${subject} down ${Math.round((1 - type.multiplier) * 100)}% on their weekly normal`;
};

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
      : `Their normal is ${type.baseline.toFixed(1)}/week.`;
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

  return otherSpread
    ? `All ${facts.occurrences} fell ${window} on ${days}. This cashier's other exceptions the same week ran across the trading day, so this is not simply when they work.`
    : `All ${facts.occurrences} fell ${window} on ${days}.`;
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
  const covered = top.reduce((acc, i) => acc + i.receipts, 0);
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
