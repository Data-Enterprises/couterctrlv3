// Utils
import { CHIPS } from "../utils";

// Interfaces
import type { SevFilter } from "../utils/index";

interface SeverityChipsProps {
  value: SevFilter;
  onChange: (f: SevFilter) => void;
  counts: { critical: number; watch: number; healthy: number };
}

const SeverityChips = ({ value, onChange, counts }: SeverityChipsProps) => (
  <>
    {CHIPS.map((c) => (
      <button
        key={c.sev}
        onClick={() => onChange(value === c.sev ? "all" : c.sev)}
        className={`text-[10px] font-semibold px-2 py-1 rounded-full ${c.cls} transition-shadow ${
          value === c.sev ? `ring-2 ${c.ring} shadow-sm` : ""
        }`}
      >
        {c.label} ({counts[c.sev]})
      </button>
    ))}
  </>
);

export default SeverityChips;
