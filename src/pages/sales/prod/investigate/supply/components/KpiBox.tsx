interface KpiBoxProps {
  /** "Ordered" or "Received". */
  title: string;
  /** Three figures and what each counts. */
  figures: { value: string; label: string }[];
  /** Tinted for what was ordered, outlined for what arrived. */
  outlined: boolean;
  /** The store this box belongs to. */
  mine: boolean;
}

/** One store's ordered or received figures, three to a box: the Supply tab's
 *  side-by-side card, so the two stores' boxes can sit level with each other. */
const KpiBox = ({ title, figures, outlined, mine }: KpiBoxProps) => (
  <div
    className={`flex flex-col gap-1 rounded-md px-2.5 pt-2 pb-2 border ${
      outlined
        ? mine
          ? "border-store_open"
          : "border-store_compare"
        : mine
          ? "border-transparent bg-store_open/[0.08]"
          : "border-transparent bg-store_compare/10"
    }`}
  >
    <span className="cc-caps text-[10.5px] text-brand_slate">{title}</span>
    <div className="grid grid-cols-3 gap-1">
      {figures.map((f) => (
        <span key={f.label} className="flex flex-col min-w-0">
          <span className="text-[17px] font-bold leading-tight tabular-nums text-content truncate">
            {f.value}
          </span>
          <span className="text-[11px] text-brand_slate">{f.label}</span>
        </span>
      ))}
    </div>
  </div>
);

export default KpiBox;
