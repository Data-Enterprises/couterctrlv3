// Utils
import { STEP_COUNT, STEP_NUMBER } from "../utils";

// Interfaces
import type { ForgotStep } from "../interfaces";

interface ProgressBarsProps {
  step: Exclude<ForgotStep, "done">;
}

/** Three short bars and "Step N of 3" above each step's heading. */
const ProgressBars = ({ step }: ProgressBarsProps) => {
  const at = STEP_NUMBER[step];
  return (
    <div className="mb-2">
      <div className="flex gap-[5px] w-[120px] mb-5" aria-hidden="true">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <span
            key={i}
            className={`flex-1 h-[3px] rounded-full ${i < at ? "bg-portal_navy" : "bg-brand_line"}`}
          />
        ))}
      </div>
      <div className="font-mono text-[10px] tracking-[0.1em] uppercase text-brand_slate_2">
        Step {at} of {STEP_COUNT}
      </div>
    </div>
  );
};

export default ProgressBars;
