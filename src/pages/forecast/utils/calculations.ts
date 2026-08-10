import type { PriceHistory } from "../../../interfaces";

/**
 * A historical observation expressed as a daily demand rate.
 *
 * `rate` is what the demand model predicts:
 * units sold per active sale day at a given price.
 */
export type DemandPoint = {
  price: number;
  qty: number;
  daysActive: number;
  rate: number;
  saleDates: string[];
};

/**
 * Linear model for:
 *
 * dailyRate = intercept + slope * price
 */
export type LinearDemandModel = {
  slope: number;
  intercept: number;
};

/**
 * One future sale day selected by the user.
 *
 * The page should create between 1 and 7 entries, depending on the
 * user-selected sale window.
 */
export type ForecastDay = {
  date: string;
  price: number;
  weekdayFactor?: number;
};

/**
 * Result returned to the UI.
 */
export type ForecastResult = {
  forecastUnits: number;
  uncappedUnits: number;
  dailyRates: number[];
  usedExtrapolation: boolean;
  cappedDays: number;
  hasInsufficientHistory: boolean;
};

/**
 * Return the percentage of dates from the smaller set that overlap
 * with the larger set.
 *
 * 1 means the smaller set is completely contained in the larger set.
 * 0 means the two observations have no dates in common.
 */
const getDateOverlapRatio = (firstDates: string[], secondDates: string[]) => {
  const firstSet = new Set(firstDates);
  const secondSet = new Set(secondDates);

  const smallerSet = firstSet.size <= secondSet.size ? firstSet : secondSet;

  const largerSet = firstSet.size <= secondSet.size ? secondSet : firstSet;

  if (smallerSet.size === 0) {
    return 0;
  }

  let matchingDates = 0;

  for (const date of smallerSet) {
    if (largerSet.has(date)) {
      matchingDates += 1;
    }
  }

  return matchingDates / smallerSet.size;
};

/**
 * Merge price-history records that appear to be one promotion recorded
 * under near-identical prices.
 *
 * Example:
 * $4.38, $4.39, and $4.40 with heavily overlapping sale dates may be
 * artifacts of one $4.40 promotion rather than three independent
 * price points.
 *
 * Important:
 * This function sums qty across merged rows. Only enable this if the
 * rows represent distinct transaction buckets and do not duplicate
 * the same transactions.
 */
export const mergePromoArtifacts = (
  history: PriceHistory[],
  priceTolerance = 0.05,
  minimumDateOverlap = 0.6,
): PriceHistory[] => {
  const visitedIndexes = new Set<number>();
  const mergedHistory: PriceHistory[] = [];

  for (let startIndex = 0; startIndex < history.length; startIndex += 1) {
    if (visitedIndexes.has(startIndex)) {
      continue;
    }

    const clusterIndexes: number[] = [];
    const queue = [startIndex];

    visitedIndexes.add(startIndex);

    while (queue.length > 0) {
      const currentIndex = queue.shift()!;
      const currentRow = history[currentIndex];

      clusterIndexes.push(currentIndex);

      for (
        let candidateIndex = 0;
        candidateIndex < history.length;
        candidateIndex += 1
      ) {
        if (visitedIndexes.has(candidateIndex)) {
          continue;
        }

        const candidateRow = history[candidateIndex];

        const pricesAreClose =
          Math.abs(Number(currentRow.price) - Number(candidateRow.price)) <=
          priceTolerance;

        const dateOverlap = getDateOverlapRatio(
          currentRow.sale_dates,
          candidateRow.sale_dates,
        );

        const datesMeaningfullyOverlap = dateOverlap >= minimumDateOverlap;

        if (pricesAreClose && datesMeaningfullyOverlap) {
          visitedIndexes.add(candidateIndex);
          queue.push(candidateIndex);
        }
      }
    }

    const cluster = clusterIndexes.map((index) => history[index]);

    // No merge needed when there is only one record in the cluster.
    if (cluster.length === 1) {
      mergedHistory.push(cluster[0]);
      continue;
    }

    const totalQty = cluster.reduce((sum, row) => sum + row.qty, 0);

    // Use a qty-weighted price so the dominant transaction price has
    // the most influence on the effective merged promo price.
    const weightedPrice =
      cluster.reduce((sum, row) => sum + Number(row.price) * row.qty, 0) /
      Math.max(totalQty, 1);

    // Do not add days_active values because merged rows overlap.
    // Use the count of unique dates instead.
    const uniqueSaleDates = [
      ...new Set(cluster.flatMap((row) => row.sale_dates)),
    ].sort();

    mergedHistory.push({
      price: weightedPrice.toFixed(2),
      qty: totalQty,
      days_active: uniqueSaleDates.length,
      sale_dates: uniqueSaleDates,
    });
  }

  return mergedHistory.sort(
    (first, second) => Number(first.price) - Number(second.price),
  );
};

/**
 * Convert raw price-history totals into daily demand-rate points.
 *
 * Example:
 * qty: 1735
 * days_active: 14
 * rate: 123.93 units per day
 *
 * Rows with zero days_active are ignored so we never divide by zero.
 */
export const createDemandPoints = (history: PriceHistory[]): DemandPoint[] => {
  return history
    .filter((row) => row.days_active > 0)
    .map((row) => ({
      price: Number(row.price),
      qty: row.qty,
      daysActive: row.days_active,
      rate: row.qty / row.days_active,
      saleDates: row.sale_dates,
    }))
    .sort((first, second) => first.price - second.price);
};

/**
 * Fit a weighted linear model using:
 *
 * price -> daily rate
 *
 * Longer observations receive more weight than one-day observations,
 * but the weight is capped so a very long period cannot dominate the
 * entire curve.
 *
 * Returns null when there are not at least two distinct prices.
 */
export const fitLinearDemand = (
  points: DemandPoint[],
  maxExposureWeight = 14,
): LinearDemandModel | null => {
  if (points.length < 2) {
    return null;
  }

  const weightedPoints = points.map((point) => ({
    ...point,

    // Longer promo periods are generally more reliable than a single day.
    // The cap prevents a long regular-price observation from overwhelming
    // all shorter promotion observations.
    weight: Math.min(point.daysActive, maxExposureWeight),
  }));

  const totalWeight = weightedPoints.reduce(
    (sum, point) => sum + point.weight,
    0,
  );

  if (totalWeight === 0) {
    return null;
  }

  const weightedMeanPrice =
    weightedPoints.reduce((sum, point) => sum + point.price * point.weight, 0) /
    totalWeight;

  const weightedMeanRate =
    weightedPoints.reduce((sum, point) => sum + point.rate * point.weight, 0) /
    totalWeight;

  let numerator = 0;
  let denominator = 0;

  for (const point of weightedPoints) {
    const priceDifference = point.price - weightedMeanPrice;
    const rateDifference = point.rate - weightedMeanRate;

    numerator += point.weight * priceDifference * rateDifference;
    denominator += point.weight * priceDifference * priceDifference;
  }

  // All usable records have the same price, so no price response can be fitted.
  if (Math.abs(denominator) < Number.EPSILON) {
    return null;
  }

  const slope = numerator / denominator;
  const intercept = weightedMeanRate - slope * weightedMeanPrice;

  return {
    slope,
    intercept,
  };
};

/**
 * Predict daily units at a requested price.
 *
 * Decision order:
 * 1. Exact historical price: use its observed daily rate.
 * 2. New price within historical range: interpolate nearby daily rates.
 * 3. New price outside historical range: use the fitted linear model.
 * 4. Not enough item history: return null for a pooled fallback upstream.
 */
export const predictDailyRate = (
  price: number,
  points: DemandPoint[],
  model: LinearDemandModel | null,
): {
  dailyRate: number | null;
  source: "exact-history" | "interpolation" | "extrapolation" | "no-model";
} => {
  const exactPoint = points.find((point) => point.price === price);

  if (exactPoint) {
    return {
      dailyRate: Math.max(0, exactPoint.rate),
      source: "exact-history",
    };
  }

  const sortedPoints = [...points].sort(
    (first, second) => first.price - second.price,
  );

  const lowerPoint = [...sortedPoints]
    .reverse()
    .find((point) => point.price < price);

  const upperPoint = sortedPoints.find((point) => point.price > price);

  // The selected price is between two observed prices.
  // Interpolation is generally safer than extrapolation.
  if (lowerPoint && upperPoint) {
    const position =
      (price - lowerPoint.price) / (upperPoint.price - lowerPoint.price);

    const interpolatedRate =
      lowerPoint.rate + position * (upperPoint.rate - lowerPoint.rate);

    return {
      dailyRate: Math.max(0, interpolatedRate),
      source: "interpolation",
    };
  }

  // The price is outside observed history.
  // Use the fitted rate model only when enough price variation exists.
  if (model) {
    const extrapolatedRate = model.intercept + model.slope * price;

    return {
      dailyRate: Math.max(0, extrapolatedRate),
      source: "extrapolation",
    };
  }

  return {
    dailyRate: null,
    source: "no-model",
  };
};

/**
 * Format a Date as YYYY-MM-DD using local time.
 *
 * Avoids UTC conversion issues that can shift a date by one day for
 * users in certain time zones.
 */
const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Build a schedule for only the selected sale window.
 *
 * If the user chooses:
 * - $4.99
 * - 4 sale days
 *
 * This returns four days at $4.99.
 *
 * It does NOT add regular-price days after the sale window.
 */
export const buildSaleSchedule = (
  startDate: Date,
  salePrice: number,
  saleDays: number,
): ForecastDay[] => {
  if (!Number.isFinite(salePrice) || salePrice < 0) {
    throw new Error("Sale price must be a valid non-negative number.");
  }

  if (!Number.isInteger(saleDays) || saleDays < 1 || saleDays > 7) {
    throw new Error("Sale days must be a whole number between 1 and 7.");
  }

  const schedule: ForecastDay[] = [];

  for (let dayIndex = 0; dayIndex < saleDays; dayIndex += 1) {
    const saleDate = new Date(startDate);

    // Supports windows that cross months or years.
    saleDate.setDate(startDate.getDate() + dayIndex);

    schedule.push({
      date: formatLocalDate(saleDate),
      price: salePrice,
    });
  }

  return schedule;
};

/**
 * Forecast expected units over only the supplied sale schedule.
 *
 * If the user selected a 4-day sale window, schedule.length should be 4
 * and this function forecasts exactly those four days.
 *
 * maxDayQty is used as a safety cap. It prevents a weak extrapolation
 * from forecasting more than the item's observed best day.
 */
export const forecastSaleWindowUnits = (
  schedule: ForecastDay[],
  points: DemandPoint[],
  model: LinearDemandModel | null,
  maxDayQty?: number,
): ForecastResult => {
  let uncappedUnits = 0;
  let cappedUnits = 0;
  let cappedDays = 0;
  let usedExtrapolation = false;
  let hasInsufficientHistory = false;

  const dailyRates: number[] = [];

  for (const day of schedule) {
    const prediction = predictDailyRate(day.price, points, model);

    if (prediction.source === "extrapolation") {
      usedExtrapolation = true;
    }

    if (prediction.source === "no-model") {
      hasInsufficientHistory = true;
    }

    // A null rate means this item needs a department/store pooled fallback.
    // Returning zero prevents an invalid number from entering the forecast,
    // but the UI should flag this as insufficient history.
    const baseDailyRate = prediction.dailyRate ?? 0;

    // Keep factor at 1 until reliable weekday weights are available.
    const weekdayFactor = day.weekdayFactor ?? 1;

    const adjustedDailyRate = Math.max(0, baseDailyRate * weekdayFactor);

    const cappedDailyRate =
      maxDayQty === undefined
        ? adjustedDailyRate
        : Math.min(adjustedDailyRate, maxDayQty);

    if (cappedDailyRate < adjustedDailyRate) {
      cappedDays += 1;
    }

    uncappedUnits += adjustedDailyRate;
    cappedUnits += cappedDailyRate;
    dailyRates.push(cappedDailyRate);
  }

  return {
    forecastUnits: Math.round(cappedUnits),
    uncappedUnits: Math.round(uncappedUnits),
    dailyRates,
    usedExtrapolation,
    cappedDays,
    hasInsufficientHistory,
  };
};

/**
 * Return a UI-friendly explanation of how a sale-price forecast was produced.
 */
export const getForecastExplanation = (
  price: number,
  points: DemandPoint[],
  model: LinearDemandModel | null,
) => {
  const prediction = predictDailyRate(price, points, model);

  switch (prediction.source) {
    case "exact-history":
      return {
        label: "Historical price",
        detail:
          "This price was observed previously, so the forecast uses its historical daily sales rate.",
      };

    case "interpolation":
      return {
        label: "Estimated within historical range",
        detail:
          "This price falls between observed prices, so the forecast interpolates nearby daily sales rates.",
      };

    case "extrapolation":
      return {
        label: "Estimated outside historical range",
        detail:
          "This price is outside observed history, so the forecast extrapolates from the fitted price-demand trend.",
      };

    default:
      return {
        label: "Insufficient item history",
        detail:
          "There are not enough distinct historical price points to estimate an item-specific demand curve.",
      };
  }
};

/**
 * Example:
 *
 * const cleanedHistory = mergePromoArtifacts(item.price_history);
 * const demandPoints = createDemandPoints(cleanedHistory);
 * const demandModel = fitLinearDemand(demandPoints);
 *
 * const schedule = buildSaleSchedule(
 *   new Date(),
 *   userEnteredSalePrice,
 *   userSelectedSaleDays
 * );
 *
 * const forecast = forecastSaleWindowUnits(
 *   schedule,
 *   demandPoints,
 *   demandModel,
 *   item.max_day_qty
 * );
 *
 * forecast.forecastUnits is the expected total for only the
 * user-selected 1-to-7-day sale window.
 */
