import { formatCurrency2 } from "../../../utils";
import type { CaseHeadline } from "./caseFileModel";

/**
 * Four facts about the week, in the app's standard strip.
 *
 * `Days active` carries its own denominator on purpose. "13 days" means
 * nothing without "of 13 worked" — an operator with exceptions on every shift
 * and one with exceptions on two of thirteen are different people, and the
 * numerator alone cannot tell them apart.
 */
interface Props {
  headline: CaseHeadline;
}

const Cell = ({ label, value }: { label: string; value: string }) => (
  <div className="px-4 py-2.5">
    <div className="text-[9px] font-medium uppercase tracking-wide text-content/85">
      {label}
    </div>
    <div className="text-[13px] font-semibold text-content mt-0.5">{value}</div>
  </div>
);

const CaseKpiStrip = ({ headline }: Props) => (
  <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-gray-50 flex-shrink-0">
    <Cell label="Exceptions" value={String(headline.latest)} />
    <Cell
      label="Exception value"
      value={formatCurrency2(headline.exceptionValue)}
    />
    <Cell
      label="Days active"
      value={`${headline.daysActive} / ${headline.daysWorked}`}
    />
    <Cell
      label="Types touched"
      value={`${headline.typesTouched} of ${headline.typesInScope}`}
    />
  </div>
);

export default CaseKpiStrip;
