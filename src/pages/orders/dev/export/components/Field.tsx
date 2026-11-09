/** A labelled field in the export modal. */
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <span className="mb-1 block text-[10px] font-medium text-content/85">
      {label}
    </span>
    {children}
  </div>
);

export default Field;
