// Interfaces
import type { Bucket, StandRow } from "../interfaces";

// Components
import CompareBucketRow from "./CompareBucketRow";
import CompareSheetCaption from "./CompareSheetCaption";

interface CompareStandTableProps {
  rows: StandRow[];
  open: Bucket;
  onOpen: (b: Bucket) => void;
}

/** The buckets: the four that sold this week or last, then the items that sold
 *  only last year. */
const CompareStandTable = ({ rows, open, onOpen }: CompareStandTableProps) => {
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
    </section>
  );
};

export default CompareStandTable;
