import WeekLinesChart from "./WeekLinesChart";
import HourStackChart from "./HourStackChart";
import type { CaseType } from "./caseModel";
import type { HourProfile } from "./hourProfile";
import type { WeekWindow } from "../lpActionsMetrics";

/**
 * The two shapes the summary is checked against.
 *
 * Called movement rather than evidence because that is what the charts are:
 * the sentences above carry the argument, and these say whether the argument
 * has a shape behind it. Both headings name the same measure and differ only
 * in the axis, which is the point — one week against the weeks before it, one
 * day against the hours in it.
 *
 * No legend of its own. The tab strip sits above carrying the same swatches,
 * so a second one here would be the same labels printed twice within an inch —
 * and the tabs are the better home for it, because clicking the swatch is what
 * emphasises the line.
 */
interface Props {
  types: CaseType[];
  windows: WeekWindow[];
  selected: string;
  profile: HourProfile | null;
  profileLoading: boolean;
  profileError: string | null;
}

const Heading = ({ text }: { text: string }) => (
  <div className="text-[11px] font-semibold uppercase tracking-wide text-content/85 mb-1">
    {text}
  </div>
);

const CaseEvidence = ({
  types,
  windows,
  selected,
  profile,
  profileLoading,
  profileError,
}: Props) => {
  const names = types.map((t) => t.saleType);

  return (
    <div className="px-4 pt-2.5 pb-3 grid grid-cols-2 gap-x-5">
      <div>
        <Heading text={`Movement — ${windows.length} weeks`} />
        <WeekLinesChart types={types} windows={windows} selected={selected} />
      </div>
      <div>
        <Heading text="Movement — by hour, latest week" />
        {profile ? (
          <HourStackChart profile={profile} types={names} selected={selected} />
        ) : (
          <div className="h-[120px] flex items-center justify-center text-center text-[12px] text-content/85 px-2">
            {profileLoading
              ? "Reading the receipts…"
              : (profileError ?? "No hour data on these receipts")}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseEvidence;
