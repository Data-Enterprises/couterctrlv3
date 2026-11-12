// Utils
import { weeksSay } from "../utils/weeks";

// Interfaces
import type { Vitals as VitalsShape } from "../utils/investigationSteps";

interface WeeksProps {
  vitals: VitalsShape;
  /** The page's metric: dollars, or units on Quantity. */
  fmt: (v: number) => string;
}

/** The department against itself: a standing difference, or something that
 *  broke in the last seven days. The answer is written above the three gaps,
 *  which are drawn as the same bars as the rest of the tab. */
const Weeks = ({ vitals, fmt }: WeeksProps) => {
  const widest = Math.max(1, ...vitals.weeks.map((w) => Math.abs(w.gap)));
  const says = weeksSay(vitals.weeks, fmt);
  /** Newest first: this week, then last week, then last year. */
  const rows = [...vitals.weeks].reverse();
  return (
    <div className="flex flex-col gap-3.5">
      <p className="text-[14px] font-semibold leading-snug text-content">
        <span
          className={
            says.tone === "worse"
              ? "text-delta_negative_text"
              : says.tone === "steady"
                ? "text-content"
                : "text-delta_positive_text"
          }
        >
          {says.lead}
        </span>{" "}
        {says.rest}
      </p>

      <div className="flex flex-col gap-2.5">
        {rows.map((w, i) => (
          <div
            key={w.label}
            className="grid grid-cols-[92px_minmax(0,1fr)_112px] gap-3 items-center"
          >
            <span
              className={`text-[12.5px] text-content ${
                i === 0 ? "font-bold" : ""
              }`}
            >
              {w.label}
            </span>
            <span className="h-[15px] rounded-sm bg-bkg">
              <span
                className={`block h-[15px] rounded-sm ${
                  w.gap >= 0 ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: `${(Math.abs(w.gap) / widest) * 100}%` }}
              />
            </span>
            <span
              className={`text-right text-[13px] font-bold tabular-nums whitespace-nowrap ${
                w.gap >= 0 ? "text-delta_positive_text" : "text-delta_negative_text"
              }`}
            >
              {w.gap >= 0 ? "+" : "−"}
              {fmt(Math.abs(w.gap))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Weeks;
