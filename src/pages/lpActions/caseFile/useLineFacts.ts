import { useMemo } from "react";
import { useAppSelector } from "../../../hooks";
import { useCaseReceipts } from "../case/useCaseReceipts";
import { buildTypeScopes } from "./caseScopes";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * The facts that only exist on a receipt line: how many units moved, and how
 * many different things they were.
 *
 * The walked row carries a count and a value but no quantity and no item, so
 * anything answering "forty units of two things or forty of thirty-five" has
 * to come from the lines. This is the one place that read is turned into
 * figures, so the KPI strip and every card agree by construction rather than
 * by two people writing the same reduce twice.
 *
 * Costs nothing extra. The scopes are identical to the ones the charts already
 * request, so this resolves out of the cache; the hook exists to share the
 * arithmetic, not to fetch again.
 *
 * **Scoped to one window.** The receipts are fetched across every walked week,
 * because the evidence and the recurrence checks need that history — but these
 * figures sit beside a count that means the latest week alone, and a quantity
 * spanning four weeks next to a count spanning one is two answers to the same
 * question. The window is required rather than optional so that cannot be
 * forgotten at a call site.
 */
export interface TypeFacts {
  /** Units across this type's lines. */
  qty: number;
  /** Distinct products involved. */
  items: number;
}

export interface LineFacts {
  byType: Map<string, TypeFacts>;
  qty: number;
  items: number;
  /** False while the read is still out. Callers show a dash, never a zero —
   *  "not read yet" and "none" are different answers. */
  ready: boolean;
}

const EMPTY: TypeFacts = { qty: 0, items: 0 };

export const useLineFacts = (
  types: string[],
  window: WeekWindow | undefined,
): LineFacts => {
  const { rawRows, caseSubject } = useAppSelector((s) => s.lpActions);

  const scopes = useMemo(
    () => buildTypeScopes(rawRows, caseSubject),
    [rawRows, caseSubject],
  );
  const receipts = useCaseReceipts(scopes);

  return useMemo(() => {
    const wanted = new Set(types);
    const byType = new Map<string, TypeFacts>();
    const names = new Map<string, Set<string>>();
    const all = new Set<string>();
    let qty = 0;

    for (const line of receipts.lines) {
      if (!wanted.has(line.sale_type)) continue;
      if (window) {
        const day = line.sale_date.slice(0, 10);
        if (day < window.start || day > window.end) continue;
      }

      const units = line.qty ?? 0;
      qty += units;

      const current = byType.get(line.sale_type) ?? { qty: 0, items: 0 };
      current.qty += units;
      byType.set(line.sale_type, current);

      const name = (line.product_description ?? "").trim().toLowerCase();
      if (!name) continue;
      all.add(name);
      const seen = names.get(line.sale_type);
      if (seen) seen.add(name);
      else names.set(line.sale_type, new Set([name]));
    }

    for (const [saleType, seen] of names) {
      const current = byType.get(saleType);
      if (current) current.items = seen.size;
    }

    return {
      byType,
      qty,
      items: all.size,
      ready: !receipts.loading || receipts.lines.length > 0,
    };
  }, [receipts.lines, receipts.loading, types, window]);
};

export const factsFor = (facts: LineFacts, saleType: string): TypeFacts =>
  facts.byType.get(saleType) ?? EMPTY;
