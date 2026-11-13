// Interfaces
import type { ReactNode } from "react";

interface PresetOptionProps {
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  /** Anything the preset shows under its row, such as its own dates. */
  children?: ReactNode;
}

/** One preset in the export modal: a checkbox with its name and description, and any extra controls under it. */
const PresetOption = ({
  label,
  description,
  checked,
  onToggle,
  children,
}: PresetOptionProps) => (
  <div>
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
      />
      <div>
        <p className="text-[13px] cc-row-title">
          {label}
        </p>
        <p className="text-[11px] text-content mt-0.5">{description}</p>
      </div>
    </label>

    {children}
  </div>
);

export default PresetOption;
