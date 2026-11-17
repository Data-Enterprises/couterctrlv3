interface SubExclNoteProps {
  /** Only assigned stores are listed, worth saying to someone who sees all. */
  canSeeAllStores: boolean;
  rowCount: number;
  excludedCount: number;
}

/** What an exclusion does, and how many departments are listed and excluded. */
const SubExclNote = ({
  canSeeAllStores,
  rowCount,
  excludedCount,
}: SubExclNoteProps) => (
  <p className="text-[11.5px] text-content/95 mb-2 leading-snug flex-shrink-0">
    An excluded department still appears in every sub-department list — it just
    stops counting towards net sales on the Performance pages.
    {canSeeAllStores && " Only the stores assigned to you are listed."}
    {rowCount > 0 && (
      <span className="font-semibold text-content">
        {" "}
        {rowCount} department{rowCount === 1 ? "" : "s"} · {excludedCount}{" "}
        excluded
      </span>
    )}
  </p>
);

export default SubExclNote;
