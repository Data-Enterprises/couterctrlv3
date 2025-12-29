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

export const forecastUnits = (
  _price: number, // 9.99
  overallUnits: number, // 295
  units: number, // 120
  sellingDays: number, // total selling days
  totalDays: number = 90,
  sellingDaysAtPrice: number, // days at price
  forecastWindow: number = 7,
  _pricesWithQty: number[][],
  adDays?: number
) => {
  // units at price || calcFcstQty
  // let unitsAtPrice = units;
  const unitsAtPrice = units;

  // if price point doesn't have historical data, estimate using linear demand
  // if (unitsAtPrice === 0) {
  //   const params = fitLinearDemand(pricesWithQty); // intercept and slope
  //   unitsAtPrice = predictQty(price, params, pricesWithQty);
  // }

  // out of the 3 days this item was active at 9.99 and sold 120 overall
  // => 120 / 3 = 40 units per day at that price
  const unitsPerSellingDay = unitsAtPrice / sellingDaysAtPrice;

  // avg daily mvmt
  // then we calculate the day rate total days active (50) / total days period (90)
  const dayRate = sellingDays / totalDays;

  // so for the next 7 days, we need to find realistically how many days
  // we would be selling based on the previous day rate => 50/90 = 0.556
  // day rate (0.556) * forecast window (7) = 3.89 expected days selling
  // over the next 7 days
  const expectedDays = dayRate * forecastWindow;

  // Ad Days defined by user input but greater than expected days (length of sale days)
  // if Ad Days is greater than expected days, we just use Ad Days
  // and return that times the units per selling day since we already have
  // the average units per selling day at that price point
  if (adDays && adDays >= expectedDays) {
    return Math.round(adDays * unitsPerSellingDay);
  }

  // Ad Days defined but less than expected days
  // if Ad Days is less than expected days, we calculate the remaining days
  // we won't be on sale and use the overall average daily mvmt for those days
  if (adDays && adDays < expectedDays) {
    // (295 - 120) / (50 - 3) = 3.723 units per day for remaining days
    const remainingAvgUnits = (overallUnits - unitsAtPrice) / (sellingDays - sellingDaysAtPrice);

    // then we need to find the difference between expected days and ad days
    // 3.89 - 2 = 1.89 days
    const diff = expectedDays - adDays;
    // then we can fill in the gaps for those days with the overall average daily mvmt
    return Math.round((adDays * unitsPerSellingDay) + (diff * remainingAvgUnits));
  }

  // Default case => no Ad Days
  // Finally we can return the expected days times the units per selling day
  // if no ad days are defined
  return Math.round(expectedDays * unitsPerSellingDay);
};