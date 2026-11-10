interface PickerFieldProps {
  label: string;
  children: React.ReactNode;
}

/** A labelled field in the order picker. */
const PickerField = ({ label, children }: PickerFieldProps) => (
  <div>
    <span className="block text-[10px] font-semibold uppercase tracking-wide text-content/95 mb-1">
      {label}
    </span>
    {children}
  </div>
);

export default PickerField;
