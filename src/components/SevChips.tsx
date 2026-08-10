import type { SevFilter } from "../features/salesLedgerSlice";

/** The severity filter row that sits between a mobile navy header and its list.
 *
 *  Shared across every graded mobile page. `SevFilter` still lives in
 *  `salesLedgerSlice` because that's where the type is authored; only the
 *  component moved. */

interface SevChipsProps {
  /** Plain string, not `SevFilter`: a page with an `extra` chip needs to be
   *  able to say "none of these four" while that chip is the active one. The
   *  value is only ever compared with `===` against the four keys below. */
  active: string;
  counts: Record<SevFilter, number>;
  onChange: (f: SevFilter) => void;
  /** An extra trailing chip for a state outside the severity scale — Vendors
   *  and Categories use it for Ungraded, which is neither a pass nor a fail.
   *  Kept as a slot rather than widening `SevFilter`, because that type is
   *  authored in `salesLedgerSlice` and shared with pages that have no such
   *  state. */
  extra?: {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
  };
}

/** Active fills solid; inactive keeps the colour as text and border so the
 *  row still reads as a severity scale when nothing is selected. */
const CHIP_CLASS: Record<SevFilter, { active: string; inactive: string }> = {
  all: {
    active: "bg-[#1e2a4a] text-custom-white border-[#1e2a4a]",
    inactive: "bg-custom-white text-content/85 border-gray-200",
  },
  critical: {
    active: "bg-red-600 text-custom-white border-red-600",
    inactive: "bg-custom-white text-red-700 border-red-200",
  },
  watch: {
    active: "bg-amber-500 text-custom-white border-amber-500",
    inactive: "bg-custom-white text-amber-800 border-amber-200",
  },
  healthy: {
    active: "bg-emerald-600 text-custom-white border-emerald-600",
    inactive: "bg-custom-white text-emerald-800 border-emerald-200",
  },
};

const LABELS: Record<SevFilter, (counts: Record<SevFilter, number>) => string> =
  {
    all: (c) => `All (${c.all})`,
    critical: (c) => `Crit (${c.critical})`,
    watch: (c) => `Watch (${c.watch})`,
    healthy: (c) => `OK (${c.healthy})`,
  };

const SevChips = ({ active, counts, onChange, extra }: SevChipsProps) => (
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
    {extra && extra.count > 0 && (
      <button
        onClick={extra.onClick}
        className={`flex-shrink-0 text-[11px] font-medium px-3 py-1 rounded-full border transition-colors ${
          extra.active
            ? "bg-gray-500 text-custom-white border-gray-500"
            : "bg-custom-white text-content/85 border-gray-200"
        }`}
      >
        {extra.label} ({extra.count})
      </button>
    )}
  </div>
);

export default SevChips;
