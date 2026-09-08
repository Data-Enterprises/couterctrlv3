import { formatCurrency2, formatDateSimple } from "../../../utils";
import { hourLabel } from "./chartTheme";
import { isTerminal, type CashierStanding } from "../profiles/rollupStats";
import type { HourProfile } from "./hourProfile";
import type { ItemRow } from "./itemMovement";
import type { TypeFacts } from "./caseModel";

/**
 * What KIND of thing this is, not how loud it is.
 *
 * The page graded before this existed, and a grade is the wrong output. Told
 * "Critical, 3.4× the peer average", a manager knows the number is big and
 * nothing else — not what happened, not what to look at, not whether it is
 * even about the cashier. Item Actions solved the same problem by emitting a
 * named action with the sentence behind it, and this is that shape: one
 * pattern, ranked by what it costs to leave alone, quoting the figures that
 * produced it.
 *
 * Two patterns exist to push a case DOWN, and they matter more than the rest.
 * A store where everybody rose in the same week is a store event until
 * somebody rules one out, and a self-checkout lane is not a person. Both used
 * to grade Critical like anything else, which is how a tool starts costing
 * more trust than it returns.
 */
export type LpPattern =
  | "bulkBasket"
  | "singleBurst"
  | "newBehaviour"
  | "newItems"
  | "persistent"
  | "valueOnly"
  | "storeWide"
  | "lane"
  | "routine";

export interface LpVerdict {
  pattern: LpPattern;
  label: string;
  /** The sentence backing it, quoting the numbers it was decided on. */
  evidence: string;
  tone: "hot" | "mid" | "calm";
}

export const PATTERN_LABEL: Record<LpPattern, string> = {
  bulkBasket: "Bulk basket",
  singleBurst: "Single burst",
  newBehaviour: "New behaviour",
  newItems: "New items",
  persistent: "Persistent",
  valueOnly: "Value, not count",
  storeWide: "Store-wide",
  lane: "A lane",
  routine: "Routine",
};

/**
 * Worst first — an ordering of how much each costs to leave alone, not a
 * severity scale.
 *
 * `storeWide` and `lane` sit below every finding deliberately. They are not
 * mild versions of the others; they are reasons the others are probably not
 * about this person, so they must win only when nothing sharper fires.
 */
export const PATTERN_RANK: Record<LpPattern, number> = {
  bulkBasket: 0,
  singleBurst: 1,
  newBehaviour: 2,
  newItems: 3,
  persistent: 4,
  valueOnly: 5,
  storeWide: 6,
  lane: 7,
  routine: 8,
};

const TONE: Record<LpPattern, LpVerdict["tone"]> = {
  bulkBasket: "hot",
  singleBurst: "hot",
  newBehaviour: "hot",
  newItems: "mid",
  persistent: "mid",
  valueOnly: "mid",
  storeWide: "calm",
  lane: "calm",
  routine: "calm",
};

const verdict = (pattern: LpPattern, evidence: string): LpVerdict => ({
  pattern,
  label: PATTERN_LABEL[pattern],
  evidence,
  tone: TONE[pattern],
});

/* ------------------------------------------------------------- thresholds */

/** Lines per basket. Above this the count is not "how often" any more, it is
 *  "how much at once", and the two mean completely different things. */
const BULK_PER_RECEIPT = 5;
/** Share of the week that has to land in one hour before it is a burst rather
 *  than a shift. */
const BURST_SHARE = 0.8;
/** How many times their own earlier weeks a week has to beat to count as new
 *  behaviour rather than a busy week. */
const STEP_MULTIPLE = 5;
/** Below this a week is too thin to read anything from, whatever the ratio. */
const MIN_WEEK = 5;

/* ---------------------------------------------------- the store's context */

export interface StoreContext {
  /** How many cashiers at this store rose in the graded week against their
   *  own earlier weeks. */
  rose: number;
  /** How many rang this exception at all. */
  people: number;
}

/**
 * Did the whole store move, or did this person?
 *
 * Computed from call 1, which holds every cashier at the store including the
 * quiet ones — the graded call cannot answer this, because it was only ever
 * sent the flagged half and would report that everyone who moved, moved.
 */
export const storeContext = (
  peers: CashierStanding[],
  weekIndex: number,
): StoreContext => {
  let rose = 0;
  for (const p of peers) {
    const week = p.weeks[weekIndex] ?? 0;
    if (week > 0 && week > p.priorPerWeek) rose += 1;
  }
  return { rose, people: peers.length };
};

/** More than half the store moving the same way in the same week is a store
 *  event until somebody rules one out. Two people is not a pattern, so a
 *  floor as well as a share. */
const isStoreWide = (ctx: StoreContext) =>
  ctx.people >= 4 && ctx.rose / ctx.people > 0.5;

/* ------------------------------------------------------------ the verdict */

export interface VerdictInput {
  standing: CashierStanding | null;
  facts: TypeFacts;
  profile: HourProfile | null;
  items: ItemRow[];
  saleType: string;
  weekIndex: number;
  ctx: StoreContext;
}

/**
 * One pattern for this cashier, this exception, this week.
 *
 * Tests run worst-first and the first to fire wins, so the sentence a reader
 * sees is always the sharpest true thing rather than a list they have to rank
 * themselves. Everything quoted is a figure printed elsewhere on the page —
 * nothing here is derived privately, so the headline and the tables can never
 * tell different stories.
 */
export const decideVerdict = ({
  standing,
  facts,
  profile,
  items,
  saleType,
  weekIndex,
  ctx,
}: VerdictInput): LpVerdict => {
  const what = saleType.toLowerCase();

  if (standing && isTerminal(standing))
    return verdict(
      "lane",
      `${standing.cashierName} is a register, not an operator. Worth knowing what it did; not worth asking anybody to explain it.`,
    );

  // Nothing to read. Said plainly rather than graded, because a thin week
  // dressed as a finding is how a list fills with arithmetic noise.
  if (facts.occurrences < MIN_WEEK)
    return verdict(
      "routine",
      `${facts.occurrences} ${what} this week — too few to read anything from.`,
    );

  const perReceipt =
    facts.receipts > 0 ? facts.occurrences / facts.receipts : 0;
  if (perReceipt >= BULK_PER_RECEIPT)
    return verdict(
      "bulkBasket",
      `${facts.occurrences} ${what} lines across only ${facts.receipts} ${
        facts.receipts === 1 ? "receipt" : "receipts"
      } — about ${Math.round(perReceipt)} per basket. That is not a rate of mistakes, it is ${
        facts.receipts === 1 ? "one event" : `${facts.receipts} events`
      }. Pull ${facts.receipts === 1 ? "the receipt" : "those receipts"} and watch the lane.`,
    );

  if (profile) {
    const buckets = profile.byType.get(saleType);
    if (buckets) {
      const total = buckets.reduce((a, n) => a + n, 0);
      let peak = 0;
      let hour = -1;
      buckets.forEach((n, h) => {
        if (n > peak) {
          peak = n;
          hour = h;
        }
      });
      if (total > 0 && hour >= 0 && peak / total >= BURST_SHARE)
        return verdict(
          "singleBurst",
          `${peak} of their ${total} ${what} ${
            total === 1 ? "receipt" : "receipts"
          } fell in the ${hourLabel(hour)} hour${
            facts.days.length === 1
              ? ` on ${formatDateSimple(facts.days[0])}`
              : ""
          }. A shift spreads across a trading day; this did not. Check who else was on and what the lane was doing.`,
        );
    }
  }

  if (standing) {
    const week = standing.weeks[weekIndex] ?? 0;
    const prior = standing.priorPerWeek;
    if (prior === 0 && week >= MIN_WEEK)
      return verdict(
        "newBehaviour",
        `They rang no ${what} at all in the weeks before this one, then ${week}. A first is not a trend — it is either a change in how they work or a change in what they were asked to do. Ask which.`,
      );
    if (prior > 0 && week >= prior * STEP_MULTIPLE)
      return verdict(
        "newBehaviour",
        `${week} this week against ${prior.toFixed(1)} a week before it — about ${Math.round(
          week / prior,
        )} times their own average. Their history, not the store's, so a busy week does not explain it.`,
      );
  }

  const fresh = items.filter((i) => i.move === "new");
  if (fresh.length > 0) {
    const covered = new Set(fresh.flatMap((i) => i.receiptIds)).size;
    return verdict(
      "newItems",
      `${fresh.length} ${fresh.length === 1 ? "item" : "items"} on ${covered} of the ${facts.receipts} ${
        facts.receipts === 1 ? "receipt" : "receipts"
      } were not rung in any earlier week — ${fresh
        .slice(0, 2)
        .map((i) => i.description)
        .join(
          ", ",
        )}${fresh.length > 2 ? ", and others" : ""}. Worth checking those against the shelf.`,
    );
  }

  if (standing) {
    const flaggedWeeks = standing.weeks.filter((n) => n >= MIN_WEEK).length;
    if (flaggedWeeks >= 3)
      return verdict(
        "persistent",
        `${flaggedWeeks} of ${standing.weeks.length} weeks at or above ${MIN_WEEK} ${what}. Nothing spiked — this is simply how they work, which is a coaching conversation rather than an incident.`,
      );

    if (standing.perWeek <= standing.storePerWeek && standing.overStoreValue)
      return verdict(
        "valueOnly",
        `An ordinary number of ${what} — ${standing.perWeek.toFixed(
          1,
        )} a week against the store's ${standing.storePerWeek.toFixed(
          1,
        )} — worth ${formatCurrency2(standing.salesPerWeek)} a week against the store's ${formatCurrency2(
          standing.storeSalesPerWeek,
        )}. The count says nothing is wrong here. The money does.`,
      );
  }

  // Last, and only when nothing sharper fired: the store moved, so this
  // probably is not about the person.
  if (isStoreWide(ctx))
    return verdict(
      "storeWide",
      `${ctx.rose} of the ${ctx.people} cashiers at this store rose the same week. A promotion ending, a prompt change at the register or a system update would produce exactly this — rule one out before treating it as anybody's behaviour.`,
    );

  return verdict(
    "routine",
    `${facts.occurrences} ${what} this week, in line with their own weeks before it.`,
  );
};

/**
 * The list's version: everything decidable from call 1 alone.
 *
 * The roster is drawn the moment the search lands, long before any receipts
 * are fetched, so it cannot know about baskets, hours or items. It can still
 * say the three things that need no receipts — and a chip reading "New
 * behaviour" beside a count is the whole reason to click that row rather than
 * the one above it.
 */
export const standingVerdict = (
  s: CashierStanding,
  weekIndex: number,
  ctx: StoreContext,
): LpVerdict =>
  decideVerdict({
    standing: s,
    facts: {
      occurrences: s.weeks[weekIndex] ?? 0,
      // Unknown without receipts. Zero keeps the basket and burst tests
      // silent rather than guessing at them.
      receipts: 0,
      days: [],
      peakDay: "",
      peakDayCount: 0,
      value: s.totalSales,
      average: 0,
      largest: 0,
    },
    profile: null,
    items: [],
    saleType: s.saleType,
    weekIndex,
    ctx,
  });
