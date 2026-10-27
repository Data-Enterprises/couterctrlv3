import type { AllOrder } from "../../../interfaces";
import type { OrderFlag } from "../../../features/dev/devOrdersSlice";
import { lineFlags } from "./ordersRows";
import {
  buildDocs,
  docKey,
  perCase,
  recompute,
  startDraft,
  unitCostOf,
  type OrderDoc,
  type OrderDraft,
} from "./orderEdit";

/**
 * The Problems tab: the items whose cost looks wrong, one row per UPC, across
 * every order the left panel shows.
 *
 * Ben's three questions are one job — find a bad cost, fix it once in unit
 * cost, and have every store's case cost and Ext cost follow. The flags were
 * on the Browse grid and the fix was in Edit; this puts the list of problems
 * in the same place as the fix, so the job is worked down a list rather than
 * remembered from one mode and searched for in the other.
 */

/** Missing cost is the cause and high margin its usual symptom, so the cause
 *  is read first. */
const FLAG_ORDER: OrderFlag[] = ["missingCost", "highMargin", "noCaseSize"];

export interface ProblemItem {
  code: string;
  /** The first real description any of its lines carries — some arrive null. */
  desc: string;
  /**
   * What is wrong with it, in reading order. Empty for an item that is only
   * here because a search found it.
   *
   * Read from the lines as loaded, not as staged: an item stays in the list
   * after it is fixed, marked as staged, so the session's work stays visible.
   */
  flags: OrderFlag[];
  stores: number;
  orders: number;
  /** The highest margin any of its lines rings, for ordering the high-margin
   *  items worst first. Null when no line has retail to measure against. */
  topMargin: number | null;
  /** Orders of this item holding a cost change not yet submitted. */
  staged: number;
}

const marginOf = (eRet: number, cogs: number) =>
  eRet > 0 ? ((eRet - cogs) / eRet) * 100 : null;

/**
 * Every item in scope, with what is wrong with it.
 *
 * `drafts` decides `staged`: an order counts once any of the item's lines in
 * it has a case cost different from the one it loaded with — staged by the
 * Problems tab or typed by hand, it is a change waiting either way.
 */
export const itemsInScope = (
  lines: AllOrder[],
  drafts: Record<string, OrderDraft>,
  marginOver: number | null,
): ProblemItem[] => {
  type Acc = {
    desc: string;
    flags: Set<OrderFlag>;
    stores: Set<string>;
    orders: Set<string>;
    topMargin: number | null;
  };
  const byCode = new Map<string, Acc>();

  for (const o of lines) {
    const code = String(o.product_code);
    const acc =
      byCode.get(code) ??
      ({
        desc: "",
        flags: new Set(),
        stores: new Set(),
        orders: new Set(),
        topMargin: null,
      } as Acc);
    const desc = (o.description ?? "").trim();
    if (!acc.desc && desc) acc.desc = desc;
    lineFlags(o, marginOver).forEach((f) => acc.flags.add(f));
    acc.stores.add(`${o.storeid}|${o.storenumber}`);
    acc.orders.add(docKey(o));
    const m = marginOf(o.e_ret ?? 0, o.cogs ?? 0);
    if (m !== null && (acc.topMargin === null || m > acc.topMargin)) {
      acc.topMargin = m;
    }
    byCode.set(code, acc);
  }

  // Which orders hold a changed case cost, per item.
  const stagedBy = new Map<string, Set<string>>();
  for (const d of Object.values(drafts)) {
    for (const l of d.lines) {
      if (l.original === null || l.base_cost === l.original.base_cost) continue;
      const code = String(l.product_code);
      const set = stagedBy.get(code) ?? new Set<string>();
      set.add(d.doc.key);
      stagedBy.set(code, set);
    }
  }

  return [...byCode.entries()].map(([code, a]) => ({
    code,
    desc: a.desc,
    flags: FLAG_ORDER.filter((f) => a.flags.has(f)),
    stores: a.stores.size,
    orders: a.orders.size,
    topMargin: a.topMargin,
    staged: [...(stagedBy.get(code) ?? [])].filter((k) => a.orders.has(k))
      .length,
  }));
};

/**
 * The list in working order.
 *
 * Still to do first, then skipped, then staged — the top of the list is
 * always the next thing to look at. Within the still-to-do: missing cost,
 * then high margin worst first, then no case size, then by name.
 */
export const workingOrder = (
  items: ProblemItem[],
  skipped: Set<string>,
): ProblemItem[] => {
  const bucket = (i: ProblemItem) =>
    i.staged > 0 ? 2 : skipped.has(i.code) ? 1 : 0;
  const rank = (i: ProblemItem) =>
    i.flags.includes("missingCost")
      ? 0
      : i.flags.includes("highMargin")
        ? 1
        : i.flags.includes("noCaseSize")
          ? 2
          : 3;
  return [...items].sort(
    (a, b) =>
      bucket(a) - bucket(b) ||
      rank(a) - rank(b) ||
      (rank(a) === 1 ? (b.topMargin ?? 0) - (a.topMargin ?? 0) : 0) ||
      Number(!a.desc) - Number(!b.desc) ||
      a.desc.localeCompare(b.desc) ||
      a.code.localeCompare(b.code),
  );
};

/** What the item's lines on one order come to. */
export interface Figures {
  caseCost: number;
  extCost: number;
  margin: number | null;
}

/** One order carrying the item, as the Problems tab shows it. */
export interface ItemStoreRow {
  doc: OrderDoc;
  /** The item's lines on this order — usually one. */
  lineNumbers: number[];
  /** As loaded. Zero means ordered by the unit: case cost IS the unit cost. */
  casesize: number;
  qty: number;
  unitNow: number;
  now: Figures;
  /** At the typed unit cost. Null while nothing valid is typed. */
  after: Figures | null;
  /** Whether staging would change anything on this order. */
  changes: boolean;
}

/**
 * Every order in scope carrying the item, with its figures now and at the
 * typed unit cost.
 *
 * "Now" is the order's draft when it has one, not the line as loaded — an
 * order already changed by hand or by an earlier fix shows what it will
 * actually send. "After" runs each line through `recompute`, the same
 * function a hand edit does, so Ext cost and margin here are exactly what the
 * grid and the file will carry.
 */
export const itemStoreRows = (
  code: string,
  scope: AllOrder[],
  all: AllOrder[],
  drafts: Record<string, OrderDraft>,
  unit: number | null,
): ItemStoreRow[] => {
  const mine = scope.filter((o) => String(o.product_code) === code);
  const lineNos = new Map<string, number[]>();
  for (const o of mine) {
    const key = docKey(o);
    lineNos.set(key, [...(lineNos.get(key) ?? []), o.line_number]);
  }

  return buildDocs(mine).map((doc) => {
    const lineNumbers = lineNos.get(doc.key) ?? [];
    const draft = drafts[doc.key] ?? startDraft(doc, all);
    const ls = draft.lines.filter((l) => lineNumbers.includes(l.line_number));
    const first = ls[0];

    const sum = (rows: typeof ls): Figures => {
      const eRet = rows.reduce((t, l) => t + (l.e_ret ?? 0), 0);
      const cogs = rows.reduce((t, l) => t + (l.cogs ?? 0), 0);
      return {
        caseCost: rows[0]?.base_cost ?? 0,
        extCost: cogs,
        margin: marginOf(eRet, cogs),
      };
    };

    const now = sum(ls);
    const afterLines =
      unit === null
        ? null
        : ls.map((l) => recompute({ ...l, base_cost: unit * perCase(l) }));
    const after = afterLines === null ? null : sum(afterLines);

    return {
      doc,
      lineNumbers,
      casesize: first?.casesize ?? 0,
      qty: ls.reduce((t, l) => t + l.qty, 0),
      unitNow: first ? unitCostOf(first) : 0,
      now,
      after,
      changes:
        afterLines !== null &&
        afterLines.some((l, i) => Math.abs(l.base_cost - ls[i].base_cost) > 1e-6),
    };
  });
};

/**
 * The unit cost most stores already pay, when there is one.
 *
 * Usually the answer: three stores at $2.19 and one at $0.00 means the $0.00
 * is the missing one. Offered, never filled in — it needs at least two stores
 * agreeing, and strictly more of them than any other price, or it is a guess.
 * Zero is not a price anybody pays, so it never counts.
 */
export const commonUnit = (rows: ItemStoreRow[]): number | null => {
  const counts = new Map<number, number>();
  for (const r of rows) {
    if (!(r.unitNow > 0)) continue;
    const cents = Math.round(r.unitNow * 100);
    counts.set(cents, (counts.get(cents) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0 || ranked[0][1] < 2) return null;
  if (ranked.length > 1 && ranked[1][1] === ranked[0][1]) return null;
  return ranked[0][0] / 100;
};
