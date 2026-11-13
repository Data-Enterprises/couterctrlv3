// Interfaces
import type { Verdict } from "../interfaces";

interface CompareVerdictProps {
  verdict: Verdict;
}

/** The answer first: whether the two lists share a problem, what each one's
 *  is, and the figure behind each. */
const CompareVerdict = ({ verdict }: CompareVerdictProps) => (
  <div className="rounded-lg bg-fill_muted px-4 py-3">
    <p className="text-[14px] leading-snug text-content">
      <span className="font-semibold text-severity_watch_text">{verdict.lead}</span> {verdict.text}
    </p>
    <div className="grid grid-cols-2 gap-3 mt-2 text-[12px] text-content">
      <div>
        <span className="font-bold">A:</span> {verdict.details[0]}
      </div>
      <div>
        <span className="font-bold text-compare_b">B:</span> {verdict.details[1]}
      </div>
    </div>
  </div>
);

export default CompareVerdict;
