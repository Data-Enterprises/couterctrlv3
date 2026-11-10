// Hooks
import { useEffect, useRef, useState } from "react";

// Utils
import { chipClass } from "../utils/index";

// Components
import ThresholdFilter from "../../../../components-dev/filters/ThresholdFilter";
import ThresholdSlider from "../../../../components-dev/filters/ThresholdSlider";

interface ThresholdChipProps {
  /** The grading threshold in percent; null while the box is cleared. */
  value: number | null;
  onChange: (v: number | null) => void;
  ariaLabel: string;
}

/** The "Thresh" chip: opens a slider and a number box, and closes on any
 *  click outside them. */
const ThresholdChip = ({ value, onChange, ariaLabel }: ThresholdChipProps) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target as Node) &&
        popRef.current &&
        !popRef.current.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors border ${chipClass(open)}`}
      >
        Thresh
      </button>
      {open && (
        <div
          ref={popRef}
          className="absolute top-full left-0 mt-1 p-1.5 rounded-md border border-gray-200 bg-custom-white shadow-lg z-20"
        >
          <div className="flex items-center gap-2">
            <ThresholdSlider
              value={value}
              onChange={onChange}
              ariaLabel={ariaLabel}
              className="w-[92px] flex-shrink-0"
            />
            <ThresholdFilter
              value={value === null ? null : { op: "gt", amount: value }}
              onChange={(v) => onChange(v?.amount ?? null)}
              showOp={false}
              suffix="%"
              inputWidth={40}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ThresholdChip;
