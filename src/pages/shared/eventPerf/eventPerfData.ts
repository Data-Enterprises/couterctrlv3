import {
  cashierKeyOf,
  storeKeyOf,
  type EventRow,
} from "../../../features/eventPerfSlice";

/** What the screen currently has open. Every builder takes the same scope so
 *  the card, the chart and the list can never disagree about what they show. */
export interface EventScope {
  lens: string | null;
  day: string | null;
  storeKey: string | null;
  cashierKey: string | null;
}

export const EMPTY_SCOPE: EventScope = {
  lens: null,
  day: null,
  storeKey: null,
  cashierKey: null,
};

/**
 * Narrow rows to the open scope.
 *
 * `day` is deliberately ignored for baseline rows by the callers below: the
 * baseline is a weekly figure with no days in it, and filtering it to a
 * Saturday would compare one day against a whole week.
 */
export const scopeRows = (rows: EventRow[], s: EventScope) => {
  let out = rows;
  if (s.lens) out = out.filter((r) => r.lens === s.lens);
  if (s.day) out = out.filter((r) => r.day === s.day);
  if (s.storeKey) out = out.filter((r) => storeKeyOf(r) === s.storeKey);
  if (s.cashierKey) out = out.filter((r) => cashierKeyOf(r) === s.cashierKey);
  return out;
};

/** Parsed at midday, so a UTC-parsed ISO date read back in local time cannot
 *  slip the weekday to the day before. */
const weekdayOf = (iso: string) => new Date(`${iso}T12:00:00`).getDay();

/**
 * Narrow the comparison period to match the open scope.
 *
 * The day is matched by WEEKDAY, not by date: the baseline window sits two
 * weeks behind the searched one, so selecting Saturday has to find the
 * Saturdays in it. Comparing one Saturday against a whole fortnight is the
 * shape this got wrong — the bar sat at the full-period figure no matter which
 * day was picked.
 *
 * Baseline rows arrive pre-scaled to one week's worth by their adapter, so two
 * halved Saturdays sum to the average Saturday, exactly as fourteen halved days
 * sum to the average week.
 *
 * A row with no day cannot be matched to one and drops out — that reads as "no
 * bar", which is honest, rather than as a comparison that silently isn't one.
 */
const scopeBaseline = (rows: EventRow[], s: EventScope) => {
  let out = rows;
  if (s.lens) out = out.filter((r) => r.lens === s.lens);
  if (s.storeKey) out = out.filter((r) => storeKeyOf(r) === s.storeKey);
  if (s.cashierKey) out = out.filter((r) => cashierKeyOf(r) === s.cashierKey);
  if (s.day) {
    const wd = weekdayOf(s.day);
    out = out.filter((r) => r.day !== "" && weekdayOf(r.day) === wd);
  }
  return out;
};

/** Transactions, not rows. A coupon sale with four coupon lines is one
 *  transaction; an exception row is already one. */
const transactionsIn = (rows: EventRow[]) => {
  const ids = new Set<string>();
  let aggregate = 0;
  for (const r of rows) {
    // Aggregate rows carry no sale id and say how many they stand for.
    if (!r.sale_id) aggregate += r.count;
    else ids.add(r.sale_id);
  }
  return ids.size + aggregate;
};

export interface EventTotals {
  /** Coupon lines / exception rows. */
  lines: number;
  transactions: number;
  amount: number;
  cashiers: number;
  stores: number;
  /** The store's name when the scope holds exactly one, so a single-store
   *  search can say where it is rather than "All stores". Already resolved
   *  against the user's stores by the adapter that built the rows. */
  storeName: string | null;
  terminals: number;
  perTransaction: number;
  /** The same figures for the comparison period, or null when there is none. */
  baselineTransactions: number | null;
  baselineAmount: number | null;
}

const totalsOf = (mine: EventRow[], base: EventRow[]): EventTotals => {
  const transactions = transactionsIn(mine);
  const amount = mine.reduce((a, r) => a + r.amount, 0);

  return {
    lines: mine.length,
    transactions,
    amount,
    cashiers: new Set(
      mine.filter((r) => r.cashier_number !== null).map(cashierKeyOf),
    ).size,
    stores: new Set(mine.map(storeKeyOf)).size,
    storeName:
      new Set(mine.map(storeKeyOf)).size === 1 ? mine[0].store_name : null,
    terminals: new Set(mine.filter((r) => r.terminal).map((r) => r.terminal))
      .size,
    perTransaction: transactions > 0 ? amount / transactions : 0,
    baselineTransactions: base.length ? transactionsIn(base) : null,
    baselineAmount: base.length ? base.reduce((a, r) => a + r.amount, 0) : null,
  };
};

export const buildTotals = (
  rows: EventRow[],
  baseline: EventRow[],
  scope: EventScope,
): EventTotals =>
  totalsOf(
    scopeRows(rows, scope),
    // The baseline is only comparable at a level it actually carries. LP's
    // trend rows know a store and never a cashier, so asking one for a
    // person's baseline yields nothing — which reads as "no bar", not zero.
    scopeBaseline(baseline, scope),
  );

/**
 * A card's figures for every lens at once, in one pass.
 *
 * Calling buildTotals per card re-scanned every row once per lens — seven full
 * passes over a store-week for a page with six exception types, redone on
 * every day tap and row tap. Narrowing once and bucketing by lens is the same
 * arithmetic in a single walk.
 *
 * `null` in `lenses` is the "everything" card, which reuses the narrowed set
 * rather than concatenating the buckets back together.
 */
export const buildLensCards = (
  rows: EventRow[],
  baseline: EventRow[],
  scope: EventScope,
  lenses: (string | null)[],
): EventTotals[] => {
  const lensless = { ...scope, lens: null };
  const within = scopeRows(rows, lensless);
  const baseWithin = scopeBaseline(baseline, lensless);

  const bucket = (list: EventRow[]) => {
    const acc = new Map<string, EventRow[]>();
    for (const r of list) {
      const found = acc.get(r.lens);
      if (found) found.push(r);
      else acc.set(r.lens, [r]);
    }
    return acc;
  };

  const byLens = bucket(within);
  const baseByLens = bucket(baseWithin);

  return lenses.map((lens) =>
    lens === null
      ? totalsOf(within, baseWithin)
      : totalsOf(byLens.get(lens) ?? [], baseByLens.get(lens) ?? []),
  );
};

export interface EventGroupRow {
  key: string;
  label: string;
  sub: string;
  transactions: number;
  amount: number;
  /** Null when the comparison period has nothing at this level. */
  baseline: number | null;
}

/**
 * The store list, or the cashier list.
 *
 * Ordered by transaction count, biggest first. Ordering by distance from
 * baseline would rank people by how unusual they look, which is the grading
 * this page exists without.
 */
export const buildGroupRows = (
  rows: EventRow[],
  baseline: EventRow[],
  scope: EventScope,
  by: "store" | "cashier",
  /** Which figure the bars measure — counts for LP, dollars for Coupons. */
  measure: "transactions" | "amount",
): EventGroupRow[] => {
  const keyFn = by === "store" ? storeKeyOf : cashierKeyOf;
  const mine = scopeRows(rows, scope).filter(
    (r) => by === "store" || r.cashier_number !== null,
  );

  const groups = new Map<string, EventRow[]>();
  for (const r of mine) {
    const k = keyFn(r);
    const list = groups.get(k);
    if (list) list.push(r);
    else groups.set(k, [r]);
  }

  // Baselines are matched by the same key, so a level the comparison period
  // does not carry simply produces null rather than a misleading zero.
  const baseAcc = new Map<string, number>();
  for (const r of scopeBaseline(baseline, { ...scope, cashierKey: null })) {
    if (by === "cashier" && r.cashier_number === null) continue;
    const k = keyFn(r);
    baseAcc.set(
      k,
      (baseAcc.get(k) ?? 0) + (measure === "amount" ? r.amount : r.count),
    );
  }

  return [...groups.entries()]
    .map(([key, list]) => {
      const first = list[0];
      const transactions = transactionsIn(list);
      const amount = list.reduce((a, r) => a + r.amount, 0);
      const lanes = [
        ...new Set(list.filter((r) => r.terminal).map((r) => r.terminal)),
      ].sort();

      return {
        key,
        label:
          by === "store"
            ? first.store_name
            : // The number is how a manager refers to a cashier, and two
              // people can share a first name on one shift.
              `${first.cashier_name} · ${first.cashier_number}`,
        sub:
          by === "store"
            ? `${new Set(list.filter((r) => r.cashier_number !== null).map(cashierKeyOf)).size} cashiers`
            : lanes.length
              ? `${lanes.length === 1 ? "lane" : "lanes"} ${lanes.join(", ")}`
              : "",
        transactions,
        amount,
        baseline: baseAcc.get(key) ?? null,
      };
    })
    .sort((a, b) =>
      measure === "amount"
        ? b.amount - a.amount
        : b.transactions - a.transactions,
    );
};

/**
 * The receipt number a person would read off a till roll.
 *
 * LP's `sale_id` is compound — `54-454872-3-8-30-2026` — and the transaction
 * number is the SECOND segment, not the last: the tail is the date, so taking
 * `.pop()` labels every receipt in a week with the same four digits. The
 * desktop page splits it the same way. The full value is still what the
 * transaction fetch needs, so only the label is trimmed.
 */
export const receiptLabel = (saleId: string) => {
  const parts = saleId.split("-");
  return parts.length > 1 ? parts[1] : saleId;
};

export interface EventReceipt {
  saleId: string;
  day: string;
  terminal: string;
  cashierName: string;
  storeName: string;
  storeid: number;
  lines: number;
  amount: number;
}

/** One row per transaction, newest first. */
export const buildReceipts = (
  rows: EventRow[],
  scope: EventScope,
  query: string,
): EventReceipt[] => {
  const q = query.trim().toLowerCase();
  const acc = new Map<string, EventReceipt>();

  for (const r of scopeRows(rows, scope)) {
    if (!r.sale_id) continue;
    const found = acc.get(r.sale_id);
    if (found) {
      found.lines += 1;
      found.amount += r.amount;
      // A sale can span lanes on a split tender; keep the first seen.
      continue;
    }
    acc.set(r.sale_id, {
      saleId: r.sale_id,
      day: r.day,
      terminal: r.terminal,
      cashierName: r.cashier_name,
      storeName: r.store_name,
      storeid: r.storeid,
      lines: 1,
      amount: r.amount,
    });
  }

  const out = [...acc.values()].filter(
    (t) =>
      !q ||
      t.saleId.toLowerCase().includes(q) ||
      t.cashierName.toLowerCase().includes(q) ||
      t.terminal.toLowerCase().includes(q),
  );

  // Most recent first: on this screen the sequence is the story, and five
  // exceptions inside forty minutes only reads that way in order.
  return out.sort((a, b) => b.saleId.localeCompare(a.saleId));
};

export interface EventDay {
  iso: string;
  label: string;
  value: number;
  baseline: number;
}

/**
 * The week, day by day.
 *
 * The baseline is spread evenly across the seven days rather than matched day
 * for day: LP's trend carries no dates at all, so a per-day baseline would be
 * invented. An even seventh is honest about being an average.
 */
export const buildEventDays = (
  rows: EventRow[],
  baseline: EventRow[],
  scope: EventScope,
  weekDates: string[],
  measure: "transactions" | "amount",
): EventDay[] => {
  const dayless: EventScope = { ...scope, day: null };
  const mine = scopeRows(rows, dayless);
  const base = scopeBaseline(baseline, dayless);

  // Bucketed by weekday rather than divided by seven. A flat seventh drew the
  // same grey bar under every column, which said nothing — a Saturday baseline
  // and a Tuesday baseline are not the same number, and the whole point of the
  // grey bar is to say whether this Saturday was a normal one.
  const baseByWeekday = new Map<number, EventRow[]>();
  for (const r of base) {
    if (!r.day) continue;
    const wd = weekdayOf(r.day);
    const found = baseByWeekday.get(wd);
    if (found) found.push(r);
    else baseByWeekday.set(wd, [r]);
  }

  return weekDates.map((iso) => {
    const onDay = mine.filter((r) => r.day === iso);
    const onWeekday = baseByWeekday.get(weekdayOf(iso)) ?? [];
    return {
      iso,
      // Parsed at midday so a UTC-parsed date read back in local time cannot
      // slip the label to the day before.
      label: new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      value:
        measure === "amount"
          ? onDay.reduce((a, r) => a + r.amount, 0)
          : transactionsIn(onDay),
      baseline:
        measure === "amount"
          ? onWeekday.reduce((a, r) => a + r.amount, 0)
          : transactionsIn(onWeekday),
    };
  });
};

/** The busiest day in the week, for the summary card. Null when nothing sold. */
export const busiestDay = (days: EventDay[]) => {
  const best = days.reduce<EventDay | null>(
    (a, d) => (d.value > 0 && (!a || d.value > a.value) ? d : a),
    null,
  );
  if (!best) return null;
  return new Date(`${best.iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "numeric",
    day: "numeric",
  });
};
