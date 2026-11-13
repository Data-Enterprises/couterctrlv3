// Interfaces
import type { GradedSev } from "../../interfaces";

// Components
import SevChips from "./SevChips";

interface GradedOptionProps {
  title: string;
  description: string;
  disabled: boolean;
  checked: boolean;
  onToggle: () => void;
  sevs: Set<GradedSev>;
  onSev: (sev: GradedSev) => void;
  /** Ruled off from the dataset above it. */
  divided?: boolean;
}

/** A graded dataset: its checkbox, what it holds, and the severities it
 *  keeps. The three graded presets are this one component. */
const GradedOption = ({ title, description, disabled, checked, onToggle, sevs, onSev, divided = false }: GradedOptionProps) => {
  return (
    <div
      className={`flex items-start gap-3 ${divided ? "pt-3 border-t border-line_hair " : ""}${disabled ? "opacity-40" : ""}`}
    >
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
      />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-content">{title}</p>
        <p className="text-[11px] text-content mt-0.5 mb-1.5">{description}</p>
        <SevChips
          value={sevs}
          onToggle={onSev}
          disabled={disabled}
          hint={checked && sevs.size === 0}
        />
      </div>
    </div>
  );
};

export default GradedOption;
