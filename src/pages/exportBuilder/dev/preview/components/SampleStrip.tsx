interface SampleStripProps {
  /** How many sample lines the numbers come from. */
  lines: number;
}

/** Over a summary: its numbers are the sample's, not the range's, so a total
 *  on screen is not read as the total in the file. */
const SampleStrip = ({ lines }: SampleStripProps) => (
  <div className="px-4 py-2 bg-severity_watch_bg border-b border-severity_watch_text/20 flex-shrink-0">
    <span className="text-[11.5px] text-severity_watch_text">
      Sample numbers, from {lines} line
      {lines === 1 ? "" : "s"}. The file is built from the whole range.
    </span>
  </div>
);

export default SampleStrip;
