interface SevChipProps {
  kind: "critical" | "watch" | "healthy";
  count: number;
  active: boolean;
  onToggle: () => void;
}

/** A severity filter chip with its count; its colour and label follow from
 *  `kind`. */
const SevChip = ({ kind, count, active, onToggle }: SevChipProps) => (
  <button
    onClick={onToggle}
    className={`text-[12px] font-semibold px-2 py-1 rounded-full transition-shadow ${
      kind === "critical"
        ? "bg-severity_critical_bg text-severity_critical_text"
        : kind === "watch"
          ? "bg-severity_watch_bg text-severity_watch_text"
          : "bg-severity_healthy_bg text-severity_healthy_text"
    } ${
      active
        ? kind === "critical"
          ? "ring-2 ring-severity_critical_text/40 shadow-sm"
          : kind === "watch"
            ? "ring-2 ring-severity_watch_text/40 shadow-sm"
            : "ring-2 ring-severity_healthy_text/40 shadow-sm"
        : ""
    }`}
  >
    {kind === "critical" ? "Crit" : kind === "watch" ? "Watch" : "OK"} ({count})
  </button>
);

export default SevChip;
