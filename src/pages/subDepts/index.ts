export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};

export const calculateCogs = (
  netCost: number,
  caseSize: number,
  qty: number,
) => {
  if (qty === 0 || caseSize === 0 || netCost === 0) return 0;

  const unitCost = (netCost / caseSize).toString();
  return parseFloat(unitCost) * qty;

  // When using calculated cost, cost fees, qty
  // if (qty === 0) return 0;

  // if (costFees) {
  //   const feePct = costFees / 100;
  //   const feeAmount = parseFloat((calculatedCost * feePct).toString());
  //   return (calculatedCost + feeAmount) * qty;
  // }

  // // no cost fees
  // return calculatedCost * qty;
};
