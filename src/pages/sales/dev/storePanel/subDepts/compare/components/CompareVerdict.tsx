// Utils
import { MIRROR_COLS } from "../utils";

// Interfaces
import type { Verdict } from "../interfaces";

interface CompareVerdictProps {
  verdict: Verdict;
}

/** The answer first, as one mirrored row: A's half, the lead in the centre,
 *  B's half. */
const CompareVerdict = ({ verdict }: CompareVerdictProps) => (
  <div className={`${MIRROR_COLS} py-2.5 border-b border-line_field text-[13px] leading-snug text-content`}>
    <span className="text-right pr-3">
      <strong className="font-semibold">{verdict.sides[0].n}</strong> {verdict.sides[0].says}
    </span>
    <span className="text-center text-[12.5px] font-semibold text-severity_watch_text">{verdict.lead}</span>
    <span className="pl-3">
      <strong className="font-semibold">{verdict.sides[1].n}</strong> {verdict.sides[1].says}
    </span>
  </div>
);

export default CompareVerdict;
