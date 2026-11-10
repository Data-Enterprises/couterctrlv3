// Interfaces
import type { HeatStyle } from "../interfaces";

const HEAT: HeatStyle[] = [
  { bg: "transparent", color: "rgb(var(--color-brand-slate-2))" },
  { bg: "#e6f1fb", color: "#185fa5" },
  { bg: "#b5d4f4", color: "#0c447c" },
  { bg: "#85b7eb", color: "#0c447c" },
  { bg: "#378add", color: "rgb(var(--color-custom-white))" },
  { bg: "#185fa5", color: "rgb(var(--color-custom-white))" },
];

// The shared magnitude-to-colour ramp: reuse it for any value coloured
// against a max.
export function heatStyle(value: number, max: number): HeatStyle {
  if (max === 0 || value === 0) return HEAT[0];
  const r = value / max;
  if (r < 0.15) return HEAT[1];
  if (r < 0.35) return HEAT[2];
  if (r < 0.55) return HEAT[3];
  if (r < 0.75) return HEAT[4];
  return HEAT[5];
}
