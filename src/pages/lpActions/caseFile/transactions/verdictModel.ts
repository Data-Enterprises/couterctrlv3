import type { TransactionListItem } from "../../../../interfaces";
import { formatCurrency2 } from "../../../../utils";
import { inFinding, type CaseFinding } from "./findingModel";
import type { EvidenceRow } from "./facetsModel";

/**
 * Whether one receipt actually supports the case.
 *
 * Four checks, each of which reports its outcome EITHER WAY. That is the point:
 * the half of this job that saves LP time is the receipt they can confidently
 * put down, and a summary that only ever accuses is no use for that.
 *
 *   · was the item re-rung afterwards
 *   · did it land inside the window the case flagged
 *   · was it on the lane carrying most of the operator's exceptions
 *   · does the same item turn up on other receipts
 *
 * Three or more fire → supports the case. One or two → worth a look. None →
 * nothing unusual. There is deliberately no softer fourth verdict: when the
 * basket cannot be read we say so instead of grading on evidence we lack.
 */

export type VerdictTone = "investigate" | "watch" | "steady";

export interface Verdict {
  tone: VerdictTone;
  label: string;
  points: string[];
}

const LABEL: Record<VerdictTone, string> = {
  investigate: "Supports the case",
  watch: "Worth a look",
  steady: "Nothing unusual",
};

const isVoid = (saleType: string) => /void/i.test(saleType);
const isCancel = (saleType: string) => /cancel/i.test(saleType);
const isNoSale = (saleType: string) => /no\s*sale/i.test(saleType);

/**
 * Was the voided item rung again further down the same receipt?
 *
 * The shape of an honest correction: scan and void, then scan again. Matched
 * on description rather than on amount, because a re-ring at a corrected price
 * is still a re-ring — and it is the item coming back that says the customer
 * kept it, not the money.
 */
const reRung = (
  basket: TransactionListItem[],
  item: string,
  afterLine: number,
) =>
  basket.some(
    (l) =>
      l.line_number > afterLine &&
      !isVoid(l.sale_type) &&
      (l.product_description ?? "").trim().toLowerCase() ===
        item.trim().toLowerCase(),
  );

export const buildVerdict = (
  row: EvidenceRow,
  all: EvidenceRow[],
  basket: TransactionListItem[],
  finding: CaseFinding | null,
  hotLane: string | null,
): Verdict => {
  const lines = basket.length;
  const position = basket.findIndex((l) => l.line_number === row.lineNumber);
  const at = position >= 0 ? position + 1 : row.lineNumber;

  const corrected =
    isVoid(row.saleType) && reRung(basket, row.item, row.lineNumber);
  // A cancelled basket is never put right — it simply ends — so this always
  // counts against it. A no sale has no line to correct either way.
  const notCorrected = isCancel(row.saleType) || (isVoid(row.saleType) && !corrected);

  const inWindow = inFinding(row, finding);
  const onHotLane = hotLane !== null && row.lane === hotLane;

  const others = all.filter(
    (r) =>
      r.saleId !== row.saleId &&
      r.saleType === row.saleType &&
      r.item.trim().toLowerCase() === row.item.trim().toLowerCase(),
  );
  const repeats = isVoid(row.saleType) && others.length > 0;

  const score = [notCorrected, inWindow, onHotLane, repeats].filter(
    Boolean,
  ).length;
  const tone: VerdictTone =
    score >= 3 ? "investigate" : score >= 1 ? "watch" : "steady";

  const points: string[] = [];

  // Sale total from the basket's own lines, ignoring the voided ones — the
  // figure a customer would have paid.
  const soldFor = basket
    .filter((l) => !isVoid(l.sale_type) && !/tender/i.test(l.sale_type))
    .reduce((acc, l) => acc + (l.net_sales ?? 0), 0);

  if (isNoSale(row.saleType)) {
    points.push(
      `Drawer opened with nothing rung — a no sale carries no line and no basket to weigh it against.`,
    );
  } else if (isCancel(row.saleType)) {
    points.push(
      `Whole basket cancelled at ${formatCurrency2(Math.abs(row.amount))} after ${Math.max(lines - 1, 0)} lines had rung, and never completed.`,
    );
  } else {
    points.push(
      corrected
        ? `Voided at line ${at} of ${lines}, then re-rung further down the receipt — the shape of a correction.`
        : `Voided at line ${at} of ${lines} and not re-rung on any later line.`,
    );
    if (soldFor > 0) {
      points.push(
        `${formatCurrency2(Math.abs(row.amount))} of a ${formatCurrency2(soldFor)} sale — ${Math.round((Math.abs(row.amount) / soldFor) * 100)}% of the basket.`,
      );
    }
  }

  points.push(
    inWindow
      ? `Inside the ${finding?.windowLabel} window this case flagged${onHotLane ? `, on lane ${row.lane}, which carries most of their exceptions` : ""}.`
      : `Outside the window this case flagged${onHotLane ? `, though on lane ${row.lane}, which carries most of their exceptions` : ""}.`,
  );

  if (isVoid(row.saleType) && row.item) {
    points.push(
      repeats
        ? `${row.item} was voided on ${others.length} other receipt${others.length > 1 ? "s" : ""} this period, ${others.length > 1 ? "all" : "also"} by this operator.`
        : `${row.item} was not voided on any other receipt this period.`,
    );
  }

  return { tone, label: LABEL[tone], points };
};
