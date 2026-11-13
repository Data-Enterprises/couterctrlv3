// Utils
import { SHEET_COLS } from "../utils";

// Interfaces
import type { Bucket, StandRow } from "../interfaces";

// Components
import CompareBucketRow from "./CompareBucketRow";
import CompareSheetCaption from "./CompareSheetCaption";

interface CompareStandTableProps {
  rows: StandRow[];
  /** Each list's items that sold this week or last, and their net change. */
  net: [{ count: number; text: string; down: boolean }, { count: number; text: string; down: boolean }];
  /** How many of each list's items land in each row, for the closing line. */
  sums: [{ sold: number; ly: number }, { sold: number; ly: number }];
  names: [string, string];
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** The buckets: the four that sold this week or last, their net against last
 *  week, then the items that sold only last year. A closing line shows every
 *  item lands in one row. */
const CompareStandTable = ({ rows, net, sums, names, open, onOpen }: CompareStandTableProps) => {
  const recent = rows.filter((r) => r.bucket !== "lyOnly");
  const lyOnly = rows.filter((r) => r.bucket === "lyOnly");
  return (
    <section>
      <CompareSheetCaption title="Change vs last week" cols={["Items", "$ vs LW"]} />
      {recent.map((r) => (
        <CompareBucketRow key={r.bucket} row={r} open={open} onOpen={onOpen} />
      ))}
      <div className={`${SHEET_COLS} h-9 px-2 border-t border-line_field text-[12.5px] font-bold text-content tabular-nums`}>
        <span>Net vs last week</span>
        {net.map((n, i) => (
          <span key={i} className="contents">
            <span className="text-right">{n.count}</span>
            <span className={`text-right whitespace-nowrap ${n.down ? "text-delta_negative_text" : "text-delta_positive_text"}`}>
              {n.text}
            </span>
          </span>
        ))}
        <span />
      </div>

      <CompareSheetCaption title="Not sold this week" cols={["Items", "LY sales"]} />
      {lyOnly.map((r) => (
        <CompareBucketRow key={r.bucket} row={r} open={open} onOpen={onOpen} />
      ))}
      <p className="mt-2 px-2 text-[11.5px] text-content">
        Every item lands in one row: {sums[0].sold} + {sums[0].ly} = {sums[0].sold + sums[0].ly} {names[0]},{" "}
        {sums[1].sold} + {sums[1].ly} = {sums[1].sold + sums[1].ly} {names[1]}.
      </p>
    </section>
  );
};

export default CompareStandTable;
