import type { CashierTransaction } from "../../../interfaces";
import { inSubject, type CaseSubject } from "../lpActionsMetrics";
import type { TypeScope } from "../case/useCaseReceipts";

/**
 * The receipts to read for one operator, grouped the way `transaction_list`
 * wants to be asked: one scope per exception type, carrying only that type's
 * sale ids.
 *
 * Asking for `Sale` instead would return every line of every basket — an order
 * of magnitude more rows, and the wrong evidence. A refund case wants the
 * items that were refunded, not everything else the customer bought.
 *
 * Spans **all** the walked weeks rather than the latest. "New item" only means
 * something against the weeks before it, and "unusual hour" only means
 * something if the earlier weeks were spread — both claims need the history,
 * so reading the spike week alone produces evidence that cannot be checked.
 *
 * The scope shape is also the cache key, and it is built identically here and
 * in the transactions view, so whichever runs second reads the first one's
 * answer instead of asking again.
 */
export const buildTypeScopes = (
  rows: CashierTransaction[],
  subject: CaseSubject | null,
): TypeScope[] => {
  if (subject === null) return [];

  const byType = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!inSubject(r, subject)) continue;
    const ids = byType.get(r.sale_type);
    if (ids) ids.add(r.sale_id);
    else byType.set(r.sale_type, new Set([r.sale_id]));
  }

  return [...byType.entries()].map(([saleType, ids]) => ({
    saleType,
    saleIds: [...ids].sort(),
  }));
};

/**
 * Every receipt this operator touched, asked for as `Tender`.
 *
 * Tender is not an exception — the walk filters it out — but it rides on the
 * same receipts, and how a suspect transaction was paid for is the question LP
 * asks after "what happened". One extra request for the whole case, and only
 * on the transactions step where someone has committed to looking.
 */
export const buildTenderScope = (
  rows: CashierTransaction[],
  subject: CaseSubject | null,
): TypeScope | null => {
  if (subject === null) return null;
  const ids = new Set<string>();
  for (const r of rows) if (inSubject(r, subject)) ids.add(r.sale_id);
  if (ids.size === 0) return null;
  return { saleType: "Tender", saleIds: [...ids].sort() };
};
