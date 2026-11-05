// Interfaces
import type { Vitals as VitalsShape } from "../utils/investigationSteps";

/** The department against itself: a standing difference, or something that
 *  broke in the last seven days. Values above the bars, because the labels
 *  below already anchor them and a figure under a bar reads as its caption
 *  rather than as its height. */
const Weeks = ({
  vitals,
  cash,
}: {
  vitals: VitalsShape;
  cash: (v: number) => string;
}) => {
  const tallest = Math.max(1, ...vitals.weeks.map((w) => Math.abs(w.gap)));
  return (
    <div className="grid grid-cols-3 gap-3">
      {vitals.weeks.map((w) => (
        <div key={w.label} className="flex flex-col">
          <div
            className={`text-[12.5px] font-bold tabular-nums text-center whitespace-nowrap ${
              w.gap >= 0
                ? "text-delta_positive_text"
                : "text-delta_negative_text"
            }`}
          >
            {w.gap >= 0 ? "+" : "−"}
            {cash(Math.abs(w.gap))}
          </div>
          <div className="h-[56px] flex items-end justify-center mt-1">
            <span
              className={`block w-full rounded-t-sm ${
                w.gap >= 0 ? "bg-emerald-500" : "bg-red-500"
              }`}
              style={{
                height: `${Math.max(3, (Math.abs(w.gap) / tallest) * 56)}px`,
              }}
            />
          </div>
          <div className="h-px bg-brand_navy/15" />
          <div className="text-[12px] font-semibold uppercase tracking-wide text-content/85 text-center whitespace-nowrap mt-1">
            {w.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Weeks;
