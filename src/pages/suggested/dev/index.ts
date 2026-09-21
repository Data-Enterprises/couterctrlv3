import type {
  DowRates,
  NotSellingItem,
  SuggestedGroupRow,
  SuggestedItem,
} from "../../../interfaces";
import type { ActionKey } from "../../../interfaces";
// Defined in src/interfaces — Suggested actions. Re-exported for this page's files.
export type { ActionKey } from "../../../interfaces";

/**
 * Rows whose department could not be resolved.
 *
 * The group endpoint returns a null `sub_department` for items that are missing
 * from `public.inventory` — one such row per store, and they carry real weight
 * (4.9% of the group on the payload this was built against). They are not an
 * error to hide: a buyer still has to order those pounds. They get a named
 * bucket so the tree totals to the same number the KPI does.
 */
export const NO_DEPARTMENT = "No department";

export const deptLabel = (desc: string | null) => desc ?? NO_DEPARTMENT;

/** Pounds, to two decimals, with thousands separators. Every weight on this
 *  page is pounds — the endpoint only answers for scale departments. */
export const fmtLb = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Pounds, or a dash when there is no figure at all.
 *
 * `fmtLb` prints a missing value as "0.00", which is right for a genuine zero
 * and wrong for an absent one. A historical call omits `suggested_weight`
 * entirely — a past date is a comparison, not an order — and printing that as
 * 0.00 lb states confidently that the store should buy nothing.
 */
export const fmtLbOrDash = (n: number | null | undefined) =>
  n === null || n === undefined ? "—" : fmtLb(n);

/** Whole pounds, for rollups where two decimals are noise. */
export const fmtLb0 = (n: number | null | undefined) =>
  Math.round(n ?? 0).toLocaleString();

/** The shrink multiplier reads as a percentage uplift, which is what it is.
 *  1.0 means no adjustment at all, and saying "none" is clearer than "1.0000". */
export const shrinkLabel = (item: { shrink_source: string; shrink_multiplier: number }) =>
  item.shrink_source === "none" || item.shrink_multiplier <= 1
    ? "—"
    : `+${((item.shrink_multiplier - 1) * 100).toFixed(1)}%`;

/** What each source means in the one sentence a hover has room for. */
const SHRINK_SOURCE_TEXT: Record<string, string> = {
  receipts:
    "From receipts — every pound that entered and never sold, trim loss included. The best signal there is.",
  markdown:
    "From recorded markdowns — product that never rang. This is where meat's loss lives.",
  damage:
    "From recorded damage. Narrower than markdown, and used only where this item has no markdowns.",
  none: "No waste signal for this item, so the order is pure demand.",
};

/**
 * The hover behind the Shrink cell.
 *
 * The percentage alone cannot say where it came from, and the sources are not
 * interchangeable — a 3% built from receipts and a 3% built from damage are
 * different levels of confidence. Naming it also makes the model's one
 * counter-intuitive rule visible: an item showing damage has NO markdowns, it
 * is not the sum of both.
 */
export const shrinkTitle = (item: {
  shrink_source: string;
  shrink_multiplier: number;
  shrink_clamped?: boolean;
}) =>
  (SHRINK_SOURCE_TEXT[item.shrink_source] ?? "") +
  (item.shrink_clamped
    ? " Capped: the raw rate blew past its limit, which is a keying problem rather than heavy waste."
    : "");

/**
 * One store's rollup across its departments.
 *
 * Built from the group rows rather than fetched: the group call already returns
 * every store x department pair, so a second call would be asking the same
 * question twice.
 */
export interface StoreRollup {
  storeid: number;
  /** Resolved through assignedStores, never the payload's own `store_name` —
   *  that goes null on rows whose department resolved fine, so the same store
   *  appears named and unnamed in one response. */
  label: string;
  storeNumber: string | null;
  suggested: number;
  items: number;
  departments: SuggestedGroupRow[];
}

export const rollupByStore = (
  rows: SuggestedGroupRow[],
  nameFor: (storeid: number, fallback: string | null) => string,
): StoreRollup[] => {
  const byStore = new Map<number, StoreRollup>();
  for (const r of rows) {
    let entry = byStore.get(r.storeid);
    if (!entry) {
      entry = {
        storeid: r.storeid,
        label: nameFor(r.storeid, r.store_name),
        storeNumber: r.store_number,
        suggested: 0,
        items: 0,
        departments: [],
      };
      byStore.set(r.storeid, entry);
    }
    // A row that resolved its store number wins the label detail — some rows
    // in the same response carry a null number for the same storeid.
    if (r.store_number && !entry.storeNumber) entry.storeNumber = r.store_number;
    entry.suggested += r.suggested_weight ?? 0;
    entry.items += r.item_count ?? 0;
    entry.departments.push(r);
  }
  const out = [...byStore.values()];
  for (const s of out) {
    // Heaviest department first: nobody orders Seafood's one pound before the
    // meat case.
    s.departments.sort(
      (a, b) => (b.suggested_weight ?? 0) - (a.suggested_weight ?? 0),
    );
  }
  return out.sort((a, b) => b.suggested - a.suggested);
};

/* ── weekday production profile ───────────────────────────────────────────── */

/**
 * Every date in the cover window, as `yyyy-mm-dd`.
 *
 * Stepped through `Date` at local noon rather than by adding days to the
 * string: noon is far enough from either midnight that a DST shift cannot roll
 * the date, which is the trap `formatDate`/`addDays` fall into elsewhere in the
 * app.
 */
export const coverDates = (
  cover: { start: string; end: string } | null | undefined,
): string[] => {
  if (!cover) return [];
  const out: string[] = [];
  const d = new Date(`${cover.start}T12:00:00`);
  const end = new Date(`${cover.end}T12:00:00`);
  // A malformed window would otherwise spin forever.
  if (isNaN(d.getTime()) || isNaN(end.getTime())) return [];
  while (d <= end && out.length < 31) {
    out.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")}`,
    );
    d.setDate(d.getDate() + 1);
  }
  return out;
};

/**
 * The forecast pounds for one date.
 *
 * `dow_rates` is keyed 0–6 with 0 = Sunday, which is also what `getDate`'s
 * sibling `getDay` returns — the two conventions agree, so no offset. Parsed at
 * local noon for the same DST reason as above.
 */
export const rateForDate = (
  rates: DowRates | undefined,
  iso: string,
): number => {
  if (!rates) return 0;
  const dow = new Date(`${iso}T12:00:00`).getDay();
  return rates[String(dow)] ?? 0;
};

/** Day label for a strip card — "Fri 9/11". */
export const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T12:00:00`);
  return `${d.toLocaleDateString(undefined, { weekday: "short" })} ${
    d.getMonth() + 1
  }/${d.getDate()}`;
};

/**
 * A day's forecast against an ordinary day, as a percentage.
 *
 * The baseline is the department's own flat daily average, so the number
 * answers "is this a heavy day here" rather than comparing one store to
 * another. Null when there is no baseline to divide by — an unsold department
 * has no normal day, and 0% would read as "exactly average".
 */
export const dayLevelPct = (dayLb: number, avgDaily: number): number | null =>
  avgDaily > 0 ? (dayLb / avgDaily - 1) * 100 : null;


/**
 * The pounds an item used to sell in this window and now does not.
 *
 * The endpoint gives both rates but not the gap, and the gap is what ranks the
 * list by what it actually costs: a 7.9 lb/day line that stopped matters more
 * than a 0.3 lb/day one, and sorted by status alone they sit together.
 *
 * Floored at 0 — an item classed `declining` on the rate test can still have a
 * heavier recent half on a short window, and negative "lost" pounds is not a
 * thing anyone can act on.
 */
export const lostLb = (r: NotSellingItem, recentDays: number) =>
  Math.max((r.prior_lb_per_day - r.recent_lb_per_day) * recentDays, 0);

/** One store's standing in a department, normalised. */
export interface BenchmarkRow {
  storeid: number;
  label: string;
  /** The department's whole-store rate, which is what the raw comparison uses. */
  lbPerDay: number;
  itemCount: number;
  /** lbPerDay / itemCount — the comparable figure. */
  lbPerItem: number;
}

/**
 * Every store's rate for one department, per item carried.
 *
 * Raw pounds a day is the wrong comparison and it is wrong in a way that reads
 * as a crisis: SAVE A LOT 115 runs 10.45 lb/day of Meat by # against IGA 1's
 * 781.20, which is -98.7% — but it stocks 5 meat items to IGA 1's 189. It has
 * no meat case. Per item carried the same pair is 2.09 against 4.13, and -49%
 * is a number somebody can actually act on.
 *
 * Stores with no items are dropped rather than divided by zero.
 */
export const buildBenchmark = (
  rows: SuggestedGroupRow[],
  subDepartment: number | null,
  labelFor: (storeid: number, fallback: string) => string,
): BenchmarkRow[] =>
  rows
    .filter((r) => r.sub_department === subDepartment && r.item_count > 0)
    .map((r) => ({
      storeid: r.storeid,
      label: labelFor(r.storeid, r.store_name ?? String(r.storeid)),
      lbPerDay: r.avg_daily_weight ?? 0,
      itemCount: r.item_count,
      lbPerItem: (r.avg_daily_weight ?? 0) / r.item_count,
    }))
    .sort((a, b) => b.lbPerItem - a.lbPerItem);

/** The middle value, not the mean — one Save A Lot with five items drags an
 *  average far harder than it drags a median. */
export const median = (ns: number[]): number => {
  if (ns.length === 0) return 0;
  const sorted = [...ns].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};


/**
 * The rows the Order tab is showing, out of the whole store's items.
 *
 * Shared rather than written twice: the export has to hand over exactly what
 * the buyer is looking at, and a second copy of this predicate would drift the
 * first time a filter is added on one side only.
 */
export const sheetRows = (
  items: SuggestedItem[],
  subDepartment: number | null,
  upcFilter: string,
  descFilter: string,
): SuggestedItem[] => {
  const upc = upcFilter.trim().toLowerCase();
  const desc = descFilter.trim().toLowerCase();
  return items.filter((i) => {
    if (i.sub_department !== subDepartment) return false;
    if (upc && !String(i.product_code).toLowerCase().includes(upc)) return false;
    if (desc && !(i.product_description ?? "").toLowerCase().includes(desc))
      return false;
    return true;
  });
};


/** One day of the cover window and what this item is forecast to do on it. */
export interface CoverDay {
  iso: string;
  /** "Fri 9/11". */
  label: string;
  lb: number;
}

/**
 * The suggested figure, taken apart.
 *
 * Not a re-derivation — the endpoint's own numbers are the authority and are
 * shown as they arrived. This only names which weekday rate each covered date
 * pulled, so the arithmetic on screen is the arithmetic that produced the row.
 *
 * The per-day figures can miss the endpoint's `demand_weight` by a hundredth or
 * two: both `dow_rates` and `demand_weight` are rounded to 2dp server-side, so
 * summing the rounded parts is not the same as rounding the sum. The panel says
 * so rather than quietly showing a total that does not add up.
 */
export const coverBreakdown = (
  rates: DowRates | undefined,
  window: { start: string; end: string } | null | undefined,
): CoverDay[] =>
  coverDates(window).map((iso) => ({
    iso,
    label: dayLabel(iso),
    lb: rateForDate(rates, iso),
  }));


/* ── suggested actions ────────────────────────────────────────────────────── */


/**
 * Days, at the precision the figure deserves.
 *
 * Under ten days it is a decision — 1.8 days of cover and 3.4 days of cover
 * call for different things — and above it the fraction is noise nobody reads.
 */
const fmtDays = (n: number) => (n < 10 ? n.toFixed(1) : Math.round(n).toString());

/**
 * What an action is ABOUT, which decides how the popover frames it.
 *
 * The load-bearing distinction on this page, and it used to be a boolean called
 * `affectsOrder`. It is four values because "not this order" turned out to mean
 * three different things, and rendering all three as "about this item's
 * history" was wrong about two of them.
 *
 * `order` is the only one that says change the number on screen. The others
 * look BACKWARD at a quarter of buying while `suggested_weight` looks FORWARD
 * at a few days — they disagree on the same item without either being wrong,
 * so a buyer who reads "over-ordering" beside 313 lb and cuts it has been
 * misled by the UI, not by the data.
 */
export type ActionScope = "order" | "pattern" | "schedule" | "recording";

export const SCOPE_TEXT: Record<ActionScope, string> = {
  order: "changes this order",
  pattern: "about the ordering pattern",
  schedule: "about the delivery schedule",
  recording: "about the recording, not the order",
};

export interface SuggestedAction {
  key: ActionKey;
  /** Chip text. Short enough to sit under a product name. */
  label: string;
  tone: "critical" | "watch" | "neutral";
  scope: ActionScope;
  detail: string;
}

/**
 * One action per row, worst first.
 *
 * Deliberately at most one. Several of these fire together on the same item —
 * a clamped rate usually means no usable waste figure either — and a stack of
 * chips under a product name is a wall, not advice. The popover carries the
 * full reasoning; the chip carries the one thing worth acting on.
 *
 * The rhythm verdicts come off the row as `rhythm_action`; this function picks
 * the wording, never the band. That split is deliberate: the thresholds are
 * request fields the endpoint tunes against real output, and the counts behind
 * the chip row are tallied over the WHOLE query server-side — neither of which
 * a page holding one store's rows could do. What arrives here is a key and its
 * evidence, and turning that into a sentence a buyer acts on is this page's job.
 *
 * `rhythm_action` is absent when the response carries no ordering data
 * (historical, or `includeOrders` off), and the ladder falls straight through
 * to the two client-side calls — the correct behaviour rather than a gap.
 */
export const suggestedAction = (
  item: SuggestedItem,
  ns?: NotSellingItem,
  recentDays = 0,
  /** `leadDays + coverDays` — what one delivery has to carry. The rhythm bands
   *  are expressed in cycles of it, so the wording has to state it. */
  cycleDays = 0,
): SuggestedAction | null => {
  // A capped rate means the number itself is not trustworthy, which outranks
  // anything the number would otherwise tell you.
  if (item.shrink_clamped) {
    return {
      key: "codes",
      label: "Check item codes",
      tone: "critical",
      scope: "order",
      detail:
        "This item records more waste than it ever sold, so the adjustment was capped. That is almost always the item being received under one code and sold under another rather than heavy waste — worth passing to whoever sets items up.",
    };
  }

  // The one class that genuinely changes what to buy: the forecast is built on
  // twelve weeks, and this item is no longer selling the way those weeks did.
  if (ns && (ns.status === "declining" || ns.status === "stopped")) {
    const lost = lostLb(ns, recentDays);
    return {
      key: "slowing",
      label: ns.status === "stopped" ? "Stopped selling" : "Selling less",
      tone: ns.status === "stopped" ? "critical" : "watch",
      scope: "order",
      detail:
        ns.status === "stopped"
          ? `Sold ${fmtLb(ns.prior_lb_per_day)} lb a day earlier in the window and nothing at all in the last ${recentDays} days. The suggestion is built on twelve weeks, so it is still buying for an item that has stopped — about ${fmtLb(lost)} lb of it.`
          : `Down to ${fmtLb(ns.recent_lb_per_day)} lb a day from ${fmtLb(ns.prior_lb_per_day)}. The suggestion averages twelve weeks, so it is running ahead of where this item is now — roughly ${fmtLb(lost)} lb over the recent window.`,
    };
  }

  /* ── the ordering rhythm ──────────────────────────────────────────────── */

  const cover = item.days_of_cover ?? null;
  // Both halves of every rhythm sentence: how long the stock lasts, and how
  // long it has to. A days figure on its own means nothing — six days of cover
  // is comfortable on a weekly delivery and two orders' worth on a Tue/Fri one.
  const stock =
    cover === null
      ? ""
      : `About ${fmtDays(cover)} days of stock in the case${
          cycleDays > 0 ? `, and one delivery only has to carry ${cycleDays}` : ""
        }.`;
  const ratio = (item.order_ratio ?? 0).toFixed(2);
  const gap = fmtLb(Math.abs(item.order_gap_weight ?? 0));

  switch (item.rhythm_action) {
    case "slow_down":
      return {
        key: "slowDown",
        label: "Slow the ordering",
        tone: "critical",
        scope: "order",
        detail: `${stock} On top of that, buying has run ${ratio}x what sold this quarter — ${gap} lb more than went out. Both readings say the same thing, which is what makes it worth acting on: order less this cycle, and less again next time.`,
      };
    case "skip_cycle":
      return {
        key: "skipCycle",
        label: "Skip this order",
        tone: "watch",
        scope: "order",
        detail: `${stock} The buying itself is in line, so nothing is wrong with the rhythm — this turn is simply not needed. Skip it and pick the rhythm back up next time.`,
      };
    case "tighten":
      return {
        key: "tighten",
        label: "Buy more",
        tone: "watch",
        scope: "order",
        detail: `${stock} And only ${ratio}x what sold has been bought over the quarter — ${gap} lb short. The case is emptying before the next truck lands.`,
      };
    case "deliver_often":
      return {
        key: "deliverOften",
        label: "Deliver more often",
        tone: "watch",
        scope: "schedule",
        detail: `${stock} This item's biggest weekday runs ${(item.dow_peak_ratio ?? 0).toFixed(2)}x its own average, so one delivery has to carry that spike. Ordering more does not fix it — the extra just sits longer. A delivery closer to the peak day does.`,
      };
    case "watch":
      // Two different causes reach this band, and they are not the same
      // conversation. Split on the flag the row already carries rather than
      // writing one sentence that half-fits both.
      return item.shrink_unrecorded
        ? {
            key: "unlogged",
            label: "No waste logged",
            tone: "watch",
            scope: "recording",
            detail:
              "Ordered and sold match almost exactly, and nothing has ever been recorded as damaged or marked down. Two separate readings both saying nothing was lost, on product sold by the pound — that is usually a gap in the recording rather than a clean run.",
          }
        : {
            key: "watchRhythm",
            label: "Watch",
            tone: "watch",
            scope: "pattern",
            detail: `Bought ${ratio}x what sold this quarter — ${gap} lb more than went out. Stock is at a sensible level, so there is nothing to change this cycle. It is the direction that is worth knowing about.`,
          };
    // ok, insufficient and unknown are not advice. `insufficient` is under
    // 10 lb across twelve weeks and `unknown` sold nothing at all, so neither
    // has enough behind it to say anything — and inventing a chip for them
    // would bury the rows that do.
    default:
      break;
  }

  // Weakest signal, and the only one that says the number is too LOW.
  if (item.shrink_source === "none") {
    return {
      key: "runsLow",
      label: "May run short",
      tone: "neutral",
      scope: "order",
      detail:
        "No waste has ever been recorded for this item, so its figure is demand only — what customers bought, with nothing added for what never reached them. It will tend to come up short.",
    };
  }

  return null;
};

/**
 * How each tone looks, following Item Actions' `actionTone.ts`: chip fill and
 * its selected ring in one place, so the chip row and the row's own chip cannot
 * disagree about what an action looks like.
 *
 * The chip carries the colour and the row stays neutral — the same call that
 * page made, for the same reason. Tinting rows by action turns a 380-row sheet
 * into a rainbow and destroys the one thing a sheet is good at.
 */
export const ACTION_TONE: Record<
  SuggestedAction["tone"],
  { chip: string; ring: string }
> = {
  critical: {
    chip: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  watch: {
    chip: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  neutral: { chip: "bg-gray-100 text-content/85", ring: "ring-content/30" },
};

/** The tone each action wears, so the chip row can colour itself without
 *  building a row to ask. */
export const ACTION_TONE_FOR: Record<ActionKey, SuggestedAction["tone"]> = {
  codes: "critical",
  slowing: "critical",
  slowDown: "critical",
  skipCycle: "watch",
  tighten: "watch",
  deliverOften: "watch",
  unlogged: "watch",
  watchRhythm: "watch",
  runsLow: "neutral",
  none: "neutral",
};

/**
 * Chip-row order: worst first, matching the order `suggestedAction` resolves
 * in, so the rows a chip filters to are the rows that were showing it.
 *
 * `none` sits last and is not a verdict about an item — it is the pile with
 * nothing to say. It earns a chip because a blank Action column is ambiguous:
 * a buyer twice asked whether those rows were safe to order or simply had not
 * been looked at. A chip with a count answers that without them asking.
 */
export const ACTION_ORDER: { key: ActionKey; label: string }[] = [
  { key: "codes", label: "Check item codes" },
  { key: "slowing", label: "Selling less" },
  { key: "slowDown", label: "Slow the ordering" },
  { key: "skipCycle", label: "Skip this order" },
  { key: "tighten", label: "Buy more" },
  { key: "deliverOften", label: "Deliver more often" },
  { key: "unlogged", label: "No waste logged" },
  { key: "watchRhythm", label: "Watch" },
  { key: "runsLow", label: "May run short" },
  { key: "none", label: "Nothing to do" },
];
