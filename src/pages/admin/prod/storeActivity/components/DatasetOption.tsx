interface DatasetOptionProps {
  title: string;
  /** What it holds, in a line. */
  detail: string;
  checked: boolean;
  /** Nothing to export in it, so it cannot be ticked. */
  disabled?: boolean;
  onToggle: () => void;
}

/** One dataset to tick in the Export CSV pop-up, with what it holds. */
const DatasetOption = ({
  title,
  detail,
  checked,
  disabled = false,
  onToggle,
}: DatasetOptionProps) => (
  <label
    className={`flex items-start gap-3 ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"} group`}
  >
    <input
      type="checkbox"
      checked={checked}
      disabled={disabled}
      onChange={onToggle}
      className="mt-0.5 cc-checkbox border-line_strong cursor-pointer flex-shrink-0"
    />
    <div>
      <p className="text-[13px] cc-row-title">{title}</p>
      <p className="text-[12px] text-content mt-0.5">{detail}</p>
    </div>
  </label>
);

export default DatasetOption;
