export const modes = [
  { mode: 1, label: "Sales Comparison" },
  { mode: 2, label: "Sales Forecast" },
  { mode: 3, label: "Price Optimization" },
  { mode: 4, label: "Trend Detection" },
];

export const info = [
  { label: "Sales Comparison", text: "Select max 7 days" },
  {
    label: "Sales Forecast",
    text: "Select min 7 days",
  },
  {
    label: "Price Optimization",
    text: "Store amount may affect load time",
  },
  { label: "Trend Detection", text: "Average 90 periods" },
];

export type Tooltip = {
  0: boolean;
  1: boolean;
  2: boolean;
  3: boolean;
};

export const defaultTooltips: Tooltip = {
  0: false,
  1: false,
  2: false,
  3: false,
};