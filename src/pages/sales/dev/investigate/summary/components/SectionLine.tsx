interface SectionLineProps {
  /** What the section is: "67% of the gap", or a cause's name. */
  label: string;
  count: number;
  amount: string;
  /** Red for a shortfall, green for a lead, grey for a list nobody is handed. */
  tone: "behind" | "ahead" | "quiet";
  open: boolean;
  onToggle: () => void;
}

/** The line that starts a section of a list: what it is, how many items and
 *  what they come to. Clicking it folds the section. */
const SectionLine = ({ label, count, amount, tone, open, onToggle }: SectionLineProps) => {
  const rule =
    tone === "behind" ? "bg-red-500/50" : tone === "ahead" ? "bg-emerald-500/50" : "bg-ungraded/60";
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="w-full flex items-center gap-2 pt-2 pb-1.5"
    >
      <span className={`h-px flex-1 ${rule}`} />
      <span
        className={`flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wide whitespace-nowrap ${
          tone === "behind"
            ? "text-delta_negative_text"
            : tone === "ahead"
              ? "text-delta_positive_text"
              : "text-content"
        }`}
      >
        <span className="text-[10px]">{open ? "▾" : "▸"}</span>
        <span>{label}</span>
        <span className="font-semibold normal-case tracking-normal tabular-nums">
          | {count.toLocaleString("en-US")} {count === 1 ? "item" : "items"} | {amount}
        </span>
      </span>
      <span className={`h-px flex-1 ${rule}`} />
    </button>
  );
};

export default SectionLine;
