export const fitLinearDemand = (pricesWithQty: number[][]) => {
  // Grab the prices and qtys into separate arrays
  const prices = pricesWithQty.map((pq) => pq[0]);
  const qtys = pricesWithQty.map((pq) => pq[1]);

  // Formula is as normal
  const n = prices.length;
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  const sumP = sum(prices);
  const sumQ = sum(qtys);
  const sumPP = sum(prices.map((p) => p * p)); // sum of prices squared
  const sumPQ = sum(prices.map((p, i) => p * qtys[i])); // sum of price * qty

  const denominator = n * sumPP - sumP * sumP;
  const slope = (n * sumPQ - sumP * sumQ) / denominator;
  const intercept = (sumQ - slope * sumP) / n;

  return { slope, intercept };
};

export const predictQty = (
  price: number,
  params: { slope: number; intercept: number },
  pricesWithQty: number[][]
) => {
  // If found => return price
  const found = pricesWithQty.find((pq) => pq[0] === price);
  if (found) {
    return found[1];
  }

  // otherwise calculate
  // Find the two closest data points
  const prices = pricesWithQty.map((pq) => pq[0]);
  prices.push(price);
  prices.sort((a, b) => a - b);

  const idx = prices.indexOf(price);
  let result: number = 0;
  if (idx === 0) {
    // start => 8.99 => demand
    const p1 = prices[1]; // 9.99
    const p2 = prices[2]; // 10.99

    const q1 = pricesWithQty.find((pq) => pq[0] === p1)![1]; // 120
    const q2 = pricesWithQty.find((pq) => pq[0] === p2)![1]; // 112
    const diff = q1 - q2;

    return Math.floor(
      Math.max(0, params.intercept + params.slope * price - diff)
    );
  } else if (idx === prices.length - 1) {
    // end => 15.99 => demand
    const p1 = prices[prices.length - 2]; // 14.99
    const p2 = prices[prices.length - 3]; // 13.99

    const q1 = pricesWithQty.find((pq) => pq[0] === p1)![1]; // 13
    const q2 = pricesWithQty.find((pq) => pq[0] === p2)![1]; // 43
    const diff = q2 - q1;

    return Math.floor(
      Math.max(0, params.intercept + params.slope * price - diff)
    );
  } else {
    // middle => 11.99
    const p1 = prices[idx - 1]; // 10.99
    const p2 = prices[idx + 1]; // 13.99

    const q1 = pricesWithQty.find((pq) => pq[0] === p1)![1]; // 112
    const q2 = pricesWithQty.find((pq) => pq[0] === p2)![1]; // 43
    const p4 = price - p1; // 11.99 - 10.99 = 1

    // 112 + (1 * (43 - 112)) / (13.99 - 10.99)
    result = q1 + (p4 * (q2 - q1)) / (p2 - p1);
    return result;
  }
};

export const calcFcstQty = (pricesWithQty: number[][], newPrice: number) => {
  const params = fitLinearDemand(pricesWithQty);
  return predictQty(newPrice, params, pricesWithQty);
};

export const predictRevenue = (
  price: number,
  params: { slope: number; intercept: number },
  pricesWithQty: number[][]
) => {
  const qty = predictQty(price, params, pricesWithQty);
  return price * qty;
};

export const predictProfit = (
  price: number,
  params: { slope: number; intercept: number },
  unitCost: number,
  pricesWithQty: number[][]
) => {
  const qty = predictQty(price, params, pricesWithQty);
  const revenue = price * qty;
  const cost = unitCost * qty;
  return revenue - cost;
};

/**
 * units at price (qty) number = 0
 * selling days (days active) number
 * total days (90 days)
 * forecast window (7 days)
 */
export const forecastUnits = (
  price: number, // 9.99
  units: number, //120
  sellingDays: number, // 50
  totalDays: number = 90,
  forecastWindow: number = 7,
  pricesWithQty: number[][]
) => {

  // units at price || calcFcstQty
  let unitsAtPrice = units; //120

  // if price point doesn't have historical data, estimate using linear demand
  if (unitsAtPrice === 0) {
    const params = fitLinearDemand(pricesWithQty); // intercept and slope
    unitsAtPrice = predictQty(price, params, pricesWithQty);
  }

  // per selling day => 120 / 50 = 2.4
  const unitsPerSellingDay = unitsAtPrice / sellingDays;
  
  // day rate => 50 / 90 = 0.556
  const dayRate = sellingDays / totalDays;

  // expected days => 0.556 * 7 = 3.892
  const expectedDays = dayRate * forecastWindow;

  // expeected forecast => 2.4 * 3.892 = 9.34 => 9
  const expectedForecast = unitsPerSellingDay * expectedDays;
  return Math.floor(expectedForecast);
};
