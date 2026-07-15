import type { SevFilter } from "../../../../features/salesLedgerSlice";

interface SevChipsProps {
  active: SevFilter;
  counts: Record<SevFilter, number>;
  onChange: (f: SevFilter) => void;
}

const CHIP_CLASS: Record<SevFilter, { active: string; inactive: string }> = {
  all:     { active: "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]",       inactive: "bg-custom-white text-content/85 border-gray-200" },
  critical:{ active: "bg-red-600 text-custom-white border-red-600",            inactive: "bg-custom-white text-red-700 border-red-200" },
  watch:   { active: "bg-amber-500 text-custom-white border-amber-500",        inactive: "bg-custom-white text-amber-800 border-amber-200" },
  healthy: { active: "bg-emerald-600 text-custom-white border-emerald-600",    inactive: "bg-custom-white text-emerald-800 border-emerald-200" },
};

const LABELS: Record<SevFilter, (counts: Record<SevFilter, number>) => string> = {
  all:      (c) => `All (${c.all})`,
  critical: (c) => `Crit (${c.critical})`,
  watch:    (c) => `Watch (${c.watch})`,
  healthy:  (c) => `OK (${c.healthy})`,
};

const SevChips = ({ active, counts, onChange }: SevChipsProps) => (
  <div className="flex gap-2 px-3 py-2 bg-custom-white border-b border-gray-100 flex-shrink-0 overflow-x-auto">
    {(["all", "critical", "watch", "healthy"] as SevFilter[]).map((f) => (
      <button
        key={f}
        onClick={() => onChange(f)}
        className={`flex-shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
          active === f ? CHIP_CLASS[f].active : CHIP_CLASS[f].inactive
        }`}
      >
        {LABELS[f](counts)}
      </button>
    ))}
  </div>
);

export default SevChips;
