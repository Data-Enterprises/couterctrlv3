export const setDates = (date: Date, days: number = 0) => {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  // returns yyyy-mm-dd so sub_sales endpoint can process the dates correctly
  return d.toISOString().split("T")[0];
};

export const calculateCogs = (
  netCost: number,
  cost: number,
  caseSize: number,
  qty: number,
  weight: number,
) => {
  if (
    weight === 0 ||
    cost === 0 ||
    netCost === 0 ||
    caseSize === 0 ||
    qty === 0 ||
    weight === 0 ||
    caseSize === 0
  ) {
    return 0;
  }

  const baseCost = netCost > 0 ? netCost : cost;
  const baseLine = weight > 0 ? weight : qty;

  const unitCost = (baseCost / caseSize).toString();
  return parseFloat(unitCost) * baseLine;

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
