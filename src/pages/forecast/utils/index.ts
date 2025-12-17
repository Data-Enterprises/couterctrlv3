export const fitLinearDemand = (prices: number[], qtys: number[]) => {
  const n = prices.length;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const sumP = sum(prices);
  const sumQ = sum(qtys);
  const sumPP = sum(prices.map((p) => p * p)); // sum of prices squared
  const sumPQ = sum(prices.map((p, i) => p * qtys[i])); // sum of price * qty

  // Denominator finds the best-fitting line through the points
  const denominator = n * sumPP - sumP * sumP;

  // Slope tells you how much quantity changes when price changes by 1 unit (not necessarily 1 dollar)
  const slope = (n * sumPQ - sumP * sumQ) / denominator;

  // Intercept tells you what quantity the line predicts at price 0
  const intercept = (sumQ - slope * sumP) / n;

  return { slope, intercept };
};

export const predictCtrlQty = (
  price: number,
  params: { slope: number; intercept: number },
  data: { prices: Record<string, number> }
) => {
  // Find the two closest data points

  const prices = Object.keys(data.prices).map(Number);
  prices.push(price);
  prices.sort((a, b) => a - b);

  const idx = prices.indexOf(price);
  let result: number = 0;
  if (idx === 0) {
    // start => 8.99 => demand
    const p1 = prices[1].toString(); // 9.99
    const p2 = prices[2].toString(); // 10.99

    const q1 = data.prices[p1 as keyof typeof data.prices]; // 120
    const q2 = data.prices[p2 as keyof typeof data.prices]; // 112
    const diff = q1 - q2;

    return Math.floor(
      Math.max(0, params.intercept + params.slope * price - diff)
    );
  } else if (idx === prices.length - 1) {
    // end => 15.99 => demand
    const p1 = prices[prices.length - 2].toString(); // 14.99
    const p2 = prices[prices.length - 3].toString(); // 13.99

    const q1 = data.prices[p1 as keyof typeof data.prices]; // 13
    const q2 = data.prices[p2 as keyof typeof data.prices]; // 43
    const diff = q2 - q1;

    return Math.floor(
      Math.max(0, params.intercept + params.slope * price - diff)
    );
  } else {
    // middle => 11.99
    const p1 = prices[idx - 1].toString(); // 10.99
    const p2 = prices[idx + 1].toString(); // 13.99

    const q1 = data.prices[p1 as keyof typeof data.prices]; // 112
    const q2 = data.prices[p2 as keyof typeof data.prices]; // 43
    const p4 = price - Number(p1); // 11.99 - 10.99 = 1

    // 112 + (1 * (43 - 112)) / (13.99 - 10.99)
    result = q1 + (p4 * (q2 - q1)) / (Number(p2) - Number(p1));
    return result;
  }
};

export const estimateCtrlRevenue = (
  price: number,
  params: { slope: number; intercept: number },
  data: { prices: Record<string, number> }
) => {
  const qty = predictCtrlQty(price, params, data);
  return price * qty;
};

export const estimateCtrlProfit = (
  price: number,
  params: { slope: number; intercept: number },
  unitCost: number,
  data: { prices: Record<string, number> }
) => {
  const qty = predictCtrlQty(price, params, data);
  const revenue = price * qty;
  const cost = unitCost * qty;
  return revenue - cost;
};