import { formatCurrency2 } from "../../../utils";
import { contributes, spreadNote } from "./contributionModel";
import type { Contribution, ContributionView } from "./contributionModel";

/**
 * One type's share of the gap, in a sentence.
 *
 * Written once and read in two places — the hover card over the contribution
 * bars, and the summary strip's popover. Two copies would have drifted the
 * first time anyone tuned the wording, and this is the sentence a manager
 * repeats to the person they are about to talk to.
 *
 * Generated, never authored. It has to stay true for a type carrying two
 * thirds of the gap, one carrying a twentieth, and one sitting below its own
 * baseline and offsetting the rest — a hand-written line is only true for the
 * case it was written about.
 */
interface Props {
  row: Contribution;
  view: ContributionView;
  cashierName: string;
  /** Appends the call to action. Only the leading contributor gets it; on
   *  every row it would be four threads to pull first. */
  lead?: boolean;
}

const ContributionSentence = ({ row, view, cashierName, lead }: Props) => {
  const { card } = row;

  if (!contributes(row)) {
    return (
      <>
        <b className="font-semibold">{row.saleType}</b> is at or below their own
        baseline of{" "}
        <b className="font-semibold">{card.baseline.toFixed(1)}</b>, so it is
        offsetting the gap rather than adding to it.
      </>
    );
  }

  const spread = spreadNote(card);

  return (
    <>
      <b className="font-semibold">{row.saleType}</b> accounts for{" "}
      <b className="font-semibold">{Math.round(row.share * 100)}%</b> of the{" "}
      <b className="font-semibold">{view.totalExcess.toFixed(1)}</b> excess
      events. {cashierName} ran{" "}
      <b className="font-semibold">{card.count}</b> against a baseline of{" "}
      <b className="font-semibold">{card.baseline.toFixed(1)}</b>
      {spread && <> &mdash; {spread}</>}
      {card.total !== 0 && <>, averaging {formatCurrency2(card.average)}</>}.
      {lead && <> That is the thread to pull first.</>}
    </>
  );
};

export default ContributionSentence;
