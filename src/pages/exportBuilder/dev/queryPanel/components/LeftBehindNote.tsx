interface LeftBehindNoteProps {
  /** What the last Apply could not carry into the configuration. */
  lines: string[];
}

/** After an Apply, what the configuration could not hold, line by line. */
const LeftBehindNote = ({ lines }: LeftBehindNoteProps) => (
  <div className="bg-custom-white border-t border-brand_line px-3 py-2">
    <div className="text-[11.5px] font-semibold text-severity_watch_text">
      Not carried over
    </div>
    {lines.map((line, i) => (
      <div key={i} className="text-[11.5px] text-severity_watch_text">
        · {line}
      </div>
    ))}
  </div>
);

export default LeftBehindNote;
