// Interfaces
import type { Verdict } from "../interfaces";

interface CompareVerdictProps {
  verdict: Verdict;
}

/** The answer first, split like the rows below it: the lead centred, A's
 *  half on the left, B's on the right. */
const CompareVerdict = ({ verdict }: CompareVerdictProps) => (
  <div className="rounded-lg bg-fill_muted px-3.5 pt-2.5 pb-3">
    <div className="text-center text-[13.5px] font-semibold text-severity_watch_text">{verdict.lead}</div>
    <div className="grid grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] gap-3.5 mt-1.5 text-[12.5px] leading-snug text-content">
      <span className="text-right">
        {verdict.sides[0].n} <strong className="font-semibold">{verdict.sides[0].says}</strong>
      </span>
      <span className="bg-line_field" />
      <span>
        {verdict.sides[1].n} <strong className="font-semibold">{verdict.sides[1].says}</strong>
      </span>
    </div>
  </div>
);

export default CompareVerdict;
