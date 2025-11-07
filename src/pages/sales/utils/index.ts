export const barColors = [
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
