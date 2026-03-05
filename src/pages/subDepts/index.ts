export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};

export const calculateCogs = (
  calculatedCost: number,
  costFees: number,
  qty: number,
) => {
  if (qty === 0) return 0;

  if (costFees) {
    const feePct = costFees / 100;
    const feeAmount = parseFloat((calculatedCost * feePct).toString());
    return (calculatedCost + feeAmount) * qty;
  }

  // no cost fees
  return calculatedCost * qty;
};
