// Utils
import { CAUSE_LABEL, CAUSE_OWNER, CAUSE_TONE } from "../utils/deptInvestigation";
import { CAUSE_ORDER } from "../utils";

// Interfaces
import type { Cause, CauseTotal } from "../interfaces";

// Components
import Bar from "./Bar";

interface CauseChipsProps {
  /** Every item in the department, before any filter. */
  total: number;
  only: Cause | null;
  onOnly: (c: Cause | null) => void;
  allIn: boolean;
  byCause: Map<Cause, CauseTotal>;
  suggested: Cause[];
  fmt: (v: number) => string;
}

/** The cause piles, as chips that narrow the grid to one of them. */
const CauseChips = ({ total, only, onOnly, allIn, byCause, suggested, fmt }: CauseChipsProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <button
      onClick={() => onOnly(null)}
      className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
        only === null
          ? "bg-filter_active border-filter_active_border text-content ring-2 ring-filter_active_border shadow-card-sm"
          : "bg-custom-white border-brand_line text-content hover:bg-fill_soft"
      }`}
    >
      All {total} items
    </button>
    {!allIn &&
      [120, 148, 132].map((w) => (
        <span key={w} className="py-1">
          <Bar w={`${w}px`} h={22} />
        </span>
      ))}
    {allIn &&
      CAUSE_ORDER.filter((c) => byCause.has(c)).map((c) => {
        const t = byCause.get(c);
        return (
          <button
            key={c}
            onClick={() => onOnly(only === c ? null : c)}
            title={
              suggested.includes(c)
                ? `${CAUSE_OWNER[c]} — where this department's shape points`
                : CAUSE_OWNER[c]
            }
            className={`text-[12px] font-semibold px-2.5 py-1 rounded-full border transition-shadow ${
              CAUSE_TONE[c].chip
            } ${
              suggested.includes(c)
                ? "border-dashed border-content/40"
                : "border-transparent"
            } ${only === c ? `ring-2 shadow-card-sm ${CAUSE_TONE[c].ring}` : ""}`}
          >
            {CAUSE_LABEL[c]}
            <span className="ml-1.5 font-normal tabular-nums">
              {t?.items} · {fmt(Math.abs(t?.dollars ?? 0))}
            </span>
          </button>
        );
      })}
  </div>
);

export default CauseChips;
