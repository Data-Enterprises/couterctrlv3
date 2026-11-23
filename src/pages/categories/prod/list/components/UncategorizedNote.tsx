interface UncategorizedNoteProps {
  /** The uncategorized buckets' total, already formatted. */
  value: string;
  count: number;
}

/** Under the filters: what sits in buckets with no category at the POS. */
const UncategorizedNote = ({ value, count }: UncategorizedNoteProps) => (
  <div className="px-4 py-1.5 bg-custom-white border-x border-b border-line_hair text-[11px] text-content/95 flex-shrink-0">
    <span className="font-medium text-content">{value}</span> across {count}{" "}
    uncategorized {count === 1 ? "bucket" : "buckets"} — items with no category
    at the POS.
  </div>
);

export default UncategorizedNote;
