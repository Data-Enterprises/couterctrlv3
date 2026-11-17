interface PreviewEmptyProps {
  /** No columns ticked for the lines file, or nothing to group for a summary. */
  kind: "lines" | "summary";
}

/** What the preview says before there is anything to show. */
const PreviewEmpty = ({ kind }: PreviewEmptyProps) => (
  <div className="flex-1 flex items-center justify-center text-center px-6">
    <div className={kind === "lines" ? "max-w-[34ch]" : "max-w-[36ch]"}>
      <div className="text-[13px] font-semibold">
        {kind === "lines" ? "No columns selected" : "Nothing to group yet"}
      </div>
      <div className="text-[12.5px] text-content/95 mt-1.5">
        {kind === "lines"
          ? "Tick a column on the left and it appears here, in the order the file will be written."
          : "Pick what the rows should be on the left, then what to measure for each one."}
      </div>
    </div>
  </div>
);

export default PreviewEmpty;
