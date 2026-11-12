interface UpcFilterProps {
  value: string;
  onChange: (v: string) => void;
  /** How many codes were pasted, and what they narrowed every list to. */
  codes: number;
  summary: string;
}

/** Paste UPCs and every document list narrows to the documents carrying
 *  them. The grid's and the Summary's right-click menus fill this in, so
 *  nobody retypes a UPC to find out whether it was ever ordered. */
const UpcFilter = ({ value, onChange, codes, summary }: UpcFilterProps) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste UPCs to find the documents carrying them"
        className="flex-1 min-w-0 text-[12.5px] px-2.5 py-1.5 rounded-md border border-brand_line bg-custom-white text-content placeholder:text-brand_placeholder focus:outline-none focus:ring-2 focus:ring-brand_navy/25"
      />
      {codes > 0 && (
        <button
          onClick={() => onChange("")}
          className="flex-shrink-0 text-[12px] font-semibold text-brand_navy_hover hover:underline"
        >
          Clear
        </button>
      )}
    </div>
    {codes > 0 && <p className="text-[12px] text-content/95">{summary}</p>}
  </div>
);

export default UpcFilter;
