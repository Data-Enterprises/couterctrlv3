// Interfaces
import type { ReactNode } from "react";

interface OptionProps {
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  title: string;
  detail: ReactNode;
}

/** One tickable dataset: a label, and what it holds or why it can't. */
const Option = ({ checked, disabled, onToggle, title, detail }: OptionProps) => (
  <label
    className={`flex items-start gap-3 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} group`}
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onToggle}
      className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0"
    />
    <div>
      <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
        {title}
      </p>
      <p className="text-[12px] text-content mt-0.5">{detail}</p>
    </div>
  </label>
);

export default Option;
