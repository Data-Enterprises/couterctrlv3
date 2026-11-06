

const Head = ({
  label,
  width,
  align,
  editable,
}: {
  label: string;
  width: number;
  align?: "right";
  editable?: boolean;
}) => (
  <th
    className={`px-2.5 py-2 text-[9px] font-sans font-semibold uppercase tracking-wide whitespace-nowrap border-r border-brand_line ${
      align === "right" ? "text-right" : "text-left"
    } ${
      editable
        ? "bg-severity_watch_bg text-severity_watch_text"
        : "text-content"
    }`}
    style={{ width }}
  >
    {label}
    {editable && <span className="ml-1 font-normal">✎</span>}
  </th>
);

export default Head;
