// Hooks
import { useEffect, useRef, useState } from "react";

// Utils
import { chipClass, type Severity } from "../../../../../utils/severity";
import { SEV_CHIP, SEV_CHIP_ON } from "../../utils";

// Components
import ThresholdSlider from "../../../../../components/filters/ThresholdSlider";
import ThresholdFilter from "../../../../../components/filters/ThresholdFilter";

interface HourChipsProps {
  counts: Record<Severity, number>;
  sevFilter: Severity | "all";
  onSevFilter: (sev: Severity) => void;
  threshold: number | null;
  onThreshold: (value: number | null) => void;
}

/** Over the hours: the grade chips with their counts, and the threshold in a
 *  pop-over that closes on an outside click. */
const HourChips = ({
  counts,
  sevFilter,
  onSevFilter,
  threshold,
  onThreshold,
}: HourChipsProps) => {
  const [threshOpen, setThreshOpen] = useState<boolean>(false);
  const threshRef = useRef<HTMLDivElement>(null);

  // Close the threshold popover on an outside click, same as Sales' hourly view.
  useEffect(() => {
    if (!threshOpen) return;
    const onDown = (e: MouseEvent) => {
      if (threshRef.current && !threshRef.current.contains(e.target as Node)) {
        setThreshOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [threshOpen]);

  const sevChip = (sev: Severity, label: string) => (
    <button
      onClick={() => onSevFilter(sev)}
      className={`text-[10px] font-semibold px-2 py-1 rounded-full transition-shadow ${SEV_CHIP[sev]} ${
        sevFilter === sev ? SEV_CHIP_ON[sev] : ""
      }`}
    >
      {label} ({counts[sev]})
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-line_hair bg-fill_muted flex-shrink-0">
      {sevChip("critical", "Crit")}
      {sevChip("watch", "Watch")}
      {sevChip("healthy", "OK")}
      <div className="relative" ref={threshRef}>
        <button
          onClick={() => setThreshOpen((v) => !v)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(threshOpen)}`}
        >
          Thresh
        </button>
        {threshOpen && (
          <div className="cc-dropdown left-0 p-1.5 z-20">
            <div className="flex items-center gap-2">
              <ThresholdSlider
                value={threshold}
                onChange={onThreshold}
                ariaLabel="Category grading threshold, percent"
                className="w-[92px] flex-shrink-0"
              />
              <ThresholdFilter
                value={
                  threshold === null ? null : { op: "lt", amount: threshold }
                }
                onChange={(v) => onThreshold(v?.amount ?? null)}
                showOp={false}
                suffix="%"
                inputWidth={40}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HourChips;
