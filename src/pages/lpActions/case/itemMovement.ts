import type { TransactionListItem } from "../../../interfaces";
import type { WeekWindow } from "../lpActionsMetrics";
import { lineQty } from "../../inventory/pricePoints";
import { isAll, weekIndexOf } from "./caseModel";

/**
 * Which items carry the movement.
 *
 * The same self-comparison rule as everywhere else, one level down: an item is
 * judged against its own rate under this cashier and this exception type, never
 * against other items.
 *
 * `new` is the strongest evidence the report can carry. An item with no history
 * cannot be explained by a habit, a slow-moving line or a fault that predates
 * the spike — absence of history is unambiguous in a way a count never is.
 *
 * `stopped` is deliberately ambiguous and shown anyway. It is equally
 * consistent with a delisting, a stockout or someone who realised they were
 * being watched, which is why the panel prints a caveat beside it rather than
 * letting a reader supply their own explanation.
 */
export type ItemMove = "new" | "increased" | "stopped" | "steady";

export interface ItemRow {
  productCode: string;
  description: string;
  /** Receipts, not lines. Seven receipts is a pattern; seven units on one
   *  receipt is a single event. */
  receipts: number;
  /** Units rung in the latest week. Receipts drive the grading, but units are
   *  what a reader counts against the shelf. */
  qty: number;
  value: number;
  baseline: number;
  move: ItemMove;
  lastSeen: string;
}

const RANK: Record<ItemMove, number> = {
  new: 0,
  increased: 1,
  stopped: 2,
  steady: 3,
};

export const buildItemMovement = (
  lines: TransactionListItem[],
  windows: WeekWindow[],
  saleType: string,
): ItemRow[] => {
  const flagged = lines.filter(
    (l) => isAll(saleType) || l.sale_type === saleType,
  );
  const lastIndex = windows.length - 1;

  const byItem = new Map<
    string,
    {
      description: string;
      receiptsPerWeek: Set<string>[];
      qty: number;
      value: number;
      lastSeen: string;
    }
  >();

  for (const l of flagged) {
    const wi = weekIndexOf(windows, l.sale_date);
    if (wi < 0) continue;
    const code = String(l.product_code);
    let entry = byItem.get(code);
    if (!entry) {
      entry = {
        description: l.product_description || code,
        receiptsPerWeek: windows.map(() => new Set<string>()),
        qty: 0,
        value: 0,
        lastSeen: "",
      };
      byItem.set(code, entry);
    }
    entry.receiptsPerWeek[wi].add(l.sale_id);
    if (wi === lastIndex) {
      entry.qty += lineQty(l);
      entry.value += Math.abs(l.net_sales ?? 0);
    }
    const day = l.sale_date.slice(0, 10);
    if (day > entry.lastSeen) entry.lastSeen = day;
  }

  return [...byItem.entries()]
    .map(([productCode, e]) => {
      const counts = e.receiptsPerWeek.map((s) => s.size);
      const latest = counts[lastIndex] ?? 0;
      const earlier = counts.slice(0, -1);
      const priorTotal = earlier.reduce((acc, n) => acc + n, 0);
      const baseline = earlier.length ? priorTotal / earlier.length : 0;

      const move: ItemMove =
        priorTotal === 0 && latest > 0
          ? "new"
          : latest === 0 && baseline >= 1
            ? "stopped"
            : baseline > 0 && latest > baseline * 1.5
              ? "increased"
              : "steady";

      return {
        productCode,
        description: e.description,
        receipts: latest,
        qty: e.qty,
        value: e.value,
        baseline,
        move,
        lastSeen: e.lastSeen,
      };
    })
    .sort((a, b) => {
      const rank = RANK[a.move] - RANK[b.move];
      if (rank !== 0) return rank;
      return b.receipts - a.receipts || b.value - a.value;
    });
};
