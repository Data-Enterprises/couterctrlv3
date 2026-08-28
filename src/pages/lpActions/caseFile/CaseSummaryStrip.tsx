import CtaStrip from "../CtaStrip";
import { multipleLabel } from "../roster/rosterTheme";
import ContributionSentence from "./ContributionSentence";
import type { CaseHeadline } from "./caseFileModel";
import type { ContributionView } from "./contributionModel";

/**
 * The verdict on the operator, in one line, with the sentence behind it.
 *
 * This used to be a thirty-pixel number and a paragraph sitting permanently
 * above the cards. It said the right thing, but it said it at the size of a
 * headline every time anyone opened a case — and the cards underneath were
 * already carrying the same claim in a form you can act on.
 *
 * So it becomes the strip: the answer on the page, the argument one click
 * away. The sentence is still generated rather than authored, and it still
 * refuses to invent a multiple it cannot compute or name a driver that is not
 * there — an LP screen that cries wolf gets ignored, and this is the first
 * thing anyone reads.
 *
 * It also carries the leading contributor's sentence — which type is actually
 * driving the multiple, and by how much. The grid states every type's figures
 * and the chart beside it draws their shares; this is the one place that says
 * which thread to pull.
 */
interface Props {
  headline: CaseHeadline;
  /** The decomposition of the multiple. Its leading row's sentence reads here
   *  as well as on hover, because this popover is where the page keeps the
   *  reasoning behind its own headline. */
  view: ContributionView;
}

const LABEL = {
  investigate: "Investigate",
  watch: "Worth a look",
  steady: "On trend",
} as const;

const list = (names: string[]) =>
  names.length === 1 ? names[0] : `${names[0]} and ${names[1]}`;

const CaseSummaryStrip = ({ headline, view }: Props) => {
  const { cashierName, latest, baseline, multiple, severity, drivers } =
    headline;

  return (
    <CtaStrip
      tone={severity}
      label={LABEL[severity]}
      trailing={
        <>
          {multiple !== null && (
            <span>{multipleLabel(multiple, severity)} their baseline</span>
          )}
          {/* The two words that answer "at what". The sentence stays behind
              Why; this is the part people ask for first, and it costs no
              vertical space to put it on the bar. */}
          {drivers.length > 0 && (
            <span className="font-normal">
              {" "}
              &middot; driven by {list(drivers)}
            </span>
          )}
        </>
      }
    >
      <p className="text-[12.5px] leading-relaxed">
        {multiple === null ? (
          <>
            {cashierName} booked <b className="font-semibold">{latest}</b>{" "}
            exceptions this week. There are no earlier weeks to compare
            against, so this is a first reading rather than a change.
          </>
        ) : (
          <>
            {cashierName} is running exceptions at{" "}
            <b className="font-semibold">
              {multiple.toFixed(1)}× their own baseline
            </b>{" "}
            — <b className="font-semibold">{latest} this week</b> where their
            normal is <b className="font-semibold">{baseline.toFixed(0)}</b>.
            {drivers.length > 0 && (
              <>
                {" "}
                The gap is <b className="font-semibold">{list(drivers)}</b>.
              </>
            )}
          </>
        )}
      </p>

      {view.lead && (
        <p className="text-[12.5px] leading-relaxed mt-1.5">
          <ContributionSentence
            row={view.lead}
            view={view}
            cashierName={headline.cashierName}
            lead
          />
        </p>
      )}

    </CtaStrip>
  );
};

export default CaseSummaryStrip;
