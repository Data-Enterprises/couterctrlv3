// Interfaces
import type { Bucket, StandRow } from "../interfaces";

// Components
import CompareBucketRow from "./CompareBucketRow";
import CompareSheetCaption from "./CompareSheetCaption";

interface CompareStandTableProps {
  rows: StandRow[];
  /** How many of each list's items land in each row, for the closing line. */
  sums: [{ sold: number; ly: number }, { sold: number; ly: number }];
  names: [string, string];
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** The buckets: the four that sold this week or last, then the items that sold
 *  only last year. A closing line shows every item lands in one row. */
const CompareStandTable = ({ rows, sums, names, open, onOpen }: CompareStandTableProps) => {
  const recent = rows.filter((r) => r.bucket !== "lyOnly");
  const lyOnly = rows.filter((r) => r.bucket === "lyOnly");
  return (
    <section>
      <CompareSheetCaption title="Change vs last week" cols={["Items", "$ vs LW"]} />
      <div>
        {recent.map((r) => (
          <CompareBucketRow key={r.bucket} row={r} open={open} onOpen={onOpen} />
        ))}
      </div>

      <CompareSheetCaption title="Not sold this week" cols={["Items", "LY sales"]} />
      <div>
        {lyOnly.map((r) => (
          <CompareBucketRow key={r.bucket} row={r} open={open} onOpen={onOpen} />
        ))}
      </div>
      <p className="mt-2 px-2 text-[11.5px] text-content">
        Every item lands in one row: {sums[0].sold} + {sums[0].ly} = {sums[0].sold + sums[0].ly} {names[0]},{" "}
        {sums[1].sold} + {sums[1].ly} = {sums[1].sold + sums[1].ly} {names[1]}.
      </p>
    </section>
  );
};

export default CompareStandTable;
