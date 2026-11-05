// Interfaces
import type { SevFilter } from "../utils/index";

interface SeverityChipsProps {
  value: SevFilter;
  onChange: (f: SevFilter) => void;
  counts: { critical: number; watch: number; healthy: number };
}

// One chip per grade; clicking the active chip goes back to "all".
const CHIPS = [
  {
    sev: "critical",
    label: "Crit",
    cls: "bg-severity_critical_bg text-severity_critical_text",
    ring: "ring-severity_critical_text/40",
  },
  {
    sev: "watch",
    label: "Watch",
    cls: "bg-severity_watch_bg text-severity_watch_text",
    ring: "ring-severity_watch_text/40",
  },
  {
    sev: "healthy",
    label: "OK",
    cls: "bg-severity_healthy_bg text-severity_healthy_text",
    ring: "ring-severity_healthy_text/40",
  },
] as const;

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
