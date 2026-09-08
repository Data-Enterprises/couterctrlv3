import { colourFor, MUTED_OPACITY } from "./chartTheme";
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
 * Carries its own legend, which it did not need while the tab strip sat above
 * it wearing the same swatches. The strip is gone — the type table below
 * chooses now — so without this the two charts are four unlabelled series.
 * Drawn from the same `colourFor` the charts and the table call, so a swatch
 * here, a line there and a row underneath are visibly one thing.
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
    <div className="px-4 pt-2.5 pb-3">
      {/* Names, not values — the totals are in the table below. */}
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 mb-2">
        {names.map((n) => (
          <span key={n} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-sm flex-shrink-0"
              style={{
                background: colourFor(names, n),
                opacity: n === selected ? 1 : MUTED_OPACITY,
              }}
            />
            <span
              className={`text-[12px] ${
                n === selected
                  ? "font-semibold text-content"
                  : "text-content/85"
              }`}
            >
              {n}
            </span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-x-5">
        <div>
          <Heading text={`Movement — ${windows.length} weeks`} />
          <WeekLinesChart types={types} windows={windows} selected={selected} />
        </div>
        <div>
          <Heading text="Movement — by hour, latest week" />
          {profile ? (
            <HourStackChart
              profile={profile}
              types={names}
              selected={selected}
            />
          ) : (
            <div className="h-[120px] flex items-center justify-center text-center text-[12px] text-content/85 px-2">
              {profileLoading
                ? "Reading the receipts…"
                : (profileError ?? "No hour data on these receipts")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseEvidence;
