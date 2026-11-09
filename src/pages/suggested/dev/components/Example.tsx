/** A worked example: label on the left, figure on the right, one row emphasised
 *  as the answer. */
const Example = ({
  head,
  rows,
}: {
  head: string;
  rows: { k: string; v: string; out?: boolean }[];
}) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden bg-custom-white">
    <div className="px-3.5 py-2.5 border-b border-gray-200 bg-gray-50 text-[12px] font-bold uppercase tracking-[0.08em] text-brand_navy">
      {head}
    </div>
    {rows.map((r) => (
      <div
        key={r.k}
        className={`grid grid-cols-[1fr_auto] gap-4 px-3.5 py-2.5 border-b border-gray-100 last:border-b-0 text-[14px] ${
          r.out ? "bg-gray-100" : ""
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
