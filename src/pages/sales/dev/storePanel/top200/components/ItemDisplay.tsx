// Interfaces
import type { DisplayVerdict } from "../utils/topItems";

interface ItemDisplayProps {
  display: DisplayVerdict;
}

/** Whether it is worth a display: the verdict and the checks behind it. */
const ItemDisplay = ({ display }: ItemDisplayProps) => (
  <div className="px-4 py-2.5">
    <div
      className={`text-[14px] font-bold leading-snug ${
        display.worth
          ? "text-severity_healthy_text"
          : "text-severity_critical_text"
      }`}
    >
      {display.says}
    </div>
    <div className="mt-1.5">
      {display.checks.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-2.5 py-1.5 border-b border-line_hair last:border-b-0 text-[13.5px]"
        >
          <span
            className={`w-[18px] h-[18px] rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold ${
              c.state === "pass"
                ? "bg-severity_healthy_bg text-severity_healthy_text"
                : c.state === "fail"
                  ? "bg-severity_critical_bg text-severity_critical_text"
                  : "bg-fill_muted text-content/95"
            }`}
            aria-hidden="true"
          >
            {c.state === "pass"
              ? "\u2713"
              : c.state === "fail"
                ? "\u2715"
                : "?"}
          </span>
          <span className="min-w-0 flex-1 truncate text-content">
            {c.label}
          </span>
          <span className="flex-shrink-0 font-semibold text-content tabular-nums">
            {c.detail}
          </span>
        </div>
      ))}
    </div>
    <p className="text-[13px] text-content/95 mt-1.5 leading-snug">
      Nothing here says what is on display today &mdash; that one
      needs a look in the store.
    </p>
  </div>
);

export default ItemDisplay;
