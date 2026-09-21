export type HeatStyle = { bg: string; color: string };

const HEAT: HeatStyle[] = [
  { bg: "transparent", color: "#9ca3af" },
  { bg: "#e6f1fb", color: "#185fa5" },
  { bg: "#b5d4f4", color: "#0c447c" },
  { bg: "#85b7eb", color: "#0c447c" },
  { bg: "#378add", color: "#fff" },
  { bg: "#185fa5", color: "#fff" },
];

// Shared magnitude-to-color ramp — any module coloring a value against a max
// (day-of-week heat grids today, potentially other magnitude visualizations
// later) should reuse this rather than defining its own scale.
export function heatStyle(value: number, max: number): HeatStyle {
  if (max === 0 || value === 0) return HEAT[0];
  const r = value / max;
  if (r < 0.15) return HEAT[1];
  if (r < 0.35) return HEAT[2];
  if (r < 0.55) return HEAT[3];
  if (r < 0.75) return HEAT[4];
  return HEAT[5];
}
