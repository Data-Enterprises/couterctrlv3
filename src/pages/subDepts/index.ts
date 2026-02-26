export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};
