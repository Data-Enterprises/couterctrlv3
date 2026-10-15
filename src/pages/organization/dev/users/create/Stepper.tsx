import { CheckIcon } from "@heroicons/react/20/solid";
import {
  STEP_ORDER,
  STEP_TITLE,
  type WizardStep,
} from "./wizardSteps";

/**
 * The wizard's left rail.
 *
 * A completed step is clickable and an upcoming one is not: going back to
 * change an answer is normal, and skipping ahead past a step that gates the
 * next one is not. The rail is the only way back, so it stays visible on
 * every step rather than being replaced by a Back button alone.
 */
const Stepper = ({
  current,
  furthest,
  onGoTo,
}: {
  current: WizardStep;
  /** The furthest step reached, so a visited step stays reachable after
   *  stepping back from it. */
  furthest: WizardStep;
  onGoTo: (step: WizardStep) => void;
}) => {
  const index = (s: WizardStep) => STEP_ORDER.indexOf(s);
  const currentAt = index(current);
  const furthestAt = index(furthest);

  return (
    <div className="flex flex-col gap-0.5">
      {STEP_ORDER.map((step, i) => {
        const done = i < currentAt;
        const isCurrent = step === current;
        const reachable = i <= furthestAt;
        return (
          <button
            key={step}
            onClick={() => reachable && onGoTo(step)}
            disabled={!reachable}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
              isCurrent
                ? "bg-custom-white shadow-card-sm"
                : reachable
                  ? "hover:bg-custom-white/60"
                  : "cursor-default"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 border ${
                done || isCurrent
                  ? "bg-brand_navy border-brand_navy text-custom-white"
                  : "bg-custom-white border-brand_line_2 text-content/85"
              }`}
            >
              {done ? <CheckIcon className="w-3 h-3" /> : i + 1}
            </span>
            <span
              className={`text-[12px] whitespace-nowrap ${
                isCurrent
                  ? "font-semibold text-content"
                  : reachable
                    ? "font-medium text-content"
                    : "font-medium text-content/85"
              }`}
            >
              {STEP_TITLE[step]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default Stepper;
