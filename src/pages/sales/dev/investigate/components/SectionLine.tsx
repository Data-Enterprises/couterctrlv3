interface SectionLineProps {
  /** Of the row's whole difference, 0–1. */
  share: number;
  count: number;
  amount: string;
  /** Red for a row behind, green for one ahead. */
  behind: boolean;
  open: boolean;
  onToggle: () => void;
}

/** The line that starts a section of a row's items: its share of the gap,
 *  how many items and what they come to. Clicking it folds the section. */
const SectionLine = ({ share, count, amount, behind, open, onToggle }: SectionLineProps) => (
  <button
    type="button"
    onClick={onToggle}
    aria-expanded={open}
    className="w-full flex items-center gap-2 pt-2 pb-1.5"
  >
    <span className={`h-px flex-1 ${behind ? "bg-red-500/50" : "bg-emerald-500/50"}`} />
    <span
      className={`flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide whitespace-nowrap ${
        behind ? "text-delta_negative_text" : "text-delta_positive_text"
      }`}
    >
      <span className="text-[10px]">{open ? "▾" : "▸"}</span>
      <span>{Math.round(share * 100)}% of the gap</span>
      <span className="font-semibold normal-case tracking-normal tabular-nums">
        | {count.toLocaleString("en-US")} {count === 1 ? "item" : "items"} | {amount}
      </span>
    </span>
    <span className={`h-px flex-1 ${behind ? "bg-red-500/50" : "bg-emerald-500/50"}`} />
  </button>
);

export default SectionLine;
