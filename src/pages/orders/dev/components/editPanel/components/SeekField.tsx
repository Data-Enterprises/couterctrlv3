

interface SeekFieldProps {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

/** A labelled text box in the Orders edit panel for finding a line, with a placeholder hint. */
const SeekField = ({ id, label, value, placeholder, onChange }: SeekFieldProps) => (
  <label htmlFor={id} className="flex items-center gap-1.5">
    <span className="text-[10px] font-bold uppercase tracking-wide text-content">
      {label}
    </span>
    <input
      id={id}
      type="text"
      autoComplete="off"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-[150px] rounded-md border border-brand_line_2 bg-bkg px-2 py-0.5 font-mono text-[11px] text-content placeholder:text-brand_placeholder focus:bg-custom-white focus:border-filter_active_border"
      style={{ outline: "none" }}
    />
  </label>
);

export default SeekField;
