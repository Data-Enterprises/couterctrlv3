

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
      className={`flex items-start gap-3 group ${
        disabled ? "opacity-40" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        disabled={disabled}
        checked={checked}
        onChange={onToggle}
        className="mt-0.5 h-3.5 w-3.5 rounded border-gray-300 accent-brand_navy cursor-pointer flex-shrink-0 disabled:cursor-not-allowed"
      />
      <div>
        <p className="text-[13px] font-medium text-content group-hover:text-brand_navy transition-colors">
          {label}
        </p>
        <p className="text-[11px] text-content mt-0.5">{description}</p>
      </div>
    </label>
  );
};

export default PresetOption;
