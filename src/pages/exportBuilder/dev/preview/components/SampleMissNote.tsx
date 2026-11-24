interface SampleMissNoteProps {
  kind: "lines" | "summary";
  /** What the source's first list counts (vendors, departments), for the lines file. */
  noun?: string;
}

/** Under the table when no sample line survives the filters: the file can
 *  still hold plenty, since the sample is two hundred lines. */
const SampleMissNote = ({ kind, noun }: SampleMissNoteProps) => (
  <div className="px-4 py-3 border-t border-brand_line bg-custom-white text-[12px] text-content/95 flex-shrink-0">
    {kind === "lines"
      ? `None of the sample lines match what you have kept. The file can still hold plenty: the sample is two hundred lines taken where the scan landed, often a handful of stores and a couple of ${noun}.`
      : "None of the sample lines survive the filters, so there is nothing to group here. The file can still hold plenty: the sample is two hundred lines taken where the scan landed."}
  </div>
);

export default SampleMissNote;
