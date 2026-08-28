import CtaStrip from "../../CtaStrip";
import type { Verdict } from "./verdictModel";

/**
 * Whether this receipt supports the case.
 *
 * The shell is the shared `CtaStrip` — the same control the operator's own
 * verdict uses one panel up, which is the point: two conclusions of the same
 * kind should not be two different objects on screen.
 *
 * Its tone comes from the verdict rather than being fixed red. The strip has
 * to be able to clear a receipt as readily as damn one, and the green
 * "Nothing unusual" is the half of this job that saves LP a trip.
 */
interface Props {
  verdict: Verdict;
}

const VerdictStrip = ({ verdict }: Props) => (
  <CtaStrip tone={verdict.tone} label={verdict.label}>
    <ul className="flex flex-col gap-1.5">
      {verdict.points.map((p) => (
        <li key={p} className="text-[12.5px] leading-relaxed pl-3 relative">
          <span className="absolute left-0 font-bold opacity-85">·</span>
          {p}
        </li>
      ))}
    </ul>
  </CtaStrip>
);

export default VerdictStrip;
