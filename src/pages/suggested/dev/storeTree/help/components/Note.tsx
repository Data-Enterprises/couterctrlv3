// Interfaces
import type { ReactNode } from "react";

interface NoteProps {
  warn?: boolean;
  children: ReactNode;
}

/** A side note in the help, amber when it warns. */
const Note = ({ warn, children }: NoteProps) => (
  <div
    className={`border-l-4 px-4 py-3 rounded-r text-[14px] leading-[1.65] ${
      warn
        ? "border-severity_watch_text bg-severity_watch_bg text-severity_watch_text"
        : "border-brand_navy/30 bg-fill_soft text-content"
    }`}
  >
    {children}
  </div>
);

export default Note;
