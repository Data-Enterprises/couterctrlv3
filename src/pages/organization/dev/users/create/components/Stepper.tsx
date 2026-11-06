// Utils
import { STEP_ORDER, STEP_TITLE } from "../utils";

// Interfaces
import type { WizardStep } from "../interfaces";

// Components
import { CheckIcon } from "@heroicons/react/20/solid";

/**
 * The four steps, across the top. A finished step is clickable, an unreached
 * one is not; `limit` stops skipping past a step emptied since it was reached.
 */
const Stepper = ({
  current,
  furthest,
  limit = STEP_ORDER.length - 1,
  onGoTo,
}: {
  current: WizardStep;
  /** The furthest step reached, so a visited step stays reachable after
   *  stepping back from it. */
  furthest: WizardStep;
  /** The last step that may be jumped to: the first one not ready. */
  limit?: number;
  onGoTo: (step: WizardStep) => void;
}) => {
  const currentAt = STEP_ORDER.indexOf(current);
  const furthestAt = Math.min(STEP_ORDER.indexOf(furthest), limit);

  return (
    <ol className="flex flex-wrap items-center gap-3 bg-custom-white rounded-lg shadow-card px-5 py-3 list-none m-0">
      {STEP_ORDER.map((step, i) => {
        const done = i < currentAt;
        const isCurrent = step === current;
        const reachable = i <= furthestAt;
        return (
          <li
            key={step}
            className="flex items-center gap-2.5 flex-1 min-w-[150px]"
          >
            <button
              onClick={() => reachable && onGoTo(step)}
              disabled={!reachable}
              aria-current={isCurrent ? "step" : undefined}
              className={`flex items-center gap-2.5 ${
                reachable && !isCurrent ? "hover:opacity-85" : "cursor-default"
              }`}
            >
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12.5px] font-bold flex-shrink-0 border-2 ${
                  done || isCurrent
                    ? "bg-brand_navy border-brand_navy text-custom-white"
                    : "bg-custom-white border-brand_line_2 text-content/85"
                }`}
              >
                {done ? <CheckIcon className="w-4 h-4" /> : i + 1}
              </span>
              <span
                className={`text-[12.5px] whitespace-nowrap ${
                  isCurrent
                    ? "font-bold text-content"
                    : done
                      ? "font-semibold text-content"
                      : "font-medium text-content/85"
                }`}
              >
                {STEP_TITLE[step]}
              </span>
            </button>
            {i < STEP_ORDER.length - 1 && (
              <span
                aria-hidden="true"
                className={`flex-1 min-w-[16px] h-0.5 rounded-full ${
                  done ? "bg-brand_navy" : "bg-brand_line_2"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default Stepper;
