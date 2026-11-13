interface FieldProps {
  label: string;
  children: React.ReactNode;
}

/** A labelled field in the export modal. */
const Field = ({ label, children }: FieldProps) => (
  <div>
    <span className="mb-1 block text-[10px] font-medium text-content/95">
      {label}
    </span>
    {children}
  </div>
);

export default Field;
