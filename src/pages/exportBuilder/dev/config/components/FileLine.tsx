interface FileLineProps {
  aggregating: boolean;
  keyCount: number;
  measureCount: number;
  selectedCount: number;
  columnCount: number;
}

/**
 * What the file is, read off the configuration rather than switched: group
 * keys or measures make a summary, their absence the lines. Asking for a rollup
 * is already asking for a rollup.
 */
const FileLine = ({
  aggregating,
  keyCount,
  measureCount,
  selectedCount,
  columnCount,
}: FileLineProps) => (
  <div className="px-2.5 pb-2 flex-shrink-0">
    <div className="flex items-baseline gap-2 rounded-lg border border-brand_line_2 bg-card_bg px-2.5 py-1.5">
      <span className="text-[11px] cc-caps">File</span>
      <span className="text-[12px] font-semibold flex-1">
        {aggregating ? "Summary" : "Every line"}
      </span>
      <span className="text-[11px] text-content/95">
        {aggregating
          ? `${keyCount} key${keyCount === 1 ? "" : "s"} · ${measureCount} measure${measureCount === 1 ? "" : "s"}`
          : `${selectedCount} of ${columnCount} columns`}
      </span>
    </div>
  </div>
);

export default FileLine;
