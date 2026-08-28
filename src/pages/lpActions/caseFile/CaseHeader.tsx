import type { CaseHeadline } from "./caseFileModel";

/**
 * Who the case is about, and where in it you are.
 *
 * The app's one-row right-panel header, and nothing else. No back control:
 * the roster it came from never went away, so "back" would point at something
 * already on screen, and moving between the two halves is the tab strip's job.
 */
interface Props {
  headline: CaseHeadline;
  /** Formatted period, e.g. "Aug 1 – Aug 13". */
  period: string;
}

const CaseHeader = ({ headline, period }: Props) => {
  // A store case already has the store's name as its title, so repeating it
  // here would be the same words twice on two lines. It gets its operator
  // count instead, which is the thing that distinguishes one person having a
  // week from the whole site having one.
  const meta = [
    headline.badge === null
      ? `${headline.cashiers} ${headline.cashiers === 1 ? "cashier" : "cashiers"}`
      : headline.storeName,
    period,
    `${headline.daysWorked} ${headline.daysWorked === 1 ? "shift" : "shifts"}`,
    headline.lanes.length > 0 && `Lanes ${headline.lanes.join(", ")}`,
  ].filter(Boolean);

  return (
    <div className="flex items-start justify-between gap-3 px-4 py-3 bg-[#1e2a4a] flex-shrink-0">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-custom-white text-[13px] font-semibold leading-tight">
          <span className="truncate">{headline.title}</span>
          {headline.badge && (
            <span className="flex-shrink-0 rounded border border-custom-white/30 px-1.5 text-[12px] font-medium tracking-wide">
              {headline.badge}
            </span>
          )}
        </p>
        <p className="text-custom-white/85 text-[12px] mt-0.5 truncate">
          {meta.join(" · ")}
        </p>
      </div>
    </div>
  );
};

export default CaseHeader;
