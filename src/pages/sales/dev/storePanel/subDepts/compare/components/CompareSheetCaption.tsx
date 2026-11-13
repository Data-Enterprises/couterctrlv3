// Utils
import { SHEET_COLS } from "../utils";

interface CompareSheetCaptionProps {
  title: string;
  /** What each list's two columns hold, e.g. ["Items", "$ vs LW"]. */
  cols: [string, string];
}

/** A section's caption strip: its name, then each list's two column names. */
const CompareSheetCaption = ({ title, cols }: CompareSheetCaptionProps) => (
  <div className={`${SHEET_COLS} mt-3 mb-0.5 h-7 px-2 rounded-md bg-fill_soft`}>
    <span className="cc-caps text-[10px] truncate">{title}</span>
    {[0, 1].map((i) => (
      <span key={i} className="contents">
        <span className="cc-caps text-[10px] text-right">{cols[0]}</span>
        <span className="cc-caps text-[10px] text-right">{cols[1]}</span>
      </span>
    ))}
    <span />
  </div>
);

export default CompareSheetCaption;
