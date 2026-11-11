// Interfaces
import type { Vitals as VitalsShape } from "../utils/investigationSteps";

interface IndexProps {
  vitals: VitalsShape;
  them: string;
  cash: (v: number) => string;
}

/** Sales, units and margin on ONE rule, the counterpart at 100, so measures
 *  that disagree are seen to disagree. */
const Index = ({ vitals, them, cash }: IndexProps) => {
  // Three bars pinned at zero say nothing, in the one case where the reason
  // they are at zero IS the finding.
  if (vitals.index.every((m) => m.mine === 0)) {
    return (
      <p className="text-[13px] leading-relaxed text-content/95">
        This store rang none of it at all, so there is nothing to put on the
        rule. {them} took{" "}
        <span className="font-semibold text-delta_negative_text">
          {cash(vitals.index[0].theirs)}
        </span>
        .
      </p>
    );
  }
  // Two thirds along, so a department running well OVER still has room.
  const RULE = 66.666;
  return (
    <div className="flex flex-col gap-2.5">
      {vitals.index.map((m) => {
        const over = (m.pct ?? 0) >= 100;
        return (
          <div key={m.label} className="flex items-center gap-2.5">
            <span className="w-[52px] flex-shrink-0 text-[12px] cc-caps">
              {m.label}
            </span>
            <span className="relative flex-1 min-w-0 h-[10.5px] rounded-sm bg-bkg">
              <span
                className={`absolute left-0 top-0 h-[10.5px] rounded-sm ${
                  over ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(100, ((m.pct ?? 0) / 150) * 100)}%`,
                }}
              />
              <span
                className="absolute -top-1 w-px h-[18px] bg-brand_navy/40"
                style={{ left: `${RULE}%` }}
              />
            </span>
            <span
              className={`w-[46px] flex-shrink-0 text-right text-[12.5px] font-bold tabular-nums ${
                over ? "text-delta_positive_text" : "text-delta_negative_text"
              }`}
            >
              {m.pct === null ? "—" : `${Math.round(m.pct)}%`}
            </span>
          </div>
        );
      })}
      <p className="text-[12px] text-content/95 leading-snug">
        The rule is {them} at 100.
      </p>
    </div>
  );
};

export default Index;
