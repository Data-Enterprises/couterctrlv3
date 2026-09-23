export type TotalsSummary = {
  weight: number;
  cost: number;
  tpr: number;
  qty: number;
  eret: number; // active retail * qty if weight is 0, otherwise use weight
  uniqueItems: number; // unique items
};

export const defaultSummary: TotalsSummary = {
  weight: 0,
  cost: 0,
  tpr: 0,
  qty: 0,
  eret: 0,
  uniqueItems: 0,
};

export const colors = [
  "#00CC55",
  "#10b981",
  "#0099AA",
  "#0066FF",
  "#3366FF",
  "#3b82f6",
  "#6688FF",
  "#FFA500",
  "#FF9900",
  "#CC8844",

  "#22C55E",
  "#34D399",
  "#14B8A6",
  "#0EA5E9",
  "#2563EB",
  "#4F46E5",
  "#7C3AED",
  "#F59E0B",
  "#FB923C",
  "#F97316",
];
