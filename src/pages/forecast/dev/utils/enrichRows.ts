// Utils
import {
  fitLinearDemand,
  predictQty,
  forecastUnits,
  estimateDaysActive,
} from "../../../../utils/forecastCalc";
import { formatRowData, formatSinglePriceRowData } from ".";

// Interfaces
import type { PriceHistoryFromListResp } from "../../../../interfaces";
import type { AdListData, AdListRow } from "../../../../features/dev/devForecastDevSlice";

/**
 * Ad-list enrichment and row formatting, the same arithmetic as legacy (only
 * `adListRows` became a parameter). An AD item's ad price is injected into the
 * price history as if real, then every metric on its row is refitted at it.
 */

export const enrichForecastRows = (
  results: PriceHistoryFromListResp["results"],
  adListRows: Record<string, AdListRow>,
) => {
  // Build a fast lookup from upc → full API result for ad-price recalculation
  const resultsByUpc = new Map(results.map((r) => [r.upc, r]));

  // For AD list items, inject the ad price as a real price_history entry so
  // CalcModal treats it as native history rather than a custom price row.
  const enrichedResults = results.map((result) => {
    const ad = adListRows[result.upc];
    if (!ad) return result;

    const adPrice = ad.unitAdRetail;
    const alreadyPresent = result.price_history.some(
      (p) => parseFloat(p.price) === adPrice,
    );
    if (alreadyPresent) return result;

    const prices = result.price_history
      .map((p) => [parseFloat(p.price), p.qty] as [number, number])
      .sort((a, b) => b[1] - a[1]);

    const linear = fitLinearDemand(prices);
    const rawPredicted = prices.length >= 3
      ? predictQty(adPrice, linear, prices)
      : linear.intercept + linear.slope * adPrice;
    const safePredicted = isFinite(rawPredicted) && !isNaN(rawPredicted)
      ? rawPredicted
      : prices[0][1];
    const predictedQty = Math.max(0, Math.round(safePredicted));
    const estimatedDays = Math.max(1, estimateDaysActive(result.price_history, adPrice));

    return {
      ...result,
      price_history: [
        ...result.price_history,
        {
          price: adPrice.toFixed(2),
          qty: predictedQty,
          days_active: estimatedDays,
          sale_dates: [] as string[],
        },
      ],
    };
  });

  // Update the lookup map to use enriched results
  enrichedResults.forEach((r) => resultsByUpc.set(r.upc, r));

  const singlePrices = enrichedResults.filter((item) => item.price_history.length === 1);
  const multiPrices = enrichedResults.filter((item) => item.price_history.length > 1);
  const rawRows = [
    ...formatRowData(multiPrices),
    ...formatSinglePriceRowData(singlePrices),
  ];

  const rows = rawRows.map((row) => {
    const ad = adListRows[row.upc];
    if (!ad) return row;

    const { upc: _upc, ...adListData } = ad as { upc: string } & AdListData;
    const adPrice = ad.unitAdRetail;
    const result = resultsByUpc.get(row.upc);

    // Recalculate all metrics at the ad price using the enriched history
    if (result && result.price_history.length > 0) {
      const prices = result.price_history
        .map((p) => [parseFloat(p.price), p.qty] as [number, number])
        .sort((a, b) => b[1] - a[1]);

      const linear = fitLinearDemand(prices);

      const rawPredicted = prices.length >= 3
        ? predictQty(adPrice, linear, prices)
        : linear.intercept + linear.slope * adPrice;
      const safePredicted = isFinite(rawPredicted) && !isNaN(rawPredicted)
        ? rawPredicted
        : prices[0][1]; // fall back to highest-volume historical qty
      const predictedQty = Math.max(0, Math.round(safePredicted));

      // Guard against 0: forecastUnits divides by sellingDaysAtPrice internally
      const estimatedDays = Math.max(1, estimateDaysActive(result.price_history, adPrice));

      const rawUnits = forecastUnits(
        adPrice,
        result.qty,
        predictedQty,
        result.days_active,
        90,
        estimatedDays,
        7,
        prices,
      );
      const units = isFinite(rawUnits) && !isNaN(rawUnits) ? rawUnits : 0;

      const regularRetail = ad.regularRetail || result.regular_retail_price;
      const markdownDollars = (regularRetail - adPrice) * units;

      return {
        ...row,
        fcstPrice: adPrice,
        qtySold: predictedQty,
        daysAtPrice: estimatedDays,
        adFcst: units,
        fcstTotal: adPrice * units,
        markdownDollars,
        adListData,
      };
    }

    // Fallback: just override the price (missing history)
    return { ...row, fcstPrice: adPrice, adListData };
  });

  return { rows, singlePrices, enrichedResults };
};
