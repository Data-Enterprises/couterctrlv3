import { VALUE_TEXT, multipleLabel } from "../roster/rosterTheme";
import type { CaseHeadline as Headline } from "./caseFileModel";

/**
 * The answer, before any of the figures behind it.
 *
 * The sentence is generated, never authored — it has to stay true for an
 * operator who went up, one who went down, and one with no history at all, and
 * a hand-written line only stays true for the case it was written about.
 *
 * It is also careful about what it claims. With no baseline to divide by it
 * says so rather than inventing a multiple, and when nothing moved it says
 * that plainly instead of reaching for a driver that isn't there. An LP screen
 * that cries wolf gets ignored, and this is the loudest line on the page.
 */
interface Props {
  headline: Headline;
}

const list = (names: string[]) =>
  names.length === 1 ? names[0] : `${names[0]} and ${names[1]}`;

const CaseHeadline = ({ headline }: Props) => {
  const { cashierName, latest, baseline, multiple, severity, drivers } =
    headline;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100">
      <span
        className={`flex-shrink-0 text-[30px] font-semibold leading-none tracking-tight ${VALUE_TEXT[severity]}`}
      >
        {multipleLabel(multiple, severity)}
      </span>

      <p className="text-[12px] leading-relaxed text-content max-w-[64ch]">
        {multiple === null ? (
          <>
            {cashierName} booked <b className="font-semibold">{latest}</b>{" "}
            exceptions this week. There are no earlier weeks to compare against,
            so this is a first reading rather than a change.
          </>
        ) : (
          <>
            {cashierName} is running exceptions at{" "}
            <b className="font-semibold">
              {multiple.toFixed(1)}× their own {}
              baseline
            </b>{" "}
            — <b className="font-semibold">{latest} this week</b> where their
            normal is <b className="font-semibold">{baseline.toFixed(0)}</b>.
            {drivers.length > 0 && (
              <>
                {" "}
                The gap is <b className="font-semibold">{list(drivers)}</b>.
              </>
            )}
          </>
        )}
      </p>
    </div>
  );
};

export default CaseHeadline;
