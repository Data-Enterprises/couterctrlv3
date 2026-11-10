/** A labelled field in the order setup panel. */
const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div>
    <span className="block text-[10px] font-semibold uppercase tracking-wide text-content/95 mb-1">
      {label}
    </span>
    {children}
  </div>
);

export default Field;
