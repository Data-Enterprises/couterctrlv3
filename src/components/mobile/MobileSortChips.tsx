/**
 * The sort row above a mobile Performance list.
 *
 * Neutral on purpose: sorting says nothing about good or bad, so it takes the
 * navy "All" treatment from SevChips rather than any severity colour. Shared so
 * every mobile Performance page sorts with the same control.
 */

export interface SortOption<K extends string> {
  key: K;
  label: string;
}

interface Props<K extends string> {
  options: SortOption<K>[];
  value: K;
  onChange: (key: K) => void;
}

const MobileSortChips = <K extends string>({
  options,
  value,
  onChange,
}: Props<K>) => (
  // `pl-3.5` plus a trailing spacer, not `px-3.5`: a flex scroll container
  // drops its right padding at the end of its scroll range — see SevChips.
  <div
    role="radiogroup"
    aria-label="Sort by"
    className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 py-2 pl-3.5"
  >
    <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-content/85">
      Sort by
    </span>
    {options.map((o) => (
      <button
        key={o.key}
        type="button"
        role="radio"
        aria-checked={value === o.key}
        onClick={() => onChange(o.key)}
        className={`flex-shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
          value === o.key
            ? "border-[#1e2a4a] bg-[#1e2a4a] text-custom-white"
            : "border-gray-200 bg-custom-white text-content/85"
        }`}
      >
        {o.label}
      </button>
    ))}
    <span aria-hidden className="w-1.5 flex-shrink-0" />
  </div>
);

export default MobileSortChips;
