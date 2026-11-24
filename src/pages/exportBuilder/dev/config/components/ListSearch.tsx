interface ListSearchProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  shown: number;
  total: number;
}

/** The narrowing box above a long list, with how many of the list it leaves
 *  showing. Its own file for the same reason as ConfigRow: declared in a render
 *  body, the input lost the focus after a single character. */
const ListSearch = ({
  value,
  onChange,
  label,
  shown,
  total,
}: ListSearchProps) => (
  <div className="flex flex-col gap-1">
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={label}
      aria-label={label}
      className="w-full border border-brand_line rounded-lg px-2.5 py-1.5 text-[12.5px]"
    />
    {value.trim().length > 0 && (
      <span className="text-[11px] text-content/95">
        {shown} of {total} shown · ticking is unaffected by the search
      </span>
    )}
  </div>
);

export default ListSearch;
