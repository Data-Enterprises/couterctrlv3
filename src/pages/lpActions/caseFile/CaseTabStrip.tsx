import { useAppDispatch, useAppSelector } from "../../../hooks";
import { setLpCaseStep } from "../../../features/lpActionsSlice";
import type { LpCaseStep } from "../../../features/lpActionsSlice";

/**
 * The two halves of a case, as tabs.
 *
 * Overview answers whether this person is worth an investigation; Evidence is
 * the investigation. Tabs rather than a footer button because they are two
 * views of one case, not two steps of a wizard — someone reading the evidence
 * should be able to glance back at the shape without feeling they have gone
 * backwards, and a tab strip says that where a "next" button does not.
 *
 * It also buys back the row of panel height the footer was spending to hold a
 * single button.
 */
const TABS: { key: LpCaseStep; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "evidence", label: "Evidence" },
];

const CaseTabStrip = () => {
  const dispatch = useAppDispatch();
  const caseStep = useAppSelector((s) => s.lpActions.caseStep);

  return (
    <div
      role="tablist"
      aria-label="Case sections"
      className="flex items-center border-b border-gray-100 px-3 flex-shrink-0"
    >
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          role="tab"
          aria-selected={caseStep === key}
          onClick={() => dispatch(setLpCaseStep(key))}
          className={`px-3 py-2 text-[12px] font-medium border-b-2 transition-colors ${
            caseStep === key
              ? "border-[#1e2a4a] text-content"
              : "border-transparent text-content/85 hover:text-content"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};

export default CaseTabStrip;
