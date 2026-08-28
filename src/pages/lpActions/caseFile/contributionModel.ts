import type { CaseCard, CaseFile } from "./caseFileModel";

/**
 * Where the multiple comes from.
 *
 * A headline of 1.8× says something is wrong; it does not say what to open
 * first. This decomposes it: each type's EXCESS over its own baseline, and
 * that excess as a share of the operator's total excess. Two types can both
 * read "above baseline" while one accounts for two thirds of the gap and the
 * other for a tenth, and only the share tells them apart.
 *
 * Excess is signed and the total keeps the negatives. A type that came in
 * BELOW its baseline genuinely offsets part of the gap, and dropping it would
 * make the remaining shares add up to more than the thing they are shares of.
 *
 * Nothing here is graded. The volume floor still governs whether a type gets a
 * multiple at all — but a type too thin to grade can still be carrying the
 * arithmetic, and hiding its contribution because it is unrated would leave
 * the shares not summing.
 */

export interface Contribution {
  saleType: string;
  /** `count - baseline`. Signed. */
  excess: number;
  /** Excess over the operator's total excess. Signed, and can exceed 1 when
   *  another type is offsetting. */
  share: number;
  card: CaseCard;
}

export interface ContributionView {
  /** `latest - baseline` across every type. */
  totalExcess: number;
  rows: Contribution[];
  /** The biggest positive contributor, when there is one worth naming. */
  lead: Contribution | null;
}

/** Below this a share is rounding, not a finding — naming a type that accounts
 *  for 4% of the gap sends someone after the wrong thread. */
const LEAD_MIN_SHARE = 0.25;

export const buildContribution = (file: CaseFile): ContributionView => {
  const totalExcess = file.headline.latest - file.headline.baseline;

  const rows: Contribution[] = file.cards
    .filter((c) => c.count > 0 || c.baseline > 0)
    .map((card) => {
      const excess = card.count - card.baseline;
      return {
        saleType: card.saleType,
        excess,
        // Guarded: with no gap at all there is nothing to take a share of,
        // and every row would divide to Infinity.
        share: totalExcess === 0 ? 0 : excess / totalExcess,
        card,
      };
    })
    .sort((a, b) => b.excess - a.excess);

  const first = rows[0];
  const lead =
    first && totalExcess > 0 && first.excess > 0 && first.share >= LEAD_MIN_SHARE
      ? first
      : null;

  return { totalExcess, rows, lead };
};

/**
 * Whether a row is worth a sentence at all.
 *
 * A type sitting on or below its baseline is not contributing to anything, and
 * a paragraph explaining that it accounts for 3% of the gap is a sentence
 * nobody needed. Those rows still draw and still hover; they just say the
 * short version.
 */
export const contributes = (row: Contribution) => row.excess > 0;

/**
 * The observation about how the lead type is spread across receipts.
 *
 * Two shapes worth calling out and nothing in between: every occurrence on its
 * own receipt is a rate, and several on one receipt is an incident. Anything
 * between those reads as ordinary and gets no sentence, because a clause that
 * fires on every case stops being read.
 */
export const spreadNote = (card: CaseCard): string | null => {
  if (card.count < 2 || card.receipts === 0) return null;
  if (card.receipts === card.count) return "every one on its own receipt";
  const per = card.count / card.receipts;
  if (per >= 3)
    return `all ${card.count} across just ${card.receipts} ${
      card.receipts === 1 ? "receipt" : "receipts"
    }`;
  return null;
};
