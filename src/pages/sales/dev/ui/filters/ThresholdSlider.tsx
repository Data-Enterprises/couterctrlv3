import { useEffect, useState, startTransition } from "react";

interface ThresholdSliderProps {
  value: number | null;
  onChange: (v: number) => void;
  fallback?: number;
  min?: number;
  max?: number;
  variant?: "light" | "dark";
  className?: string;
  ariaLabel?: string;
}

// Drag-to-set companion for ThresholdFilter. The handle runs off local state so
// dragging repaints immediately and only this component re-renders; the real
// write is wrapped in startTransition so React can interrupt and discard the
// expensive downstream re-grades as newer drag values arrive, instead of
// running every intermediate value to completion.
//
// Percent is technically 0-100, but grading past ~30 stops separating anything
// — the bounds cover the span that actually changes the result. The paired
// numeric input still accepts values outside it.
const ThresholdSlider = ({
  value,
  onChange,
  fallback = 9,
  min = 1,
  max = 30,
  variant = "light",
  className = "",
  ariaLabel = "Grading threshold, percent",
}: ThresholdSliderProps) => {
  const resolved = value ?? fallback;
  const [local, setLocal] = useState(resolved);

  // Keeps the handle in step when the value changes from elsewhere — typing in
  // the numeric input, or a reset.
  useEffect(() => {
    if (value != null) setLocal(value);
  }, [value]);

  const clamped = Math.min(Math.max(local, min), max);
  const trackPct = ((clamped - min) / (max - min)) * 100;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={1}
      value={clamped}
      onChange={(e) => {
        const next = Number(e.target.value);
        setLocal(next);
        startTransition(() => onChange(next));
      }}
      aria-label={ariaLabel}
      className={`threshold-range ${variant === "light" ? "threshold-range-light" : ""} ${className}`}
      style={{ ["--track-pct" as string]: `${trackPct}%` }}
    />
  );
};

export default ThresholdSlider;
