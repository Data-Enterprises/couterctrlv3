import type { WeeklySale, SelectedSalesPanel } from "../../../interfaces";

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
];

export const getDateLayout = (date: string) => {
  const [year, month, day] = date.split("-");
  return `${month}/${day}/${year}`;
};

export const rgbaColor = (hex: string, alpha: number) => {
  // if (!hex) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
};

export const comparePanels = (a: WeeklySale, b: SelectedSalesPanel) => {
  const date = a.sale_date.split("T")[0];
  return (
    date === b.sale_date &&
    a.storeid === b.storeid &&
    b.store_name === a.store_name
  );
};

export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};
