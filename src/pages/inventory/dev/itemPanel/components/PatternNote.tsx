// Components
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid";

interface PatternNoteProps {
  pattern: { concerning: boolean; title: string; detail: string };
}

/** One verdict on how the item sold, not a stack — the checks are ordered so
 *  the most specific explanation wins. */
const PatternNote = ({ pattern }: PatternNoteProps) => (
  <div className="px-4 pt-3 flex-shrink-0">
    <div
      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg ${
        pattern.concerning ? "bg-severity_watch_bg" : "bg-fill_soft"
      }`}
    >
      {pattern.concerning ? (
        <ExclamationTriangleIcon className="w-4 h-4 text-severity_watch_text flex-shrink-0" />
      ) : (
        <InformationCircleIcon className="w-4 h-4 text-content/95 flex-shrink-0" />
      )}
      <span
        className={`text-[12.5px] truncate ${pattern.concerning ? "text-severity_watch_text" : "text-content"}`}
      >
        <span className="font-medium">{pattern.title}</span> — {pattern.detail}
      </span>
    </div>
  </div>
);

export default PatternNote;
