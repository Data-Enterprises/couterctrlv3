// Interfaces
import type { Verdict } from "../interfaces";

interface CompareVerdictProps {
  verdict: Verdict;
  names: [string, string];
}

/** The answer first, in a line: same or different problems, and each list's
 *  in a few words. The figures are the tables' below. */
const CompareVerdict = ({ verdict, names }: CompareVerdictProps) => (
  <p className="rounded-md bg-fill_muted px-3 py-2 text-[12.5px] leading-snug text-content">
    <span className="font-semibold text-severity_watch_text">{verdict.lead}</span>{" "}
    <span className="font-semibold">{names[0]}:</span> {verdict.phrases[0]}
    <span className="px-1">|</span>
    <span className="font-semibold text-compare_b">{names[1]}:</span> {verdict.phrases[1]}
  </p>
);

export default CompareVerdict;
