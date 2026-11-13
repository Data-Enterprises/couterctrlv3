interface ExampleProps {
  head: string;
  rows: { k: string; v: string; out?: boolean }[];
}

/** A worked example: label on the left, figure on the right, one row emphasised
 *  as the answer. */
const Example = ({ head, rows }: ExampleProps) => (
  <div className="border border-line_field rounded-lg overflow-hidden bg-custom-white">
    <div className="px-3.5 py-2.5 border-b border-line_field bg-fill_soft text-[12px] font-bold uppercase tracking-[0.08em] text-brand_navy">
      {head}
    </div>
    {rows.map((r) => (
      <div
        key={r.k}
        className={`grid grid-cols-[1fr_auto] gap-4 px-3.5 py-2.5 border-b border-line_hair last:border-b-0 text-[14px] ${
          r.out ? "bg-fill_muted" : ""
        }`}
      >
        <span className={r.out ? "font-bold text-content" : "text-content"}>
          {r.k}
        </span>
        <span
          className={`tabular-nums ${r.out ? "font-bold text-brand_navy text-[15px]" : "font-medium text-content"}`}
        >
          {r.v}
        </span>
      </div>
    ))}
  </div>
);

export default Example;
