// Hooks
import type { ReactNode } from "react";

// Components
import { ChevronRightIcon } from "@heroicons/react/20/solid";

interface ConfigRowProps {
  label: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  /** This section is the one standing between here and a file. */
  warn?: boolean;
}

/** One fold-open row of the configuration: its name and its answer, opening
 *  to the question itself. Declared in its own file so it is never a new
 *  component type per render (that took the focus out of the search boxes). */
const ConfigRow = ({
  label,
  summary,
  isOpen,
  onToggle,
  children,
  warn = false,
}: ConfigRowProps) => (
  <div
    className={`rounded-lg overflow-hidden flex flex-col flex-shrink-0 border ${
      warn
        ? "bg-severity_watch_bg border-severity_watch_text/20"
        : "bg-card_bg border-brand_line"
    }`}
  >
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="w-full flex items-center gap-2 px-3 py-2.5 text-left flex-shrink-0"
    >
      <ChevronRightIcon
        className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-150 ${
          warn ? "text-severity_watch_text" : "text-content/95"
        } ${isOpen ? "rotate-90" : ""}`}
      />
      <span
        className={`text-[13px] font-semibold flex-1 ${
          warn ? "text-severity_watch_text" : ""
        }`}
      >
        {label}
      </span>
      <span
        className={`text-[12px] ${
          warn ? "text-severity_watch_text font-semibold" : "text-content/95"
        }`}
      >
        {summary}
      </span>
    </button>
    {isOpen && children}
  </div>
);

export default ConfigRow;
