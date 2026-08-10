/**
 * Amt / Qty — what the store, section and product lists sort by.
 *
 * Lives in the navy header's `actions` slot on both the store list and the
 * overview, which is why it isn't inlined in either. Height matches the 22px
 * `HeaderIconButton` beside it so row two doesn't grow around it.
 */
interface Props {
  value: "amount" | "qty";
  onChange: (v: "amount" | "qty") => void;
}

const CpnSortToggle = ({ value, onChange }: Props) => (
  <div className="flex h-[22px] border border-custom-white/20 rounded overflow-hidden flex-shrink-0">
    {(["amount", "qty"] as const).map((m) => (
      <button
        key={m}
        onClick={() => onChange(m)}
        title={m === "amount" ? "Sort by amount" : "Sort by count"}
        className={`px-2 text-[10px] font-medium transition-colors ${
          value === m
            ? "bg-custom-white/20 text-custom-white"
            : "text-custom-white/75 hover:text-custom-white"
        }`}
      >
        {m === "amount" ? "Amt" : "Qty"}
      </button>
    ))}
  </div>
);

export default CpnSortToggle;
