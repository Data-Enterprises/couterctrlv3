/**
 * The sort row above a mobile Performance list.
 *
 * Neutral on purpose: sorting says nothing about good or bad, so it takes the
 * navy "All" treatment from SevChips rather than any severity colour. Shared so
 * every mobile Performance page sorts with the same control.
 *
 * The active chip can carry a direction arrow. It is optional so the pages that
 * sort one way only are unchanged, and it shows the direction the list is
 * actually in rather than a fixed glyph — "biggest first" and "worst first" are
 * both a column's natural opening, and they point opposite ways.
 */

export interface SortOption<K extends string> {
  key: K;
  label: string;
}

interface Props<K extends string> {
  options: SortOption<K>[];
  /** null when no sort is applied and the list is in its natural order. */
  value: K | null;
  /** Which way the active chip's column is pointing. Omitted for lists that
   *  only sort one way. */
  dir?: "asc" | "desc" | null;
  onChange: (key: K) => void;
  /**
   * A visible caption in front of the chips.
   *
   * Sorting rows don't take one. "Sort by" in front of Sales / Profit / GPM
   * said nothing the chips weren't already saying, and it cost the row the
   * width of two characters per chip on the narrowest screens. A row reused
   * for something that isn't sorting — the location picker — still needs
   * naming, which is what this is for.
   */
  label?: string;
}

const MobileSortChips = <K extends string>({
  options,
  value,
  dir,
  onChange,
  label,
}: Props<K>) => (
  // `pl-3.5` plus a trailing spacer, not `px-3.5`: a flex scroll container
  // drops its right padding at the end of its scroll range — see SevChips.
  <div
    role="radiogroup"
    // Named for a screen reader whether or not it is named on screen.
    aria-label={label ?? "Sort by"}
    className="flex items-center gap-2 overflow-x-auto border-b border-gray-100 py-2 pl-3.5"
  >
    {label && (
      <span className="flex-shrink-0 font-mono text-[10px] uppercase tracking-wider text-content/85">
        {label}
      </span>
    )}
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
        {value === o.key && dir && (
          <span aria-hidden className="ml-1">
            {dir === "asc" ? "\u2191" : "\u2193"}
          </span>
        )}
      </button>
    ))}
    <span aria-hidden className="w-1.5 flex-shrink-0" />
  </div>
);

export default MobileSortChips;
