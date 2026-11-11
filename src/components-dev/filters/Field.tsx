interface FieldProps {
  label: string;
  children: React.ReactNode;
}

/** A labelled field in the order setup panel. */
const Field = ({ label, children }: FieldProps) => (
  <div>
    <span className="block text-[10px] cc-caps mb-1">
      {label}
    </span>
    {children}
  </div>
);

export default Field;
