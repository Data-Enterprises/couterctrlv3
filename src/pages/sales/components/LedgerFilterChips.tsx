export type FilterMode = "all" | "attention" | "above";

interface LedgerFilterChipsProps {
  filter: FilterMode;
  totalCount: number;
  attentionCount: number;
  onChange: (f: FilterMode) => void;
}

const chips: { key: FilterMode; label: (total: number, attn: number) => string }[] = [
  { key: "all", label: (total) => `All stores (${total})` },
  { key: "attention", label: (_, attn) => `Needs attention (${attn})` },
  { key: "above", label: () => "Above LY" },
];

const LedgerFilterChips = ({
  filter,
  totalCount,
  attentionCount,
  onChange,
}: LedgerFilterChipsProps) => {
  return (
    <div className="flex gap-2 mb-3">
      {chips.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
            filter === key
              ? "bg-[#3b82f6] text-white border-[#3b82f6]"
              : "bg-custom-white text-content border-gray-200 hover:border-[#3b82f6]"
          }`}
        >
          {label(totalCount, attentionCount)}
        </button>
      ))}
    </div>
  );
};

export default LedgerFilterChips;
