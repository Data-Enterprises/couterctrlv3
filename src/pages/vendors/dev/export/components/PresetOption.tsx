interface PresetOptionProps {
  label: string;
  description: string;
  disabled: boolean;
  checked: boolean;
  onToggle: () => void;
}

/** One preset dataset: a checkbox, its name and what it holds. */
const PresetOption = ({ label, description, disabled, checked, onToggle }: PresetOptionProps) => {
  return (
    <label
      className={`flex items-start gap-3 group ${disabled ? "opacity-40" : "cursor-pointer"}`}
    >
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
      />
      <div>
        <p className="text-[13px] cc-row-title">
          {label}
        </p>
        <p className="text-[11px] text-content mt-0.5">{description}</p>
      </div>
    </label>
  );
};

export default PresetOption;
