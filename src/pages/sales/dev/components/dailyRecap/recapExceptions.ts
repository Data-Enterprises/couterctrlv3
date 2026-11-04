import type { ExceptionLine } from "../../../../../api/exceptionLines";
import type { RecapExceptions, RecapExceptionType } from "./recapTypes";

/** The order the card lists types in; anything else follows, by name. */
const TYPE_ORDER = ["Voided", "Cancelled", "Refunded", "No Sale", "Backup"];

/** How the card names a type. */
const TYPE_LABEL: Record<string, string> = { "No Sale": "No sale" };

/**
 * Payment lines, not exceptions: left out of the card altogether. Tender's
 * amounts match neither the total nor net sales (it likely carries more than
 * the basket), and LP Actions counts it as a payment, not an exception, too.
 */
const NOT_EXCEPTIONS = new Set(["Tender"]);

/** A No Sale opens the drawer and rings nothing: no qty, no amount. */
const RINGS_NOTHING = new Set(["No Sale"]);

const rank = (t: string) => {
  const i = TYPE_ORDER.indexOf(t);
  return i === -1 ? TYPE_ORDER.length : i;
};

/** The card's order for exception types: the usual ones first, the rest by name. */
export const byTypeOrder = (a: { type: string }, b: { type: string }) =>
  rank(a.type) - rank(b.type) || a.type.localeCompare(b.type);

/**
 * A week's exception lines, rolled up per day and per type.
 *
 * Transactions are distinct receipts (`sale_id`), so a ten-line void is one,
 * the way LP Actions counts. Qty is the lines' qty summed. Amount is net
 * sales, the basis the rest of the recap uses, each line taken as a positive
 * amount since the endpoint signs refunds and reversals either way. A No Sale
 * has neither, so both are null for it.
 *
 * Only types with lines that day appear.
 */
export const exceptionsByDay = (lines: ExceptionLine[]): Map<string, RecapExceptions> => {
  const days = new Map<
    string,
    { receipts: Set<string>; amount: number; types: Map<string, RecapExceptionType & { ids: Set<string> }> }
  >();
  for (const l of lines) {
    if (NOT_EXCEPTIONS.has(String(l.sale_type ?? "").trim())) continue;
    const date = l.sale_date.split("T")[0];
    const day = days.get(date) ?? { receipts: new Set(), amount: 0, types: new Map() };
    const type = String(l.sale_type ?? "").trim() || "Other";
    const nothing = RINGS_NOTHING.has(type);
    const t = day.types.get(type) ?? {
      type,
      label: TYPE_LABEL[type] ?? type,
      transactions: 0,
      qty: nothing ? null : 0,
      amount: nothing ? null : 0,
      ids: new Set<string>(),
    };
    t.ids.add(l.sale_id);
    day.receipts.add(l.sale_id);
    if (!nothing) {
      const amount = Math.abs(l.net_sales || 0);
      t.qty = (t.qty ?? 0) + Math.abs(l.qty || 0);
      t.amount = (t.amount ?? 0) + amount;
      day.amount += amount;
    }
    day.types.set(type, t);
    days.set(date, day);
  }
  const out = new Map<string, RecapExceptions>();
  for (const [date, d] of days) {
    out.set(date, {
      transactions: d.receipts.size,
      amount: d.amount,
      types: [...d.types.values()]
        .map(({ ids, ...t }) => ({ ...t, transactions: ids.size }))
        .sort(byTypeOrder),
    });
  }
  return out;
};

/** A day with no exception lines. */
export const NO_EXCEPTIONS: RecapExceptions = { transactions: 0, amount: 0, types: [] };
